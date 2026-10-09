"""
PixelForge Studio - Processing History Service
Menyimpan riwayat pemrosesan foto dan laporan batch dalam format JSON lokal / SQLite.
"""

import json
import time
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

logger = logging.getLogger("PixelForge.Service.History")


class HistoryService:
    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            self.base_dir = Path(__file__).resolve().parent.parent
        else:
            self.base_dir = Path(base_dir).resolve()

        self.history_file = self.base_dir / "logs" / "processing_history.json"
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_file()

    def _ensure_file(self):
        if not self.history_file.exists():
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def get_all_records(self) -> List[Dict[str, Any]]:
        try:
            with open(self.history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def add_record(self, record: Dict[str, Any]):
        records = self.get_all_records()
        record["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        records.append(record)
        # Batasi simpan 1000 entri terbaru
        if len(records) > 1000:
            records = records[-1000:]
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Gagal menyimpan riwayat: %s", e)

    def clear_history(self):
        try:
            with open(self.history_file, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception as e:
            logger.error("Gagal membersihkan riwayat: %s", e)
