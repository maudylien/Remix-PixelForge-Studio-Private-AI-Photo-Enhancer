"""
PixelForge Studio - Hardware Diagnostic & Environment Service
Mendeteksi versi Windows, Python, CPU, RAM, GPU Vulkan, executable status,
model status, dan ruang disk lokal yang tersedia.
"""

import os
import sys
import platform
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False


def get_hardware_info(base_dir: Optional[Path] = None) -> Dict[str, Any]:
    if base_dir is None:
        base_dir = Path(__file__).resolve().parent.parent

    # 1. OS & Python
    os_name = platform.system()
    os_release = platform.release()
    os_version = platform.version()
    architecture = platform.machine()
    python_version = platform.python_version()

    # 2. CPU & RAM
    cpu_count = os.cpu_count() or 1
    ram_total_gb = 0.0
    ram_available_gb = 0.0
    ram_percent_used = 0.0

    if PSUTIL_AVAILABLE:
        try:
            mem = psutil.virtual_memory()
            ram_total_gb = round(mem.total / (1024**3), 2)
            ram_available_gb = round(mem.available / (1024**3), 2)
            ram_percent_used = mem.percent
        except Exception:
            pass

    # 3. Disk Space pada folder output
    output_dir = base_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    free_disk_gb = 0.0
    try:
        disk_usage = shutil.disk_usage(output_dir)
        free_disk_gb = round(disk_usage.free / (1024**3), 2)
    except Exception:
        pass

    # 4. Engine & Model status
    from download_models import check_engine_installed
    engine_status = check_engine_installed(base_dir)

    # 5. GPU & Vulkan Detection
    gpu_devices = []
    vulkan_supported = False

    # Check via wmic or PowerShell on Windows if possible
    if os_name == "Windows":
        try:
            import subprocess
            out = subprocess.check_output("wmic path win32_VideoController get name", shell=True, text=True)
            for line in out.splitlines()[1:]:
                name = line.strip()
                if name:
                    gpu_devices.append(name)
        except Exception:
            pass

    if not gpu_devices and os_name != "Windows":
        gpu_devices.append("Host Graphics / Vulkan Device")

    if gpu_devices:
        vulkan_supported = True

    return {
        "os": f"{os_name} {os_release} ({architecture})",
        "python_version": python_version,
        "cpu_threads": cpu_count,
        "ram_total_gb": ram_total_gb,
        "ram_available_gb": ram_available_gb,
        "ram_percent_used": ram_percent_used,
        "free_disk_gb": free_disk_gb,
        "gpu_devices": gpu_devices if gpu_devices else ["Tidak terdeteksi otomatis (menggunakan default)"],
        "vulkan_supported": vulkan_supported,
        "engine_ready": engine_status["is_ready"],
        "engine_exe": engine_status["exe_path"],
        "models_count": f"{engine_status['models_count']}/{engine_status['total_models']}",
        "missing_models": engine_status["models_missing"],
    }


def get_system_summary() -> str:
    info = get_hardware_info()
    lines = [
        "--- PIXELFORGE STUDIO SYSTEM DIAGNOSTICS ---",
        f"Sistem Operasi      : {info['os']}",
        f"Versi Python        : {info['python_version']}",
        f"CPU Cores/Threads   : {info['cpu_threads']}",
        f"RAM                 : {info['ram_available_gb']} GB tersedia dari {info['ram_total_gb']} GB ({info['ram_percent_used']}% terpakai)",
        f"Ruang Disk Bebas    : {info['free_disk_gb']} GB",
        f"Kartu Grafis (GPU)  : {', '.join(info['gpu_devices'])}",
        f"AI Engine Ready     : {'YA' if info['engine_ready'] else 'BELUM LENGKAP'}",
        f"Executable Path     : {info['engine_exe'] or 'Belum terpasang'}",
        f"Model Files         : {info['models_count']}",
    ]
    return "\n".join(lines)


# Type hint compatibility
from typing import Optional
