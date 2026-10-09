"""
PixelForge Studio - Real-ESRGAN NCNN Vulkan Engine Adapter
Menghubungkan aplikasi ke executable resmi Real-ESRGAN NCNN Vulkan dengan eksekusi subprocess yang aman.
"""

import os
import time
import subprocess
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from PIL import Image

from .base_engine import BaseUpscaleEngine, EngineResult

logger = logging.getLogger("PixelForge.Engine.RealESRGAN")


class RealESRGANEngine(BaseUpscaleEngine):
    """
    Adapter resmi untuk binary Real-ESRGAN NCNN Vulkan.
    Mendukung model:
    - realesrgan-x4plus (Default)
    - realesrnet-x4plus
    - realesrgan-x4plus-anime
    - realesr-animevideov3
    """

    SUPPORTED_MODELS = [
        "realesrgan-x4plus",
        "realesrnet-x4plus",
        "realesrgan-x4plus-anime",
        "realesr-animevideov3",
    ]

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            self.base_dir = Path(__file__).resolve().parent.parent
        else:
            self.base_dir = Path(base_dir).resolve()

        self.tools_dir = self.base_dir / "tools"
        self.models_dir = self.base_dir / "models"
        self.temp_dir = self.base_dir / "temp"
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        self.exe_path = self._find_executable()

    def _find_executable(self) -> Optional[Path]:
        exe_names = [
            "realesrgan-ncnn-vulkan.exe",
            "realesrgan-ncnn-vulkan",  # Linux / Unix testing compatibility
        ]

        candidates = [
            self.tools_dir / "realesrgan-ncnn-vulkan.exe",
            self.tools_dir / "realesrgan-ncnn-vulkan",
            self.tools_dir / "realesrgan-ncnn-vulkan" / "realesrgan-ncnn-vulkan.exe",
            self.base_dir / "realesrgan-ncnn-vulkan.exe",
            self.base_dir / "realesrgan-ncnn-vulkan",
        ]

        for cand in candidates:
            if cand.exists() and cand.is_file():
                return cand

        # Check system PATH
        for name in exe_names:
            found = shutil_which(name)
            if found:
                return Path(found)

        return None

    def is_available(self) -> bool:
        if not self.exe_path or not self.exe_path.exists():
            return False
        # Memeriksa setidaknya ada satu model .param dan .bin
        default_param = self.models_dir / "realesrgan-x4plus.param"
        default_bin = self.models_dir / "realesrgan-x4plus.bin"
        if default_param.exists() and default_bin.exists():
            return True
        # Atau di folder yang sama dengan binary
        if (self.exe_path.parent / "models" / "realesrgan-x4plus.param").exists():
            return True
        if (self.exe_path.parent / "realesrgan-x4plus.param").exists():
            return True
        return False

    def get_supported_models(self) -> List[str]:
        return self.SUPPORTED_MODELS.copy()

    def get_engine_info(self) -> Dict[str, Any]:
        return {
            "name": "Real-ESRGAN NCNN Vulkan",
            "executable_found": self.exe_path is not None,
            "executable_path": str(self.exe_path) if self.exe_path else None,
            "models_dir": str(self.models_dir),
            "is_ready": self.is_available(),
            "models": self.SUPPORTED_MODELS,
        }

    def _get_model_directory_arg(self) -> Path:
        """Menentukan direktori model yang valid untuk argumen -m."""
        if (self.models_dir / "realesrgan-x4plus.param").exists():
            return self.models_dir
        if self.exe_path and (self.exe_path.parent / "models").exists():
            return self.exe_path.parent / "models"
        if self.exe_path:
            return self.exe_path.parent
        return self.models_dir

    def upscale(
        self,
        input_path: Path,
        output_path: Path,
        model_name: str = "realesrgan-x4plus",
        scale: int = 4,
        tile_size: int = 0,
        gpu_id: int = 0,
        output_format: str = "png",
        **kwargs
    ) -> EngineResult:
        """
        Menjalankan proses upscaling AI.
        Untuk scale 2x: menjalankan inferensi 4x kemudian downsample presisi ke 2x.
        Untuk scale 8x: menjalankan multi-pass pipeline 4x -> 2x.
        """
        input_p = Path(input_path).resolve()
        output_p = Path(output_path).resolve()

        if not input_p.exists():
            return EngineResult(
                success=False,
                input_path=str(input_p),
                error_message=f"File input tidak ditemukan: {input_p}",
            )

        if not self.is_available():
            return EngineResult(
                success=False,
                input_path=str(input_p),
                error_message="Real-ESRGAN executable atau file model belum terpasang. Jalankan setup.bat atau download_models.py.",
            )

        if model_name not in self.SUPPORTED_MODELS:
            model_name = "realesrgan-x4plus"

        # Buka dimensi awal
        try:
            with Image.open(input_p) as img:
                orig_w, orig_h = img.size
        except Exception as e:
            return EngineResult(
                success=False,
                input_path=str(input_p),
                error_message=f"Gagal membuka file gambar input: {e}",
            )

        start_time = time.time()

        try:
            if scale == 4:
                # Direct 4x inference
                res = self._run_single_pass(
                    input_p, output_p, model_name, scale=4, tile_size=tile_size, gpu_id=gpu_id, fmt=output_format
                )
            elif scale == 2:
                # 4x AI Inference followed by Lanczos downsample to 2x (master prompt standard)
                temp_4x = self.temp_dir / f"pass1_4x_{int(time.time()*1000)}.png"
                res = self._run_single_pass(
                    input_p, temp_4x, model_name, scale=4, tile_size=tile_size, gpu_id=gpu_id, fmt="png"
                )
                if res.success and temp_4x.exists():
                    target_w = orig_w * 2
                    target_h = orig_h * 2
                    with Image.open(temp_4x) as img4x:
                        downsampled = img4x.resize((target_w, target_h), Image.Resampling.LANCZOS)
                        output_p.parent.mkdir(parents=True, exist_ok=True)
                        save_fmt = "JPEG" if output_format.lower() in ["jpg", "jpeg"] else output_format.upper()
                        downsampled.save(output_p, format=save_fmt, quality=95)
                    try:
                        temp_4x.unlink(missing_ok=True)
                    except Exception:
                        pass
                else:
                    return res
            elif scale == 8:
                # Multi-pass: Pass 1 (4x) -> Pass 2 (2x AI) = 8x Total
                temp_pass1 = self.temp_dir / f"pass1_4x_{int(time.time()*1000)}.png"
                res1 = self._run_single_pass(
                    input_p, temp_pass1, model_name, scale=4, tile_size=tile_size, gpu_id=gpu_id, fmt="png"
                )
                if not res1.success:
                    return res1

                temp_pass2_4x = self.temp_dir / f"pass2_4x_{int(time.time()*1000)}.png"
                res2 = self._run_single_pass(
                    temp_pass1, temp_pass2_4x, model_name, scale=4, tile_size=tile_size, gpu_id=gpu_id, fmt="png"
                )
                if res2.success and temp_pass2_4x.exists():
                    # Total 16x downscaled to 8x
                    target_w = orig_w * 8
                    target_h = orig_h * 8
                    with Image.open(temp_pass2_4x) as img16:
                        downsampled = img16.resize((target_w, target_h), Image.Resampling.LANCZOS)
                        output_p.parent.mkdir(parents=True, exist_ok=True)
                        save_fmt = "JPEG" if output_format.lower() in ["jpg", "jpeg"] else output_format.upper()
                        downsampled.save(output_p, format=save_fmt, quality=95)
                    for f in [temp_pass1, temp_pass2_4x]:
                        try:
                            f.unlink(missing_ok=True)
                        except Exception:
                            pass
                else:
                    return res2
            else:
                return EngineResult(
                    success=False,
                    input_path=str(input_p),
                    error_message=f"Faktor skala {scale}x tidak didukung.",
                )

            # Validasi file output yang dihasilkan
            if not output_p.exists() or output_p.stat().st_size == 0:
                return EngineResult(
                    success=False,
                    input_path=str(input_p),
                    error_message="Proses inferensi selesai tetapi file output kosong atau tidak terbentuk.",
                )

            with Image.open(output_p) as out_img:
                out_w, out_h = out_img.size

            duration = time.time() - start_time
            return EngineResult(
                success=True,
                output_path=str(output_p),
                input_path=str(input_p),
                scale=scale,
                model_name=model_name,
                duration_seconds=round(duration, 2),
                input_dimensions=(orig_w, orig_h),
                output_dimensions=(out_w, out_h),
                tile_size_used=tile_size,
                gpu_id_used=gpu_id,
            )

        except Exception as e:
            logger.exception("Error selama eksekusi RealESRGAN: %s", e)
            return EngineResult(
                success=False,
                input_path=str(input_p),
                error_message=str(e),
                duration_seconds=round(time.time() - start_time, 2),
            )

    def _run_single_pass(
        self,
        in_file: Path,
        out_file: Path,
        model_name: str,
        scale: int,
        tile_size: int,
        gpu_id: int,
        fmt: str,
    ) -> EngineResult:
        """Menjalankan binary realesrgan-ncnn-vulkan secara langsung."""
        out_file.parent.mkdir(parents=True, exist_ok=True)
        model_dir = self._get_model_directory_arg()

        # Ekstensi format file
        ext = fmt.lower()
        if ext == "jpeg":
            ext = "jpg"
        if ext not in ["jpg", "png", "webp"]:
            ext = "png"

        cmd = [
            str(self.exe_path),
            "-i", str(in_file),
            "-o", str(out_file),
            "-n", str(model_name),
            "-s", str(scale),
            "-t", str(tile_size),
            "-m", str(model_dir),
            "-g", str(gpu_id),
            "-f", ext,
        ]

        logger.info("Executing AI Subprocess: %s", " ".join(cmd))
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,  # 5 menit safety timeout
        )

        if proc.returncode != 0:
            err = proc.stderr.strip() or proc.stdout.strip() or f"Proses keluar dengan kode error {proc.returncode}"
            return EngineResult(
                success=False,
                input_path=str(in_file),
                error_message=f"AI Engine Subprocess Error: {err}",
            )

        if not out_file.exists():
            return EngineResult(
                success=False,
                input_path=str(in_file),
                error_message="Subprocess selesai tanpa membuat file output.",
            )

        return EngineResult(success=True, output_path=str(out_file), input_path=str(in_file))


def shutil_which(pgm: str) -> Optional[str]:
    import shutil
    return shutil.which(pgm)
