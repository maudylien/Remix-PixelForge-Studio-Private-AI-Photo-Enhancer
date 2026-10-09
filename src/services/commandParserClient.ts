import { CommandParseResult, ProcessingSettings } from '../types';

export function parseNaturalLanguageCommand(
  text: string,
  _currentSettings: ProcessingSettings,
  isIndonesian: boolean = true
): CommandParseResult {
  const normalized = text.toLowerCase().trim();
  const mods: Partial<ProcessingSettings> = {};
  const explanations: string[] = [];

  // 1. Scale detection
  if (/\b(8x|delapan kali|8 kali|eight times)\b/i.test(normalized)) {
    mods.scale = 8;
    explanations.push(isIndonesian ? 'Skala AI diatur ke 8x (Multi-pass pipeline)' : 'AI scale set to 8x (Multi-pass pipeline)');
  } else if (/\b(4x|empat kali|4 kali|four times)\b/i.test(normalized)) {
    mods.scale = 4;
    explanations.push(isIndonesian ? 'Skala AI diatur ke 4x (Resolusi tinggi)' : 'AI scale set to 4x (High resolution)');
  } else if (/\b(2x|dua kali|2 kali|two times)\b/i.test(normalized)) {
    mods.scale = 2;
    explanations.push(isIndonesian ? 'Skala AI diatur ke 2x (Optimal Lanczos)' : 'AI scale set to 2x (Optimal Lanczos)');
  }

  // 2. Model selection
  if (/\b(anime|kartun|animasi|manga|cartoon|illustration)\b/i.test(normalized)) {
    mods.modelName = 'realesrgan-x4plus-anime';
    explanations.push(isIndonesian ? "Model AI diubah ke 'realesrgan-x4plus-anime' untuk ilustrasi/kartun" : "Model switched to 'realesrgan-x4plus-anime' for 2D art");
  } else if (/\b(realesrnet|halus|smooth|tanpa artefak)\b/i.test(normalized)) {
    mods.modelName = 'realesrnet-x4plus';
    explanations.push(isIndonesian ? "Model AI diubah ke 'realesrnet-x4plus' (Restorasi tekstur halus)" : "Model switched to 'realesrnet-x4plus' (Smooth texture)");
  } else if (/\b(foto biasa|general photo|default model|x4plus)\b/i.test(normalized)) {
    mods.modelName = 'realesrgan-x4plus';
    explanations.push(isIndonesian ? "Model AI diubah ke 'realesrgan-x4plus' (Standar fotografi)" : "Model switched to 'realesrgan-x4plus' (Photo default)");
  }

  // 3. Face restoration
  if (/\b(wajah|portrait|face|potret|muka|natural face)\b/i.test(normalized)) {
    mods.faceRestorationEnabled = true;
    mods.faceStrength = 0.6;
    explanations.push(isIndonesian ? 'Modul restorasi wajah diaktifkan (GFPGAN level 0.6 natural)' : 'Face restoration enabled (GFPGAN level 0.6 natural)');
  }

  if (/\b(prioritaskan kualitas wajah|restorasi penuh|wajah tajam|deep face)\b/i.test(normalized)) {
    mods.faceRestorationEnabled = true;
    mods.faceStrength = 0.8;
    explanations.push(isIndonesian ? 'Kekuatan restorasi wajah ditingkatkan ke 0.8' : 'Face restoration strength boosted to 0.8');
  }

  // 4. Output format & Quality
  if (/\b(webp|kompresi webp)\b/i.test(normalized)) {
    mods.outputFormat = 'WEBP';
    explanations.push(isIndonesian ? 'Format keluaran diubah ke WebP' : 'Output format set to WebP');
    const qMatch = normalized.match(/(?:kualitas|quality)\s*(\d{2,3})/);
    if (qMatch) {
      const q = Math.max(50, Math.min(100, parseInt(qMatch[1], 10)));
      mods.webpQuality = q;
      explanations.push(isIndonesian ? `Kualitas WebP diatur ke ${q}%` : `WebP quality set to ${q}%`);
    }
  } else if (/\b(png|tanpa kompresi|lossless)\b/i.test(normalized)) {
    mods.outputFormat = 'PNG';
    explanations.push(isIndonesian ? 'Format keluaran diubah ke PNG (Lossless)' : 'Output format set to PNG (Lossless)');
  } else if (/\b(jpg|jpeg)\b/i.test(normalized)) {
    mods.outputFormat = 'JPG';
    explanations.push(isIndonesian ? 'Format keluaran diubah ke JPG' : 'Output format set to JPG');
    const qMatch = normalized.match(/(?:kualitas|quality)\s*(\d{2,3})/);
    if (qMatch) {
      const q = Math.max(50, Math.min(100, parseInt(qMatch[1], 10)));
      mods.jpegQuality = q;
      explanations.push(isIndonesian ? `Kualitas JPEG diatur ke ${q}%` : `JPEG quality set to ${q}%`);
    }
  }

  // 5. Filename prefix and suffix
  const prefixMatch = normalized.match(/(?:awalan|prefix)\s+([a-zA-Z0-9_\-]+)/);
  if (prefixMatch) {
    mods.filenamePrefix = prefixMatch[1];
    explanations.push(isIndonesian ? `Awalan berkas ditambahkan: '${prefixMatch[1]}'` : `Filename prefix set to '${prefixMatch[1]}'`);
  }

  const suffixMatch = normalized.match(/(?:akhiran|suffix)\s+([a-zA-Z0-9_\-]+)/);
  if (suffixMatch) {
    mods.filenameSuffix = suffixMatch[1];
    explanations.push(isIndonesian ? `Akhiran berkas diatur: '${suffixMatch[1]}'` : `Filename suffix set to '${suffixMatch[1]}'`);
  }

  // 6. Visual Adjustments (Sharpness, brightness, denoise)
  if (/\b(lebih tajam|pertajam|tajam|sharpen|sharpness|sharper|sharp|crisp)\b/i.test(normalized)) {
    mods.sharpness = 1.25;
    explanations.push(isIndonesian ? 'Ketajaman gambar ditingkatkan ke 1.25x' : 'Sharpness increased to 1.25x');
  }

  if (/\b(lebih terang|cerahkan|brighten|brightness)\b/i.test(normalized)) {
    mods.brightness = 1.1;
    explanations.push(isIndonesian ? 'Kecerahan gambar ditingkatkan ke 1.1x' : 'Brightness boosted to 1.1x');
  }

  if (/\b(denoise|hilangkan noise|kurangi bintik)\b/i.test(normalized)) {
    mods.denoise = 0.25;
    explanations.push(isIndonesian ? 'Filter reduksi noise diaktifkan (level 0.25)' : 'Noise reduction filter enabled (level 0.25)');
  }

  if (Object.keys(mods).length === 0) {
    return {
      understood: false,
      rawText: text,
      summary: isIndonesian
        ? 'Perintah belum dikenali. Contoh: "Perbesar semua foto menjadi 4x, prioritaskan kualitas wajah natural, simpan sebagai JPG 95, masukkan ke ZIP"'
        : 'Instruction not recognized. Try: "Upscale 4x with natural portrait quality, save as JPG 95, and export to ZIP"',
      explanations: [],
      proposedModifications: {},
    };
  }

  return {
    understood: true,
    rawText: text,
    summary: explanations.join(' • '),
    explanations,
    proposedModifications: mods,
  };
}
