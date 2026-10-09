"""
PixelForge Studio - Optional Face & Portrait Restoration Module
Mendukung GFPGAN (TencentARC) sebagai engine restorasi wajah opsional.
Jika PyTorch/GFPGAN belum terpasang, sistem melaporkan status dan menyediakan instruksi instalasi tanpa merusak workflow utama.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from PIL import Image

logger = logging.getLogger("PixelForge.Engine.FaceRestoration")


class FaceRestorationEngine:
    """
    Adapter opsional untuk modul restorasi wajah (GFPGAN / CodeFormer).
    """

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            self.base_dir = Path(__file__).resolve().parent.parent
        else:
            self.base_dir = Path(base_dir).resolve()

        self.models_dir = self.base_dir / "models"
        self._gfpgan_available = False
        self._gfpgan_model = None
        self._check_dependencies()

    def _check_dependencies(self):
        """Memeriksa apakah pustaka torch, torchvision, dan gfpgan terpasang."""
        try:
            import torch
            import torchvision
            from gfpgan import GFPGANer
            self._gfpgan_available = True
        except ImportError:
            self._gfpgan_available = False

    def is_available(self) -> bool:
        """Apakah engine GFPGAN siap dijalankan."""
        if not self._gfpgan_available:
            return False
        # Periksa file model weights GFPGAN
        weight_candidates = [
            self.models_dir / "GFPGANv1.4.pth",
            self.models_dir / "GFPGANv1.3.pth",
            self.base_dir / "GFPGANv1.4.pth",
        ]
        return any(p.exists() for p in weight_candidates)

    def get_status_info(self) -> Dict[str, Any]:
        """Laporan status ketersediaan modul restorasi wajah."""
        return {
            "module_name": "GFPGAN Face Restoration (Optional)",
            "pytorch_installed": self._gfpgan_available,
            "weights_found": self.is_available(),
            "recommended_model": "GFPGANv1.4.pth",
            "installation_guide": (
                "Untuk mengaktifkan restorasi wajah AI: "
                "1. Jalankan: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118\n"
                "2. Jalankan: pip install gfpgan\n"
                "3. Unduh model GFPGANv1.4.pth dan simpan di folder models/"
            ),
        }

    def restore_faces(
        self,
        image_path: Path,
        output_path: Path,
        strength: float = 0.6,
        aligned: bool = False,
        only_center_face: bool = False,
    ) -> Dict[str, Any]:
        """
        Menjalankan restorasi wajah pada gambar.
        strength: 0.0 (hanya asli) hingga 1.0 (restorasi penuh).
        """
        in_path = Path(image_path).resolve()
        out_path = Path(output_path).resolve()

        if not in_path.exists():
            return {
                "success": False,
                "error": f"File gambar tidak ditemukan: {in_path}",
            }

        if not self.is_available():
            return {
                "success": False,
                "error": "GFPGAN belum terpasang atau model weights GFPGANv1.4.pth tidak ditemukan di folder models/.",
                "guide": self.get_status_info()["installation_guide"],
            }

        try:
            import cv2
            import numpy as np
            from gfpgan import GFPGANer

            model_path = self.models_dir / "GFPGANv1.4.pth"
            if not model_path.exists():
                model_path = self.models_dir / "GFPGANv1.3.pth"

            # Inisialisasi GFPGANer
            restorer = GFPGANer(
                model_path=str(model_path),
                upscale=1,
                arch="clean",
                channel_multiplier=2,
                bg_upsampler=None,
            )

            # Baca gambar via cv2
            input_img = cv2.imread(str(in_path), cv2.IMREAD_COLOR)
            if input_img is None:
                return {"success": False, "error": "Gagal membaca gambar dengan OpenCV"}

            cropped_faces, restored_faces, restored_img = restorer.enhance(
                input_img,
                has_aligned=aligned,
                only_center_face=only_center_face,
                paste_back=True,
                weight=strength,
            )

            out_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(out_path), restored_img)

            return {
                "success": True,
                "faces_detected": len(cropped_faces),
                "output_path": str(out_path),
                "strength_applied": strength,
                "model_used": model_path.name,
            }

        except Exception as e:
            logger.exception("Gagal menjalankan restorasi wajah GFPGAN: %s", e)
            return {"success": False, "error": str(e)}
