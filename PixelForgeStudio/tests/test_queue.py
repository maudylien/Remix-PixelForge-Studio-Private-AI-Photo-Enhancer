"""
PixelForge Studio - Unit Tests for Batch Queue Manager
Memverifikasi manajemen antrean, pencegahan duplikat, transisi status,
jeda/lanjutkan, dan isolasi kegagalan per-item.
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

from services.batch_queue import BatchQueueManager, ItemStatus
from engines.base_engine import BaseUpscaleEngine, EngineResult


class MockTestEngine(BaseUpscaleEngine):
    """Mock engine terisolasi khusus pengujian alur antrean (tidak digunakan untuk klaim AI)."""
    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail

    def is_available(self) -> bool:
        return True

    def get_supported_models(self):
        return ["mock-model"]

    def get_engine_info(self):
        return {"name": "MockTestEngine"}

    def upscale(self, input_path, output_path, **kwargs) -> EngineResult:
        if self.should_fail:
            return EngineResult(success=False, error_message="Simulated engine failure")

        # Buat gambar dummy output
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        img = Image.new("RGB", (200, 200), color=(100, 150, 200))
        img.save(out_p, format="JPEG")
        return EngineResult(
            success=True,
            output_path=str(out_p),
            input_path=str(input_path),
            scale=4,
            model_name="mock-model",
            duration_seconds=0.1,
            input_dimensions=(100, 100),
            output_dimensions=(200, 200),
        )


@pytest.fixture
def queue_env(tmp_path):
    # Buat file gambar tes asli
    in_dir = tmp_path / "inputs"
    in_dir.mkdir()

    img1 = in_dir / "sample1.jpg"
    img2 = in_dir / "sample2.jpg"

    Image.new("RGB", (50, 50), color="red").save(img1, format="JPEG")
    Image.new("RGB", (60, 60), color="blue").save(img2, format="JPEG")

    engine = MockTestEngine(should_fail=False)
    qm = BatchQueueManager(engine=engine, base_dir=tmp_path)

    return {"qm": qm, "img1": img1, "img2": img2, "tmp": tmp_path}


def test_add_image_and_duplicate_detection(queue_env):
    qm = queue_env["qm"]
    img1 = queue_env["img1"]

    # Tambah pertama kali
    item1, err1 = qm.add_image(img1)
    assert item1 is not None
    assert err1 is None
    assert len(qm.items) == 1

    # Coba tambah file yang sama persis (hash duplikat)
    item_dup, err_dup = qm.add_image(img1)
    assert item_dup is None
    assert "Duplikat" in err_dup
    assert len(qm.items) == 1


def test_queue_process_successful(queue_env):
    qm = queue_env["qm"]
    qm.add_image(queue_env["img1"])
    qm.add_image(queue_env["img2"])

    assert len(qm.items) == 2
    summary = qm.process_queue("batch_test_1", {"scale": 4, "output_format": "JPG"})

    assert summary["completed"] == 2
    assert summary["failed"] == 0
    assert qm.items[0].status == ItemStatus.COMPLETED
    assert qm.items[1].status == ItemStatus.COMPLETED
    assert Path(qm.items[0].output_path).exists()


def test_queue_handles_individual_failure_without_stopping(queue_env):
    # Setup engine yang gagal untuk item kedua
    qm = queue_env["qm"]
    qm.add_image(queue_env["img1"])
    qm.add_image(queue_env["img2"])

    # Engine gagal
    qm.engine = MockTestEngine(should_fail=True)

    summary = qm.process_queue("batch_fail_test", {"scale": 4})
    assert summary["failed"] == 2
    assert qm.items[0].status == ItemStatus.FAILED
    assert qm.items[0].error_message is not None

    # Uji coba retry failed
    qm.retry_failed()
    assert qm.items[0].status == ItemStatus.WAITING
    assert qm.items[1].status == ItemStatus.WAITING
