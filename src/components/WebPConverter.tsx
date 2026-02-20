import React, { useState, useCallback } from 'react';
import { ArrowRightLeft, Download, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DropZone from './DropZone';
import { convertToWebP, downloadBlob, formatFileSize } from '@/lib/canvas-utils';

interface FileItem {
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  outputBlob?: Blob;
}

const WebPConverter: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [converting, setConverting] = useState(false);

  const onFilesSelected = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((f) => ({ file: f, status: 'pending', progress: 0 }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const convertAll = useCallback(async () => {
    setConverting(true);
    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue;
      updated[i] = { ...updated[i], status: 'converting', progress: 50 };
      setFiles([...updated]);
      try {
        const blob = await convertToWebP(updated[i].file, quality / 100);
        updated[i] = { ...updated[i], status: 'done', progress: 100, outputBlob: blob };
      } catch {
        updated[i] = { ...updated[i], status: 'error', progress: 0 };
      }
      setFiles([...updated]);
    }
    // Auto-download
    for (const item of updated) {
      if (item.status === 'done' && item.outputBlob) {
        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        downloadBlob(item.outputBlob, `${baseName}_converted.webp`);
      }
    }
    setConverting(false);
  }, [files, quality]);

  return (
    <div className="space-y-6">
      <DropZone
        onFilesSelected={onFilesSelected}
        multiple
        label="Drop images to convert to WebP"
        sublabel="Select multiple files for batch conversion"
      />

      {files.length > 0 && (
        <>
          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Output Quality</span>
                <span className="text-muted-foreground">{quality}%</span>
              </div>
              <Slider value={[quality]} min={10} max={100} step={1} onValueChange={([v]) => setQuality(v)} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4 space-y-3">
              {files.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                  </div>
                  <div className="w-32">
                    {item.status === 'converting' && <Progress value={item.progress} className="h-2" />}
                    {item.status === 'done' && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Done
                        {item.outputBlob && (
                          <span className="text-muted-foreground ml-1">({formatFileSize(item.outputBlob.size)})</span>
                        )}
                      </div>
                    )}
                    {item.status === 'error' && <span className="text-xs text-destructive">Failed</span>}
                    {item.status === 'pending' && <span className="text-xs text-muted-foreground">Pending</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={convertAll}
              disabled={converting}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
            >
              {converting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
              {converting ? 'Converting...' : 'Convert All'}
            </Button>
            <Button variant="destructive" onClick={() => setFiles([])} disabled={converting}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default WebPConverter;
