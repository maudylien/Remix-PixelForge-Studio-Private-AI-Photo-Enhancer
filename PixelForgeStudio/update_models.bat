@echo off
setlocal
title PixelForge Studio - Model Updater & Checker

if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment 'venv' belum ditemukan. Jalankan setup.bat terlebih dahulu.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
echo [INFO] Memeriksa pembaharuan dan integritas model AI...
python download_models.py --interactive
pause
