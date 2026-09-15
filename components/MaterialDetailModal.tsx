'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Truck, 
  Wrench, 
  Camera, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  Layers, 
  MapPin, 
  User, 
  Building2,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { MaterialDetail, Role } from '@/lib/types';
import { formatRupiah, formatNumber, formatDate, getProcurementBadge, getReceivingBadge, getInstallationBadge } from '@/lib/utils';

interface MaterialDetailModalProps {
  materialId: number | null;
  onClose: () => void;
  currentUserRole: Role;
  onOpenQuickPurchase: (mat: any) => void;
  onOpenQuickReceipt: (mat: any) => void;
  onOpenQuickInstall: (mat: any) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  materialId,
  onClose,
  currentUserRole,
  onOpenQuickPurchase,
  onOpenQuickReceipt,
  onOpenQuickInstall,
}) => {
  const [detail, setDetail] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'purchases' | 'receipts' | 'installations' | 'gallery'>('summary');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/materials/${materialId}/detail`);
        const data = await res.json();
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [materialId]);

  if (!materialId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-amber-400 bg-slate-800 px-2 py-0.5 rounded font-bold">
                {detail?.material_code || 'MAT-...'}
              </span>
              <span className="text-xs text-slate-400">• {detail?.category_name || 'Kategori'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              {detail?.material_name || 'Memuat detail material...'}
            </h2>
            {detail?.specification && (
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Spesifikasi: {detail.specification}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar & Quick Actions */}
        {detail && (
          <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            {/* Status Badges */}
            <div className="flex items-center space-x-2">
              {(() => {
                const proc = getProcurementBadge(detail.procurement_status);
                const rec = getReceivingBadge(detail.receiving_status);
                const inst = getInstallationBadge(detail.installation_status);
                return (
                  <>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${proc.bg}`}>
                      Beli: {proc.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rec.bg}`}>
                      Terima: {rec.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${inst.bg}`}>
                      Pasang: {inst.label}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenQuickPurchase(detail)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition"
              >
                <Plus className="w-3 h-3" />
                <span>PO / DP</span>
              </button>
              <button
                onClick={() => onOpenQuickReceipt(detail)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition"
              >
                <Plus className="w-3 h-3" />
                <span>Penerimaan</span>
              </button>
              <button
                onClick={() => onOpenQuickInstall(detail)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition"
              >
                <Plus className="w-3 h-3" />
                <span>Pemasangan</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Tabs Navigation */}
        <div className="px-5 border-b border-slate-200 bg-white flex space-x-4 text-xs font-semibold text-slate-500 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'summary' ? 'border-amber-500 text-slate-900' : 'border-transparent hover:text-slate-700'
            }`}
          >
            Ringkasan Siklus Material
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'purchases' ? 'border-amber-500 text-slate-900' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <span>Histori Pembelian (PO)</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {detail?.purchases.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`py-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'receipts' ? 'border-amber-500 text-slate-900' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <span>Penerimaan Surat Jalan</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {detail?.receipts.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('installations')}
            className={`py-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'installations' ? 'border-amber-500 text-slate-900' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <span>Pemasangan Fisik</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {detail?.installations.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-3 border-b-2 transition whitespace-nowrap flex items-center space-x-1 ${
              activeTab === 'gallery' ? 'border-amber-500 text-slate-900' : 'border-transparent hover:text-slate-700'
            }`}
          >
            <span>Galeri Foto Lapangan</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full font-bold">
              {detail?.images.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 mt-2">Memuat data material...</p>
            </div>
          ) : !detail ? (
            <div className="text-center py-12 text-slate-400 text-xs">Data material tidak ditemukan.</div>
          ) : (
            <>
              {/* TAB 1: SUMMARY / SIKLUS */}
              {activeTab === 'summary' && (
                <div className="space-y-5">
                  {/* 4 Cards Workflow Lifecycle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Stage 1: Planning */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">1. Rencana (RAP)</span>
                        <Layers className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(detail.planned_quantity)} {detail.unit}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">
                        @ {formatRupiah(detail.rap_unit_price)}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-2 pt-2 border-t border-slate-100">
                        Total: {formatRupiah(detail.rap_total_price)}
                      </div>
                    </div>

                    {/* Stage 2: Procurement */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">2. Pembelian (PO)</span>
                        <ShoppingCart className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(detail.purchased_quantity || 0)} / {detail.planned_quantity} {detail.unit}
                      </div>
                      <div className="text-xs text-amber-700 font-semibold mt-1">
                        Total PO: {formatRupiah(detail.actual_total_cost || 0)}
                      </div>
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
                        <span>DP: {formatRupiah(detail.total_dp_amount || 0)}</span>
                        <span className="text-rose-600 font-medium">Hutang: {formatRupiah(Math.max(0, (detail.actual_total_cost || 0) - (detail.total_paid_amount || 0)))}</span>
                      </div>
                    </div>

                    {/* Stage 3: Receiving */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">3. Terima di Proyek</span>
                        <Truck className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(detail.received_quantity || 0)} {detail.unit}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        {(detail.purchased_quantity || 0) > (detail.received_quantity || 0) ? (
                          `Sisa kirim: ${formatNumber((detail.purchased_quantity || 0) - (detail.received_quantity || 0))} ${detail.unit}`
                        ) : (
                          'Semua pesanan telah tiba di proyek'
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        Surat Jalan: {detail.receipts.length} transaksi
                      </div>
                    </div>

                    {/* Stage 4: Installation */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">4. Pasang Fisik</span>
                        <Wrench className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {formatNumber(detail.installed_quantity || 0)} {detail.unit} ({detail.progress_percentage || 0}%)
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${detail.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        Stok di lokasi: {formatNumber((detail.received_quantity || 0) - (detail.installed_quantity || 0))} {detail.unit}
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Technical Specs */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm">Spesifikasi & Informasi Referensi</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">Kategori Pekerjaan:</span>
                        <span className="font-semibold text-slate-800">{detail.category_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Toko / Rekanan Rekomendasi:</span>
                        <span className="font-semibold text-slate-800">{detail.vendor_name || 'Belum ditentukan'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Rencana Titik Pasang:</span>
                        <span className="font-semibold text-slate-800">{detail.location || 'Kamar Samara'}</span>
                      </div>
                    </div>
                    {detail.notes && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block">Catatan Tambahan:</span>
                        <p className="text-slate-700 mt-0.5">{detail.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PURCHASES */}
              {activeTab === 'purchases' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Riwayat Pembelian & Uang Muka (PO)</h3>
                    <button
                      onClick={() => onOpenQuickPurchase(detail)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                    >
                      + Tambah PO
                    </button>
                  </div>

                  {detail.purchases.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      Belum ada transaksi pembelian untuk material ini.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="py-2 px-3">Tanggal</th>
                            <th className="py-2 px-3">No. Invoice / PO</th>
                            <th className="py-2 px-3">Vendor</th>
                            <th className="py-2 px-3 text-center">Volume</th>
                            <th className="py-2 px-3 text-right">Harga</th>
                            <th className="py-2 px-3 text-right">Total Transaksi</th>
                            <th className="py-2 px-3 text-center">Status</th>
                            <th className="py-2 px-3 text-right">DP / Terbayar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.purchases.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 px-3 font-medium">{formatDate(p.purchase_date)}</td>
                              <td className="py-2.5 px-3 font-mono">{p.invoice_number || `PO-${p.id}`}</td>
                              <td className="py-2.5 px-3">{p.vendor_name || '-'}</td>
                              <td className="py-2.5 px-3 text-center font-bold">{formatNumber(p.quantity)} {p.unit}</td>
                              <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(p.unit_price)}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiah(p.total_price)}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {p.payment_status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                                {formatRupiah(p.paid_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECEIPTS */}
              {activeTab === 'receipts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Riwayat Surat Jalan & Kedatangan Barang</h3>
                    <button
                      onClick={() => onOpenQuickReceipt(detail)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs"
                    >
                      + Catat Kedatangan
                    </button>
                  </div>

                  {detail.receipts.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      Belum ada catatan kedatangan fisik barang di proyek.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="py-2 px-3">Tanggal Terima</th>
                            <th className="py-2 px-3 text-center">Volume</th>
                            <th className="py-2 px-3">Penerima Lapangan</th>
                            <th className="py-2 px-3">Catatan</th>
                            <th className="py-2 px-3 text-center">Foto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.receipts.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2.5 px-3 font-semibold">{formatDate(r.received_date)}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-blue-700">{formatNumber(r.quantity_received)} {detail.unit}</td>
                              <td className="py-2.5 px-3">{r.receiver_name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{r.notes || '-'}</td>
                              <td className="py-2.5 px-3 text-center">
                                {r.delivery_photo_url ? (
                                  <button
                                    onClick={() => setPreviewPhoto(r.delivery_photo_url)}
                                    className="text-blue-600 hover:underline font-semibold"
                                  >
                                    Lihat Foto
                                  </button>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INSTALLATIONS */}
              {activeTab === 'installations' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Riwayat Pemasangan Fisik & Opname Lapangan</h3>
                    <button
                      onClick={() => onOpenQuickInstall(detail)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs"
                    >
                      + Catat Pemasangan
                    </button>
                  </div>

                  {detail.installations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      Belum ada riwayat pemasangan untuk material ini.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="py-2 px-3">Tanggal Pasang</th>
                            <th className="py-2 px-3 text-center">Volume Terpasang</th>
                            <th className="py-2 px-3">Titik / Lokasi</th>
                            <th className="py-2 px-3">Mandor / Tukang</th>
                            <th className="py-2 px-3">Catatan</th>
                            <th className="py-2 px-3 text-center">Foto Lapangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.installations.map((i) => (
                            <tr key={i.id}>
                              <td className="py-2.5 px-3 font-semibold">{formatDate(i.installation_date)}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{formatNumber(i.quantity_installed)} {detail.unit}</td>
                              <td className="py-2.5 px-3">{i.location}</td>
                              <td className="py-2.5 px-3">{i.installer_name}</td>
                              <td className="py-2.5 px-3 text-slate-500">{i.notes || '-'}</td>
                              <td className="py-2.5 px-3 text-center">
                                {i.site_photo_url ? (
                                  <button
                                    onClick={() => setPreviewPhoto(i.site_photo_url)}
                                    className="text-indigo-600 hover:underline font-semibold"
                                  >
                                    Lihat Foto
                                  </button>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: GALLERY */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Dokumentasi Foto Lapangan & Bukti Fisik
                  </h3>

                  {detail.images.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                      Belum ada foto yang diunggah untuk material ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detail.images.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setPreviewPhoto(img.image_url)}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition group"
                        >
                          <div className="h-36 bg-slate-900 overflow-hidden flex items-center justify-center">
                            <img
                              src={img.image_url}
                              alt={img.caption || 'Foto'}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          </div>
                          <div className="p-2.5 text-xs">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {img.image_type}
                            </span>
                            <div className="font-medium text-slate-800 mt-1 line-clamp-1">{img.caption || 'Foto Dokumentasi'}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(img.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
          >
            Tutup Detail
          </button>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-900 text-white">
              <span className="text-xs font-bold">Foto Dokumentasi</span>
              <button onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center">
              <img src={previewPhoto} alt="Preview" className="max-h-[80vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
