"""
PixelForge Studio - Unit Tests for Output Management & Conventional Image Adjustments
Memverifikasi filter kecerahan, kontras, ketajaman, denoise, EXIF, dan format ekspor.
"""

from pathlib import Path
try:
    import pytest
except ImportError:
    class DummyPytest:
        @staticmethod
        def fixture(func):
            return func
        @staticmethod
        def skip(reason):
            pass
    pytest = DummyPytest()

try:
    from PIL import Image
except ImportError:
    Image = None

from services.image_service import (
    apply_conventional_enhancements,
    get_image_metadata,
    compute_file_hash,
)


@pytest.fixture
def sample_image(tmp_path):
    img_path = tmp_path / "test_input.jpg"
    img = Image.new("RGB", (100, 100), color=(128, 128, 128))
    img.save(img_path, format="JPEG", quality=90)
    return img_path


def test_conventional_adjustments(sample_image, tmp_path):
    out_path = tmp_path / "test_output.jpg"
    apply_conventional_enhancements(
        image_path=sample_image,
        output_path=out_path,
        brightness=1.2,
        contrast=1.1,
        saturation=1.0,
        sharpness=1.3,
        denoise=0.2,
        output_format="JPG",
        jpeg_quality=95,
    )

    assert out_path.exists()
    assert out_path.stat().st_size > 0
    meta = get_image_metadata(out_path)
    assert meta["valid"] is True
    assert meta["width"] == 100
    assert meta["height"] == 100


def test_webp_conversion(sample_image, tmp_path):
    out_webp = tmp_path / "test_output.webp"
    apply_conventional_enhancements(
        image_path=sample_image,
        output_path=out_webp,
        output_format="WEBP",
        webp_quality=85,
    )

    assert out_webp.exists()
    meta = get_image_metadata(out_webp)
    assert meta["valid"] is True
    assert meta["format"] == "WEBP"


def test_file_hash_stability(sample_image):
    hash1 = compute_file_hash(sample_image)
    hash2 = compute_file_hash(sample_image)
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 length
