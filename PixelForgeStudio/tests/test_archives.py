"""
PixelForge Studio - Unit Tests for Archive Service (ZIP Import & Export)
Memverifikasi ekstraksi arsip ZIP aman terhadap ancaman Zip Slip (path traversal)
dan integritas pembuatan arsip ekspor batch.
"""

import zipfile
from pathlib import Path
from services.archive_service import ArchiveService

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


@pytest.fixture
def temp_workspace(tmp_path):
    src_dir = tmp_path / "src"
    dest_dir = tmp_path / "dest"
    src_dir.mkdir()
    dest_dir.mkdir()
    return {"src": src_dir, "dest": dest_dir, "root": tmp_path}


def test_zip_extraction_clean(temp_workspace):
    # Buat arsip ZIP bersih dengan dua file gambar tiruan
    zip_path = temp_workspace["src"] / "valid_images.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("photo1.jpg", b"\xFF\xD8\xFF\xE0" + b"\x00" * 200)
        zf.writestr("subfolder/photo2.png", b"\x89PNG\r\n\x1a\n" + b"\x00" * 200)
        zf.writestr("ignored_document.txt", b"Bukan gambar")

    extracted, errors = ArchiveService.extract_zip_safely(zip_path, temp_workspace["dest"])

    assert len(extracted) == 2
    assert any(p.name == "photo1.jpg" for p in extracted)
    assert any(p.name == "photo2.png" for p in extracted)
    assert not any(p.name == "ignored_document.txt" for p in extracted)
    assert len(errors) == 0


def test_zip_slip_path_traversal_protection(temp_workspace):
    # Buat zip berbahaya dengan path traversal ../../attack.jpg
    malicious_zip = temp_workspace["src"] / "malicious.zip"
    with zipfile.ZipFile(malicious_zip, "w") as zf:
        zf.writestr("../../escaped_photo.jpg", b"Dangerous payload")
        zf.writestr("valid_photo.jpg", b"\xFF\xD8\xFF" + b"\x00" * 50)

    extracted, errors = ArchiveService.extract_zip_safely(malicious_zip, temp_workspace["dest"])

    # Path berbahaya harus ditolak dan dicatat di errors
    assert any("Zip Slip" in err for err in errors)
    assert not (temp_workspace["root"] / "escaped_photo.jpg").exists()


def test_create_batch_zip(temp_workspace):
    # Buat 2 file gambar sementara
    img1 = temp_workspace["src"] / "photo_a.jpg"
    img2 = temp_workspace["src"] / "photo_b.png"
    img1.write_bytes(b"DATA1")
    img2.write_bytes(b"DATA2")

    out_zip = temp_workspace["dest"] / "export.zip"
    report = {"batch_id": "test_batch", "count": 2}

    res_zip = ArchiveService.create_batch_zip(out_zip, [img1, img2], batch_report=report)
    assert res_zip.exists()

    with zipfile.ZipFile(res_zip, "r") as zf:
        names = zf.namelist()
        assert "photo_a.jpg" in names
        assert "photo_b.png" in names
        assert "processing_report.json" in names
