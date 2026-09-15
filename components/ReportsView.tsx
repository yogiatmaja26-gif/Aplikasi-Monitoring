'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  TrendingUp, 
  ShoppingCart, 
  Wrench, 
  DollarSign, 
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { formatRupiah, formatNumber } from '@/lib/utils';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'procurement' | 'installation' | 'master'>('procurement');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const endpoint = reportType === 'installation' 
        ? '/api/reports/installation' 
        : '/api/reports/procurement';
      const res = await fetch(endpoint);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const items = data?.items || [];
  const summary = data?.summary || {};

  const filteredItems = items.filter((item: any) => {
    return (
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.vendor && item.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header & Report Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Pusat Laporan & Ekspor Dokumen Konstruksi</span>
            </h2>
            <p className="text-xs text-slate-500">
              Laporan realisasi anggaran PO, pengawasan uang muka (DP), dan opname progres fisik material terpasang.
            </p>
          </div>

          <a
            href={`/api/reports/export?type=${reportType}`}
            download
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan Excel (.xlsx)</span>
          </a>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="flex space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setReportType('procurement')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'procurement'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>Laporan Realisasi Pengadaan & Uang Muka</span>
          </button>

          <button
            onClick={() => setReportType('installation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              reportType === 'installation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span>Laporan Opname Progres Pemasangan Fisik</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {reportType === 'procurement' && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Total Anggaran RAP</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-1">{formatRupiah(summary.total_rap)}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Realisasi PO</span>
            <div className="text-sm sm:text-base font-bold text-amber-700 mt-1">{formatRupiah(summary.total_actual)}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Efisiensi / Varian</span>
            <div className={`text-sm sm:text-base font-bold mt-1 ${summary.total_variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRupiah(summary.total_variance)}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Total Terbayar / DP</span>
            <div className="text-sm sm:text-base font-bold text-emerald-700 mt-1">{formatRupiah(summary.total_paid)}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Sisa Tagihan / Hutang</span>
            <div className="text-sm sm:text-base font-bold text-rose-600 mt-1">{formatRupiah(summary.total_remaining_payment)}</div>
          </div>
        </div>
      )}

      {reportType === 'installation' && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Total Volume Rencana</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">{formatNumber(summary.total_planned_volume)} Unit/M2</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Volume Tiba di Proyek</span>
            <div className="text-base sm:text-lg font-bold text-blue-700 mt-1">{formatNumber(summary.total_received_volume)} Unit/M2</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Volume Terpasang</span>
            <div className="text-base sm:text-lg font-bold text-emerald-700 mt-1">{formatNumber(summary.total_installed_volume)} Unit/M2</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Rata-Rata Progres Fisik</span>
            <div className="text-base sm:text-lg font-extrabold text-indigo-700 mt-1">{summary.overall_installation_progress}%</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        <input
          type="text"
          placeholder="Filter data laporan berdasarkan kode, nama material, kategori, vendor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
        />
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          {reportType === 'procurement' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-2 text-center border-r border-slate-800 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Kode & Material</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Kategori</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Vendor</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">Vol RAP / Beli</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Total RAP</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Realisasi Beli</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Varian Anggaran</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Total DP</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Terbayar</th>
                  <th className="py-2.5 px-3 text-right">Sisa Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={11} className="py-8 text-center text-slate-400">Menyusun laporan pengadaan...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={11} className="py-8 text-center text-slate-400">Tidak ada data.</td></tr>
                ) : (
                  filteredItems.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-amber-50/40">
                      <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-100">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-100">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-600">{item.category}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-700 font-medium">{item.vendor || '-'}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-center">
                        <span className="font-bold">{formatNumber(item.purchased_quantity)}</span> / {item.planned_quantity} {item.unit}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-mono text-slate-900">
                        {formatRupiah(item.rap_total_price)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-mono font-bold text-amber-700">
                        {formatRupiah(item.actual_total_cost)}
                      </td>
                      <td className={`py-2 px-3 border-r border-slate-100 text-right font-mono font-semibold ${item.budget_variance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatRupiah(item.budget_variance)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-mono text-amber-700">
                        {formatRupiah(item.dp_amount)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-mono text-emerald-700">
                        {formatRupiah(item.paid_amount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-rose-600">
                        {formatRupiah(item.remaining_payment)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-2 text-center border-r border-slate-800 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Kode & Material</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Kategori</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Titik Pasang</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Vol Rencana</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Vol Tiba Proyek</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Vol Terpasang</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-right">Sisa Belum Pasang</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">Progres Fisik</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">Menyusun laporan pemasangan...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">Tidak ada data.</td></tr>
                ) : (
                  filteredItems.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40">
                      <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-100">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-100">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-600">{item.category}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-700">{item.location || 'Site Proyek'}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-bold">{formatNumber(item.planned_quantity)} {item.unit}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right text-blue-700 font-semibold">{formatNumber(item.received_quantity)} {item.unit}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right text-emerald-700 font-bold">{formatNumber(item.installed_quantity)} {item.unit}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right text-indigo-700">{formatNumber(item.remaining_to_install)} {item.unit}</td>
                      <td className="py-2 px-3 border-r border-slate-100 text-center">
                        <div className="font-bold text-slate-900">{item.progress_percentage}%</div>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${item.progress_percentage}%` }}></div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.installation_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
