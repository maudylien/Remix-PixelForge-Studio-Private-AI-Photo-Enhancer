@echo off
setlocal
title PixelForge Studio - Private AI Photo Enhancer

echo ====================================================================
echo     PIXELFORGE STUDIO -- PRIVATE AI PHOTO ENHANCER (WINDOWS)
echo ====================================================================
echo.
echo Mode: 100%% Offline / Private Localhost Processing
echo Binding: http://127.0.0.1:7860
echo.

:: Check Virtual Environment
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Virtual environment 'venv' belum ditemukan.
    echo Menjalankan setup otomatis pertama kali (setup.bat)...
    echo.
    call setup.bat
    if not exist "venv\Scripts\activate.bat" (
        echo.
        echo [ERROR] Setup belum selesai atau dibatalkan.
        pause
        exit /b 1
    )
)

:: Activate Virtual Environment
call venv\Scripts\activate.bat

:: Launch Application
echo [INFO] Memulai server lokal PixelForge Studio...
python app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Aplikasi berhenti dengan kode error: %errorlevel%
    echo Periksa file log di direktori logs/ untuk informasi kesalahan detail.
    pause
)
