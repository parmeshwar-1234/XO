import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { FlipHorizontal, FlipVertical, Download, Trash2, RefreshCw, Eye, X, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DropZone from './DropZone';
import BeforeAfterSlider from './BeforeAfterSlider';
import FreeCropBox from './FreeCropBox';
import { getCroppedImg, downloadBlob, formatFileSize } from '@/lib/canvas-utils';

const ASPECT_RATIOS: { label: string; value: number | undefined }[] = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '21:9', value: 21 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: 'Custom', value: -1 },
];

const ImageCropper: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [freeCropArea, setFreeCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [customAspectW, setCustomAspectW] = useState(16);
  const [customAspectH, setCustomAspectH] = useState(9);
  const [isCustomAspect, setIsCustomAspect] = useState(false);
  const isFreeMode = aspectRatio === undefined && !isCustomAspect;
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState(92);
  const [targetSizeKB, setTargetSizeKB] = useState(500);
  const [useTargetSize, setUseTargetSize] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('—');
  const [estimating, setEstimating] = useState(false);
  const estimateTimer = useRef<ReturnType<typeof setTimeout>>();

  // Debounced file size estimation
  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) {
      setEstimatedSize('—');
      return;
    }

    if (estimateTimer.current) clearTimeout(estimateTimer.current);
    setEstimating(true);

    estimateTimer.current = setTimeout(async () => {
      try {
        const blob = await getCroppedImg(
          imageSrc, croppedAreaPixels, rotation, flipH, flipV, exportFormat, quality / 100
        );
        setEstimatedSize(formatFileSize(blob.size));
      } catch {
        setEstimatedSize('—');
      }
      setEstimating(false);
    }, 400);

    return () => {
      if (estimateTimer.current) clearTimeout(estimateTimer.current);
    };
  }, [imageSrc, croppedAreaPixels, rotation, flipH, flipV, exportFormat, quality]);

  const onFileSelected = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);
      const img = new Image();
      img.onload = () => setImgDimensions({ w: img.width, h: img.height });
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const generateCroppedBlob = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return null;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flipH, flipV, exportFormat, quality / 100);

    if (useTargetSize && targetSizeKB > 0 && exportFormat !== 'image/png') {
      const targetBytes = targetSizeKB * 1024;
      if (blob.size <= targetBytes) return blob;

      let lo = 0.05, hi = quality / 100, bestBlob = blob;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        const attempt = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flipH, flipV, exportFormat, mid);
        bestBlob = attempt;
        if (attempt.size > targetBytes) hi = mid;
        else lo = mid;
      }
      return bestBlob;
    }

    return blob;
  }, [imageSrc, croppedAreaPixels, rotation, flipH, flipV, exportFormat, quality, useTargetSize, targetSizeKB]);

  const handleDownload = useCallback(async () => {
    setProcessing(true);
    try {
      const blob = await generateCroppedBlob();
      if (!blob) return;
      const ext = exportFormat.split('/')[1];
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${baseName}_edited.${ext}`);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setProcessing(false);
  }, [generateCroppedBlob, exportFormat, fileName]);

  const handlePreview = useCallback(async () => {
    try {
      const blob = await generateCroppedBlob();
      if (!blob) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview failed:', err);
    }
  }, [previewUrl, generateCroppedBlob]);

  const handleAspectSelect = (label: string) => {
    const found = ASPECT_RATIOS.find((a) => a.label === label);
    if (!found) return;
    if (label === 'Custom') {
      setIsCustomAspect(true);
      setAspectRatio(customAspectW / customAspectH);
    } else {
      setIsCustomAspect(false);
      setAspectRatio(found.value);
    }
  };

  useEffect(() => {
    if (isCustomAspect && customAspectW > 0 && customAspectH > 0) {
      setAspectRatio(customAspectW / customAspectH);
    }
  }, [customAspectW, customAspectH, isCustomAspect]);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio(undefined);
    setIsCustomAspect(false);
    setExportFormat('image/png');
    setQuality(92);
    setUseTargetSize(false);
    setTargetSizeKB(500);
    setShowPreview(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleClear = () => {
    handleReset();
    setImageSrc(null);
    setFileName('');
    setFileSize(0);
    setImgDimensions({ w: 0, h: 0 });
    setEstimatedSize('—');
  };

  if (!imageSrc) {
    return <DropZone onFilesSelected={onFileSelected} label="Drop your image to crop" sublabel="Supports PNG, JPEG, WebP, GIF, BMP" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Cropper area */}
        <Card className="glass overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full" style={{ height: '500px' }}>
              {isFreeMode ? (
                <FreeCropBox
                  imageSrc={imageSrc}
                  flipH={flipH}
                  flipV={flipV}
                  rotation={rotation}
                  onCropChange={(area) => {
                    setFreeCropArea(area);
                    setCroppedAreaPixels({
                      x: Math.round(area.x),
                      y: Math.round(area.y),
                      width: Math.round(area.width),
                      height: Math.round(area.height),
                    });
                  }}
                />
              ) : (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid
                  classes={{ cropAreaClassName: 'crop-area-with-handles' }}
                  style={{
                    containerStyle: { borderRadius: 'var(--radius)' },
                    mediaStyle: {
                      transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`.trim() || undefined,
                    },
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[700px] pr-1">
          {/* Info */}
          <Card className="glass">
            <CardContent className="p-4 text-sm space-y-1">
              <p className="text-muted-foreground">File: <span className="text-foreground font-medium">{fileName}</span></p>
              <p className="text-muted-foreground">Original: <span className="text-foreground">{formatFileSize(fileSize)}</span></p>
              <p className="text-muted-foreground">Dimensions: <span className="text-foreground">{imgDimensions.w} × {imgDimensions.h}</span></p>
              {croppedAreaPixels && (
                <p className="text-muted-foreground">Crop: <span className="text-foreground">{Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)}</span></p>
              )}
              <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 mt-1">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Est. output:</span>
                <span className={`font-medium ${estimating ? 'text-muted-foreground animate-pulse' : 'text-primary'}`}>
                  {estimating ? 'calculating...' : estimatedSize}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Aspect Ratio */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <Button
                    key={ar.label}
                    variant={
                      (ar.label === 'Custom' && isCustomAspect) ||
                      (ar.label !== 'Custom' && !isCustomAspect && aspectRatio === ar.value)
                        ? 'default' : 'secondary'
                    }
                    size="sm"
                    onClick={() => handleAspectSelect(ar.label)}
                    className="text-xs"
                  >
                    {ar.label}
                  </Button>
                ))}
              </div>
              {isCustomAspect && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-xs text-muted-foreground">W</label>
                    <Input type="number" value={customAspectW} min={1} max={100} onChange={(e) => setCustomAspectW(Number(e.target.value))} className="h-8" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">H</label>
                    <Input type="number" value={customAspectH} min={1} max={100} onChange={(e) => setCustomAspectH(Number(e.target.value))} className="h-8" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Zoom */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Zoom</span>
                <span className="text-muted-foreground">{zoom.toFixed(1)}x</span>
              </div>
              <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={([v]) => setZoom(v)} />
            </CardContent>
          </Card>

          {/* Rotation */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Rotation</span>
                <span className="text-muted-foreground">{rotation}°</span>
              </div>
              <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={([v]) => setRotation(v)} />
            </CardContent>
          </Card>

          {/* Flip */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button variant={flipH ? 'default' : 'secondary'} size="sm" className="flex-1" onClick={() => setFlipH(!flipH)}>
                  <FlipHorizontal className="w-4 h-4 mr-1" /> Flip H
                </Button>
                <Button variant={flipV ? 'default' : 'secondary'} size="sm" className="flex-1" onClick={() => setFlipV(!flipV)}>
                  <FlipVertical className="w-4 h-4 mr-1" /> Flip V
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Target File Size */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Target File Size</label>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setUseTargetSize(!useTargetSize)}>
                  {useTargetSize ? 'On' : 'Off'}
                </Button>
              </div>
              {useTargetSize && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input type="number" value={targetSizeKB} min={1} max={50000} onChange={(e) => setTargetSizeKB(Number(e.target.value))} className="h-8" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">KB</span>
                  </div>
                  {exportFormat === 'image/png' && (
                    <p className="text-xs text-muted-foreground">⚠ PNG is lossless — switch to JPEG or WebP for file size control</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/jpeg">JPEG</SelectItem>
                  <SelectItem value="image/webp">WebP</SelectItem>
                </SelectContent>
              </Select>
              {exportFormat !== 'image/png' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality</span>
                    <span className="text-muted-foreground">{quality}%</span>
                  </div>
                  <Slider value={[quality]} min={10} max={100} step={1} onValueChange={([v]) => setQuality(v)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePreview} className="flex-1">
              <Eye className="w-4 h-4 mr-1" /> Compare
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClear} className="flex-1">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
          <Button onClick={handleDownload} disabled={processing} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
            <Download className="w-4 h-4 mr-2" /> {processing ? 'Processing...' : 'Download'}
          </Button>
        </div>
      </div>

      {/* Before/After Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => {
        if (!open) {
          setShowPreview(false);
          if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Before / After Comparison</DialogTitle>
          </DialogHeader>
          {previewUrl && imageSrc && (
            <BeforeAfterSlider
              beforeSrc={imageSrc}
              afterSrc={previewUrl}
              className="h-[60vh] rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageCropper;
