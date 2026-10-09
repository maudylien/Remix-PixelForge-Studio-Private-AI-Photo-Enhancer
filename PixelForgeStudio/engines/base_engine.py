"""
PixelForge Studio - Base AI Engine Adapter Interface
Abstraksi bersih agar engine upscaling AI lain dapat diintegrasikan dengan mudah di kemudian hari.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any


@dataclass
class EngineResult:
    success: bool
    output_path: Optional[str] = None
    input_path: Optional[str] = None
    scale: int = 4
    model_name: str = "unknown"
    duration_seconds: float = 0.0
    input_dimensions: Optional[Tuple[int, int]] = None
    output_dimensions: Optional[Tuple[int, int]] = None
    error_message: Optional[str] = None
    tile_size_used: int = 0
    gpu_id_used: int = 0
    metadata: Optional[Dict[str, Any]] = None


class BaseUpscaleEngine(ABC):
    """Kelas dasar abstrak untuk semua engine AI Super-Resolution di PixelForge Studio."""

    @abstractmethod
    def is_available(self) -> bool:
        """Memeriksa apakah binary executable dan model AI tersedia di sistem lokal."""
        pass

    @abstractmethod
    def get_supported_models(self) -> List[str]:
        """Daftar model yang didukung oleh engine ini."""
        pass

    @abstractmethod
    def upscale(
        self,
        input_path: Path,
        output_path: Path,
        model_name: str = "realesrgan-x4plus",
        scale: int = 4,
        tile_size: int = 0,
        gpu_id: int = 0,
        output_format: str = "jpg",
        **kwargs
    ) -> EngineResult:
        """Menjalankan proses inferensi peningkatan resolusi AI."""
        pass

    @abstractmethod
    def get_engine_info(self) -> Dict[str, Any]:
        """Mengembalikan informasi diagnosa versi dan status engine."""
        pass
