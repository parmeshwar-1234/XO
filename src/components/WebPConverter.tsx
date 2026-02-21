import React, { useState, useCallback } from 'react';
import { ArrowRightLeft, Download, Trash2, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [convertingIndex, setConvertingIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onFilesSelected = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((f) => ({ file: f, status: 'pending', progress: 0 }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const convertSingle = useCallback(async (index: number) => {
    setConvertingIndex(index);
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'converting', progress: 50 };
      return updated;
    });
    try {
      const blob = await convertToWebP(files[index].file, quality / 100);
      setFiles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'done', progress: 100, outputBlob: blob };
        return updated;
      });
    } catch {
      setFiles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'error', progress: 0 };
        return updated;
      });
    }
    setConvertingIndex(null);
  }, [files, quality]);

  const downloadSingle = useCallback((index: number) => {
    const item = files[index];
    if (item.status === 'done' && item.outputBlob) {
      const baseName = item.file.name.replace(/\.[^/.]+$/, '');
      downloadBlob(item.outputBlob, `${baseName}_converted.webp`);
    }
  }, [files]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
    setConverting(false);
  }, [files, quality]);

  const downloadAll = useCallback(() => {
    for (const item of files) {
      if (item.status === 'done' && item.outputBlob) {
        const baseName = item.file.name.replace(/\.[^/.]+$/, '');
        downloadBlob(item.outputBlob, `${baseName}_converted.webp`);
      }
    }
  }, [files]);

  const hasConverted = files.some((f) => f.status === 'done');
  const allConverted = files.length > 0 && files.every((f) => f.status === 'done');
  const hasPending = files.some((f) => f.status === 'pending' || f.status === 'error');

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
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                      {item.status === 'done' && item.outputBlob && (
                        <span className="text-primary ml-1">→ {formatFileSize(item.outputBlob.size)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {item.status === 'converting' && <Progress value={item.progress} className="h-2 w-20" />}
                    {item.status === 'done' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                    {item.status === 'error' && <span className="text-xs text-destructive">Failed</span>}
                    {item.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={converting || convertingIndex !== null}
                        onClick={() => convertSingle(i)}
                      >
                        <ArrowRightLeft className="w-3 h-3 mr-1" /> Convert
                      </Button>
                    )}
                    {item.status === 'error' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={converting || convertingIndex !== null}
                        onClick={() => convertSingle(i)}
                      >
                        Retry
                      </Button>
                    )}
                    {item.status === 'done' && item.outputBlob && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                            const url = URL.createObjectURL(item.outputBlob!);
                            setPreviewUrl(url);
                            setPreviewIndex(i);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" /> Preview
                        </Button>
                        <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => downloadSingle(i)}>
                          <Download className="w-3 h-3 mr-1" /> Save
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={converting || convertingIndex !== null}
                      onClick={() => removeFile(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {hasPending && (
              <Button
                onClick={convertAll}
                disabled={converting || convertingIndex !== null}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
              >
                {converting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                {converting ? 'Converting...' : 'Convert All'}
              </Button>
            )}
            {hasConverted && (
              <Button onClick={downloadAll} variant="secondary" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Download All
              </Button>
            )}
            <Button variant="destructive" onClick={() => setFiles([])} disabled={converting || convertingIndex !== null}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setPreviewIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {previewIndex !== null && files[previewIndex]
                ? files[previewIndex].file.name.replace(/\.[^/.]+$/, '') + '.webp'
                : 'Preview'}
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center bg-black/40 rounded-lg overflow-hidden" style={{ maxHeight: '70vh' }}>
              <img src={previewUrl} alt="Converted preview" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          )}
          {previewIndex !== null && files[previewIndex]?.outputBlob && (
            <p className="text-xs text-muted-foreground text-center">
              Size: {formatFileSize(files[previewIndex].outputBlob!.size)}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebPConverter;
