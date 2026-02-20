import React, { useState, useCallback, useRef, useEffect } from 'react';

interface FreeCropBoxProps {
  imageSrc: string;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  flipH?: boolean;
  flipV?: boolean;
  rotation?: number;
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'ml' | 'mr';

const MIN_SIZE = 30;

const HANDLE_CURSORS: Record<HandleType, string> = {
  tl: 'nwse-resize',
  tr: 'nesw-resize',
  bl: 'nesw-resize',
  br: 'nwse-resize',
  tm: 'ns-resize',
  bm: 'ns-resize',
  ml: 'ew-resize',
  mr: 'ew-resize',
};

const FreeCropBox: React.FC<FreeCropBoxProps> = ({
  imageSrc,
  onCropChange,
  flipH = false,
  flipV = false,
  rotation = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  // Crop box state (in displayed pixel coords)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Interaction state
  const interactionRef = useRef<{
    type: 'move' | HandleType;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Initialize crop box when image loads
  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImgLoaded(true);

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    setContainerSize({ w: cw, h: ch });

    // Fit image into container
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    const offsetX = (cw - displayW) / 2;
    const offsetY = (ch - displayH) / 2;

    // Initial crop = 80% centered
    const margin = 0.1;
    setCropBox({
      x: offsetX + displayW * margin,
      y: offsetY + displayH * margin,
      w: displayW * (1 - 2 * margin),
      h: displayH * (1 - 2 * margin),
    });
  }, []);

  // Recalculate on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (imgRef.current && imgLoaded) {
        setContainerSize({ w: container.clientWidth, h: container.clientHeight });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [imgLoaded]);

  // Get image display bounds
  const getImageBounds = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return { x: 0, y: 0, w: 0, h: 0, scale: 1 };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    return {
      x: (cw - displayW) / 2,
      y: (ch - displayH) / 2,
      w: displayW,
      h: displayH,
      scale,
    };
  }, []);

  // Report crop in natural image coordinates
  useEffect(() => {
    if (!imgLoaded) return;
    const bounds = getImageBounds();
    if (bounds.w === 0 || bounds.h === 0) return;
    const scale = bounds.scale;
    onCropChange({
      x: Math.max(0, (cropBox.x - bounds.x) / scale),
      y: Math.max(0, (cropBox.y - bounds.y) / scale),
      width: cropBox.w / scale,
      height: cropBox.h / scale,
    });
  }, [cropBox, imgLoaded, getImageBounds, onCropChange]);

  // Clamp crop to image bounds
  const clampCrop = useCallback(
    (c: { x: number; y: number; w: number; h: number }) => {
      const bounds = getImageBounds();
      const minX = bounds.x;
      const minY = bounds.y;
      const maxX = bounds.x + bounds.w;
      const maxY = bounds.y + bounds.h;
      let { x, y, w, h } = c;
      w = Math.max(MIN_SIZE, Math.min(w, bounds.w));
      h = Math.max(MIN_SIZE, Math.min(h, bounds.h));
      x = Math.max(minX, Math.min(x, maxX - w));
      y = Math.max(minY, Math.min(y, maxY - h));
      return { x, y, w, h };
    },
    [getImageBounds]
  );

  // Pointer handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent, type: 'move' | HandleType) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      interactionRef.current = {
        type,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...cropBox },
      };
    },
    [cropBox]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      const dx = e.clientX - interaction.startX;
      const dy = e.clientY - interaction.startY;
      const s = interaction.startCrop;

      let newCrop = { ...s };

      if (interaction.type === 'move') {
        newCrop.x = s.x + dx;
        newCrop.y = s.y + dy;
      } else {
        const handle = interaction.type;
        // Resize based on handle
        if (handle === 'br') {
          newCrop.w = Math.max(MIN_SIZE, s.w + dx);
          newCrop.h = Math.max(MIN_SIZE, s.h + dy);
        } else if (handle === 'bl') {
          const newW = Math.max(MIN_SIZE, s.w - dx);
          newCrop.x = s.x + (s.w - newW);
          newCrop.w = newW;
          newCrop.h = Math.max(MIN_SIZE, s.h + dy);
        } else if (handle === 'tr') {
          newCrop.w = Math.max(MIN_SIZE, s.w + dx);
          const newH = Math.max(MIN_SIZE, s.h - dy);
          newCrop.y = s.y + (s.h - newH);
          newCrop.h = newH;
        } else if (handle === 'tl') {
          const newW = Math.max(MIN_SIZE, s.w - dx);
          const newH = Math.max(MIN_SIZE, s.h - dy);
          newCrop.x = s.x + (s.w - newW);
          newCrop.y = s.y + (s.h - newH);
          newCrop.w = newW;
          newCrop.h = newH;
        } else if (handle === 'tm') {
          const newH = Math.max(MIN_SIZE, s.h - dy);
          newCrop.y = s.y + (s.h - newH);
          newCrop.h = newH;
        } else if (handle === 'bm') {
          newCrop.h = Math.max(MIN_SIZE, s.h + dy);
        } else if (handle === 'ml') {
          const newW = Math.max(MIN_SIZE, s.w - dx);
          newCrop.x = s.x + (s.w - newW);
          newCrop.w = newW;
        } else if (handle === 'mr') {
          newCrop.w = Math.max(MIN_SIZE, s.w + dx);
        }
      }

      setCropBox(clampCrop(newCrop));
    },
    [clampCrop]
  );

  const onPointerUp = useCallback(() => {
    interactionRef.current = null;
  }, []);

  const handles: HandleType[] = ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr'];

  const getHandlePosition = (handle: HandleType) => {
    const { x, y, w, h } = cropBox;
    switch (handle) {
      case 'tl': return { left: x, top: y };
      case 'tr': return { left: x + w, top: y };
      case 'bl': return { left: x, top: y + h };
      case 'br': return { left: x + w, top: y + h };
      case 'tm': return { left: x + w / 2, top: y };
      case 'bm': return { left: x + w / 2, top: y + h };
      case 'ml': return { left: x, top: y + h / 2 };
      case 'mr': return { left: x + w, top: y + h / 2 };
    }
  };

  const isCorner = (h: HandleType) => ['tl', 'tr', 'bl', 'br'].includes(h);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-black"
      style={{ touchAction: 'none' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Crop source"
        onLoad={onImageLoad}
        draggable={false}
        className="absolute max-w-full max-h-full object-contain"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        }}
      />

      {imgLoaded && (
        <>
          {/* Dark overlay - 4 pieces around crop box */}
          {/* Top */}
          <div
            className="absolute bg-black/60 pointer-events-none"
            style={{ top: 0, left: cropBox.x, width: cropBox.w, height: cropBox.y }}
          />
          {/* Bottom */}
          <div
            className="absolute bg-black/60 pointer-events-none"
            style={{
              top: cropBox.y + cropBox.h,
              left: cropBox.x,
              width: cropBox.w,
              bottom: 0,
            }}
          />
          {/* Left */}
          <div
            className="absolute bg-black/60 pointer-events-none"
            style={{ top: 0, left: 0, width: cropBox.x, bottom: 0 }}
          />
          {/* Right */}
          <div
            className="absolute bg-black/60 pointer-events-none"
            style={{
              top: 0,
              left: cropBox.x + cropBox.w,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Crop border + grid */}
          <div
            className="absolute border-2 border-primary pointer-events-none"
            style={{
              left: cropBox.x,
              top: cropBox.y,
              width: cropBox.w,
              height: cropBox.h,
            }}
          >
            {/* Rule of thirds grid */}
            <div className="absolute inset-0">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            </div>
          </div>

          {/* Move area (the crop box itself) */}
          <div
            className="absolute cursor-move"
            style={{
              left: cropBox.x,
              top: cropBox.y,
              width: cropBox.w,
              height: cropBox.h,
            }}
            onPointerDown={(e) => onPointerDown(e, 'move')}
          />

          {/* 8 Resize handles */}
          {handles.map((handle) => {
            const pos = getHandlePosition(handle);
            const size = isCorner(handle) ? 14 : 10;
            return (
              <div
                key={handle}
                className="absolute z-20"
                style={{
                  left: pos.left - size / 2,
                  top: pos.top - size / 2,
                  width: size,
                  height: size,
                  cursor: HANDLE_CURSORS[handle],
                }}
                onPointerDown={(e) => onPointerDown(e, handle)}
              >
                <div
                  className="w-full h-full rounded-full bg-primary border-2 border-white shadow-md"
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default FreeCropBox;
