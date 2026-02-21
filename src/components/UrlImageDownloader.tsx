import React, { useState, useCallback } from 'react';
import { Download, Loader2, Link2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadBlob, formatFileSize } from '@/lib/canvas-utils';

type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const FORMAT_LABELS: Record<ExportFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

const UrlImageDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);

  const loadImage = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setPreviewSrc(null);

    try {
      // Try loading the image directly (works for CORS-enabled URLs)
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
          setPreviewSrc(url.trim());
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image. Check the URL or CORS policy.'));
        img.src = url.trim();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load image');
    }
    setLoading(false);
  }, [url]);

  const handleDownload = useCallback(async () => {
    if (!previewSrc) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load'));
        img.src = previewSrc;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Conversion failed'))),
          format,
          format === 'image/png' ? undefined : quality / 100
        );
      });

      const ext = format.split('/')[1];
      const urlName = url.split('/').pop()?.split('?')[0]?.replace(/\.[^/.]+$/, '') || 'image';
      downloadBlob(blob, `${urlName}.${ext}`);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    }
    setProcessing(false);
  }, [previewSrc, format, quality, url]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') loadImage();
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <Card className="glass">
        <CardContent className="p-4 space-y-4">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Image URL
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={loadImage} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              <span className="ml-2">{loading ? 'Loading…' : 'Load'}</span>
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Preview */}
      {previewSrc && (
        <>
          <Card className="glass overflow-hidden">
            <CardContent className="p-0">
              <div className="relative flex items-center justify-center bg-black/40" style={{ minHeight: 200, maxHeight: 500 }}>
                <img
                  src={previewSrc}
                  alt="Preview"
                  crossOrigin="anonymous"
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="glass">
            <CardContent className="p-4 text-sm space-y-1">
              <p className="text-muted-foreground">Dimensions: <span className="text-foreground">{imgDimensions.w} × {imgDimensions.h}</span></p>
            </CardContent>
          </Card>

          {/* Format & Quality */}
          <Card className="glass">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {format !== 'image/png' && (
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

          {/* Download */}
          <Button
            onClick={handleDownload}
            disabled={processing}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
          >
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {processing ? 'Processing…' : `Download as ${FORMAT_LABELS[format]}`}
          </Button>
        </>
      )}
    </div>
  );
};

export default UrlImageDownloader;
