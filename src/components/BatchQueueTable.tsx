import React, { useState } from 'react';
import {
  Download, RotateCw, Trash2, CheckCircle2, Clock, AlertTriangle,
  FileCheck, ShieldAlert, ArrowUpRight, Search
} from 'lucide-react';
import { BatchItem, ItemStatus } from '../types';
import { exportBatchImagesZip } from '../services/packageGenerator';

interface BatchQueueTableProps {
  items: BatchItem[];
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  onRetryFailed: () => void;
  onClearCompleted: () => void;
  isIndonesian: boolean;
  onSelectViewerItem: (item: BatchItem) => void;
}

export const BatchQueueTable: React.FC<BatchQueueTableProps> = ({
  items,
  setItems,
  onRetryFailed,
  onClearCompleted,
  isIndonesian,
  onSelectViewerItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExportingZip, setIsExportingZip] = useState(false);

  const completedItems = items.filter((it) => it.status === 'Completed');
  const failedItems = items.filter((it) => it.status === 'Failed');
  const waitingItems = items.filter((it) => it.status === 'Waiting');
  const totalDuration = completedItems.reduce((acc, it) => acc + (it.durationSeconds || 0), 0);

  const handleExportZip = async () => {
    if (completedItems.length === 0) return;
    setIsExportingZip(true);
    try {
      const blob = await exportBatchImagesZip(items, 'PixelForge_Batch_Enhanced');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PixelForge_Batch_Export_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleRemoveSingle = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch = it.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || it.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>{isIndonesian ? 'Total Foto' : 'Total Items'}</span>
            <FileCheck className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">{items.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {waitingItems.length} {isIndonesian ? 'dalam antrean' : 'in queue'}
          </div>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span>{isIndonesian ? 'Berhasil Selesai' : 'Completed'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{completedItems.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0}% {isIndonesian ? 'rasio sukses' : 'success rate'}
          </div>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between text-red-400 text-xs mb-1">
            <span>{isIndonesian ? 'Gagal' : 'Failed'}</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{failedItems.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {failedItems.length > 0 ? (isIndonesian ? 'Dapat diulang' : 'Can retry') : (isIndonesian ? 'Tidak ada kegagalan' : 'No errors')}
          </div>
        </div>

        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
            <span>{isIndonesian ? 'Total Durasi' : 'Total Duration'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{totalDuration.toFixed(1)}s</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {completedItems.length > 0 ? (totalDuration / completedItems.length).toFixed(2) : '0.00'}s / {isIndonesian ? 'foto' : 'image'}
          </div>
        </div>
      </div>

      {/* 2. TABLE TOOLBAR */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search & Status Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isIndonesian ? 'Cari nama file...' : 'Search filename...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300"
            >
              <option value="all">{isIndonesian ? 'Semua Status' : 'All Status'}</option>
              <option value="Waiting">Waiting</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {failedItems.length > 0 && (
              <button
                onClick={onRetryFailed}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition flex items-center space-x-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isIndonesian ? 'Ulangi yang Gagal' : 'Retry Failed'}</span>
              </button>
            )}

            {completedItems.length > 0 && (
              <button
                onClick={onClearCompleted}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-400 hover:text-neutral-200 transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isIndonesian ? 'Hapus yang Selesai' : 'Clear Completed'}</span>
              </button>
            )}

            <button
              onClick={handleExportZip}
              disabled={completedItems.length === 0 || isExportingZip}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExportingZip
                  ? (isIndonesian ? 'Mengompresi ZIP...' : 'Compressing ZIP...')
                  : (isIndonesian ? `📦 Ekspor ZIP (${completedItems.length} Foto)` : `📦 Export ZIP (${completedItems.length})`)}
              </span>
            </button>
          </div>
        </div>

        {/* 3. TABLE */}
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Pratinjau</th>
                <th className="py-2.5 px-3">Nama Berkas</th>
                <th className="py-2.5 px-3">Dimensi Asli</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Dimensi Hasil</th>
                <th className="py-2.5 px-3">Ukuran File</th>
                <th className="py-2.5 px-3">Durasi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500 font-sans">
                    {isIndonesian ? 'Tidak ada data foto yang cocok.' : 'No matching photos found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-800/30 transition group"
                  >
                    <td className="py-2 px-3">
                      <div
                        onClick={() => onSelectViewerItem(item)}
                        className="w-10 h-10 rounded overflow-hidden bg-neutral-900 border border-neutral-800 cursor-pointer shrink-0"
                      >
                        <img
                          src={item.outputDataUrl || item.originalDataUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 font-sans font-medium text-neutral-200 truncate max-w-[200px]" title={item.filename}>
                      {item.filename}
                    </td>
                    <td className="py-2 px-3 text-neutral-400">
                      {item.originalWidth} x {item.originalHeight}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'Processing'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : item.status === 'Failed'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-emerald-400">
                      {item.outputWidth ? `${item.outputWidth} x ${item.outputHeight}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-neutral-400">
                      {item.outputFileSizeKb ? (
                        <span>{item.outputFileSizeKb} KB</span>
                      ) : (
                        <span>{item.fileSizeKb} KB</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-neutral-400">
                      {item.durationSeconds ? `${item.durationSeconds.toFixed(2)}s` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectViewerItem(item)}
                          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition cursor-pointer"
                          title="Inspeksi Sebelum & Sesudah"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSingle(item.id)}
                          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
