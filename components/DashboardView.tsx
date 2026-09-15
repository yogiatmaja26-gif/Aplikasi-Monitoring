'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  DollarSign, 
  ShoppingCart, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { DashboardSummary, Material } from '@/lib/types';
import { formatRupiah, formatNumber } from '@/lib/utils';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onSelectMaterial: (materialId: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  loading,
  onSelectMaterial,
  onNavigateTab,
}) => {
  if (loading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Memuat data Dashboard & RAP Control...</p>
      </div>
    );
  }

  const budgetVariance = summary.total_rap_budget - summary.total_actual_purchase;
  const isOverBudget = budgetVariance < 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Project Overview */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Proyek Aktif
            </span>
            <span className="text-xs text-slate-400">• Cluster Samara Residence Blok B2/14</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Renovasi Interior Kamar Tidur Samara
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kontrol pengadaan, penerimaan gudang lapangan, pemasangan fisik, dan monitoring anggaran real-time.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('materials')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog RAP</span>
          </button>
          <button
            onClick={() => onNavigateTab('procurement')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-semibold hover:bg-amber-400 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Catat Pengadaan</span>
          </button>
        </div>
      </div>

      {/* Primary Financial & Physical KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: RAP Total Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Anggaran RAP</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatRupiah(summary.total_rap_budget)}
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
              <span>{summary.total_material_items} item material terdaftar</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Realized Purchases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Realisasi Pembelian</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {formatRupiah(summary.total_actual_purchase)}
            </div>
            <div className="flex items-center space-x-1.5 text-xs mt-1">
              <span className={`font-semibold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isOverBudget ? 'Melebihi RAP' : 'Sisa RAP'}: {formatRupiah(Math.abs(budgetVariance))}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: DP & Paid Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Uang Muka & Terbayar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
              {formatRupiah(summary.total_paid)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Total DP: {formatRupiah(summary.total_dp)}</span>
              <span className="text-rose-600 font-medium">Hutang: {formatRupiah(summary.total_outstanding_payment)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Overall Installation Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progres Fisik Terpasang</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-700">
                {summary.installation_progress_percentage}%
              </span>
              <span className="text-xs text-slate-500">
                ({summary.total_installed_items} item tuntas)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.installation_progress_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: RAP vs Actual by Category + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Comparison Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Anggaran RAP vs Realisasi per Kategori Pekerjaan
              </h2>
              <p className="text-xs text-slate-500">Perbandingan biaya rencana dengan aktual PO vendor</p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.rap_vs_actual_by_category}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis 
                  dataKey="category_name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp${val / 1000000}M`}
                />
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="rap_budget" name="Anggaran RAP" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_spent" name="Realisasi Beli" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Status Distributions (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
              Distribusi Status Material
            </h2>
            <p className="text-xs text-slate-500 mb-4">Ringkasan status pengadaan & fisik</p>
          </div>

          <div className="space-y-4">
            {/* Procurement Status Bars */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Pengadaan (PO/Beli)</span>
                <span>{summary.total_purchased_items} / {summary.total_material_items} Selesai</span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                {summary.status_distributions.procurement.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${(item.value / (summary.total_material_items || 1)) * 100}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${item.value}`}
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>Belum ({summary.status_distributions.procurement[0]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>DP ({summary.status_distributions.procurement[1]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Lunas ({summary.status_distributions.procurement[2]?.value || 0})</span>
                </span>
              </div>
            </div>

            {/* Receiving Status Bars */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Penerimaan di Proyek</span>
                <span>{summary.total_fully_received_items} / {summary.total_material_items} Selesai</span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                {summary.status_distributions.receiving.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${(item.value / (summary.total_material_items || 1)) * 100}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${item.value}`}
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                  <span>Belum ({summary.status_distributions.receiving[0]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                  <span>Sebagian ({summary.status_distributions.receiving[1]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  <span>Lengkap ({summary.status_distributions.receiving[2]?.value || 0})</span>
                </span>
              </div>
            </div>

            {/* Installation Status Bars */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Pemasangan Fisik</span>
                <span>{summary.total_installed_items} / {summary.total_material_items} Selesai</span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                {summary.status_distributions.installation.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${(item.value / (summary.total_material_items || 1)) * 100}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${item.value}`}
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                  <span>Belum ({summary.status_distributions.installation[0]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span>Sebagian ({summary.status_distributions.installation[1]?.value || 0})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Terpasang ({summary.status_distributions.installation[2]?.value || 0})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
            Perhitungan status sinkron otomatis dengan histori transaksi
          </div>
        </div>
      </div>

      {/* Actionable Attention Lists (4 Columns / Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Perhatian & Tindakan Lapangan</h2>
            <p className="text-xs text-slate-500">Item-item yang membutuhkan aksi tim purchasing atau supervisor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* List 1: Belum Dibeli */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Belum Dibeli</span>
              </div>
              <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                {summary.attention_lists.not_purchased.length} Item
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {summary.attention_lists.not_purchased.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Semua material telah mulai dibeli.</p>
              ) : (
                summary.attention_lists.not_purchased.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMaterial(m.id)}
                    className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1 transition"
                  >
                    <div className="font-semibold text-xs text-slate-900 truncate">{m.material_name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span>{m.planned_quantity} {m.unit}</span>
                      <span className="font-medium text-slate-700">{formatRupiah(m.rap_total_price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {summary.attention_lists.not_purchased.length > 5 && (
              <button
                onClick={() => onNavigateTab('materials')}
                className="w-full text-center text-xs text-rose-600 hover:text-rose-800 font-semibold pt-2 border-t border-slate-100 mt-2 block"
              >
                Lihat Semua ({summary.attention_lists.not_purchased.length}) →
              </button>
            )}
          </div>

          {/* List 2: Status DP */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Dalam Proses DP</span>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {summary.attention_lists.dp_status.length} Item
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {summary.attention_lists.dp_status.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Tidak ada transaksi DP yang pending.</p>
              ) : (
                summary.attention_lists.dp_status.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMaterial(m.id)}
                    className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1 transition"
                  >
                    <div className="font-semibold text-xs text-slate-900 truncate">{m.material_name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span>Beli: {m.purchased_quantity} / {m.planned_quantity} {m.unit}</span>
                      <span className="font-medium text-amber-700">DP: {formatRupiah(m.total_dp_amount || 0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {summary.attention_lists.dp_status.length > 5 && (
              <button
                onClick={() => onNavigateTab('procurement')}
                className="w-full text-center text-xs text-amber-600 hover:text-amber-800 font-semibold pt-2 border-t border-slate-100 mt-2 block"
              >
                Lihat Transaksi DP →
              </button>
            )}
          </div>

          {/* List 3: Menunggu Pengiriman */}
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Menunggu Kirim</span>
              </div>
              <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                {summary.attention_lists.awaiting_delivery.length} Item
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {summary.attention_lists.awaiting_delivery.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Semua material terbeli sudah diterima di lokasi.</p>
              ) : (
                summary.attention_lists.awaiting_delivery.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMaterial(m.id)}
                    className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1 transition"
                  >
                    <div className="font-semibold text-xs text-slate-900 truncate">{m.material_name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span>Sisa: {(m.purchased_quantity || 0) - (m.received_quantity || 0)} {m.unit}</span>
                      <span className="text-orange-600 font-medium">Dari {m.vendor_name || 'Vendor'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {summary.attention_lists.awaiting_delivery.length > 0 && (
              <button
                onClick={() => onNavigateTab('receiving')}
                className="w-full text-center text-xs text-orange-600 hover:text-orange-800 font-semibold pt-2 border-t border-slate-100 mt-2 block"
              >
                Catat Penerimaan Surat Jalan →
              </button>
            )}
          </div>

          {/* List 4: Siap Dipasang */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Siap Dipasang</span>
              </div>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {summary.attention_lists.awaiting_installation.length} Item
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {summary.attention_lists.awaiting_installation.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Semua stok di lokasi sudah terpasang.</p>
              ) : (
                summary.attention_lists.awaiting_installation.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMaterial(m.id)}
                    className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1 transition"
                  >
                    <div className="font-semibold text-xs text-slate-900 truncate">{m.material_name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span>Stok proyek: {(m.received_quantity || 0) - (m.installed_quantity || 0)} {m.unit}</span>
                      <span className="text-blue-600 font-medium">{m.location || 'Site'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {summary.attention_lists.awaiting_installation.length > 0 && (
              <button
                onClick={() => onNavigateTab('installation')}
                className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-semibold pt-2 border-t border-slate-100 mt-2 block"
              >
                Catat Pemasangan & Foto →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
