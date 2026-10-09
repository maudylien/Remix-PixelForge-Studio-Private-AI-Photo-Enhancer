"""
PixelForge Studio - Unit Tests for Natural Language Command Parser
Menguji kemampuan parser lokal berbasis aturan dalam mengenali instruksi bahasa Indonesia & Inggris.
"""

from services.command_parser import CommandParser


def test_indonesian_command_full():
    cmd = "Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah yang natural, simpan sebagai JPG kualitas 95, dan masukkan semua hasil ke ZIP."
    res = CommandParser.parse_command(cmd, {})

    assert res["understood"] is True
    mods = res["proposed_modifications"]
    assert mods.get("scale") == 4
    assert mods.get("face_restoration_enabled") is True
    assert mods.get("output_format") == "JPG"
    assert mods.get("jpeg_quality") == 95
    assert mods.get("auto_create_zip") is True


def test_prefix_and_sequential():
    cmd = "Proses semua foto secara berurutan, jangan ubah foto asli, tambahkan awalan enhanced_ pada nama file, dan simpan hasilnya di folder output."
    res = CommandParser.parse_command(cmd, {})

    assert res["understood"] is True
    mods = res["proposed_modifications"]
    assert mods.get("filename_prefix") == "enhanced_"


def test_webp_conversion():
    cmd = "Kurangi ukuran file menjadi WebP dengan kualitas 90 tanpa mengubah rasio gambar."
    res = CommandParser.parse_command(cmd, {})

    assert res["understood"] is True
    mods = res["proposed_modifications"]
    assert mods.get("output_format") == "WEBP"
    assert mods.get("webp_quality") == 90


def test_english_command():
    cmd = "Upscale 8x cartoon illustration to PNG with sharper details"
    res = CommandParser.parse_command(cmd, {})

    assert res["understood"] is True
    mods = res["proposed_modifications"]
    assert mods.get("scale") == 8
    assert mods.get("model_name") == "realesrgan-x4plus-anime"
    assert mods.get("output_format") == "PNG"
    assert mods.get("sharpness") == 1.2


def test_unrecognized_command():
    cmd = "halo apa kabar tolong masak nasi goreng"
    res = CommandParser.parse_command(cmd, {})
    assert res["understood"] is False
    assert len(res["proposed_modifications"]) == 0
