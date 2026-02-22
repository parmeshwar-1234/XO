import React, { useState, useEffect } from 'react';
import { Crop, FileSearch, ArrowRightLeft, Maximize2, Link2, Zap, ChevronRight, Home, Sun, Moon, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropper from '@/components/ImageCropper';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import WebPConverter from '@/components/WebPConverter';
import ImageResizer from '@/components/ImageResizer';
import UrlImageDownloader from '@/components/UrlImageDownloader';
import PdfCompressor from '@/components/PdfCompressor';
import SlugifyText from '@/components/SlugifyText';

type Feature = 'home' | 'cropper' | 'analyzer' | 'resizer' | 'converter' | 'url-download' | 'pdf-compress' | 'slugify';

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
  {
    id: 'slugify',
    label: 'Slugify Text',
    icon: <Sliders className="w-8 h-8" />,
    description: 'Convert text to URL-friendly slugs with customizable options',
    component: SlugifyText,
  },
];

const Index: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('home');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference or localStorage
    const stored = localStorage.getItem('theme');
    if (stored) {
      setIsDark(stored === 'dark');
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDark);
  };

  const currentFeature = features.find(f => f.id === activeFeature);
  const Component = currentFeature?.component;

  return (
    <div className="min-h-screen bg-[#e6e9ef] dark:bg-[#374151] transition-colors duration-500 text-gray-700 dark:text-gray-200">
      {/* Navigation Bar - Neuromorphic */}
      <nav className="sticky top-0 z-40 border-b border-border/20 shadow-lg dark:shadow-2xl neu-raised-fixed dark:navbar-glass dark:bg-transparent dark:backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveFeature('home')}
              className="flex items-center gap-2 hover:opacity-80 neu-focus rounded-lg px-2 py-1"
              data-tooltip="Back to Home"
            >
              <h1 className="text-xl sm:text-2xl font-bold">
                <span className="gradient-text">
                  <span className="sm:hidden">XO</span>
                  <span className="hidden sm:inline">Xpert-Optimiser</span>
                </span>
              </h1>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`neu-btn neu-focus gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-300 ${
                    activeFeature === feature.id
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'neu-raised-sm text-foreground hover:shadow-md'
                  }`}
                >
                  {feature.icon}
                  <span className="hidden lg:inline text-xs">{feature.label}</span>
                </button>
              ))}

              {/* Theme Toggle Button - Desktop */}
              <button
                onClick={toggleTheme}
                className="neu-raised-sm neu-btn neu-focus px-3 py-2 rounded-xl transition-all duration-300"
                aria-label="Toggle dark mode"
                data-tooltip={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-500 transition-colors duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 transition-colors duration-300" />
                )}
              </button>
            </div>

            {/* Mobile Navigation Container */}
            <div className="md:hidden flex items-center gap-2">
              {/* Theme Toggle Button - Mobile */}
              <button
                onClick={toggleTheme}
                className="neu-raised-sm neu-btn neu-focus px-3 py-2 rounded-xl transition-all duration-300"
                aria-label="Toggle dark mode"
                data-tooltip={isDark ? "Light Mode" : "Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-500 transition-colors duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 transition-colors duration-300" />
                )}
              </button>

              {/* Mobile Navigation Dropdown */}
              <select
                value={activeFeature}
                onChange={(e) => setActiveFeature(e.target.value as Feature)}
                className="neu-inset px-3 py-2 rounded-xl bg-transparent text-foreground border border-border text-sm neu-focus"
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

      {/* Breadcrumb Navigation */}
      {activeFeature !== 'home' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <button
              onClick={() => setActiveFeature('home')}
              className="flex items-center gap-1 hover:text-foreground transition neu-focus rounded px-2 py-1"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{currentFeature?.label}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-4 sm:pt-6 pb-6 sm:pb-8 text-center px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {activeFeature === 'home' ? (
            <>
              <span className="gradient-text">Professional Image & Document</span>
              <br />
              <span className="gradient-text">Optimization Suite</span>
            </>
          ) : (
            <span className="gradient-text">{currentFeature?.label}</span>
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
          // Cards Grid - Neuromorphic Design
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className="group neu-raised rounded-3xl p-6 border border-border/20 transition-all duration-300 transform hover:neu-raised-sm hover:-translate-y-2 text-left"
                data-tooltip={`Open ${feature.label}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  {feature.label}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <div className="neu-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-gradient-to-br from-purple-600 to-purple-700 shadow-md">
                  Get Started
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Feature Component - Neuromorphic Container
          <div className="neu-raised border border-border/20 rounded-3xl p-4 sm:p-6 backdrop-blur">
            {Component && <Component />}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
