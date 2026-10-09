import React, { useState, useRef } from 'react';
import {
  Upload, Sparkles, MessageSquare, Play, Pause, XCircle, RotateCcw,
  Sliders, UserCheck, Image as ImageIcon, Zap, CheckCircle2, AlertCircle,
  FileArchive, Layers, Eye
} from 'lucide-react';
import { BatchItem, ProcessingSettings, Preset, CommandParseResult, SupportedModel } from '../types';
import { BUILTIN_PRESETS } from '../data/presets';
import { parseNaturalLanguageCommand } from '../services/commandParserClient';

interface BatchWorkspaceProps {
  items: BatchItem[];
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  settings: ProcessingSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProcessingSettings>>;
  onLoad30Samples: () => void;
  onStartProcessing: () => void;
  onPauseProcessing: () => void;
  onCancelProcessing: () => void;
  onResetQueue: () => void;
  isProcessing: boolean;
  isPaused: boolean;
  processingProgress: number;
  currentProcessingItem: BatchItem | null;
  isIndonesian: boolean;
  onSelectViewerItem: (item: BatchItem) => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({
  items,
  setItems,
  settings,
  setSettings,
  onLoad30Samples,
  onStartProcessing,
  onPauseProcessing,
  onCancelProcessing,
  onResetQueue,
  isProcessing,
  isPaused,
  processingProgress,
  currentProcessingItem,
  isIndonesian,
  onSelectViewerItem,
}) => {
  const [commandText, setCommandText] = useState('');
  const [parsedCommand, setParsedCommand] = useState<CommandParseResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Command Execution
  const handleExecuteCommand = () => {
    if (!commandText.trim()) return;
    const res = parseNaturalLanguageCommand(commandText, settings, isIndonesian);
    setParsedCommand(res);
    if (res.understood) {
      setSettings((prev) => ({ ...prev, ...res.proposedModifications }));
    }
  };

  // Load preset
  const handleApplyPreset = (preset: Preset) => {
    setSettings((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  // Handle local file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchItem[] = [];
    let duplicates = 0;
    const seenHashes = new Set(items.map((it) => it.fileHash));

    Array.from(files).forEach((file, index) => {
      const hash = `hash_${file.name}_${file.size}_${file.lastModified}`;
      if (seenHashes.has(hash)) {
        duplicates++;
        return;
      }
      seenHashes.add(hash);

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        newItems.push({
          id: `upload-${Date.now()}-${index}`,
          filename: file.name,
          fileSizeKb: Math.round(file.size / 1024),
          originalWidth: img.naturalWidth || 800,
          originalHeight: img.naturalHeight || 600,
          originalDataUrl: objectUrl,
          status: 'Waiting',
          fileHash: hash,
          category: 'custom',
        });
        if (newItems.length === files.length - duplicates) {
          setItems((prev) => [...prev, ...newItems]);
        }
      };
    });

    if (duplicates > 0) {
      setDuplicateWarning(
        isIndonesian
          ? `${duplicates} file terdeteksi sebagai duplikat dan diabaikan.`
          : `${duplicates} duplicate files were skipped.`
      );
      setTimeout(() => setDuplicateWarning(null), 4000);
    }
  };

  const filteredItems = items.filter((it) => {
    if (activeCategory === 'all') return true;
    return it.category === activeCategory;
  });

  const waitingCount = items.filter((it) => it.status === 'Waiting').length;
  const completedCount = items.filter((it) => it.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* 1. TOP COMMAND BAR & QUICK SAMPLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Natural Language Command Bar */}
        <div className="lg:col-span-2 rounded-xl bg-neutral-900 border border-neutral-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-200">
                {isIndonesian ? 'Perintah Bahasa Alami (ID / EN)' : 'Natural Language Command Bar (ID / EN)'}
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">
              {isIndonesian ? 'Parsing lokal 100% tanpa API eksternal' : '100% local rule-based parsing'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
              placeholder={
                isIndonesian
                  ? 'Contoh: Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah natural, simpan sebagai JPG 95...'
                  : 'E.g.: Upscale 4x with natural portrait face, export as JPG 95 quality, pack to ZIP...'
              }
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
            <button
              onClick={handleExecuteCommand}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isIndonesian ? 'Terapkan' : 'Apply'}</span>
            </button>
          </div>

          {/* Feedback pill */}
          {parsedCommand && (
            <div
              className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-start space-x-2 border ${
                parsedCommand.understood
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              }`}
            >
              {parsedCommand.understood ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{parsedCommand.summary}</p>
                {parsedCommand.explanations.length > 0 && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-neutral-300">
                    {parsedCommand.explanations.map((exp, i) => (
                      <li key={i}>{exp}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Batch Actions Card */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-200">
                {isIndonesian ? 'Uji Coba Masal (30 Foto)' : 'Batch Benchmark (30 Photos)'}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                {items.length} {isIndonesian ? 'Foto' : 'Photos'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              {isIndonesian
                ? 'Muat langsung 30 sampel foto portrait & landscape beresolusi berbeda untuk menguji performa batch tanpa repot mencari file di komputer.'
                : 'Instantly load 30 portrait and landscape test cards to test large-batch upscaling workflows right away.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLoad30Samples}
              className="flex-1 py-2 px-3 text-xs font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 hover:border-amber-500/50 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isIndonesian ? '⚡ Muat 30 Sampel Foto' : '⚡ Load 30 Samples'}</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center justify-center space-x-1 cursor-pointer"
              title="Pilih foto dari komputer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isIndonesian ? 'Unggah' : 'Upload'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*,.zip"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Duplicate warning alert */}
      {duplicateWarning && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {/* 2. PRESETS ROW */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-200">
              {isIndonesian ? 'Preset Optimasi Siap Pakai' : 'Instant Preset Profiles'}
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            {isIndonesian ? 'Pilih konfigurasi siap pakai' : '1-click configurations'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {BUILTIN_PRESETS.map((preset) => {
            const isSelected =
              settings.scale === preset.settings.scale &&
              settings.modelName === preset.settings.modelName &&
              settings.faceRestorationEnabled === preset.settings.faceRestorationEnabled;

            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    {preset.settings.scale}x
                  </span>
                  {preset.settings.faceRestorationEnabled && (
                    <span title="Restorasi Wajah Aktif">
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold truncate leading-tight mt-1" title={preset.name}>
                  {isIndonesian ? preset.name : preset.nameEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SETTINGS & HARDWARE CONTROLS */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-200">
              {isIndonesian ? 'Konfigurasi Mesin AI & Pemrosesan' : 'AI Engine & Image Pipeline Settings'}
            </h3>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            {showAdvanced
              ? (isIndonesian ? 'Sembunyikan Pengaturan Lanjutan' : 'Hide Advanced')
              : (isIndonesian ? 'Tampilkan Pengaturan Lanjutan...' : 'Show Advanced...')}
          </button>
        </div>

        {/* Core Settings: Model, Scale, Face Restoration */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Model Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {isIndonesian ? 'Model Real-ESRGAN' : 'Real-ESRGAN Model'}
            </label>
            <select
              value={settings.modelName}
              onChange={(e) => setSettings({ ...settings, modelName: e.target.value as SupportedModel })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="realesrgan-x4plus">realesrgan-x4plus (Foto & Portrait)</option>
              <option value="realesrnet-x4plus">realesrnet-x4plus (Halus / Denoise)</option>
              <option value="realesrgan-x4plus-anime">realesrgan-x4plus-anime (2D & Kartun)</option>
              <option value="realesr-animevideov3">realesr-animevideov3 (Anime Cepat)</option>
            </select>
            <p className="text-[10px] text-neutral-500 mt-1">
              {settings.modelName === 'realesrgan-x4plus'
                ? 'Model utama untuk foto manusia & detail tajam.'
                : 'Model khusus reduksi noise tanpa artefak.'}
            </p>
          </div>

          {/* Scale Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {isIndonesian ? 'Skala Perbesaran' : 'Upscale Factor'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setSettings({ ...settings, scale: s as 2 | 4 | 8 })}
                  className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    settings.scale === s
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              {settings.scale === 4
                ? 'Resolusi native 4x model AI.'
                : settings.scale === 2
                ? '2x via inferensi 4x + downscale presisi.'
                : '8x via pipeline multi-pass.'}
            </p>
          </div>

          {/* Face Restoration (GFPGAN) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isIndonesian ? 'Restorasi Wajah' : 'Face Restoration'}</span>
              </label>
              <input
                type="checkbox"
                checked={settings.faceRestorationEnabled}
                onChange={(e) => setSettings({ ...settings, faceRestorationEnabled: e.target.checked })}
                className="rounded accent-amber-500 h-4 w-4 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                disabled={!settings.faceRestorationEnabled}
                value={settings.faceStrength}
                onChange={(e) => setSettings({ ...settings, faceStrength: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>{isIndonesian ? 'Natural' : 'Natural'} (0.1)</span>
                <span className="font-mono text-amber-400">{settings.faceStrength.toFixed(2)}</span>
                <span>{isIndonesian ? 'Tajam' : 'Sharp'} (1.0)</span>
              </div>
            </div>
          </div>

          {/* Format & Quality */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {isIndonesian ? 'Format Ekspor' : 'Export Format'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['JPG', 'PNG', 'WEBP'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSettings({ ...settings, outputFormat: fmt })}
                  className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    settings.outputFormat === fmt
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              {settings.outputFormat === 'JPG'
                ? `Kualitas ${settings.jpegQuality}%`
                : settings.outputFormat === 'WEBP'
                ? `Kualitas ${settings.webpQuality}% WebP`
                : 'PNG Lossless'}
            </p>
          </div>
        </div>

        {/* Advanced Accordion: Sliders for brightness, contrast, saturation, sharpness, tile size */}
        {showAdvanced && (
          <div className="pt-4 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>{isIndonesian ? 'Kecerahan' : 'Brightness'}</span>
                <span className="font-mono text-neutral-400">{settings.brightness.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.02"
                value={settings.brightness}
                onChange={(e) => setSettings({ ...settings, brightness: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>{isIndonesian ? 'Kontras' : 'Contrast'}</span>
                <span className="font-mono text-neutral-400">{settings.contrast.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.02"
                value={settings.contrast}
                onChange={(e) => setSettings({ ...settings, contrast: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Sharpness */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>{isIndonesian ? 'Ketajaman' : 'Sharpness'}</span>
                <span className="font-mono text-neutral-400">{settings.sharpness.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={settings.sharpness}
                onChange={(e) => setSettings({ ...settings, sharpness: parseFloat(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Tile Size (VRAM) */}
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>{isIndonesian ? 'Tile Size (VRAM)' : 'Tile Size (VRAM)'}</span>
                <span className="font-mono text-neutral-400">{settings.tileSize === 0 ? 'Auto' : `${settings.tileSize}px`}</span>
              </div>
              <select
                value={settings.tileSize}
                onChange={(e) => setSettings({ ...settings, tileSize: parseInt(e.target.value, 10) })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
              >
                <option value={0}>0 (Auto / GPU VRAM Cepat)</option>
                <option value={200}>200px (Hemat VRAM 2-4GB)</option>
                <option value={400}>400px (Standar GPU 6-8GB)</option>
              </select>
            </div>

            {/* Filename Suffix */}
            <div>
              <label className="block text-xs text-neutral-300 mb-1">
                {isIndonesian ? 'Akhiran Nama File' : 'Filename Suffix'}
              </label>
              <input
                type="text"
                value={settings.filenameSuffix}
                onChange={(e) => setSettings({ ...settings, filenameSuffix: e.target.value })}
                placeholder="_enhanced"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN BATCH ACTION BAR & PROGRESS */}
      <div className="rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onStartProcessing}
              disabled={items.length === 0 || isProcessing}
              className="px-6 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 transition disabled:opacity-40 flex items-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isIndonesian
                  ? `🚀 Mulai Proses Semua (${waitingCount > 0 ? waitingCount : items.length} Foto)`
                  : `🚀 Process All (${waitingCount > 0 ? waitingCount : items.length} Photos)`}
              </span>
            </button>

            {isProcessing && (
              <>
                <button
                  onClick={onPauseProcessing}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{isPaused ? (isIndonesian ? 'Lanjutkan' : 'Resume') : (isIndonesian ? 'Jeda' : 'Pause')}</span>
                </button>
                <button
                  onClick={onCancelProcessing}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/60 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isIndonesian ? 'Batalkan' : 'Cancel'}</span>
                </button>
              </>
            )}

            {!isProcessing && items.length > 0 && (
              <button
                onClick={onResetQueue}
                className="px-3 py-2 text-xs font-medium rounded-lg text-neutral-400 hover:text-neutral-200 transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isIndonesian ? 'Bersihkan Antrean' : 'Clear Queue'}</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Counter */}
          <div className="flex items-center space-x-4 text-xs font-mono">
            <div>
              <span className="text-neutral-500">{isIndonesian ? 'Total:' : 'Total:'} </span>
              <span className="font-bold text-neutral-200">{items.length}</span>
            </div>
            <div>
              <span className="text-neutral-500">{isIndonesian ? 'Menunggu:' : 'Waiting:'} </span>
              <span className="font-bold text-amber-400">{waitingCount}</span>
            </div>
            <div>
              <span className="text-neutral-500">{isIndonesian ? 'Selesai:' : 'Done:'} </span>
              <span className="font-bold text-emerald-400">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        {(isProcessing || processingProgress > 0) && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-300">
              <span className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>
                  {currentProcessingItem
                    ? `${isIndonesian ? 'Sedang memproses:' : 'Processing:'} ${currentProcessingItem.filename} (${settings.scale}x ${settings.modelName})`
                    : isIndonesian
                    ? 'Menyiapkan batch...'
                    : 'Preparing batch...'}
                </span>
              </span>
              <span className="font-mono font-bold text-amber-400">{processingProgress}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. THUMBNAIL GALLERY PREVIEW */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-200">
              {isIndonesian ? 'Pratinjau Antrean Foto' : 'Batch Photo Queue Grid'}
            </h3>
            <span className="text-xs text-neutral-400 font-mono">({filteredItems.length})</span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1 text-xs">
            {[
              { id: 'all', label: isIndonesian ? 'Semua' : 'All' },
              { id: 'portrait', label: isIndonesian ? 'Portrait / Wajah' : 'Portraits' },
              { id: 'vintage', label: isIndonesian ? 'Vintage / Low-Res' : 'Vintage' },
              { id: 'landscape', label: isIndonesian ? 'Pemandangan' : 'Landscape' },
              { id: 'anime', label: isIndonesian ? 'Anime / 2D' : 'Anime' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                  activeCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40">
            <FileArchive className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">
              {isIndonesian
                ? 'Belum ada foto dalam antrean. Klik "⚡ Muat 30 Sampel Foto" atau unggah file Anda.'
                : 'No photos in queue. Click "⚡ Load 30 Samples" or drag & drop image files.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredItems.map((item) => {
              const isCompleted = item.status === 'Completed';
              const isProcessingThis = item.status === 'Processing';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectViewerItem(item)}
                  className={`group relative rounded-lg overflow-hidden border bg-neutral-950 transition cursor-pointer flex flex-col justify-between ${
                    isProcessingThis
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : isCompleted
                      ? 'border-emerald-800/80 hover:border-emerald-500'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[4/3] w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={isCompleted && item.outputDataUrl ? item.outputDataUrl : item.originalDataUrl}
                      alt={item.filename}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${
                          item.status === 'Completed'
                            ? 'bg-emerald-500 text-neutral-950'
                            : item.status === 'Processing'
                            ? 'bg-amber-500 text-neutral-950 animate-pulse'
                            : item.status === 'Failed'
                            ? 'bg-red-500 text-white'
                            : 'bg-neutral-800/90 text-neutral-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Hover Inspect Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Meta Footer */}
                  <div className="p-2 text-[10px] space-y-0.5 bg-neutral-950">
                    <div className="font-medium text-neutral-200 truncate" title={item.filename}>
                      {item.filename}
                    </div>
                    <div className="flex justify-between text-neutral-400 font-mono">
                      <span>{item.originalWidth}x{item.originalHeight}</span>
                      {isCompleted && item.outputWidth ? (
                        <span className="text-emerald-400 font-bold">
                          {item.outputWidth}x{item.outputHeight}
                        </span>
                      ) : (
                        <span>{item.fileSizeKb} KB</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
