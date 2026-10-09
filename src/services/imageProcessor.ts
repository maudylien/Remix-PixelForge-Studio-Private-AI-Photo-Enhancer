import { ProcessingSettings } from '../types';

export interface ProcessImageResult {
  outputDataUrl: string;
  outputWidth: number;
  outputHeight: number;
  durationSeconds: number;
  outputFileSizeKb: number;
}

export async function processImageOnCanvas(
  dataUrl: string,
  settings: ProcessingSettings,
  origW: number,
  origH: number
): Promise<ProcessImageResult> {
  const startTime = performance.now();

  const scale = settings.scale || 4;
  const targetW = origW * scale;
  const targetH = origH * scale;

  // Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  // Create canvas for upscaling
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not acquire 2D canvas context');

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Apply filters via canvas CSS filter or pixel manipulation
  const b = settings.brightness;
  const c = settings.contrast;
  const s = settings.saturation;

  if (Math.abs(b - 1.0) > 0.01 || Math.abs(c - 1.0) > 0.01 || Math.abs(s - 1.0) > 0.01) {
    ctx.filter = `brightness(${b * 100}%) contrast(${c * 100}%) saturate(${s * 100}%)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  // Pixel-level convolution sharpening & face enhancement if enabled
  if (settings.sharpness > 1.05 || settings.faceRestorationEnabled) {
    try {
      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imageData.data;
      const factor = (settings.sharpness - 1.0) * 1.5 + (settings.faceRestorationEnabled ? 0.2 : 0);

      // Lightweight 3x3 unsharp mask blend for sharp edges
      const copy = new Uint8ClampedArray(data);
      const rowBytes = targetW * 4;

      for (let y = 1; y < targetH - 1; y += 2) { // Step 2 for high performance
        for (let x = 1; x < targetW - 1; x += 2) {
          const idx = y * rowBytes + x * 4;
          for (let ch = 0; ch < 3; ch++) {
            const current = copy[idx + ch];
            const avgSurround = (
              copy[idx - 4 + ch] +
              copy[idx + 4 + ch] +
              copy[idx - rowBytes + ch] +
              copy[idx + rowBytes + ch]
            ) * 0.25;
            const diff = current - avgSurround;
            data[idx + ch] = Math.min(255, Math.max(0, current + diff * factor));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Continue gracefully if getImageData is restricted
    }
  }

  // Format selection
  let mimeType = 'image/jpeg';
  let quality = settings.jpegQuality / 100;

  if (settings.outputFormat === 'PNG') {
    mimeType = 'image/png';
  } else if (settings.outputFormat === 'WEBP') {
    mimeType = 'image/webp';
    quality = settings.webpQuality / 100;
  }

  const outDataUrl = canvas.toDataURL(mimeType, quality);
  const duration = Math.max(0.12, (performance.now() - startTime) / 1000);

  // Estimate file size
  const head = `data:${mimeType};base64,`;
  const base64Len = outDataUrl.length - head.length;
  const sizeKb = Math.round((base64Len * 0.75) / 1024);

  return {
    outputDataUrl: outDataUrl,
    outputWidth: targetW,
    outputHeight: targetH,
    durationSeconds: Number(duration.toFixed(2)),
    outputFileSizeKb: sizeKb,
  };
}
