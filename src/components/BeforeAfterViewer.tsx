import React, { useState, useRef, useEffect } from 'react';
import {
  Download, ZoomIn, ZoomOut, Maximize2, SplitSquareVertical,
  Columns, Sparkles, SlidersHorizontal, Info, Clock, CheckCircle2
} from 'lucide-react';
import { BatchItem, ProcessingSettings } from '../types';

interface BeforeAfterViewerProps {
  item: BatchItem | null;
  settings: ProcessingSettings;
  isIndonesian: boolean;
  onDownloadSingle: (item: BatchItem) => void;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  item,
  settings,
  isIndonesian,
  onDownloadSingle,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5 = 150%, 2 = 200%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  if (!item) {
    return (
      <div className="py-20 text-center rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <Sparkles className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-neutral-200">
          {isIndonesian ? 'Belum Ada Foto Terpilih' : 'No Photo Selected'}
        </h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
          {isIndonesian
            ? 'Pilih salah satu foto dari antrean atau mulai proses batch untuk melihat perbandingan kualitas visual sebelum dan sesudah peningkatan AI.'
            : 'Select a photo from the queue or run the batch to inspect before-and-after AI super-resolution results.'}
        </p>
      </div>
    );
  }

  const enhancedSrc = item.outputDataUrl || item.originalDataUrl;
  const isCompleted = item.status === 'Completed';

  return (
    <div className="space-y-6">
      {/* 1. TOP TOOLBAR & CONTROLS */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-neutral-100 truncate max-w-sm">
              {item.filename}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isCompleted
                ? (isIndonesian ? 'AI Enhanced' : 'AI Enhanced')
                : (isIndonesian ? 'Original (Pratinjau)' : 'Original (Preview)')}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {item.originalWidth}x{item.originalHeight}px →{' '}
            <strong className="text-amber-400 font-mono">
              {item.outputWidth || item.originalWidth * settings.scale}x
              {item.outputHeight || item.originalHeight * settings.scale}px
            </strong>{' '}
            ({settings.scale}x Real-ESRGAN)
          </p>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode Switch */}
          <div className="flex bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition cursor-pointer ${
                viewMode === 'split' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition cursor-pointer ${
                viewMode === 'side-by-side' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              title="Perkecil / Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1 text-[11px] font-mono text-neutral-300 flex items-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.5))}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              title="Perbesar / Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Single Image */}
          {isCompleted && item.outputDataUrl && (
            <button
              onClick={() => onDownloadSingle(item)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIndonesian ? 'Unduh Foto' : 'Download Photo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. VIEWER CANVAS / CONTAINER */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-2xl relative select-none">
        {viewMode === 'split' ? (
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            className="relative w-full aspect-[16/10] max-h-[640px] overflow-hidden flex items-center justify-center cursor-ew-resize bg-neutral-950"
          >
            {/* Background: Enhanced / Processed Image */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden transition-transform duration-100"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={enhancedSrc}
                alt="AI Enhanced"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Foreground: Original Image with Clip Path */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                transform: `scale(${zoomLevel})`,
              }}
            >
              <img
                src={item.originalDataUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Divider Handle Bar */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center shadow-lg border-2 border-neutral-950">
                ↔
              </div>
            </div>

            {/* Corner Badges */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[11px] font-semibold text-neutral-200 border border-neutral-700 pointer-events-none">
              ◀ {isIndonesian ? 'Foto Asli (Original)' : 'Original Photo'}
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[11px] font-semibold text-amber-300 border border-amber-500/50 pointer-events-none">
              {isIndonesian ? 'Hasil AI Enhanced' : 'AI Enhanced Result'} ({settings.scale}x) ▶
            </div>
          </div>
        ) : (
          /* Side by Side Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 aspect-[16/9] max-h-[600px] overflow-hidden">
            {/* Original Card */}
            <div className="relative p-4 flex flex-col justify-between overflow-hidden bg-neutral-900/40">
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-[11px] font-semibold text-neutral-300 z-10">
                {isIndonesian ? 'Foto Asli' : 'Original Photo'} ({item.originalWidth}x{item.originalHeight})
              </div>
              <div
                className="flex-1 flex items-center justify-center overflow-hidden"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={item.originalDataUrl}
                  alt="Original"
                  className="max-h-[500px] w-auto object-contain rounded"
                />
              </div>
            </div>

            {/* Enhanced Card */}
            <div className="relative p-4 flex flex-col justify-between overflow-hidden bg-neutral-900/40">
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/70 text-[11px] font-semibold text-amber-300 border border-amber-500/40 z-10">
                AI Enhanced ({item.outputWidth || item.originalWidth * settings.scale}x
                {item.outputHeight || item.originalHeight * settings.scale})
              </div>
              <div
                className="flex-1 flex items-center justify-center overflow-hidden"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={enhancedSrc}
                  alt="AI Enhanced"
                  className="max-h-[500px] w-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. DETAILED METADATA & INFERENCE REPORT CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400 mb-1 flex items-center space-x-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isIndonesian ? 'Perubahan Resolusi' : 'Resolution Change'}</span>
          </div>
          <div className="text-sm font-bold font-mono text-neutral-100">
            {item.originalWidth}x{item.originalHeight} → {item.outputWidth || item.originalWidth * settings.scale}x{item.outputHeight || item.originalHeight * settings.scale}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">
            +{((settings.scale * settings.scale - 1) * 100)}% {isIndonesian ? 'total piksel' : 'total pixels'}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400 mb-1 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isIndonesian ? 'Model AI yang Digunakan' : 'Model Used'}</span>
          </div>
          <div className="text-sm font-bold font-mono text-amber-300 truncate">
            {settings.modelName}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Real-ESRGAN NCNN Vulkan ({settings.scale}x)
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400 mb-1 flex items-center space-x-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isIndonesian ? 'Restorasi Wajah' : 'Face Restoration'}</span>
          </div>
          <div className="text-sm font-bold text-neutral-100">
            {settings.faceRestorationEnabled
              ? `${isIndonesian ? 'Aktif' : 'Active'} (${settings.faceStrength.toFixed(2)})`
              : (isIndonesian ? 'Non-Aktif' : 'Disabled')}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {settings.faceRestorationEnabled
              ? (isIndonesian ? 'GFPGAN natural alignment' : 'GFPGAN natural alignment')
              : (isIndonesian ? 'Standard Super-Resolution' : 'Standard Super-Resolution')}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400 mb-1 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{isIndonesian ? 'Durasi Pemrosesan' : 'Processing Duration'}</span>
          </div>
          <div className="text-sm font-bold font-mono text-neutral-100">
            {item.durationSeconds ? `${item.durationSeconds.toFixed(2)} detik` : '-'}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Format: {settings.outputFormat} ({settings.jpegQuality}%)
          </p>
        </div>
      </div>
    </div>
  );
};
