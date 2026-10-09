/**
 * PixelForge Studio — Private AI Photo Enhancer
 * Aplikasi Desktop & Web Studio Lokal untuk AI Photo Upscaling & Batch Processing.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers, Sliders, Eye, ListOrdered, Download,
  Terminal, Cpu, CheckCircle2, AlertCircle, HardDrive
} from 'lucide-react';
import { BatchItem, ProcessingSettings } from './types';
import { generate30SamplePhotos } from './data/samplePhotos';
import { processImageOnCanvas } from './services/imageProcessor';
import { generateFullWindowsZip } from './services/packageGenerator';
import { Header } from './components/Header';
import { BatchWorkspace } from './components/BatchWorkspace';
import { BatchQueueTable } from './components/BatchQueueTable';
import { BeforeAfterViewer } from './components/BeforeAfterViewer';
import { WindowsPackageExporter } from './components/WindowsPackageExporter';
import { HardwareDiagnostics } from './components/HardwareDiagnostics';

export default function App() {
  const [isIndonesian, setIsIndonesian] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'viewer' | 'queue' | 'installer' | 'diagnostics'>('workspace');

  // Batch Items & Initial 30 Samples
  const [items, setItems] = useState<BatchItem[]>(() => generate30SamplePhotos());
  const [selectedViewerItem, setSelectedViewerItem] = useState<BatchItem | null>(null);

  // Settings State
  const [settings, setSettings] = useState<ProcessingSettings>({
    modelName: 'realesrgan-x4plus',
    scale: 4,
    tileSize: 0,
    gpuId: 0,
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sharpness: 1.0,
    denoise: 0.0,
    faceRestorationEnabled: true,
    faceStrength: 0.6,
    outputFormat: 'JPG',
    jpegQuality: 95,
    webpQuality: 90,
    filenamePrefix: '',
    filenameSuffix: '_enhanced',
    preserveMetadata: true,
    autoOrientExif: true,
    stripGps: true,
  });

  // Batch Processing Controller State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingItem, setCurrentProcessingItem] = useState<BatchItem | null>(null);
  const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isCancelledRef = useRef(false);

  // Auto select first sample for viewer
  useEffect(() => {
    if (!selectedViewerItem && items.length > 0) {
      setSelectedViewerItem(items[0]);
    }
  }, [items, selectedViewerItem]);

  // Load 30 fresh samples
  const handleLoad30Samples = () => {
    const samples = generate30SamplePhotos();
    setItems(samples);
    setSelectedViewerItem(samples[0]);
    setProcessingProgress(0);
  };

  // Start Batch Processing sequentially
  const handleStartProcessing = async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setIsPaused(false);
    isCancelledRef.current = false;

    const waitingIndices = items
      .map((it, idx) => (it.status === 'Waiting' || it.status === 'Failed' ? idx : -1))
      .filter((idx) => idx !== -1);

    const targetIndices = waitingIndices.length > 0 ? waitingIndices : items.map((_, idx) => idx);
    let processedCount = 0;

    for (const idx of targetIndices) {
      if (isCancelledRef.current) break;

      // Handle pause wait loop
      while (isPausedRef.current && !isCancelledRef.current) {
        await new Promise((r) => setTimeout(r, 200));
      }

      const currentItem = items[idx];
      setCurrentProcessingItem(currentItem);

      // Mark Preparing & Processing
      setItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], status: 'Processing' };
        return next;
      });

      try {
        // Run Canvas image processing
        const res = await processImageOnCanvas(
          currentItem.originalDataUrl,
          settings,
          currentItem.originalWidth,
          currentItem.originalHeight
        );

        setItems((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'Completed',
            outputDataUrl: res.outputDataUrl,
            outputWidth: res.outputWidth,
            outputHeight: res.outputHeight,
            durationSeconds: res.durationSeconds,
            outputFileSizeKb: res.outputFileSizeKb,
          };
          return next;
        });

        // Set as selected viewer item for live preview
        setSelectedViewerItem((prev) => {
          if (!prev || prev.id === currentItem.id) {
            return {
              ...currentItem,
              status: 'Completed',
              outputDataUrl: res.outputDataUrl,
              outputWidth: res.outputWidth,
              outputHeight: res.outputHeight,
              durationSeconds: res.durationSeconds,
              outputFileSizeKb: res.outputFileSizeKb,
            };
          }
          return prev;
        });
      } catch (err: any) {
        setItems((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'Failed',
            errorMessage: err?.message || 'Processing failed',
          };
          return next;
        });
      }

      processedCount++;
      const progressPct = Math.round((processedCount / targetIndices.length) * 100);
      setProcessingProgress(progressPct);
    }

    setIsProcessing(false);
    setCurrentProcessingItem(null);
  };

  const handlePauseProcessing = () => {
    setIsPaused((p) => !p);
  };

  const handleCancelProcessing = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentProcessingItem(null);
  };

  const handleResetQueue = () => {
    setItems([]);
    setSelectedViewerItem(null);
    setProcessingProgress(0);
  };

  const handleRetryFailed = () => {
    setItems((prev) =>
      prev.map((it) => (it.status === 'Failed' ? { ...it, status: 'Waiting', errorMessage: undefined } : it))
    );
  };

  const handleClearCompleted = () => {
    setItems((prev) => prev.filter((it) => it.status !== 'Completed'));
  };

  const handleSelectViewerItem = (item: BatchItem) => {
    setSelectedViewerItem(item);
    setActiveTab('viewer');
  };

  const handleDownloadSingle = (item: BatchItem) => {
    if (!item.outputDataUrl) return;
    const a = document.createElement('a');
    a.href = item.outputDataUrl;
    const ext = settings.outputFormat.toLowerCase();
    const cleanName = item.filename.replace(/\.[^/.]+$/, '') + settings.filenameSuffix + `.${ext}`;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadWindowsZip = async () => {
    setIsDownloadingPackage(true);
    try {
      const blob = await generateFullWindowsZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PixelForgeStudio_Windows.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsDownloadingPackage(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* 1. TOP HEADER */}
      <Header
        isIndonesian={isIndonesian}
        setIsIndonesian={setIsIndonesian}
        onDownloadWindowsZip={handleDownloadWindowsZip}
        isDownloadingPackage={isDownloadingPackage}
      />

      {/* 2. SUB-NAV TABS */}
      <nav className="border-b border-neutral-800 bg-neutral-900/60 sticky top-[57px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 py-2">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shrink-0 cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isIndonesian ? 'Ruang Kerja Batch' : 'Batch Workspace'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shrink-0 cursor-pointer ${
              activeTab === 'viewer'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isIndonesian ? 'Sebelum & Sesudah' : 'Before & After'}</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shrink-0 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isIndonesian ? 'Antrean & Ekspor ZIP' : 'Queue & ZIP Export'}</span>
          </button>

          <button
            onClick={() => setActiveTab('installer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shrink-0 cursor-pointer ${
              activeTab === 'installer'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isIndonesian ? 'Paket Windows & Skrip' : 'Windows Package & Setup'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition shrink-0 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isIndonesian ? 'Diagnostik Hardware' : 'Hardware Diagnostics'}</span>
          </button>
        </div>
      </nav>

      {/* 3. MAIN CONTENT VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'workspace' && (
          <BatchWorkspace
            items={items}
            setItems={setItems}
            settings={settings}
            setSettings={setSettings}
            onLoad30Samples={handleLoad30Samples}
            onStartProcessing={handleStartProcessing}
            onPauseProcessing={handlePauseProcessing}
            onCancelProcessing={handleCancelProcessing}
            onResetQueue={handleResetQueue}
            isProcessing={isProcessing}
            isPaused={isPaused}
            processingProgress={processingProgress}
            currentProcessingItem={currentProcessingItem}
            isIndonesian={isIndonesian}
            onSelectViewerItem={handleSelectViewerItem}
          />
        )}

        {activeTab === 'viewer' && (
          <BeforeAfterViewer
            item={selectedViewerItem}
            settings={settings}
            isIndonesian={isIndonesian}
            onDownloadSingle={handleDownloadSingle}
          />
        )}

        {activeTab === 'queue' && (
          <BatchQueueTable
            items={items}
            setItems={setItems}
            onRetryFailed={handleRetryFailed}
            onClearCompleted={handleClearCompleted}
            isIndonesian={isIndonesian}
            onSelectViewerItem={handleSelectViewerItem}
          />
        )}

        {activeTab === 'installer' && (
          <WindowsPackageExporter
            onDownloadWindowsZip={handleDownloadWindowsZip}
            isDownloadingPackage={isDownloadingPackage}
            isIndonesian={isIndonesian}
          />
        )}

        {activeTab === 'diagnostics' && (
          <HardwareDiagnostics isIndonesian={isIndonesian} />
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-neutral-800/80 bg-neutral-900/60 py-4 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-neutral-200">PixelForge Studio</span>
            <span>•</span>
            <span>{isIndonesian ? 'Aplikasi Windows Lokal Mandiri' : 'Standalone Windows Local App'}</span>
            <span>•</span>
            <span className="text-emerald-400">100% Private Localhost (127.0.0.1)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>Real-ESRGAN NCNN Vulkan</span>
            <span>GFPGAN Face Restoration</span>
            <span>Zero API Key Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
