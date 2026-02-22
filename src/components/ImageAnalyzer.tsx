import React, { useState, useCallback } from 'react';
import { FileSearch, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import DropZone from './DropZone';
import LoadingDots from './LoadingDots';
import { formatFileSize, getSimplifiedRatio } from '@/lib/canvas-utils';

interface ImageMeta {
  name: string;
  width: number;
  height: number;
  ratio: string;
  megapixels: string;
  size: string;
  format: string;
  orientation: string;
  dataUrl: string;
}

const ImageAnalyzer: React.FC = () => {
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const onFileSelected = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setMeta({
          name: file.name,
          width: img.width,
          height: img.height,
          ratio: getSimplifiedRatio(img.width, img.height),
          megapixels: ((img.width * img.height) / 1_000_000).toFixed(2),
          size: formatFileSize(file.size),
          format: file.type || 'unknown',
          orientation: img.width > img.height ? 'Landscape' : img.width < img.height ? 'Portrait' : 'Square',
          dataUrl,
        });
        setAnalyzing(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  if (analyzing) {
    return (
      <div className="flex items-center justify-center min-h-96 rounded-3xl bg-white/50 dark:bg-gray-800/50">
        <LoadingDots size="md" text="Analyzing image..." />
      </div>
    );
  }

  if (!meta) {
    return <DropZone onFilesSelected={onFileSelected} label="Drop an image to analyze" sublabel="Get detailed image metadata instantly" />;
  }

  const rows = [
    { label: 'Width', value: `${meta.width}px` },
    { label: 'Height', value: `${meta.height}px` },
    { label: 'Aspect Ratio', value: meta.ratio },
    { label: 'Megapixels', value: `${meta.megapixels} MP` },
    { label: 'File Size', value: meta.size },
    { label: 'Format', value: meta.format },
    { label: 'Orientation', value: meta.orientation },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <Card className="glass overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center min-h-[400px]">
          <img src={meta.dataUrl} alt="Preview" className="max-w-full max-h-[500px] rounded-lg object-contain" />
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="glass">
        <CardContent className="p-6 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <FileSearch className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{meta.name}</h3>
          </div>
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">{row.label}</span>
                <span className="text-foreground font-medium text-sm">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <button
              onClick={() => setMeta(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Analyze another image
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageAnalyzer;
