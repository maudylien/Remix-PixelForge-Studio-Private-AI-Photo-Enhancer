@echo off
setlocal enabledelayedexpansion
title PixelForge Studio - Setup & Environment Initializer

echo ====================================================================
echo    PIXELFORGE STUDIO -- PRIVATE AI PHOTO ENHANCER SETUP (WINDOWS)
echo ====================================================================
echo.

:: 1. Check Windows Version
ver | findstr /i "10\. 11\." >nul
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

:: Activate Virtual Environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Gagal mengaktifkan virtual environment.
    pause
    exit /b 1
)

:: 4. Upgrade pip & Install Dependencies
echo.
echo [INFO] Memperbarui pip dan memasang pustaka dari requirements.txt...
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [PERINGATAN] Ada pustaka yang gagal diinstal otomatis. Mencoba instalasi verbose...
    python -m pip install -r requirements.txt
) else (
    echo [OK] Seluruh dependensi Python berhasil dipasang.
)

:: 5. Create Directory Structure
echo.
echo [INFO] Menyiapkan struktur folder kerja lokal...
if not exist "inputs" mkdir inputs
if not exist "output" mkdir output
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "models" mkdir models
if not exist "tools" mkdir tools
echo [OK] Direktori kerja siap: inputs, output, temp, logs, models, tools.

:: 6. Check / Download Real-ESRGAN-ncnn-vulkan Engine
echo.
echo [INFO] Memeriksa ketersediaan AI Engine Real-ESRGAN NCNN Vulkan...
python download_models.py --interactive
if %errorlevel% neq 0 (
    echo [CATATAN] Anda dapat mengunduh engine secara manual nanti.
)

:: 7. Run Diagnostic Self-Test
echo.
echo [INFO] Menjalankan uji diagnostik mandiri...
python -c "import services.hardware_service as hw; print(hw.get_system_summary())"
echo.
echo ====================================================================
echo  SETUP SELESAI! Anda sekarang dapat menjalankan aplikasi dengan:
echo  run.bat
echo ====================================================================
echo.
pause
