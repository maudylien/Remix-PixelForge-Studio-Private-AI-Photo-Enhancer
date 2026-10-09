import React from 'react';
import {
  Cpu, HardDrive, ShieldCheck, CheckCircle2, AlertTriangle,
  Zap, Info, Terminal, RefreshCw, Layers, Check
} from 'lucide-react';

interface HardwareDiagnosticsProps {
  isIndonesian: boolean;
}

export const HardwareDiagnostics: React.FC<HardwareDiagnosticsProps> = ({ isIndonesian }) => {
  return (
    <div className="space-y-6">
      {/* 1. STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Windows & Python Compatibility */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">
              {isIndonesian ? 'Sistem Operasi & Python' : 'OS & Python Environment'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              KOMPATIBEL
            </span>
          </div>
          <div className="text-sm font-bold text-neutral-100 font-mono">
            Windows 10 / 11 (64-bit)
          </div>
          <div className="text-xs text-neutral-400 space-y-0.5 font-mono text-[11px]">
            <div>• Target Python: Python 3.10 atau 3.11 (64-bit)</div>
            <div>• Virtual Environment: venv (terisolasi otomatis)</div>
            <div>• Terminal: CMD / PowerShell / Windows Terminal</div>
          </div>
        </div>

        {/* Vulkan GPU Acceleration */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">
              {isIndonesian ? 'Akselerasi Perangkat Keras' : 'Hardware Acceleration'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              VULKAN READY
            </span>
          </div>
          <div className="text-sm font-bold text-neutral-100 font-mono">
            Vulkan 1.2+ API
          </div>
          <div className="text-xs text-neutral-400 space-y-0.5 font-mono text-[11px]">
            <div>• NVIDIA: GeForce GTX 900+ / RTX 20/30/40 series</div>
            <div>• AMD: Radeon RX 400+ / Vega / RDNA series</div>
            <div>• Intel: Arc / Iris Xe / UHD Graphics 620+</div>
          </div>
        </div>

        {/* Local Security & Privacy */}
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">
              {isIndonesian ? 'Privasi & Keamanan Data' : 'Privacy & Offline Guarantee'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% PRIVATE
            </span>
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            Localhost 127.0.0.1
          </div>
          <div className="text-xs text-neutral-400 space-y-0.5 font-mono text-[11px]">
            <div>• Tidak ada upload foto ke internet</div>
            <div>• Bebas biaya langganan / tanpa API key</div>
            <div>• Foto asli tidak akan pernah ditimpa</div>
          </div>
        </div>
      </div>

      {/* 2. ENGINE & MODEL INTEGRITY AUDIT */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>
            {isIndonesian ? 'Status Model & Executable AI Resmi' : 'Official AI Engine & Models Status'}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 font-mono">realesrgan-ncnn-vulkan.exe</span>
              <span className="text-emerald-400 font-mono text-[11px] font-bold">Resmi xinntao v0.1.0</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Binary resmi Real-ESRGAN NCNN Vulkan portabel. Menjalankan inferensi AI secara langsung menggunakan instruksi GPU tanpa overhead Python interpreter.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 font-mono">realesrgan-x4plus (.param & .bin)</span>
              <span className="text-amber-400 font-mono text-[11px] font-bold">Model Utama (4x)</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Model pembobotan neural network resmi untuk perbesaran foto umum, wajah manusia, dan tekstur beresolusi ultra-tinggi.
            </p>
          </div>
        </div>
      </div>

      {/* 3. TROUBLESHOOTING & COMMON PITFALLS */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center space-x-2">
          <Info className="w-4 h-4 text-sky-400" />
          <span>
            {isIndonesian ? 'Panduan Diagnostik & Solusi Kesalahan Umum' : 'Diagnostics & Troubleshooting FAQ'}
          </span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80">
            <div className="font-semibold text-amber-300 mb-1">
              {isIndonesian ? '1. VRAM GPU Penuh (Out of Memory saat memproses foto resolusi besar)' : '1. GPU Out of Memory (OOM on ultra-large photos)'}
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              {isIndonesian
                ? 'Solusi: Buka menu "Opsi Lanjutan Engine" di tab Ruang Kerja, lalu atur Tile Size ke 200 atau 400. Fitur tile membagi gambar menjadi kotak-kotak kecil saat inferensi dan menyatukannya kembali secara presisi, menghemat pemakaian memori VRAM.'
                : 'Solution: Set Tile Size to 200 or 400 in the Advanced Settings panel. Tiling splits the image into smaller patches during inference to prevent GPU memory exhaustion.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80">
            <div className="font-semibold text-amber-300 mb-1">
              {isIndonesian ? '2. Error VCRUNTIME140.dll / MSVCP140.dll Hilang' : '2. Missing VCRUNTIME140.dll'}
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              {isIndonesian
                ? 'Solusi: Instal Visual C++ 2015-2022 Redistributable (x64) gratis dari Microsoft melalui tautan resmi: https://aka.ms/vs/17/release/vc_redist.x64.exe'
                : 'Solution: Install the Visual C++ Redistributable (x64) from official Microsoft link: https://aka.ms/vs/17/release/vc_redist.x64.exe'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-800/80">
            <div className="font-semibold text-amber-300 mb-1">
              {isIndonesian ? '3. Modul Restorasi Wajah GFPGAN (Opsional)' : '3. Optional GFPGAN Face Restoration'}
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              {isIndonesian
                ? 'Modul restorasi wajah diperlakukan sebagai komponen opsional agar tidak membebani instalasi dasar. Untuk memasangnya di lingkungan venv Anda: jalankan "pip install torch torchvision" dan "pip install gfpgan".'
                : 'Face restoration is modular. You can enable deep GFPGAN by running "pip install torch torchvision gfpgan" inside your venv.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
