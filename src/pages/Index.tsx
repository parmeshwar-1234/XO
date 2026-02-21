import React, { useState } from 'react';
import { Crop, FileSearch, ArrowRightLeft, Maximize2, Link2, Zap, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImageCropper from '@/components/ImageCropper';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import WebPConverter from '@/components/WebPConverter';
import ImageResizer from '@/components/ImageResizer';
import UrlImageDownloader from '@/components/UrlImageDownloader';
import PdfCompressor from '@/components/PdfCompressor';

type Feature = 'home' | 'cropper' | 'analyzer' | 'resizer' | 'converter' | 'url-download' | 'pdf-compress';

interface FeatureItem {
  id: Feature;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ComponentType;
}

const features: FeatureItem[] = [
  {
    id: 'cropper',
    label: 'Image Cropper',
    icon: <Crop className="w-8 h-8" />,
    description: 'Crop, rotate, zoom, and flip images with precision',
    component: ImageCropper,
  },
  {
    id: 'analyzer',
    label: 'Image Analyzer',
    icon: <FileSearch className="w-8 h-8" />,
    description: 'Analyze image properties and get detailed metadata',
    component: ImageAnalyzer,
  },
  {
    id: 'resizer',
    label: 'Image Resizer',
    icon: <Maximize2 className="w-8 h-8" />,
    description: 'Resize images to any dimension with quality control',
    component: ImageResizer,
  },
  {
    id: 'converter',
    label: 'WebP Converter',
    icon: <ArrowRightLeft className="w-8 h-8" />,
    description: 'Convert images to WebP format for better compression',
    component: WebPConverter,
  },
  {
    id: 'url-download',
    label: 'URL Image Downloader',
    icon: <Link2 className="w-8 h-8" />,
    description: 'Download and convert images directly from URLs',
    component: UrlImageDownloader,
  },
  {
    id: 'pdf-compress',
    label: 'PDF Compressor',
    icon: <Zap className="w-8 h-8" />,
    description: 'Compress PDFs with adjustable quality levels',
    component: PdfCompressor,
  },
];

const Index: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('home');

  const currentFeature = features.find(f => f.id === activeFeature);
  const Component = currentFeature?.component;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveFeature('home')}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <h1 className="text-xl sm:text-2xl font-bold">
                <span className="gradient-text">
                  <span className="sm:hidden">XO</span>
                  <span className="hidden sm:inline">Xpert-Optimiser</span>
                </span>
              </h1>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {features.map((feature) => (
                <Button
                  key={feature.id}
                  variant={activeFeature === feature.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveFeature(feature.id)}
                  className="gap-2"
                >
                  {feature.icon}
                  <span className="hidden lg:inline text-xs">{feature.label}</span>
                </Button>
              ))}
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="md:hidden">
              <select
                value={activeFeature}
                onChange={(e) => setActiveFeature(e.target.value as Feature)}
                className="px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm"
              >
                <option value="home">Select Feature</option>
                {features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb - Desktop Only */}
      {activeFeature !== 'home' && (
        <div className="hidden sm:block bg-muted/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                onClick={() => setActiveFeature('home')}
                className="flex items-center gap-1 hover:text-foreground transition"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{currentFeature?.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-8 sm:pt-10 pb-6 sm:pb-8 text-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {activeFeature === 'home' ? (
            <>
              <span className="gradient-text">Professional Image & Document</span>
              <br />
              <span className="gradient-text">Optimization Suite</span>
            </>
          ) : (
            currentFeature?.label
          )}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          {activeFeature === 'home'
            ? 'XO aims to become a trusted, free, and secure optimization hub where users can analyze, transform, and compress media assets with expert-level precision — directly from the browser.'
            : currentFeature?.description}
        </p>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 pb-10 sm:pb-16">
        {activeFeature === 'home' ? (
          // Cards Grid for Home Page
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature) => (
              <Card
                key={feature.id}
                className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="mt-4 text-lg sm:text-xl">{feature.label}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    Get Started
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Feature Component
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 sm:p-6 backdrop-blur">
            {Component && <Component />}
          </div>
        )}
      </section>
    </main>
  );
};

export default Index;
