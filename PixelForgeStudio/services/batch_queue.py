"""
PixelForge Studio - Batch Queue Manager
Mengelola antrean foto dengan status transisi yang ketat:
WAITING -> PREPARING -> PROCESSING -> COMPLETED / FAILED / CANCELLED.
Mendukung pause/resume, pembatalan aman di batas subprocess, retry failed, dan pencegahan duplikat.
"""

import time
import uuid
import logging
from enum import Enum
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any

from .image_service import (
    compute_file_hash,
    get_image_metadata,
    create_thumbnail,
    apply_conventional_enhancements,
)
from .history_service import HistoryService
from engines.base_engine import BaseUpscaleEngine

logger = logging.getLogger("PixelForge.Service.Queue")


class ItemStatus(str, Enum):
    WAITING = "Waiting"
    PREPARING = "Preparing"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


@dataclass
class QueueItem:
    id: str
    file_path: Path
    filename: str
    file_hash: str
    file_size_kb: float
    dimensions: Optional[tuple] = None
    thumbnail_path: Optional[str] = None
    status: ItemStatus = ItemStatus.WAITING
    output_path: Optional[str] = None
    output_dimensions: Optional[tuple] = None
    duration_seconds: float = 0.0
    error_message: Optional[str] = None
    added_at: float = field(default_factory=time.time)


class BatchQueueManager:
    def __init__(
        self,
        engine: BaseUpscaleEngine,
        history_service: Optional[HistoryService] = None,
        base_dir: Optional[Path] = None,
    ):
        self.engine = engine
        self.history_service = history_service
        self.base_dir = base_dir or Path(__file__).resolve().parent.parent

        self.temp_dir = self.base_dir / "temp"
        self.output_dir = self.base_dir / "output"
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.items: List[QueueItem] = []
        self.seen_hashes: Dict[str, str] = {}  # hash -> item_id
        self._is_paused: bool = False
        self._is_cancelled: bool = False
        self._current_processing_id: Optional[str] = None

    def add_image(self, file_path: Path) -> Tuple[Optional[QueueItem], Optional[str]]:
        """Menambahkan file gambar ke antrean dengan validasi hash duplikasi."""
        p = Path(file_path).resolve()
        if not p.exists():
            return None, f"File tidak ditemukan: {p.name}"

        meta = get_image_metadata(p)
        if not meta.get("valid"):
            return None, f"Bukan file gambar yang valid: {meta.get('error', 'Unknown')}"

        f_hash = compute_file_hash(p)
        if f_hash in self.seen_hashes:
            return None, f"Duplikat terdeteksi: Gambar '{p.name}' identik dengan item yang sudah ada dalam antrean."

        item_id = str(uuid.uuid4())[:8]
        thumb_file = self.temp_dir / "thumbs" / f"thumb_{item_id}.jpg"
        try:
            create_thumbnail(p, thumb_file)
            thumb_str = str(thumb_file)
        except Exception:
            thumb_str = None

        item = QueueItem(
            id=item_id,
            file_path=p,
            filename=p.name,
            file_hash=f_hash,
            file_size_kb=meta.get("file_size_kb", 0.0),
            dimensions=(meta.get("width"), meta.get("height")),
            thumbnail_path=thumb_str,
            status=ItemStatus.WAITING,
        )

        self.items.append(item)
        self.seen_hashes[f_hash] = item_id
        return item, None

    def remove_item(self, item_id: str) -> bool:
        """Menghapus item dari antrean jika belum selesai/sedang diproses."""
        for i, item in enumerate(self.items):
            if item.id == item_id:
                if item.status == ItemStatus.PROCESSING:
                    return False  # Tidak bisa hapus saat sedang proses aktif
                if item.file_hash in self.seen_hashes:
                    del self.seen_hashes[item.file_hash]
                self.items.pop(i)
                return True
        return False

    def clear_completed(self):
        """Membersihkan item yang sudah sukses selesai dari tampilan antrean."""
        self.items = [item for item in self.items if item.status != ItemStatus.COMPLETED]
        self.seen_hashes = {item.file_hash: item.id for item in self.items}

    def pause(self):
        """Meminta jeda aman setelah item yang sedang aktif selesai dieksekusi."""
        self._is_paused = True

    def resume(self):
        """Melanjutkan pemrosesan antrean."""
        self._is_paused = False

    def cancel(self):
        """Membatalkan seluruh antrean yang tersisa."""
        self._is_cancelled = True
        for item in self.items:
            if item.status in (ItemStatus.WAITING, ItemStatus.PREPARING):
                item.status = ItemStatus.CANCELLED

    def retry_failed(self):
        """Mengembalikan status item yang gagal kembali ke antrean WAITING."""
        for item in self.items:
            if item.status in (ItemStatus.FAILED, ItemStatus.CANCELLED):
                item.status = ItemStatus.WAITING
                item.error_message = None

    def get_summary(self) -> Dict[str, Any]:
        """Statistik antrean terkini."""
        counts = {status.value: 0 for status in ItemStatus}
        for item in self.items:
            counts[item.status.value] += 1

        total = len(self.items)
        completed = counts[ItemStatus.COMPLETED.value]
        progress_pct = round((completed / total) * 100, 1) if total > 0 else 0.0

        return {
            "total": total,
            "completed": completed,
            "waiting": counts[ItemStatus.WAITING.value],
            "processing": counts[ItemStatus.PROCESSING.value],
            "failed": counts[ItemStatus.FAILED.value],
            "cancelled": counts[ItemStatus.CANCELLED.value],
            "progress_percent": progress_pct,
            "is_paused": self._is_paused,
            "is_cancelled": self._is_cancelled,
        }

    def process_queue(
        self,
        batch_folder_name: str,
        settings: Dict[str, Any],
        on_progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        """
        Menjalankan seluruh antrean foto secara sekuensial untuk menghemat memori.
        Jika satu foto gagal, proses otomatis lanjut ke foto berikutnya tanpa mogok.
        """
        self._is_paused = False
        self._is_cancelled = False

        batch_out_dir = self.output_dir / batch_folder_name
        batch_out_dir.mkdir(parents=True, exist_ok=True)

        for item in self.items:
            if self._is_cancelled:
                if item.status == ItemStatus.WAITING:
                    item.status = ItemStatus.CANCELLED
                continue

            if self._is_paused:
                logger.info("Antrean dijeda oleh pengguna.")
                break

            if item.status != ItemStatus.WAITING:
                continue

            # Mulai persiapan
            item.status = ItemStatus.PREPARING
            self._current_processing_id = item.id
            if on_progress_callback:
                on_progress_callback(self.get_summary())

            start_t = time.time()
            item.status = ItemStatus.PROCESSING

            try:
                # Tentukan nama file tujuan dengan prefix/suffix
                prefix = settings.get("filename_prefix", "")
                suffix = settings.get("filename_suffix", "_enhanced")
                fmt = settings.get("output_format", "JPG").lower()
                ext = ".jpg" if fmt in ["jpg", "jpeg"] else f".{fmt}"

                stem = item.file_path.stem
                out_filename = f"{prefix}{stem}{suffix}{ext}"
                out_file_path = batch_out_dir / out_filename

                # Menghindari tubrukan nama jika file sudah ada sebelumnya
                counter = 1
                while out_file_path.exists():
                    out_file_path = batch_out_dir / f"{prefix}{stem}{suffix}_{counter}{ext}"
                    counter += 1

                # 1. Jalankan Inferensi AI Engine
                engine_res = self.engine.upscale(
                    input_path=item.file_path,
                    output_path=out_file_path,
                    model_name=settings.get("model_name", "realesrgan-x4plus"),
                    scale=settings.get("scale", 4),
                    tile_size=settings.get("tile_size", 0),
                    gpu_id=settings.get("gpu_id", 0),
                    output_format=fmt,
                )

                if not engine_res.success:
                    item.status = ItemStatus.FAILED
                    item.error_message = engine_res.error_message or "AI Engine gagal memproses gambar."
                    item.duration_seconds = round(time.time() - start_t, 2)
                    logger.error("Item %s gagal: %s", item.filename, item.error_message)
                    continue

                # 2. Terapkan penyesuaian konvensional jika ada
                needs_adjustments = any([
                    abs(settings.get("brightness", 1.0) - 1.0) > 0.01,
                    abs(settings.get("contrast", 1.0) - 1.0) > 0.01,
                    abs(settings.get("saturation", 1.0) - 1.0) > 0.01,
                    abs(settings.get("sharpness", 1.0) - 1.0) > 0.01,
                    settings.get("denoise", 0.0) > 0.05,
                ])

                if needs_adjustments and out_file_path.exists():
                    apply_conventional_enhancements(
                        image_path=out_file_path,
                        output_path=out_file_path,
                        brightness=settings.get("brightness", 1.0),
                        contrast=settings.get("contrast", 1.0),
                        saturation=settings.get("saturation", 1.0),
                        sharpness=settings.get("sharpness", 1.0),
                        denoise=settings.get("denoise", 0.0),
                        output_format=fmt,
                        jpeg_quality=settings.get("jpeg_quality", 95),
                        webp_quality=settings.get("webp_quality", 90),
                    )

                # Dapatkan dimensi akhir
                final_meta = get_image_metadata(out_file_path)

                item.status = ItemStatus.COMPLETED
                item.output_path = str(out_file_path)
                item.output_dimensions = (final_meta.get("width"), final_meta.get("height"))
                item.duration_seconds = round(time.time() - start_t, 2)

                # Rekam riwayat
                if self.history_service:
                    self.history_service.add_record({
                        "batch_id": batch_folder_name,
                        "filename": item.filename,
                        "output_file": out_file_path.name,
                        "original_dims": item.dimensions,
                        "output_dims": item.output_dimensions,
                        "scale": settings.get("scale", 4),
                        "model": settings.get("model_name", "realesrgan-x4plus"),
                        "duration": item.duration_seconds,
                        "status": "COMPLETED",
                    })

            except Exception as e:
                logger.exception("Kesalahan tak terduga pada item %s: %s", item.filename, e)
                item.status = ItemStatus.FAILED
                item.error_message = str(e)
                item.duration_seconds = round(time.time() - start_t, 2)
            finally:
                self._current_processing_id = None
                if on_progress_callback:
                    on_progress_callback(self.get_summary())

        return self.get_summary()
