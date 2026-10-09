export type ItemStatus = 'Waiting' | 'Preparing' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

export type SupportedModel = 'realesrgan-x4plus' | 'realesrnet-x4plus' | 'realesrgan-x4plus-anime' | 'realesr-animevideov3';

export type OutputFormat = 'JPG' | 'PNG' | 'WEBP';

export interface BatchItem {
  id: string;
  filename: string;
  fileSizeKb: number;
  originalWidth: number;
  originalHeight: number;
  originalDataUrl: string;
  status: ItemStatus;
  outputWidth?: number;
  outputHeight?: number;
  outputDataUrl?: string;
  outputFileSizeKb?: number;
  durationSeconds?: number;
  errorMessage?: string;
  fileHash: string;
  category?: 'portrait' | 'landscape' | 'vintage' | 'anime' | 'custom';
}

export interface ProcessingSettings {
  modelName: SupportedModel;
  scale: 2 | 4 | 8;
  tileSize: number;
  gpuId: number;
  brightness: number; // 0.5 - 1.5 (default 1.0)
  contrast: number;   // 0.5 - 1.5 (default 1.0)
  saturation: number; // 0.0 - 2.0 (default 1.0)
  sharpness: number;  // 0.5 - 2.0 (default 1.0)
  denoise: number;    // 0.0 - 1.0 (default 0.0)
  faceRestorationEnabled: boolean;
  faceStrength: number; // 0.0 - 1.0 (default 0.6)
  outputFormat: OutputFormat;
  jpegQuality: number; // 60 - 100 (default 95)
  webpQuality: number; // 60 - 100 (default 90)
  filenamePrefix: string;
  filenameSuffix: string;
  preserveMetadata: boolean;
  autoOrientExif: boolean;
  stripGps: boolean;
}

export interface Preset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  settings: Partial<ProcessingSettings>;
  iconName: string;
}

export interface CommandParseResult {
  understood: boolean;
  rawText: string;
  summary: string;
  explanations: string[];
  proposedModifications: Partial<ProcessingSettings>;
}
