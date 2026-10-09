import JSZip from 'jszip';
import { BatchItem } from '../types';

export async function exportBatchImagesZip(
  items: BatchItem[],
  batchName: string = 'PixelForge_Batch_Export'
): Promise<Blob> {
  const zip = new JSZip();
  const completed = items.filter((it) => it.status === 'Completed' && it.outputDataUrl);

  const report = {
    application: 'PixelForge Studio — Private AI Photo Enhancer',
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    totalExported: completed.length,
    items: completed.map((it) => ({
      originalFilename: it.filename,
      initialDimensions: `${it.originalWidth}x${it.originalHeight}`,
      enhancedDimensions: `${it.outputWidth}x${it.outputHeight}`,
      fileSizeKb: it.outputFileSizeKb,
      durationSeconds: it.durationSeconds,
      status: it.status,
    })),
  };

  zip.file('processing_report.json', JSON.stringify(report, null, 2));

  for (const item of completed) {
    if (!item.outputDataUrl) continue;
    // Extract base64
    const commaIdx = item.outputDataUrl.indexOf(',');
    if (commaIdx !== -1) {
      const base64Data = item.outputDataUrl.substring(commaIdx + 1);
      const ext = item.outputDataUrl.includes('webp') ? '.webp' : item.outputDataUrl.includes('png') ? '.png' : '.jpg';
      const cleanName = item.filename.replace(/\.[^/.]+$/, '') + '_enhanced' + ext;
      zip.file(cleanName, base64Data, { base64: true });
    }
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function generateFullWindowsZip(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('PixelForgeStudio') || zip;

  // setup.bat
  root.file(
    'setup.bat',
    `@echo off
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
`
  );

  // run.bat
  root.file(
    'run.bat',
    `@echo off
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
`
  );

  // update_models.bat
  root.file(
    'update_models.bat',
    `@echo off
setlocal
title PixelForge Studio - Model Updater & Checker

if not exist "venv\\Scripts\\activate.bat" (
    echo [ERROR] Virtual environment 'venv' belum ditemukan. Jalankan setup.bat terlebih dahulu.
    pause
    exit /b 1
)

call venv\\Scripts\\activate.bat
echo [INFO] Memeriksa pembaharuan dan integritas model AI...
python download_models.py --interactive
pause
`
  );

  // requirements.txt
  root.file(
    'requirements.txt',
    `gradio>=4.38.0,<5.0.0
pillow>=10.2.0
numpy>=1.24.0
requests>=2.31.0
tqdm>=4.66.0
psutil>=5.9.0
pytest>=7.4.0
`
  );

  // config.json
  root.file(
    'config.json',
    JSON.stringify(
      {
        app_name: 'PixelForge Studio',
        version: '1.0.0',
        language: 'id',
        theme: 'dark',
        host: '127.0.0.1',
        port: 7860,
        engine: {
          default_model: 'realesrgan-x4plus',
          default_scale: 4,
          tile_size: 0,
          gpu_id: 0,
        },
        enhancement: {
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,
          sharpness: 1.0,
          output_format: 'JPG',
          jpeg_quality: 95,
        },
      },
      null,
      2
    )
  );

  // README.md (in Indonesian)
  root.file(
    'README.md',
    `# PixelForge Studio — Private AI Photo Enhancer (Windows)

Aplikasi Windows Desktop lokal untuk AI photo upscaling masal (30-100+ foto), restorasi portrait, dan peningkatan kualitas gambar menggunakan Real-ESRGAN NCNN Vulkan.

## Cara Instalasi Cepat:
1. Klik ganda **setup.bat**
2. Klik ganda **run.bat**
3. Aplikasi akan membuka browser lokal di: http://127.0.0.1:7860

100% Offline, Tanpa Telemetry, Tanpa API Berbayar.
`
  );

  // models README & tools README
  root.file('models/README.md', '# Direktori Model AI Real-ESRGAN (.bin & .param)\n');
  root.file('tools/README.md', '# Direktori Executable Real-ESRGAN NCNN Vulkan Windows\n');
  root.file('inputs/.gitkeep', '');
  root.file('output/.gitkeep', '');
  root.file('temp/.gitkeep', '');
  root.file('logs/.gitkeep', '');

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
