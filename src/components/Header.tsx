import React from 'react';
import { Cpu, Download, Globe, ShieldCheck, HardDrive } from 'lucide-react';

interface HeaderProps {
  isIndonesian: boolean;
  setIsIndonesian: (val: boolean) => void;
  onDownloadWindowsZip: () => void;
  isDownloadingPackage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isIndonesian,
  setIsIndonesian,
  onDownloadWindowsZip,
  isDownloadingPackage,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950 font-black text-xl">
            PF
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">PixelForge Studio</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                v1.0 Windows & Web
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {isIndonesian
                ? 'Private AI Photo Enhancer & Batch Upscaler (Real-ESRGAN NCNN Vulkan)'
                : 'Private AI Photo Enhancer & Batch Upscaler (Real-ESRGAN NCNN Vulkan)'}
            </p>
          </div>
        </div>

        {/* Security & Local Badges */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Offline / Localhost 127.0.0.1</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-sky-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Real-ESRGAN Vulkan GPU</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-amber-400">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Batch 30 - 100+ Foto</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Language Switch */}
          <button
            onClick={() => setIsIndonesian(!isIndonesian)}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
            title="Ganti Bahasa / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span>{isIndonesian ? 'Bahasa Indonesia' : 'English'}</span>
          </button>

          {/* 1-Click Windows Zip Download */}
          <button
            onClick={onDownloadWindowsZip}
            disabled={isDownloadingPackage}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isDownloadingPackage
                ? (isIndonesian ? 'Menyiapkan ZIP...' : 'Preparing ZIP...')
                : (isIndonesian ? 'Unduh Paket Windows (.ZIP)' : 'Download Windows Package (.ZIP)')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
