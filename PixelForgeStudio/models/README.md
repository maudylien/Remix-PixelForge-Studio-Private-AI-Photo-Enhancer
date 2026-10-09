# Direktori Model AI — PixelForge Studio

Folder ini menyimpan bobot dan parameter model AI untuk inferensi lokal.

## Model Real-ESRGAN NCNN yang Didukung:
1. **realesrgan-x4plus** (Foto umum, portrait, tekstur natural - DEFAULT)
   - `realesrgan-x4plus.bin`
   - `realesrgan-x4plus.param`
2. **realesrnet-x4plus** (Restorasi foto halus dengan sedikit artefak ketajaman)
   - `realesrnet-x4plus.bin`
   - `realesrnet-x4plus.param`
3. **realesrgan-x4plus-anime** (Ilustrasi, lukisan, dan gambar digital)
   - `realesrgan-x4plus-anime.bin`
   - `realesrgan-x4plus-anime.param`
4. **realesr-animevideov3** (Anime cepat / video frame)
   - `realesr-animevideov3.bin`
   - `realesr-animevideov3.param`

## Model Opsional Restorasi Wajah (GFPGAN / CodeFormer):
- `GFPGANv1.4.pth` (Opsional, untuk modul restorasi wajah spesifik)
- Letakkan di folder ini jika mengaktifkan face restoration berbasis PyTorch.
