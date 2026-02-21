import React from 'react';
import { Crop, FileSearch, ArrowRightLeft, Maximize2, Link2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageCropper from '@/components/ImageCropper';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import WebPConverter from '@/components/WebPConverter';
import ImageResizer from '@/components/ImageResizer';
import UrlImageDownloader from '@/components/UrlImageDownloader';

const Index: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="pt-8 sm:pt-10 pb-4 sm:pb-6 text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Xpert-Optimiser</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto font-serif">XO aims to become a trusted, free, and secure optimization hub where users can analyze, transform, and compress media assets with expert-level precision — directly from the browser.</p>
      </header>

      <section className="max-w-6xl mx-auto px-3 sm:px-4 pb-10 sm:pb-16">
        <Tabs defaultValue="cropper" className="w-full">
          <TabsList className="flex w-full max-w-3xl mx-auto mb-6 sm:mb-8 bg-muted/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
            <TabsTrigger value="cropper" className="flex-1 min-w-0 gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3">
              <Crop className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">Crop</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex-1 min-w-0 gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3">
              <FileSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="resizer" className="flex-1 min-w-0 gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3">
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">Resize</span>
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex-1 min-w-0 gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3">
              <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">WebP</span>
            </TabsTrigger>
            <TabsTrigger value="url-download" className="flex-1 min-w-0 gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-3">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">URL</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cropper"><ImageCropper /></TabsContent>
          <TabsContent value="analyzer"><ImageAnalyzer /></TabsContent>
          <TabsContent value="resizer"><ImageResizer /></TabsContent>
          <TabsContent value="converter"><WebPConverter /></TabsContent>
          <TabsContent value="url-download"><UrlImageDownloader /></TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Index;
