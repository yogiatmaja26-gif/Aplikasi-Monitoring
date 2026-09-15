'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Database, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  FileCheck,
  Building2
} from 'lucide-react';
import { formatRupiah, formatNumber } from '@/lib/utils';

interface ExcelImportViewProps {
  onRefreshAll: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({
  onRefreshAll,
  onNavigateTab,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Trigger import of default Excel file: RAP - Kamar - Samara copy.xlsx
  const handleImportDefaultFile = async () => {
    setLoading(true);
    setStatusMessage('Membaca dan memproses file Excel "RAP - Kamar - Samara copy.xlsx"...');
    setErrorMessage(null);
    setImportResult(null);

    try {
      const res = await fetch('/api/import/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: 'RAP - Kamar - Samara copy.xlsx',
          sheetName: 'RAP Kamar Samara',
          projectId: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses file Excel.');
      }

      setImportResult(data);
      setStatusMessage('Impor Excel berhasil! Database telah diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengimpor Excel.');
    } finally {
      setLoading(false);
    }
  };

  // Custom file upload and import
  const handleUploadCustomFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Mengunggah file "${file.name}"...`);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to server
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      setStatusMessage('Mem-parsing data sheet dan memetakan struktur RAP...');

      // Import from uploaded path
      const importRes = await fetch('/api/import/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadData.file_path,
          projectId: 1,
        }),
      });

      const importData = await importRes.json();
      if (!importRes.ok) throw new Error(importData.error || 'Import failed');

      setImportResult(importData);
      setStatusMessage('Impor Excel berhasil! Database telah diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title & Info Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Modul Impor RAP dari Spreadsheet Excel
            </h1>
            <p className="text-xs text-slate-500">
              Sinkronisasi data master RAP material langsung dari template file RAB/RAP proyek ke dalam database sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Main Import Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source File Card (Default Project RAP) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                File RAP Default Proyek
              </span>
              <span className="text-[11px] text-slate-400">Tersimpan di Workspace</span>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <FileCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">RAP - Kamar - Samara copy.xlsx</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sheet: <b>RAP Kamar Samara</b> & <b>Ringkasan Eksekutif</b>
                </div>
                <div className="text-[11px] text-slate-500">
                  Total Item: 22 item material lengkap dengan volume, harga satuan & total RAP.
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 mt-4 space-y-2">
              <div className="font-semibold text-slate-800">Aturan Pemetaan Otomatis:</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                <li>Kolom <b>Uraian Pekerjaan</b> dipetakan sebagai Nama Material & Kategori.</li>
                <li>Kolom <b>Satuan</b>, <b>Volume</b>, dan <b>Harga Satuan</b> diekstrak ke angka numerik terformat.</li>
                <li>Total RAP dihitung otomatis: <code className="bg-slate-100 px-1 rounded">Volume × Harga Satuan</code>.</li>
                <li>Kategori pekerjaan dikelompokkan otomatis (Pekerjaan Dinding, Lantai, Plafon, dll).</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleImportDefaultFile}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition disabled:opacity-50 text-xs shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sedang Memproses...' : 'Sinkronisasi RAP Default ke Database'}</span>
          </button>
        </div>

        {/* Upload Custom File Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Unggah File Excel Baru
              </span>
              <span className="text-[11px] text-slate-400">Format .xlsx / .xls</span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Gunakan opsi ini jika Anda memiliki file revisi Addendum RAP atau file proyek kamar lain yang ingin diimpor.
            </p>

            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/40">
              <Upload className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-xs font-bold text-slate-800">Klik untuk memilih file Excel</span>
              <span className="text-[11px] text-slate-400 mt-1">atau seret dan lepas file di sini (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleUploadCustomFile}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
            <b>Catatan Penting:</b> Format header kolom Excel yang disarankan:
            <br />
            <code>No | Kategori | Uraian Material | Satuan | Volume | Harga Satuan | Total</code>
          </div>
        </div>
      </div>

      {/* Progress & Error States */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-semibold">{statusMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Import Results Summary Card */}
      {importResult && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Ringkasan Hasil Eksekusi Impor Database</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Status: Sukses
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500">Material Diimpor</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{importResult.imported_count || 0}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500">Kategori Pekerjaan</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{importResult.categories_count || 0}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500">Vendor Teridentifikasi</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{importResult.vendors_count || 0}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
              <div className="text-xs text-emerald-700">Total Anggaran RAP</div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-800 mt-1">
                {formatRupiah(importResult.total_rap_budget || 0)}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onNavigateTab('materials')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
            >
              <span>Buka Katalog Material RAP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
