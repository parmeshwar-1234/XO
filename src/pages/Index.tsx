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
      <header className="pt-10 pb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Xpert-Optimiser</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-lg px-[2px] text-center mx-[10px] pl-[10px] pr-[10px] font-serif">XO aims to become a trusted, free, and secure optimization hub where users can analyze, transform, and compress media assets with expert-level precision — directly from the browser.</p>
      </header>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <Tabs defaultValue="cropper" className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 mb-8 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="cropper" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Crop className="w-4 h-4" /> Cropper
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileSearch className="w-4 h-4" /> Analyzer
            </TabsTrigger>
            <TabsTrigger value="resizer" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Maximize2 className="w-4 h-4" /> Resizer
            </TabsTrigger>
            <TabsTrigger value="converter" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ArrowRightLeft className="w-4 h-4" /> WebP
            </TabsTrigger>
            <TabsTrigger value="url-download" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Link2 className="w-4 h-4" /> URL
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
