"""
PixelForge Studio - Image Processing Service
Menangani decoding gambar, kalkulasi hash duplikat, thumbnail hemat memori,
penyesuaian konvensional (kecerahan, kontras, saturasi, ketajaman, denoise),
penanganan EXIF, dan ekspor format.
"""

import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
except ImportError:
    Image = None
    ImageEnhance = None
    ImageFilter = None
    ImageOps = None

logger = logging.getLogger("PixelForge.Service.Image")

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"}


def is_supported_image(file_path: Path) -> bool:
    """Memeriksa apakah file adalah format gambar yang didukung."""
    return Path(file_path).suffix.lower() in SUPPORTED_EXTENSIONS


def compute_file_hash(file_path: Path) -> str:
    """Menghitung SHA-256 hash dari file untuk deteksi duplikasi gambar."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def get_image_metadata(file_path: Path) -> Dict[str, Any]:
    """Mengambil dimensi, ukuran file, mode warna, dan format gambar tanpa membaca seluruh byte ke memori."""
    p = Path(file_path)
    file_size_bytes = p.stat().st_size
    try:
        with Image.open(p) as img:
            width, height = img.size
            fmt = img.format
            mode = img.mode
            has_transparency = "A" in mode or "transparency" in img.info
        return {
            "valid": True,
            "width": width,
            "height": height,
            "file_size": file_size_bytes,
            "file_size_kb": round(file_size_bytes / 1024, 2),
            "file_size_mb": round(file_size_bytes / (1024 * 1024), 2),
            "format": fmt,
            "mode": mode,
            "has_transparency": has_transparency,
            "filename": p.name,
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "file_size": file_size_bytes,
            "filename": p.name,
        }


def create_thumbnail(image_path: Path, thumb_path: Path, max_size: Tuple[int, int] = (256, 256)) -> Path:
    """Membuat thumbnail beresolusi rendah agar antarmuka tidak boros memori."""
    thumb_path = Path(thumb_path)
    thumb_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(image_path) as img:
        img = ImageOps.exif_transpose(img)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "LA") or ("transparency" in img.info):
            img.save(thumb_path, format="PNG")
        else:
            img = img.convert("RGB")
            img.save(thumb_path, format="JPEG", quality=80)
    return thumb_path


def apply_conventional_enhancements(
    image_path: Path,
    output_path: Path,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    sharpness: float = 1.0,
    denoise: float = 0.0,
    output_format: str = "JPG",
    jpeg_quality: int = 95,
    webp_quality: int = 90,
    auto_orient_exif: bool = True,
    preserve_metadata: bool = True,
    strip_gps: bool = True,
) -> Path:
    """
    Menerapkan penyesuaian konvensional:
    - Kecerahan (brightness), Kontras (contrast), Saturasi (saturation), Ketajaman (sharpness)
    - Denoise ringan (bilateral / gaussian blend)
    - Penanganan EXIF dan format output
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(image_path) as img:
        # EXIF Orientation
        exif_data = img.getexif() if hasattr(img, "getexif") else None
        if auto_orient_exif:
            img = ImageOps.exif_transpose(img)

        # Pertahankan transparansi jika RGBA
        has_alpha = img.mode in ("RGBA", "LA") or ("transparency" in img.info)

        # Penyesuaian Denoise jika diminta
        if denoise > 0.05:
            # Gaussian blur blend dengan intensitas halus
            radius = min(2.0, denoise * 1.5)
            blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
            # Blend sesuai strength denoise
            alpha = min(0.6, denoise * 0.5)
            img = Image.blend(img.convert("RGBA") if has_alpha else img.convert("RGB"),
                              blurred.convert("RGBA") if has_alpha else blurred.convert("RGB"),
                              alpha)

        # Brightness
        if abs(brightness - 1.0) > 0.01:
            enh = ImageEnhance.Brightness(img)
            img = enh.enhance(brightness)

        # Contrast
        if abs(contrast - 1.0) > 0.01:
            enh = ImageEnhance.Contrast(img)
            img = enh.enhance(contrast)

        # Saturation (Color)
        if abs(saturation - 1.0) > 0.01 and img.mode in ("RGB", "RGBA"):
            enh = ImageEnhance.Color(img)
            img = enh.enhance(saturation)

        # Sharpness
        if abs(sharpness - 1.0) > 0.01:
            enh = ImageEnhance.Sharpness(img)
            img = enh.enhance(sharpness)

        # Format output
        fmt_clean = output_format.upper()
        if fmt_clean in ("JPG", "JPEG"):
            if img.mode != "RGB":
                # Latar belakang putih jika ada transparansi
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if has_alpha:
                    bg.paste(img, mask=img.split()[-1])
                    img = bg
                else:
                    img = img.convert("RGB")
            img.save(output_path, format="JPEG", quality=jpeg_quality, optimize=True)
        elif fmt_clean == "WEBP":
            img.save(output_path, format="WEBP", quality=webp_quality)
        elif fmt_clean == "PNG":
            img.save(output_path, format="PNG", optimize=True)
        else:
            img.save(output_path)

    return output_path
