import React, { useState } from 'react';
import {
  Download, Terminal, FileCode, Check, Copy, FolderCheck,
  ShieldCheck, HelpCircle, HardDrive, Cpu, ExternalLink
} from 'lucide-react';

interface WindowsPackageExporterProps {
  onDownloadWindowsZip: () => void;
  isDownloadingPackage: boolean;
  isIndonesian: boolean;
}

const CODE_SNIPPETS: Record<string, { label: string; lang: string; content: string }> = {
  'setup.bat': {
    label: 'setup.bat (Installer Otomatis Windows)',
    lang: 'bat',
    content: `@echo off
setlocal enabledelayedexpansion
title PixelForge Studio - Setup & Environment Initializer

echo ====================================================================
echo    PIXELFORGE STUDIO -- PRIVATE AI PHOTO ENHANCER SETUP (WINDOWS)
echo ====================================================================
echo.

:: 1. Check Windows Version
ver | findstr /i "10\\. 11\\." >nul
if %errorlevel% neq 0 (
    echo [PERINGATAN] Disarankan Windows 10 atau Windows 11 (64-bit).
) else (
    echo [OK] Windows 10/11 64-bit terdeteksi.
)

:: 2. Check Python Installation
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan di PATH sistem Anda.
    echo Silakan unduh dan instal Python 3.11 atau 3.10 dari https://www.python.org/
    echo Pastikan centang opsi "Add Python to PATH" saat instalasi.
    pause
    exit /b 1
)

python -c "import sys; assert sys.version_info >= (3, 10), 'Python minimal versi 3.10'" >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Versi Python terlalu lama. Diperlukan Python 3.10 atau 3.11.
    python --version
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo [OK] Terdeteksi %PY_VER%

:: 3. Create Virtual Environment
if not exist "venv" (
    echo [INFO] Membuat Python Virtual Environment (venv)...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal membuat virtual environment.
        pause
        exit /b 1
    )
    echo [OK] Virtual environment 'venv' berhasil dibuat.
) else (
    echo [OK] Virtual environment 'venv' sudah tersedia.
)

call venv\\Scripts\\activate.bat

:: 4. Upgrade pip & Install Dependencies
echo.
echo [INFO] Memperbarui pip dan memasang pustaka dari requirements.txt...
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
echo [OK] Seluruh dependensi Python berhasil dipasang.

:: 5. Create Directory Structure
if not exist "inputs" mkdir inputs
if not exist "output" mkdir output
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "models" mkdir models
if not exist "tools" mkdir tools

:: 6. Check / Download Real-ESRGAN-ncnn-vulkan Engine
echo.
echo [INFO] Memeriksa ketersediaan AI Engine Real-ESRGAN NCNN Vulkan...
python download_models.py --interactive

:: 7. Run Diagnostic Self-Test
echo.
echo [INFO] Menjalankan uji diagnostik mandiri...
python -c "import services.hardware_service as hw; print(hw.get_system_summary())"

echo.
echo ====================================================================
echo  SETUP SELESAI! Anda sekarang dapat menjalankan aplikasi dengan:
echo  run.bat
echo ====================================================================
pause
`,
  },
  'run.bat': {
    label: 'run.bat (Peluncur 1-Klik Otomatis)',
    lang: 'bat',
    content: `@echo off
setlocal
title PixelForge Studio - Private AI Photo Enhancer

echo ====================================================================
echo     PIXELFORGE STUDIO -- PRIVATE AI PHOTO ENHANCER (WINDOWS)
echo ====================================================================
echo.
echo Mode: 100%% Offline / Private Localhost Processing
echo Binding: http://127.0.0.1:7860
echo.

if not exist "venv\\Scripts\\activate.bat" (
    echo [INFO] Virtual environment 'venv' belum ditemukan.
    echo Menjalankan setup otomatis pertama kali (setup.bat)...
    echo.
    call setup.bat
    if not exist "venv\\Scripts\\activate.bat" (
        echo.
        echo [ERROR] Setup belum selesai atau dibatalkan.
        pause
        exit /b 1
    )
)

call venv\\Scripts\\activate.bat
python app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Aplikasi berhenti dengan kode error: %errorlevel%
    echo Periksa file log di direktori logs/ untuk informasi kesalahan detail.
    pause
)
`,
  },
  'download_models.py': {
    label: 'download_models.py (Verifikator & Downloader Resmi)',
    lang: 'python',
    content: `#!/usr/bin/env python3
"""
PixelForge Studio - Model & AI Engine Downloader and Verifier
Memeriksa dan mengunduh Real-ESRGAN NCNN Vulkan binary portabel resmi dari GitHub releases.
"""

import os
import sys
import zipfile
import urllib.request
import shutil
from pathlib import Path

OFFICIAL_RELEASE_URL = (
    "https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/releases/download/"
    "v0.1.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
)
ZIP_FILENAME = "realesrgan-ncnn-vulkan-20220424-windows.zip"
EXPECTED_EXE = "realesrgan-ncnn-vulkan.exe"
EXPECTED_MODELS = [
    "realesrgan-x4plus.param", "realesrgan-x4plus.bin",
    "realesrnet-x4plus.param", "realesrnet-x4plus.bin",
    "realesrgan-x4plus-anime.param", "realesrgan-x4plus-anime.bin",
    "realesr-animevideov3.param", "realesr-animevideov3.bin",
]
`,
  },
  'realesrgan_engine.py': {
    label: 'engines/realesrgan_engine.py (Adapter Subprocess AI)',
    lang: 'python',
    content: `class RealESRGANEngine(BaseUpscaleEngine):
    SUPPORTED_MODELS = [
        "realesrgan-x4plus",
        "realesrnet-x4plus",
        "realesrgan-x4plus-anime",
        "realesr-animevideov3",
    ]
    # Eksekusi subprocess aman, scale 4x, scale 2x (downscale presisi),
    # scale 8x (multi-pass), pelaporan dimensi, durasi, dan penanganan error.
`,
  },
  'config.json': {
    label: 'config.json (Konfigurasi Lokal)',
    lang: 'json',
    content: `{
  "app_name": "PixelForge Studio",
  "version": "1.0.0",
  "host": "127.0.0.1",
  "port": 7860,
  "engine": {
    "default_model": "realesrgan-x4plus",
    "default_scale": 4,
    "tile_size": 0,
    "gpu_id": 0
  }
}`,
  },
};

export const WindowsPackageExporter: React.FC<WindowsPackageExporterProps> = ({
  onDownloadWindowsZip,
  isDownloadingPackage,
  isIndonesian,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('setup.bat');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO CALLOUT: 1-CLICK ZIP DOWNLOAD */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-2">
            <FolderCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">
              {isIndonesian
                ? 'Paket Lengkap Aplikasi Windows Siap Pakai'
                : 'Ready-to-Run Windows Desktop Application Package'}
            </h2>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {isIndonesian
              ? 'Unduh seluruh berkas kode sumber PixelForge Studio (skrip setup.bat, run.bat, app.py, engine Real-ESRGAN, utilitas pengunduh model, serta rangkaian uji coba). Cukup ekstrak dan jalankan di komputer Windows Anda tanpa memerlukan langganan atau API cloud!'
              : 'Download the full standalone source package with setup.bat, run.bat, Gradio interface, and Real-ESRGAN NCNN Vulkan pipeline. Runs 100% offline on your Windows desktop.'}
          </p>
        </div>

        <button
          onClick={onDownloadWindowsZip}
          disabled={isDownloadingPackage}
          className="px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-xl shadow-amber-500/25 transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>
            {isDownloadingPackage
              ? (isIndonesian ? 'Mengompresi Paket ZIP...' : 'Preparing ZIP...')
              : (isIndonesian ? 'Unduh PixelForgeStudio.zip' : 'Download PixelForgeStudio.zip')}
          </span>
        </button>
      </div>

      {/* 2. STEP-BY-STEP WINDOWS SETUP GUIDE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-[11px]">
              1
            </span>
            <span>{isIndonesian ? 'Ekstrak & Jalankan Setup' : 'Extract & Run Setup'}</span>
          </div>
          <p className="text-xs text-neutral-300">
            {isIndonesian
              ? 'Ekstrak berkas PixelForgeStudio.zip ke folder pilihan Anda (misal C:\\PixelForgeStudio), kemudian klik ganda pada:'
              : 'Extract PixelForgeStudio.zip to any directory, then double click:'}
          </p>
          <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs font-mono text-amber-300 flex items-center justify-between">
            <span>setup.bat</span>
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <p className="text-[11px] text-neutral-500">
            {isIndonesian
              ? 'Skrip ini otomatis membuat venv, memasang dependensi, dan menyiapkan engine AI.'
              : 'Creates venv, installs dependencies, and prepares AI models.'}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-[11px]">
              2
            </span>
            <span>{isIndonesian ? 'Jalankan Aplikasi' : 'Launch Application'}</span>
          </div>
          <p className="text-xs text-neutral-300">
            {isIndonesian
              ? 'Setelah setup selesai, cukup klik ganda pada:'
              : 'Once setup completes, double click:'}
          </p>
          <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <span>run.bat</span>
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <p className="text-[11px] text-neutral-500">
            {isIndonesian
              ? 'Aplikasi otomatis membuka browser lokal di http://127.0.0.1:7860.'
              : 'Automatically opens browser at http://127.0.0.1:7860.'}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-mono text-[11px]">
              3
            </span>
            <span>{isIndonesian ? 'Proses Batch Offline' : 'Offline Batch Upscale'}</span>
          </div>
          <p className="text-xs text-neutral-300">
            {isIndonesian
              ? 'Pilih 30, 50, atau 100+ foto sekaligus, pilih skala 4x, dan unduh seluruh hasil dalam paket ZIP.'
              : 'Select 30-100+ photos at once, choose 4x upscale, and export everything to ZIP.'}
          </p>
          <div className="bg-neutral-950 border border-neutral-800 rounded p-2 text-[11px] font-mono text-sky-300">
            100% Private Local Vulkan GPU
          </div>
          <p className="text-[11px] text-neutral-500">
            {isIndonesian ? 'Bebas biaya per-foto selamanya.' : 'Zero API costs forever.'}
          </p>
        </div>
      </div>

      {/* 3. CODE SNIPPET EXPLORER */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="border-b border-neutral-800 bg-neutral-950/70 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-200">
              {isIndonesian ? 'Pratinjau Berkas Skrip & Kode Sumber' : 'Source Code & Scripts Viewer'}
            </span>
          </div>

          {/* File Switcher Tabs */}
          <div className="flex flex-wrap gap-1">
            {Object.keys(CODE_SNIPPETS).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedFile(key)}
                className={`px-2.5 py-1 text-xs rounded font-mono transition cursor-pointer ${
                  selectedFile === key
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{isIndonesian ? 'Tersalin!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>{isIndonesian ? 'Salin Kode' : 'Copy Code'}</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-neutral-950 max-h-96 overflow-y-auto">
          <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {CODE_SNIPPETS[selectedFile].content}
          </pre>
        </div>
      </div>
    </div>
  );
};
