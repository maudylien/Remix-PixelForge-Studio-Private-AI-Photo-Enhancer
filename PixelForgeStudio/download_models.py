#!/usr/bin/env python3
"""
PixelForge Studio - Model & AI Engine Downloader and Verifier
Memeriksa dan mengunduh Real-ESRGAN NCNN Vulkan binary portabel resmi dari GitHub releases.
"""

import os
import sys
import zipfile
import argparse
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
    "realesrgan-x4plus.param",
    "realesrgan-x4plus.bin",
    "realesrnet-x4plus.param",
    "realesrnet-x4plus.bin",
    "realesrgan-x4plus-anime.param",
    "realesrgan-x4plus-anime.bin",
    "realesr-animevideov3.param",
    "realesr-animevideov3.bin",
]


def get_base_dir() -> Path:
    return Path(__file__).resolve().parent


def check_engine_installed(base_dir: Path) -> dict:
    tools_dir = base_dir / "tools"
    models_dir = base_dir / "models"

    exe_candidates = [
        tools_dir / EXPECTED_EXE,
        tools_dir / "realesrgan-ncnn-vulkan" / EXPECTED_EXE,
        base_dir / EXPECTED_EXE,
    ]

    found_exe = None
    for cand in exe_candidates:
        if cand.exists() and cand.is_file():
            found_exe = cand
            break

    models_found = []
    models_missing = []

    # Check in models_dir and next to exe
    search_dirs = [models_dir]
    if found_exe:
        search_dirs.append(found_exe.parent / "models")
        search_dirs.append(found_exe.parent)

    for model_file in EXPECTED_MODELS:
        present = any((d / model_file).exists() for d in search_dirs)
        if present:
            models_found.append(model_file)
        else:
            models_missing.append(model_file)

    return {
        "exe_found": found_exe is not None,
        "exe_path": str(found_exe) if found_exe else None,
        "models_count": len(models_found),
        "total_models": len(EXPECTED_MODELS),
        "models_missing": models_missing,
        "is_ready": (found_exe is not None and len(models_missing) == 0),
    }


def download_and_extract(base_dir: Path):
    temp_dir = base_dir / "temp"
    tools_dir = base_dir / "tools"
    models_dir = base_dir / "models"

    temp_dir.mkdir(parents=True, exist_ok=True)
    tools_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    zip_dest = temp_dir / ZIP_FILENAME

    print(f"[DOWNLOAD] Mengunduh Real-ESRGAN NCNN Vulkan portabel resmi...")
    print(f"Sumber: {OFFICIAL_RELEASE_URL}")

    def report_progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = min(100.0, (downloaded / total_size) * 100.0)
            mb_down = downloaded / (1024 * 1024)
            mb_tot = total_size / (1024 * 1024)
            sys.stdout.write(f"\rProgress: {percent:5.1f}% [{mb_down:.1f} MB / {mb_tot:.1f} MB]")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(OFFICIAL_RELEASE_URL, str(zip_dest), reporthook=report_progress)
        print("\n[OK] Unduhan selesai. Mengekstrak berkas...")

        with zipfile.ZipFile(str(zip_dest), "r") as zf:
            for member in zf.infolist():
                # Proteksi Zip Slip / path traversal
                target_path = (temp_dir / "extracted" / member.filename).resolve()
                if not str(target_path).startswith(str((temp_dir / "extracted").resolve())):
                    raise RuntimeError(f"Zip slip security risk terdeteksi: {member.filename}")
            zf.extractall(temp_dir / "extracted")

        # Cari file exe dan model
        extracted_root = temp_dir / "extracted"
        # Buka jika berada di dalam subfolder
        for root, _, files in os.walk(extracted_root):
            for file in files:
                src_file = Path(root) / file
                if file.lower() == EXPECTED_EXE.lower():
                    shutil.copy2(src_file, tools_dir / EXPECTED_EXE)
                    print(f"[INSTALLED] Executable tersimpan di: tools/{EXPECTED_EXE}")
                elif any(file.lower() == m.lower() for m in EXPECTED_MODELS):
                    shutil.copy2(src_file, models_dir / file)

        # Bersihkan temp
        try:
            shutil.rmtree(temp_dir / "extracted", ignore_errors=True)
            if zip_dest.exists():
                zip_dest.unlink()
        except Exception:
            pass

        status = check_engine_installed(base_dir)
        if status["is_ready"]:
            print("\n[SUKSES] Real-ESRGAN NCNN Vulkan dan seluruh model berhasil disiapkan!")
        else:
            print(f"\n[SELESAI DENGAN CATATAN] Model yang belum terpasang: {status['models_missing']}")

    except Exception as e:
        print(f"\n[ERROR] Gagal mengunduh atau mengekstrak: {e}")
        print("\nInstruksi Manual:")
        print(f"1. Unduh zip manual dari: {OFFICIAL_RELEASE_URL}")
        print(f"2. Ekstrak 'realesrgan-ncnn-vulkan.exe' ke folder: {tools_dir}")
        print(f"3. Ekstrak file .param dan .bin ke folder: {models_dir}")


def main():
    parser = argparse.ArgumentParser(description="PixelForge Studio Model Downloader")
    parser.add_argument("--check-only", action="store_true", help="Hanya periksa status instalasi")
    parser.add_argument("--interactive", action="store_true", help="Tanya sebelum mengunduh jika belum ada")
    args = parser.parse_args()

    base_dir = get_base_dir()
    status = check_engine_installed(base_dir)

    print("====================================================================")
    print("      STATUS REAL-ESRGAN NCNN VULKAN LOCAL AI ENGINE")
    print("====================================================================")
    print(f"Executable terpasang : {'YA (' + status['exe_path'] + ')' if status['exe_found'] else 'BELUM ADA'}")
    print(f"Model tersedia       : {status['models_count']}/{status['total_models']}")
    if status["models_missing"]:
        print(f"Model hilang         : {', '.join(status['models_missing'][:4])}...")
    print(f"Status Kesiapan      : {'SIAP DIGUNAKAN (READY)' if status['is_ready'] else 'PERLU PERSIAPAN'}")
    print("====================================================================")

    if args.check_only:
        sys.exit(0 if status["is_ready"] else 1)

    if not status["is_ready"]:
        if args.interactive:
            choice = input("\nIngin mengunduh engine resmi sekarang? (Y/T): ").strip().lower()
            if choice in ["y", "ya", "yes"]:
                download_and_extract(base_dir)
            else:
                print("Lewati pengunduhan. Anda dapat mengunduh manual ke folder tools/ dan models/.")
        else:
            download_and_extract(base_dir)


if __name__ == "__main__":
    main()
