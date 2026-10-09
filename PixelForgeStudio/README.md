# PixelForge Studio — Private AI Photo Enhancer (Windows)

> **Aplikasi Windows Desktop & Web Studio Lokal untuk AI Super-Resolution, Batch Upscaling Foto, dan Restorasi Wajah.**
> 100% Berjalan Lokal di Komputer Anda (`http://127.0.0.1:7860`). Tanpa Biaya API per-foto, Tanpa Berlangganan, Tanpa Pengiriman Data ke Cloud.

---

## 🌟 Fitur Utama

1. **Batch Upscaling Masal (30, 50, 100+ Foto Sekaligus):**
   - Mendukung pemilihan banyak file sekaligus atau impor langsung file arsip `.ZIP`.
   - Deteksi gambar duplikat otomatis menggunakan hash kriptografis SHA-256.
   - Manajemen memori aman: thumbnail hemat memori tanpa memuat foto resolusi penuh secara bersamaan.

2. **Real AI Super-Resolution Engine:**
   - Menggunakan binary resmi **Real-ESRGAN NCNN Vulkan** yang dioptimalkan untuk Windows 64-bit.
   - Akselerasi perangkat keras via GPU Vulkan (mendukung NVIDIA RTX/GTX, AMD Radeon, Intel Arc/Iris Xe).
   - Skala Pembesaran:
     - **4x:** Inferensi native model AI (misal: 1000x1000 → 4000x4000 piksel).
     - **2x:** Inferensi 4x dilanjutkan downsampling Lanczos presisi tinggi.
     - **8x:** Pipeline multi-pass terverifikasi (4x dilanjutkan 2x).

3. **Model AI yang Didukung:**
   - `realesrgan-x4plus`: Model standar fotografi umum, portrait, tekstur alami (Rekomendasi Utama).
   - `realesrnet-x4plus`: Menghilangkan noise dan artefak kompresi dengan hasil lebih halus.
   - `realesrgan-x4plus-anime`: Optimal untuk kartun, ilustrasi, gambar digital, dan anime.
   - `realesr-animevideov3`: Model cepat untuk anime dan render 2D.

4. **Modul Restorasi Wajah Opsional (GFPGAN):**
   - Mendukung integrasi opsional dengan model GFPGAN v1.4 untuk merestorasi detail mata, kulit, dan bibir pada foto potret lawas/buram.
   - Slider kekuatan restorasi (0.0 - 1.0) dengan pratinjau perbandingan.

5. **Panel Perintah Bahasa Alami (Natural Language):**
   - Ketik instruksi dalam Bahasa Indonesia atau Bahasa Inggris!
   - Contoh:
     > *"Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah yang natural, simpan sebagai JPG kualitas 95, dan masukkan semua hasil ke ZIP."*
     > *"Ubah ke WebP kualitas 90, tambahkan awalan hd_ pada nama file"*
   - Sistem menerjemahkan perintah secara lokal (rule-based pattern matching) tanpa perlu API eksternal.

6. **Pengendali Kualitas & Penyesuaian Visual:**
   - Kecerahan (Brightness), Kontras, Saturasi, Ketajaman (Sharpness), Denoising.
   - Format keluaran: JPEG (kualitas 60-100), Lossless PNG, atau WebP kompresi tinggi.
   - Mempertahankan rotasi EXIF orientation dan proteksi metadata privasi (stripping GPS).

7. **Manajer Antrean Handal:**
   - Status terperinci: *Waiting*, *Preparing*, *Processing*, *Completed*, *Failed*, *Cancelled*.
   - Pemrosesan sekuensial yang stabil — jika 1 foto korup/gagal, antrean tetap lanjut memproses foto berikutnya.
   - Fitur jeda (pause), lanjutkan (resume), dan coba ulang foto yang gagal (*Retry Failed*).

8. **Ekspor & Arsip ZIP Sekali Klik:**
   - Paket hasil ekspor langsung diunduh dalam bentuk `.ZIP` rapi yang menyertakan berkas `processing_report.json`.

---

## 💻 Persyaratan Sistem

- **Sistem Operasi:** Windows 10 atau Windows 11 (64-bit).
- **Python:** Python 3.10 atau Python 3.11 ([Unduh dari python.org](https://www.python.org/downloads/)). *Pastikan centang "Add Python to PATH" saat instalasi.*
- **GPU (Disarankan):** Kartu grafis yang mendukung Vulkan (NVIDIA GTX 900+ / RTX, AMD RX series, Intel UHD 620+ / Iris Xe / Arc).
- **RAM:** Minimal 8 GB RAM (16 GB direkomendasikan untuk batch 100+ foto).
- **Ruang Penyimpanan:** Minimal 2 GB ruang disk bebas.

---

## 🚀 Panduan Instalasi Cepat (First-Run Setup)

### Langkah 1: Jalankan Setup Otomatis
Cukup klik ganda pada file:
```cmd
setup.bat
```
Skrip ini akan secara otomatis:
1. Memeriksa versi Windows dan Python Anda.
2. Membuat lingkungan terisolasi (`venv`).
3. Memasang dependensi resmi dari `requirements.txt`.
4. Menyiapkan folder kerja (`inputs`, `output`, `temp`, `logs`, `models`, `tools`).
5. Memeriksa dan menawarkan pengunduhan otomatis binary resmi **Real-ESRGAN NCNN Vulkan** beserta model resminya dari GitHub.
6. Menjalankan uji diagnostik mandiri perangkat keras.

---

### Langkah 2: Jalankan Aplikasi
Setelah setup selesai, cukup klik ganda:
```cmd
run.bat
```
Aplikasi akan membuka browser lokal Anda secara otomatis di:
`http://127.0.0.1:7860`

---

## 📂 Struktur Direktori Proyek

```
PixelForgeStudio/
├── app.py                      # Server antarmuka utama (Gradio Web UI)
├── requirements.txt            # Daftar pustaka Python terverifikasi
├── setup.bat                   # Skrip inisialisasi lingkungan & download pertama kali
├── run.bat                     # Skrip peluncur 1-klik
├── update_models.bat           # Skrip pemeriksa model & binary update
├── download_models.py          # Utilitas pengunduh & verifikator Real-ESRGAN resmi
├── config.json                 # Pengaturan default aplikasi
├── README.md                   # Dokumentasi lengkap Bahasa Indonesia
├── engines/
│   ├── base_engine.py          # Interface adapter abstrak AI Super-Resolution
│   ├── realesrgan_engine.py    # Integrasi subprocess Real-ESRGAN NCNN Vulkan
│   └── face_restoration_engine.py # Modul opsional GFPGAN Face Restoration
├── services/
│   ├── batch_queue.py          # Manajer antrean foto sekuensial & isolasi error
│   ├── image_service.py        # Penyesuaian gambar Pillow, kalkulasi hash & EXIF
│   ├── archive_service.py      # Ekstraksi aman ZIP (anti-Zip Slip) & ekspor paket
│   ├── command_parser.py       # Parser perintah bahasa alami lokal ID/EN
│   ├── hardware_service.py     # Diagnostik CPU, GPU Vulkan, RAM, dan Disk
│   └── history_service.py      # Database riwayat pemrosesan lokal
├── ui/
│   ├── components.py           # Definisi preset siap pakai & utilitas UI
│   └── styles.css              # Styling tema gelap desktop Fluent
├── tests/                      # Rangkaian pengujian otomatis (Pytest)
│   ├── test_queue.py
│   ├── test_archives.py
│   ├── test_commands.py
│   ├── test_outputs.py
│   └── test_integration.py
├── tools/                      # Tempat executable realesrgan-ncnn-vulkan.exe
├── models/                     # Tempat model .bin dan .param Real-ESRGAN
├── inputs/                     # Folder penampung foto input
├── output/                     # Folder hasil akhir pemrosesan per-batch
└── logs/                       # Berkas catatan diagnosa & riwayat (pixelforge.log)
```

---

## 🛠️ Panduan Pemecahan Masalah (Troubleshooting)

1. **Muncul pesan "VCRUNTIME140.dll is missing":**
   - Instal Visual C++ Redistributable terbaru dari Microsoft:
     https://aka.ms/vs/17/release/vc_redist.x64.exe

2. **GPU Vulkan tidak terdeteksi atau muncul error driver:**
   - Perbarui driver kartu grafis Anda ke versi terbaru (NVIDIA GeForce Experience, AMD Adrenalin, atau Intel Driver Support Assistant).
   - Jalankan `tools/realesrgan-ncnn-vulkan.exe -v` di CMD untuk melihat daftar perangkat Vulkan yang terbaca.

3. **VRAM GPU Habis (Out of Memory pada foto sangat besar):**
   - Di tab *Ruang Kerja*, buka menu *Opsi Lanjutan Engine*.
   - Ubah nilai **Tile Size** dari `0` menjadi `200` atau `400`. Nilai tile membagi gambar besar menjadi potongan kecil sehingga menggunakan VRAM jauh lebih sedikit.

4. **Menjalankan Pengujian Otomatis (Unit & Integration Tests):**
   ```cmd
   venv\Scripts\activate.bat
   pytest tests/ -v
   ```

---

## 🔒 Privasi & Keamanan Data 100% Lokal

- PixelForge Studio dirancang khusus untuk komputasi pribadi mandiri.
- Seluruh inferensi AI dijalankan oleh binary CPU/GPU lokal pada komputer Anda.
- Tidak ada data, foto, thumbnail, atau statistik yang dikirim ke internet.
- Tidak memerlukan koneksi internet setelah model awal terpasang.
- Foto asli Anda tidak akan pernah ditimpa atau diubah (Originals remain 100% untouched).
