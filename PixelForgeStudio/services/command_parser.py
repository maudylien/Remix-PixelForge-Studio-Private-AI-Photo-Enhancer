"""
PixelForge Studio - Natural Language Processing Command Parser
Menerjemahkan instruksi bahasa Indonesia dan bahasa Inggris menjadi konfigurasi pemrosesan
secara 100% lokal berbasis aturan (rule-based pattern matching), tanpa memanggil API cloud eksternal.
"""

import re
from typing import Dict, Any, List


class CommandParser:
    @staticmethod
    def parse_command(command_text: str, current_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Menganalisis teks instruksi bahasa Indonesia atau Inggris dan mengembalikan
        usulan perubahan parameter beserta penjelasan konfirmasi ramah pengguna.
        """
        text = command_text.lower().strip()
        modifications: Dict[str, Any] = {}
        explanations: List[str] = []

        # 1. Deteksi Skala Upscaling (2x, 4x, 8x)
        if re.search(r"\b(8x|delapan kali|8 kali|eight times)\b", text):
            modifications["scale"] = 8
            explanations.append("Skala AI diatur ke 8x (Multi-pass pipeline)")
        elif re.search(r"\b(4x|empat kali|4 kali|four times)\b", text):
            modifications["scale"] = 4
            explanations.append("Skala AI diatur ke 4x (Resolusi tinggi)")
        elif re.search(r"\b(2x|dua kali|2 kali|two times)\b", text):
            modifications["scale"] = 2
            explanations.append("Skala AI diatur ke 2x (Optimal)")

        # 2. Deteksi Model Real-ESRGAN
        if re.search(r"\b(anime|kartun|animasi|manga|cartoon|illustration)\b", text):
            modifications["model_name"] = "realesrgan-x4plus-anime"
            explanations.append("Model AI diubah ke 'realesrgan-x4plus-anime' untuk ilustrasi/kartun")
        elif re.search(r"\b(realesrnet|halus|smooth|tanpa artefak)\b", text):
            modifications["model_name"] = "realesrnet-x4plus"
            explanations.append("Model AI diubah ke 'realesrnet-x4plus' (Restorasi tekstur halus)")
        elif re.search(r"\b(foto biasa|general photo|default model|x4plus)\b", text):
            modifications["model_name"] = "realesrgan-x4plus"
            explanations.append("Model AI diubah ke 'realesrgan-x4plus' (Standar fotografi)")

        # 3. Deteksi Restorasi Wajah / Portrait
        if re.search(r"\b(wajah|portrait|face|potret|muka|natural face)\b", text):
            modifications["face_restoration_enabled"] = True
            modifications["face_strength"] = 0.6
            explanations.append("Modul restorasi wajah diaktifkan dengan prioritas natural (kekuatan 0.6)")

        if re.search(r"\b(prioritaskan kualitas wajah|restorasi penuh|wajah tajam)\b", text):
            modifications["face_restoration_enabled"] = True
            modifications["face_strength"] = 0.8
            explanations.append("Kekuatan restorasi wajah ditingkatkan ke 0.8")

        # 4. Deteksi Format Output & Kualitas
        if re.search(r"\b(webp|kompresi webp)\b", text):
            modifications["output_format"] = "WEBP"
            explanations.append("Format keluaran diubah menjadi WebP")
            # Kualitas WebP
            q_match = re.search(r"kualitas\s*(\d{2,3})|quality\s*(\d{2,3})", text)
            if q_match:
                q_val = int(q_match.group(1) or q_match.group(2))
                modifications["webp_quality"] = max(50, min(100, q_val))
                explanations.append(f"Kualitas WebP diatur ke {modifications['webp_quality']}")
        elif re.search(r"\b(png|tanpa kompresi|lossless)\b", text):
            modifications["output_format"] = "PNG"
            explanations.append("Format keluaran diubah menjadi PNG (Lossless)")
        elif re.search(r"\b(jpg|jpeg)\b", text):
            modifications["output_format"] = "JPG"
            explanations.append("Format keluaran diubah menjadi JPG")
            q_match = re.search(r"kualitas\s*(\d{2,3})|quality\s*(\d{2,3})", text)
            if q_match:
                q_val = int(q_match.group(1) or q_match.group(2))
                modifications["jpeg_quality"] = max(50, min(100, q_val))
                explanations.append(f"Kualitas JPEG diatur ke {modifications['jpeg_quality']}")

        # 5. Deteksi Ekspor ZIP
        if re.search(r"\b(zip|arsip|masukkan semua hasil ke zip|export zip|pack to zip)\b", text):
            modifications["auto_create_zip"] = True
            explanations.append("Opsi pembungkusan hasil akhir otomatis ke berkas ZIP diaktifkan")

        # 6. Deteksi Awalan (Prefix) dan Akhiran (Suffix) File
        prefix_match = re.search(r"(?:awalan|prefix)\s+([a-zA-Z0-9_\-]+)", text)
        if prefix_match:
            modifications["filename_prefix"] = prefix_match.group(1)
            explanations.append(f"Awalan nama berkas ditambahkan: '{prefix_match.group(1)}'")

        suffix_match = re.search(r"(?:akhiran|suffix)\s+([a-zA-Z0-9_\-]+)", text)
        if suffix_match:
            modifications["filename_suffix"] = suffix_match.group(1)
            explanations.append(f"Akhiran nama berkas diatur: '{suffix_match.group(1)}'")

        # 7. Penyesuaian Ketajaman & Kecerahan
        if re.search(r"\b(lebih tajam|pertajam|tajam|sharpen|sharpness|sharper|sharp|crisp)\b", text):
            modifications["sharpness"] = 1.2
            explanations.append("Ketajaman gambar ditingkatkan ke 1.2x")

        if re.search(r"\b(lebih terang|cerahkan|brighten|brightness)\b", text):
            modifications["brightness"] = 1.1
            explanations.append("Kecerahan gambar ditingkatkan ke 1.1x")

        if re.search(r"\b(denoise|hilangkan noise|kurangi bintik)\b", text):
            modifications["denoise"] = 0.3
            explanations.append("Filter pengurangan noise diaktifkan (level 0.3)")

        # Jika tidak ada perintah spesifik yang dipahami
        if not modifications:
            return {
                "understood": False,
                "message": (
                    "Instruksi belum dikenali. Contoh perintah yang didukung:\n"
                    "• 'Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah yang natural, simpan sebagai JPG kualitas 95, dan masukkan semua hasil ke ZIP'\n"
                    "• 'Ubah ke WebP dengan kualitas 90, tambahkan awalan hd_'\n"
                    "• 'Upscale 2x anime illustration to PNG'"
                ),
                "proposed_modifications": {},
                "explanations": [],
            }

        return {
            "understood": True,
            "raw_text": command_text,
            "proposed_modifications": modifications,
            "explanations": explanations,
            "summary": " | ".join(explanations),
        }
