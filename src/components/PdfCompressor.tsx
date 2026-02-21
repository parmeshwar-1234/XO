import React, { useState, useCallback, useEffect } from 'react';
import { FileUp, Download, Loader2, Zap, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatFileSize } from '@/lib/canvas-utils';

interface UploadedPDF {
  file: File;
  id: string;
  originalSize: number;
  quality: number;
  compressedSize?: number;
  estimatedSize?: number;
  compressing?: boolean;
  compressed?: boolean;
  error?: string;
}

const PdfCompressor: React.FC = () => {
  const [files, setFiles] = useState<UploadedPDF[]>([]);
  const [processingAll, setProcessingAll] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadLibraries = () => {
      if ((window as any).pdfjsLib && (window as any).jspdf) {
        setLibsLoaded(true);
        return;
      }

      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script2.onload = () => {
          if ((window as any).pdfjsLib) {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          setLibsLoaded(true);
        };
        script2.onerror = () => {
          setLoadError('Failed to load jsPDF library');
        };
        document.head.appendChild(script2);
      };
      script1.onerror = () => {
        setLoadError('Failed to load PDF.js library');
      };
      document.head.appendChild(script1);
    };

    loadLibraries();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');

    const newPdfs: UploadedPDF[] = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      originalSize: file.size,
      quality: 80,
      estimatedSize: Math.round(file.size * 0.8),
    }));

    setFiles(prev => [...prev, ...newPdfs]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      setLoadError('Please drop PDF files only');
      setTimeout(() => setLoadError(''), 3000);
      return;
    }

    const newPdfs: UploadedPDF[] = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      originalSize: file.size,
      quality: 80,
      estimatedSize: Math.round(file.size * 0.8),
    }));

    setFiles(prev => [...prev, ...newPdfs]);
  }, []);

  const compressPdf = async (pdf: UploadedPDF): Promise<Blob | null> => {
    try {
      const PDFjs = (window as any).pdfjsLib;
      const jsPDF = (window as any).jspdf.jsPDF;

      if (!PDFjs || !jsPDF) {
        throw new Error('PDF libraries not loaded');
      }

      const qualityMap: { [key: number]: number } = {
        10: 0.1,
        20: 0.2,
        30: 0.3,
        40: 0.4,
        50: 0.5,
        60: 0.6,
        70: 0.7,
        80: 0.8,
        90: 0.9,
        100: 1.0,
      };

      const jpegQuality = qualityMap[pdf.quality] || 0.8;

      const arrayBuffer = await pdf.file.arrayBuffer();
      const pdfDoc = await PDFjs.getDocument({ data: arrayBuffer }).promise;

      const newPdf = new jsPDF({
        orientation: 'portrait' as const,
        unit: 'mm',
        format: 'a4',
      });

      const pageCount = pdfDoc.numPages;

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas context not available');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

        if (i > 1) {
          newPdf.addPage();
        }

        const pageWidth = newPdf.internal.pageSize.getWidth();
        const pageHeight = newPdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        let yPos = 0;
        let remainingHeight = imgHeight;

        while (remainingHeight > 0) {
          const heightToAdd = Math.min(remainingHeight, pageHeight);
          newPdf.addImage(imgData, 'JPEG', 0, yPos, imgWidth, heightToAdd);
          remainingHeight -= pageHeight;
          if (remainingHeight > 0) {
            newPdf.addPage();
            yPos = 0;
          }
        }
      }

      return newPdf.output('blob');
    } catch (error) {
      console.error('PDF compression error:', error);
      throw error;
    }
  };

  const handleCompress = useCallback(
    async (id: string) => {
      const pdf = files.find(f => f.id === id);
      if (!pdf || !libsLoaded) return;

      setFiles(prev =>
        prev.map(f =>
          f.id === id ? { ...f, compressing: true, error: undefined } : f
        )
      );

      try {
        const blob = await compressPdf(pdf);
        if (!blob) throw new Error('Compression failed');

        setFiles(prev =>
          prev.map(f =>
            f.id === id
              ? {
                  ...f,
                  compressed: true,
                  compressing: false,
                  compressedSize: blob.size,
                }
              : f
          )
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pdf.file.name.replace('.pdf', '')}_compressed_${pdf.quality}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        setFiles(prev =>
          prev.map(f =>
            f.id === id
              ? {
                  ...f,
                  compressing: false,
                  error: err.message || 'Compression failed',
                }
              : f
          )
        );
      }
    },
    [files, libsLoaded]
  );

  const handleEdit = useCallback((id: string) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === id ? { ...f, compressed: false } : f
      )
    );
  }, []);

  const handleCompressAll = useCallback(async () => {
    setProcessingAll(true);
    for (const pdf of files.filter(f => !f.compressed && !f.compressing)) {
      await handleCompress(pdf.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setProcessingAll(false);
  }, [files, handleCompress]);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    setFiles([]);
  }, []);

  const totalOriginalSize = files.reduce((sum, f) => sum + f.originalSize, 0);
  const totalCompressedSize = files.reduce((sum, f) => sum + (f.compressedSize || 0), 0);
  const compressionRatio =
    totalOriginalSize > 0 ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1) : '0';

  return (
    <div className="w-full space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            PDF Compressor
          </CardTitle>
          <CardDescription>
            Compress PDF files directly in your browser while maintaining quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadError && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {loadError}
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="border-2 border-dashed border-primary/30 rounded-lg p-4 sm:p-8 text-center hover:border-primary/60 transition cursor-pointer bg-primary/5"
          >
            <FileUp className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-primary/60" />
            <p className="text-sm sm:text-base text-foreground font-semibold mb-1">
              Drop PDF files here or click to select
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Supported: PDF files (no size limit)
            </p>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-input"
            />
            <Button
              onClick={() => document.getElementById('pdf-input')?.click()}
              variant="outline"
              disabled={!libsLoaded}
            >
              {libsLoaded ? 'Select Files' : 'Loading...'}
            </Button>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Files</p>
                <p className="text-base sm:text-lg font-bold">{files.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Original</p>
                <p className="text-base sm:text-lg font-bold">{formatFileSize(totalOriginalSize)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Saved</p>
                <p className="text-base sm:text-lg font-bold text-green-500">{compressionRatio}%</p>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2 sm:space-y-3 max-h-[600px] overflow-y-auto">
              {files.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/30 space-y-2 sm:space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{pdf.file.name}</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs">
                        <span className="text-muted-foreground">
                          Orig: <span className="font-semibold">{formatFileSize(pdf.originalSize)}</span>
                        </span>
                        {!pdf.compressed && (
                          <span className="text-primary">
                            Exp: <span className="font-semibold">{formatFileSize(pdf.estimatedSize || 0)}</span>
                          </span>
                        )}
                        {pdf.compressedSize && (
                          <span className="text-green-500">
                            Act: <span className="font-semibold">{formatFileSize(pdf.compressedSize)}</span>
                          </span>
                        )}
                      </div>
                      {pdf.error && (
                        <p className="text-xs text-destructive mt-1">{pdf.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {pdf.compressing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                      ) : pdf.compressed ? (
                        <>
                          <div className="text-green-500 text-sm font-semibold flex-shrink-0">✓</div>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(pdf.id)}
                            disabled={processingAll}
                            variant="outline"
                            className="text-xs sm:text-sm"
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCompress(pdf.id)}
                          disabled={processingAll || !libsLoaded}
                          variant="outline"
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleRemove(pdf.id)}
                        disabled={processingAll || pdf.compressing}
                        variant="ghost"
                        className="hover:text-destructive p-0 h-auto"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>

                  {!pdf.compressed && (
                    <div className="space-y-1 sm:space-y-2 pt-2 border-t border-border/30">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold">Quality</label>
                        <span className="text-xs font-mono bg-primary/20 px-2 py-1 rounded">
                          {pdf.quality}%
                        </span>
                      </div>
                      <Slider
                        value={[pdf.quality]}
                        onValueChange={(v) => {
                          setFiles(prev =>
                            prev.map(f =>
                              f.id === pdf.id
                                ? {
                                    ...f,
                                    quality: v[0],
                                    estimatedSize: Math.round(f.originalSize * (v[0] / 100)),
                                  }
                                : f
                            )
                          );
                        }}
                        min={10}
                        max={100}
                        step={10}
                        disabled={processingAll || pdf.compressing}
                      />
                      <p className="text-xs text-muted-foreground">
                        Adjust quality level
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleCompressAll}
                disabled={processingAll || !libsLoaded || files.every(f => f.compressed)}
                className="flex-1"
              >
                {processingAll ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                    <span className="text-xs sm:text-base">Compressing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-base">Compress All</span>
                  </>
                )}
              </Button>
              <Button onClick={handleClear} variant="outline" disabled={processingAll} className="flex-1 sm:flex-none">
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfCompressor;
