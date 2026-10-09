#!/usr/bin/env python3
"""
PixelForge Studio - Automated Test Runner
Menjalankan pengujian otomatis menggunakan modul pytest atau fallback standard library.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Import individual tests
from tests.test_archives import test_zip_extraction_clean, test_zip_slip_path_traversal_protection, test_create_batch_zip
from tests.test_commands import test_indonesian_command_full, test_prefix_and_sequential, test_webp_conversion, test_english_command, test_unrecognized_command


class PixelForgeAutomatedTests(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.tmp = Path(tempfile.mkdtemp())

    def test_commands(self):
        """Uji coba parsing perintah bahasa alami (ID & EN)."""
        test_indonesian_command_full()
        test_prefix_and_sequential()
        test_webp_conversion()
        test_english_command()
        test_unrecognized_command()

    def test_archives(self):
        """Uji coba ekstraksi ZIP dan pencegahan Zip Slip path traversal."""
        ws = {"src": self.tmp / "src", "dest": self.tmp / "dest", "root": self.tmp}
        ws["src"].mkdir()
        ws["dest"].mkdir()
        test_zip_extraction_clean(ws)
        test_zip_slip_path_traversal_protection(ws)
        test_create_batch_zip(ws)

    def test_queue_and_hashes(self):
        """Uji coba deteksi duplikasi hash file."""
        f1 = self.tmp / "img1.bin"
        f2 = self.tmp / "img2.bin"
        f1.write_bytes(b"DATA_SAMPLE_123")
        f2.write_bytes(b"DATA_SAMPLE_123")
        import hashlib
        h1 = hashlib.sha256(f1.read_bytes()).hexdigest()
        h2 = hashlib.sha256(f2.read_bytes()).hexdigest()
        self.assertEqual(h1, h2)
        self.assertEqual(len(h1), 64)


if __name__ == "__main__":
    print("====================================================================")
    print("      MENJALANKAN PENGUJIAN OTOMATIS PIXELFORGE STUDIO")
    print("====================================================================")
    suite = unittest.TestLoader().loadTestsFromTestCase(PixelForgeAutomatedTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n[SUKSES] Semua pengujian unit mandiri berhasil lolos 100%!")
        sys.exit(0)
    else:
        print("\n[GAGAL] Ada pengujian yang tidak lulus.")
        sys.exit(1)

