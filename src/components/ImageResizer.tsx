import React, { useState, useCallback } from 'react';
import { Download, Trash2, Lock, Unlock, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import DropZone from './DropZone';
import LoadingDots from './LoadingDots';
import { downloadBlob, formatFileSize } from '@/lib/canvas-utils';

const SOCIAL_PRESETS = [
  { label: 'Custom', w: 0, h: 0 },
  { label: 'Instagram Post (1080×1080)', w: 1080, h: 1080 },
  { label: 'Instagram Story (1080×1920)', w: 1080, h: 1920 },
  { label: 'Facebook Cover (820×312)', w: 820, h: 312 },
  { label: 'Twitter Header (1500×500)', w: 1500, h: 500 },
  { label: 'YouTube Thumbnail (1280×720)', w: 1280, h: 720 },
  { label: 'LinkedIn Banner (1584×396)', w: 1584, h: 396 },
  { label: 'Pinterest Pin (1000×1500)', w: 1000, h: 1500 },
  { label: 'OG Image (1200×630)', w: 1200, h: 630 },
  { label: 'Favicon (512×512)', w: 512, h: 512 },
];

const ImageResizer: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [originalW, setOriginalW] = useState(0);
  const [originalH, setOriginalH] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [quality, setQuality] = useState(92);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [processing, setProcessing] = useState(false);
  const [preset, setPreset] = useState('Custom');

  const onFileSelected = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);
      const img = new Image();
      img.onload = () => {
        setOriginalW(img.width);
        setOriginalH(img.height);
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && originalW > 0) {
      setHeight(Math.round((val / originalW) * originalH));
    }
    setPreset('Custom');
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && originalH > 0) {
      setWidth(Math.round((val / originalH) * originalW));
    }
    setPreset('Custom');
  };

  const handlePreset = (label: string) => {
    setPreset(label);
    const p = SOCIAL_PRESETS.find((s) => s.label === label);
    if (p && p.w > 0) {
      setWidth(p.w);
      setHeight(p.h);
      setLockAspect(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!imageSrc || width <= 0 || height <= 0) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = imageSrc; });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob>((res, rej) => {
        canvas.toBlob((b) => b ? res(b) : rej(new Error('Failed')), exportFormat, quality / 100);
      });
      const ext = exportFormat.split('/')[1];
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${baseName}_resized_${width}x${height}.${ext}`);
    } catch (err) {
      console.error('Resize failed:', err);
    }
    setProcessing(false);
  }, [imageSrc, width, height, exportFormat, quality, fileName]);

  if (!imageSrc) {
    return <DropZone onFilesSelected={onFileSelected} label="Drop an image to resize" sublabel="Resize to any dimensions or social media presets" />;
  }

  const scalePercent = originalW > 0 ? Math.round((width / originalW) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      {/* Preview */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center min-h-[400px]">
          <img src={imageSrc} alt="Preview" className="max-w-full max-h-[500px] rounded-lg object-contain" />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <Card className="glass">
          <CardContent className="p-4 text-sm space-y-1">
            <p className="text-muted-foreground">Original: <span className="text-foreground font-medium">{originalW} × {originalH}</span></p>
            <p className="text-muted-foreground">Scale: <span className="text-foreground font-medium">{scalePercent}%</span></p>
          </CardContent>
        </Card>

        {/* Presets */}
        <Card className="glass">
          <CardContent className="p-4 space-y-3">
            <label className="text-sm font-medium">Social Media Presets</label>
            <Select value={preset} onValueChange={handlePreset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOCIAL_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className="glass">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Dimensions</label>
              <Button variant="ghost" size="sm" onClick={() => setLockAspect(!lockAspect)} className="h-7 px-2">
                {lockAspect ? <Lock className="w-3.5 h-3.5 mr-1" /> : <Unlock className="w-3.5 h-3.5 mr-1" />}
                <span className="text-xs">{lockAspect ? 'Locked' : 'Unlocked'}</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Width (px)</label>
                <Input type="number" value={width} onChange={(e) => handleWidthChange(Number(e.target.value))} min={1} max={10000} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Height (px)</label>
                <Input type="number" value={height} onChange={(e) => handleHeightChange(Number(e.target.value))} min={1} max={10000} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export */}
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

        <Button variant="destructive" size="sm" onClick={() => { setImageSrc(null); setPreset('Custom'); }}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </Button>
        <Button onClick={handleDownload} disabled={processing} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
          <Download className="w-4 h-4 mr-2" /> {processing ? 'Processing...' : `Download ${width}×${height}`}
        </Button>
      </div>
    </div>
  );
};

export default ImageResizer;
