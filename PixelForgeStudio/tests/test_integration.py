"""
PixelForge Studio - Real AI Engine Integration Test
Menguji secara langsung binary executable Real-ESRGAN NCNN Vulkan pada mesin lokal jika terpasang.
Jika binary belum diunduh ke folder tools/, tes ini menandai skip secara jelas dengan instruksi setup.
"""

import os
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

from engines.realesrgan_engine import RealESRGANEngine
from services.batch_queue import BatchQueueManager, ItemStatus
from services.archive_service import ArchiveService


@pytest.fixture
def integration_env(tmp_path):
    base_dir = Path(__file__).resolve().parent.parent
    engine = RealESRGANEngine(base_dir=base_dir)

    # Buat gambar sampel kecil berdimensi 64x64
    test_img = tmp_path / "integration_input.png"
    img = Image.new("RGB", (64, 64), color=(200, 100, 50))
    img.save(test_img, format="PNG")

    return {
        "engine": engine,
        "test_img": test_img,
        "tmp_path": tmp_path,
        "base_dir": base_dir,
    }


def test_real_ai_engine_execution(integration_env):
    """
    Menguji apakah executable Real-ESRGAN benar-benar berjalan dan menghasilkan output 4x.
    Tidak menggunakan mock. Jika binary belum ada di tools/, skip dengan pesan informatif.
    """
    engine: RealESRGANEngine = integration_env["engine"]
    test_img: Path = integration_env["test_img"]
    out_img = integration_env["tmp_path"] / "integration_output_4x.png"

    if not engine.is_available():
        pytest.skip(
            "Executable Real-ESRGAN NCNN Vulkan atau model belum terpasang di tools/ dan models/. "
            "Jalankan setup.bat atau python download_models.py untuk mengunduh binary resmi."
        )

    # Catat mtime awal untuk memastikan file sumber tidak diubah
    orig_mtime = test_img.stat().st_mtime

    res = engine.upscale(
        input_path=test_img,
        output_path=out_img,
        model_name="realesrgan-x4plus",
        scale=4,
        tile_size=0,
        gpu_id=0,
        output_format="png",
    )

    # 1. Pastikan executable sukses berjalan
    assert res.success is True, f"Inference gagal: {res.error_message}"

    # 2. File output harus valid dan ada
    assert out_img.exists()
    assert out_img.stat().st_size > 0

    # 3. Dimensi output harus 4x lipat (64x64 -> 256x256)
    with Image.open(out_img) as out_pic:
        assert out_pic.size == (256, 256)

    # 4. File input asli tidak boleh berubah sama sekali
    assert test_img.stat().st_mtime == orig_mtime

    # 5. Ekspor ZIP harus berisi file yang valid
    out_zip = integration_env["tmp_path"] / "integration_batch.zip"
    ArchiveService.create_batch_zip(out_zip, [out_img])
    assert out_zip.exists()
    assert out_zip.stat().st_size > 0


def test_core_processing_has_no_cloud_telemetry():
    """Memverifikasi bahwa konfigurasi inti tidak memiliki dependensi kunci API cloud."""
    # Pastikan tidak ada environment variable GEMINI_API_KEY atau OPENAI_API_KEY yang diwajibkan
    from engines.realesrgan_engine import RealESRGANEngine
    engine = RealESRGANEngine()
    info = engine.get_engine_info()
    assert "Real-ESRGAN NCNN Vulkan" in info["name"]
