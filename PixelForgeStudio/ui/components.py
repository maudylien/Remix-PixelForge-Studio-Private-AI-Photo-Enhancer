"""
PixelForge Studio - UI Helpers & Preset Definitions
Menyediakan preset bawaan yang dapat dikustomisasi, helper format, dan generator status.
"""

from typing import Dict, Any

BUILTIN_PRESETS: Dict[str, Dict[str, Any]] = {
    "Natural Photo Enhancement": {
        "scale": 4,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.0,
        "contrast": 1.02,
        "saturation": 1.0,
        "sharpness": 1.05,
        "denoise": 0.05,
        "output_format": "JPG",
        "jpeg_quality": 95,
        "face_restoration": True,
        "face_strength": 0.5,
    },
    "Portrait Enhancement": {
        "scale": 4,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.02,
        "contrast": 1.0,
        "saturation": 1.03,
        "sharpness": 1.0,
        "denoise": 0.1,
        "output_format": "JPG",
        "jpeg_quality": 98,
        "face_restoration": True,
        "face_strength": 0.7,
    },
    "Low-Resolution Photo Restoration": {
        "scale": 4,
        "model_name": "realesrnet-x4plus",
        "brightness": 1.05,
        "contrast": 1.08,
        "saturation": 1.02,
        "sharpness": 1.15,
        "denoise": 0.25,
        "output_format": "PNG",
        "face_restoration": True,
        "face_strength": 0.65,
    },
    "General 4x Upscaling": {
        "scale": 4,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "sharpness": 1.0,
        "denoise": 0.0,
        "output_format": "PNG",
        "face_restoration": False,
        "face_strength": 0.0,
    },
    "Gentle Sharpening (2x)": {
        "scale": 2,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "sharpness": 1.1,
        "denoise": 0.0,
        "output_format": "JPG",
        "jpeg_quality": 95,
        "face_restoration": False,
        "face_strength": 0.0,
    },
    "High-Quality JPG Export": {
        "scale": 4,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "sharpness": 1.0,
        "denoise": 0.0,
        "output_format": "JPG",
        "jpeg_quality": 100,
        "face_restoration": False,
        "face_strength": 0.0,
    },
    "Small WebP Export": {
        "scale": 2,
        "model_name": "realesrgan-x4plus",
        "brightness": 1.0,
        "contrast": 1.0,
        "saturation": 1.0,
        "sharpness": 1.0,
        "denoise": 0.0,
        "output_format": "WEBP",
        "webp_quality": 85,
        "face_restoration": False,
        "face_strength": 0.0,
    },
}


def get_preset_list() -> list:
    return list(BUILTIN_PRESETS.keys())


def load_preset_values(preset_name: str) -> Dict[str, Any]:
    return BUILTIN_PRESETS.get(preset_name, BUILTIN_PRESETS["Natural Photo Enhancement"]).copy()
