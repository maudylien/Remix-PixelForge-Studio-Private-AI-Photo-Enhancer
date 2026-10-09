"""
PixelForge Studio - Archive Service (ZIP Import & Export)
Menangani ekstraksi arsip ZIP secara aman dengan proteksi Zip Slip,
serta pembungkusan batch foto yang berhasil ditingkatkan ke dalam berkas ZIP ekspor.
"""

import os
import json
import zipfile
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
from .image_service import is_supported_image

logger = logging.getLogger("PixelForge.Service.Archive")


class ArchiveService:
    @staticmethod
    def extract_zip_safely(zip_file_path: Path, destination_dir: Path) -> Tuple[List[Path], List[str]]:
        """
        Mengekstrak file gambar dari arsip ZIP dengan pengamanan ketat:
        - Mencegah Path Traversal / Zip Slip
        - Hanya mengekstrak ekstensi gambar yang didukung
        - Mengabaikan metadata MacOS (__MACOSX, .DS_Store)
        """
        zip_path = Path(zip_file_path).resolve()
        dest_dir = Path(destination_dir).resolve()
        dest_dir.mkdir(parents=True, exist_ok=True)

        extracted_images: List[Path] = []
        errors: List[str] = []

        if not zipfile.is_zipfile(zip_path):
            errors.append(f"Berkas bukan arsip ZIP yang valid: {zip_path.name}")
            return extracted_images, errors

        with zipfile.ZipFile(zip_path, "r") as archive:
            for member in archive.infolist():
                if member.is_dir():
                    continue

                # Abaikan sampah OS (misal MacOS resource fork atau .DS_Store)
                if "__MACOSX" in member.filename or member.filename.startswith("._") or member.filename.endswith(".DS_Store"):
                    continue

                # Proteksi Zip Slip Traversal menggunakan os.path.commonpath
                target_path = (dest_dir / member.filename).resolve()
                try:
                    if os.path.commonpath([str(dest_dir), str(target_path)]) != str(dest_dir):
                        errors.append(f"Ditolak (keamanan Zip Slip): {member.filename}")
                        continue
                except ValueError:
                    errors.append(f"Ditolak (keamanan Zip Slip): {member.filename}")
                    continue

                # Hanya izinkan gambar
                if not is_supported_image(target_path):
                    continue

                try:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(member) as source, open(target_path, "wb") as dest:
                        dest.write(source.read())
                    extracted_images.append(target_path)
                except Exception as e:
                    errors.append(f"Gagal mengekstrak {member.filename}: {e}")

        return extracted_images, errors

    @staticmethod
    def create_batch_zip(
        output_zip_path: Path,
        image_files: List[Path],
        batch_report: Optional[Dict[str, Any]] = None,
    ) -> Path:
        """
        Membuat paket ZIP hasil pemrosesan batch yang berisi seluruh gambar sukses
        serta processing_report.json untuk rekam jejak.
        """
        out_zip = Path(output_zip_path).resolve()
        out_zip.parent.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for img in image_files:
                if img.exists() and img.is_file():
                    # Simpan dengan nama file saja di root zip
                    zf.write(img, arcname=img.name)

            # Sisipkan laporan json jika ada
            if batch_report:
                report_str = json.dumps(batch_report, indent=2, ensure_ascii=False)
                zf.writestr("processing_report.json", report_str)

        return out_zip
