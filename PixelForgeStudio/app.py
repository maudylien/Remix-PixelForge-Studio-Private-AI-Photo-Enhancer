#!/usr/bin/env python3
"""
PixelForge Studio — Private AI Photo Enhancer
Aplikasi Desktop & Web Studio Lokal untuk AI Photo Upscaling & Batch Enhancement.
100% Berjalan Lokal pada Windows (127.0.0.1), Tanpa Biaya API / Tanpa Cloud Telemetry.
"""

import os
import sys
import time
import json
import logging
from pathlib import Path
from typing import List, Optional

# Setup Logging
BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "pixelforge.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("PixelForge.Main")

# Tambahkan direktori root ke sys.path
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Import Services
from engines.realesrgan_engine import RealESRGANEngine
from engines.face_restoration_engine import FaceRestorationEngine
from services.batch_queue import BatchQueueManager, ItemStatus
from services.archive_service import ArchiveService
from services.command_parser import CommandParser
from services.hardware_service import get_hardware_info, get_system_summary
from services.history_service import HistoryService
from ui.components import BUILTIN_PRESETS, get_preset_list, load_preset_values

# Load Config
CONFIG_PATH = BASE_DIR / "config.json"
try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        APP_CONFIG = json.load(f)
except Exception:
    APP_CONFIG = {"host": "127.0.0.1", "port": 7860}

# Inisialisasi Engine & Services
engine = RealESRGANEngine(base_dir=BASE_DIR)
face_engine = FaceRestorationEngine(base_dir=BASE_DIR)
history_service = HistoryService(base_dir=BASE_DIR)
queue_manager = BatchQueueManager(engine=engine, history_service=history_service, base_dir=BASE_DIR)


def build_app():
    import gradio as gr

    custom_css = """
    .gradio-container { max-width: 1300px !important; margin: 0 auto !important; }
    .status-badge { font-weight: 700; padding: 4px 8px; border-radius: 6px; }
    """

    with gr.Blocks(title="PixelForge Studio — AI Photo Enhancer", css=custom_css, theme=gr.themes.Base()) as demo:
        gr.Markdown(
            """
            # ⚡ PixelForge Studio — Private AI Photo Enhancer
            **Aplikasi Lokal Pribadi Windows** • Akselerasi Real-ESRGAN NCNN Vulkan • 100% Offline & Privat
            """
        )

        with gr.Tabs() as tabs:
            # TAB 1: WORKSPACE & BATCH UPLOAD
            with gr.Tab("📁 Ruang Kerja Batch", id="tab_workspace"):
                with gr.Row():
                    with gr.Column(scale=5):
                        gr.Markdown("### 1. Unggah Foto (Mendukung 30 - 100+ Foto / Berkas ZIP)")
                        file_input = gr.File(
                            label="Pilih Banyak Foto atau Berkas .ZIP",
                            file_count="multiple",
                            file_types=["image", ".zip"],
                            type="filepath",
                        )
                        btn_import_zip = gr.Button("📦 Ekstrak & Tambahkan Arsip ZIP", size="sm")

                        # Panel Perintah Bahasa Alami
                        gr.Markdown("### 💬 Perintah Bahasa Alami (ID / EN)")
                        with gr.Group():
                            cmd_input = gr.Textbox(
                                placeholder="Contoh: Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah natural, simpan sebagai JPG 95, masukkan hasil ke ZIP...",
                                label="Instruksi Pemrosesan",
                                lines=2,
                            )
                            btn_parse_cmd = gr.Button("🔍 Analisis & Terapkan Perintah", size="sm")
                            cmd_feedback = gr.Markdown(value="*Belum ada perintah yang diinput.*")

                        # Galeri Pratinjau Antrean
                        queue_gallery = gr.Gallery(
                            label="Pratinjau Foto dalam Antrean",
                            show_label=True,
                            columns=5,
                            rows=2,
                            height=250,
                            object_fit="contain",
                        )

                    with gr.Column(scale=4):
                        gr.Markdown("### 2. Pengaturan Inferensi AI")
                        with gr.Group():
                            preset_dropdown = gr.Dropdown(
                                choices=get_preset_list(),
                                value="Natural Photo Enhancement",
                                label="Preset Siap Pakai",
                            )

                            model_dropdown = gr.Dropdown(
                                choices=engine.get_supported_models(),
                                value="realesrgan-x4plus",
                                label="Model AI Super-Resolution",
                            )

                            scale_radio = gr.Radio(
                                choices=[2, 4, 8],
                                value=4,
                                label="Faktor Skala Perbesaran (x)",
                                info="4x adalah rasio bawaan model. 2x menggunakan downscale presisi. 8x menggunakan multi-pass.",
                            )

                            with gr.Accordion("⚙️ Opsi Lanjutan Engine", open=False):
                                tile_size_slider = gr.Slider(
                                    minimum=0, maximum=800, step=100, value=0,
                                    label="Tile Size (0 = Otomatis)",
                                    info="Gunakan 200 atau 400 jika VRAM GPU terbatas.",
                                )
                                gpu_id_number = gr.Number(value=0, label="GPU Device ID", precision=0)

                        gr.Markdown("### 3. Restorasi Wajah & Penyesuaian")
                        with gr.Group():
                            face_enable_cb = gr.Checkbox(value=False, label="Aktifkan Restorasi Wajah (GFPGAN)")
                            face_strength_slider = gr.Slider(0.0, 1.0, value=0.6, step=0.05, label="Kekuatan Restorasi Wajah")

                            with gr.Accordion("🎨 Penyesuaian Visual Konvensional", open=False):
                                brightness_slider = gr.Slider(0.5, 1.5, value=1.0, step=0.05, label="Kecerahan (Brightness)")
                                contrast_slider = gr.Slider(0.5, 1.5, value=1.0, step=0.05, label="Kontras (Contrast)")
                                saturation_slider = gr.Slider(0.0, 2.0, value=1.0, step=0.05, label="Saturasi (Saturation)")
                                sharpness_slider = gr.Slider(0.5, 2.0, value=1.0, step=0.05, label="Ketajaman (Sharpness)")
                                denoise_slider = gr.Slider(0.0, 1.0, value=0.0, step=0.05, label="Pengurangan Bintik (Denoise)")

                        gr.Markdown("### 4. Ekspor & Nama Berkas")
                        with gr.Group():
                            out_format_radio = gr.Radio(["JPG", "PNG", "WEBP"], value="JPG", label="Format File")
                            out_quality_slider = gr.Slider(60, 100, value=95, step=1, label="Kualitas JPEG / WEBP (%)")
                            prefix_input = gr.Textbox(value="", label="Awalan Nama (Prefix)", placeholder="misal: hd_")
                            suffix_input = gr.Textbox(value="_enhanced", label="Akhiran Nama (Suffix)")

                gr.Markdown("---")
                with gr.Row():
                    btn_start_batch = gr.Button("🚀 PROSES SEMUA FOTO DALAM ANTREAN", variant="primary", scale=2)
                    btn_pause_batch = gr.Button("⏸️ Jeda Antrean", scale=1)
                    btn_cancel_batch = gr.Button("🛑 Batalkan", scale=1)

                batch_status_md = gr.Markdown("Status: **Siap memproses.**")
                batch_progress_bar = gr.Slider(0, 100, value=0, label="Progres Batch Keseluruhan (%)", interactive=False)

            # TAB 2: SEBELUM & SESUDAH (COMPARISON VIEWER)
            with gr.Tab("🔍 Sebelum & Sesudah", id="tab_viewer"):
                gr.Markdown("### Perbandingan Kualitas: Foto Asli vs Hasil AI Enhancement")
                with gr.Row():
                    with gr.Column():
                        img_original_view = gr.Image(label="Foto Asli (Original)", type="filepath")
                        meta_orig_md = gr.Markdown("Dimensi: - | Ukuran: -")
                    with gr.Column():
                        img_enhanced_view = gr.Image(label="Hasil AI Enhanced (Real-ESRGAN)", type="filepath")
                        meta_enh_md = gr.Markdown("Dimensi: - | Ukuran: - | Durasi: -")

                btn_download_single = gr.File(label="Unduh Berkas Hasil Tunggal", interactive=False)

            # TAB 3: ANTREAN & MANAJEMEN BATCH
            with gr.Tab("📋 Antrean & Ekspor ZIP", id="tab_queue"):
                with gr.Row():
                    btn_retry_failed = gr.Button("🔄 Ulangi yang Gagal (Retry)")
                    btn_clear_completed = gr.Button("🧹 Bersihkan yang Selesai")
                    btn_export_zip = gr.Button("📦 Unduh Semua Hasil Sukses (.ZIP)", variant="primary")

                zip_download_file = gr.File(label="Paket Unduhan ZIP", interactive=False)
                queue_table = gr.Dataframe(
                    headers=["ID", "Nama File", "Ukuran", "Dimensi Awal", "Status", "Dimensi Hasil", "Durasi (dtk)"],
                    datatype=["str", "str", "str", "str", "str", "str", "str"],
                    value=[],
                    label="Daftar Rincian Antrean Foto",
                )

            # TAB 4: DIAGNOSTIK HARDWARE & ENGINE
            with gr.Tab("🛠️ Diagnostik Sistem & Model", id="tab_diag"):
                gr.Markdown("### Pemeriksaan Lingkungan Perangkat Keras & AI Engine")
                sys_summary_text = gr.Textbox(value=get_system_summary(), lines=12, label="Ringkasan Diagnostik Sistem")
                btn_refresh_diag = gr.Button("🔄 Segarkan Status Diagnostik")

                gr.Markdown(
                    """
                    #### Catatan Kesiapan AI Engine:
                    - Jika status menyatakan **Executable / Model Belum Siap**, jalankan berkas **setup.bat** atau **update_models.bat** pada folder aplikasi Anda.
                    - Executable resmi `realesrgan-ncnn-vulkan.exe` akan diunduh langsung dari GitHub resmi `xinntao/Real-ESRGAN-ncnn-vulkan`.
                    """
                )

        # --- EVENT HANDLERS ---

        def handle_file_upload(files):
            if not files:
                return [], "Belum ada file dipilih.", []

            added_count = 0
            duplicates = 0
            thumbs = []
            rows = []

            for f in files:
                f_path = Path(f)
                if f_path.suffix.lower() == ".zip":
                    ext_imgs, errs = ArchiveService.extract_zip_safely(f_path, queue_manager.temp_dir / "unzipped")
                    for img_p in ext_imgs:
                        item, err = queue_manager.add_image(img_p)
                        if item:
                            added_count += 1
                            if item.thumbnail_path:
                                thumbs.append(item.thumbnail_path)
                            rows.append([item.id, item.filename, f"{item.file_size_kb:.1f} KB", str(item.dimensions), item.status.value, "-", "-"])
                        elif "duplikat" in (err or "").lower():
                            duplicates += 1
                else:
                    item, err = queue_manager.add_image(f_path)
                    if item:
                        added_count += 1
                        if item.thumbnail_path:
                            thumbs.append(item.thumbnail_path)
                        rows.append([item.id, item.filename, f"{item.file_size_kb:.1f} KB", str(item.dimensions), item.status.value, "-", "-"])
                    elif "duplikat" in (err or "").lower():
                        duplicates += 1

            status_text = f"Berhasil menambahkan **{added_count}** foto ke antrean."
            if duplicates > 0:
                status_text += f" (*{duplicates} file duplikat dilewati*)"

            return thumbs, status_text, rows

        file_input.change(
            handle_file_upload,
            inputs=[file_input],
            outputs=[queue_gallery, batch_status_md, queue_table],
        )

        def handle_parse_command(text, current_scale, current_model):
            res = CommandParser.parse_command(text, {})
            if not res["understood"]:
                return (
                    f"⚠️ {res['message']}",
                    current_scale,
                    current_model,
                    gr.update(),
                    gr.update(),
                    gr.update(),
                )

            mods = res["proposed_modifications"]
            new_scale = mods.get("scale", current_scale)
            new_model = mods.get("model_name", current_model)
            new_face = mods.get("face_restoration_enabled", gr.update())
            new_fmt = mods.get("output_format", gr.update())
            new_q = mods.get("jpeg_quality", mods.get("webp_quality", gr.update()))

            feedback = f"✅ **Perintah Dikenali:**\n{res['summary']}"
            return feedback, new_scale, new_model, new_face, new_fmt, new_q

        btn_parse_cmd.click(
            handle_parse_command,
            inputs=[cmd_input, scale_radio, model_dropdown],
            outputs=[cmd_feedback, scale_radio, model_dropdown, face_enable_cb, out_format_radio, out_quality_slider],
        )

        def handle_preset_change(preset_name):
            vals = load_preset_values(preset_name)
            return (
                vals.get("scale", 4),
                vals.get("model_name", "realesrgan-x4plus"),
                vals.get("brightness", 1.0),
                vals.get("contrast", 1.0),
                vals.get("saturation", 1.0),
                vals.get("sharpness", 1.0),
                vals.get("denoise", 0.0),
                vals.get("output_format", "JPG"),
                vals.get("jpeg_quality", 95),
                vals.get("face_restoration", False),
                vals.get("face_strength", 0.6),
            )

        preset_dropdown.change(
            handle_preset_change,
            inputs=[preset_dropdown],
            outputs=[
                scale_radio,
                model_dropdown,
                brightness_slider,
                contrast_slider,
                saturation_slider,
                sharpness_slider,
                denoise_slider,
                out_format_radio,
                out_quality_slider,
                face_enable_cb,
                face_strength_slider,
            ],
        )

        def start_processing(
            model_name, scale, tile_size, gpu_id,
            bright, cont, sat, sharp, denoise,
            fmt, quality, prefix, suffix
        ):
            if not queue_manager.items:
                return "Antrean kosong. Silakan unggah foto terlebih dahulu.", 0, [], None, None, "-", "-"

            batch_id = f"batch_{int(time.time())}"
            settings = {
                "model_name": model_name,
                "scale": scale,
                "tile_size": tile_size,
                "gpu_id": gpu_id,
                "brightness": bright,
                "contrast": cont,
                "saturation": sat,
                "sharpness": sharp,
                "denoise": denoise,
                "output_format": fmt,
                "jpeg_quality": quality,
                "webp_quality": quality,
                "filename_prefix": prefix,
                "filename_suffix": suffix,
            }

            queue_manager.process_queue(batch_id, settings)

            # Siapkan tabel dan sampel pratinjau hasil pertama
            rows = []
            first_orig = None
            first_enh = None
            orig_meta_str = "-"
            enh_meta_str = "-"

            for item in queue_manager.items:
                rows.append([
                    item.id,
                    item.filename,
                    f"{item.file_size_kb:.1f} KB",
                    str(item.dimensions),
                    item.status.value,
                    str(item.output_dimensions) if item.output_dimensions else "-",
                    f"{item.duration_seconds:.2f}" if item.duration_seconds > 0 else "-",
                ])
                if item.status == ItemStatus.COMPLETED and not first_enh:
                    first_orig = str(item.file_path)
                    first_enh = item.output_path
                    orig_meta_str = f"Dimensi: {item.dimensions} | Asli: {item.filename}"
                    enh_meta_str = f"Dimensi: {item.output_dimensions} | Durasi: {item.duration_seconds}s | Model: {model_name}"

            summ = queue_manager.get_summary()
            status_text = (
                f"Selesai: **{summ['completed']}** sukses, **{summ['failed']}** gagal "
                f"dari total **{summ['total']}** foto."
            )

            return status_text, 100, rows, first_orig, first_enh, orig_meta_str, enh_meta_str

        btn_start_batch.click(
            start_processing,
            inputs=[
                model_dropdown, scale_radio, tile_size_slider, gpu_id_number,
                brightness_slider, contrast_slider, saturation_slider, sharpness_slider, denoise_slider,
                out_format_radio, out_quality_slider, prefix_input, suffix_input,
            ],
            outputs=[
                batch_status_md, batch_progress_bar, queue_table,
                img_original_view, img_enhanced_view, meta_orig_md, meta_enh_md,
            ],
        )

        def export_zip():
            successful_paths = [Path(item.output_path) for item in queue_manager.items if item.status == ItemStatus.COMPLETED and item.output_path]
            if not successful_paths:
                return None

            zip_dest = queue_manager.output_dir / f"PixelForge_Export_{int(time.time())}.zip"
            report = {
                "app": "PixelForge Studio",
                "export_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_exported": len(successful_paths),
                "items": [
                    {
                        "filename": item.filename,
                        "output": Path(item.output_path).name,
                        "scale": 4,
                        "dimensions": item.output_dimensions,
                    }
                    for item in queue_manager.items if item.status == ItemStatus.COMPLETED
                ],
            }
            ArchiveService.create_batch_zip(zip_dest, successful_paths, batch_report=report)
            return str(zip_dest)

        btn_export_zip.click(export_zip, outputs=[zip_download_file])

        btn_refresh_diag.click(get_system_summary, outputs=[sys_summary_text])

    return demo


if __name__ == "__main__":
    print("====================================================================")
    print("      PIXELFORGE STUDIO -- PRIVATE LOCAL AI PHOTO ENHANCER")
    print("====================================================================")
    print(f"Host: {APP_CONFIG.get('host', '127.0.0.1')}")
    print(f"Port: {APP_CONFIG.get('port', 7860)}")
    print("Local Only: 100% Offline, Tanpa Telemetry, Tanpa API Berbayar.")
    print("====================================================================")

    app = build_app()
    app.launch(
        server_name=APP_CONFIG.get("host", "127.0.0.1"),
        server_port=APP_CONFIG.get("port", 7860),
        share=False,
    )
