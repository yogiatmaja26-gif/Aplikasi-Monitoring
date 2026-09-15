'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Trash2, 
  Eye, 
  Upload,
  Calendar,
  X
} from 'lucide-react';
import { Material, PurchaseTransaction, Vendor, Role } from '@/lib/types';
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils';

interface ProcurementViewProps {
  materials: Material[];
  vendors: Vendor[];
  currentUserRole: Role;
  onRefreshAll: () => void;
  onSelectMaterial: (id: number) => void;
  preselectedMaterial?: Material | null;
  onClearPreselected?: () => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  materials,
  vendors,
  currentUserRole,
  onRefreshAll,
  onSelectMaterial,
  preselectedMaterial,
  onClearPreselected,
}) => {
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Record Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(materials[0]?.id || 1);
  const [vendorId, setVendorId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('unit');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'DP' | 'PARTIALLY_PAID' | 'PAID'>('DP');
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFileUrl, setInvoiceFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load purchases
  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  // Preselected handling
  useEffect(() => {
    if (preselectedMaterial) {
      setSelectedMaterialId(preselectedMaterial.id);
      setUnit(preselectedMaterial.unit);
      setUnitPrice(preselectedMaterial.rap_unit_price);
      setQuantity(preselectedMaterial.remaining_to_purchase || preselectedMaterial.planned_quantity);
      if (preselectedMaterial.vendor_id) {
        setVendorId(String(preselectedMaterial.vendor_id));
      }
      setIsModalOpen(true);
      if (onClearPreselected) onClearPreselected();
    }
  }, [preselectedMaterial]);

  // When selected material changes in form
  const handleMaterialChange = (matId: number) => {
    setSelectedMaterialId(matId);
    const m = materials.find((item) => item.id === matId);
    if (m) {
      setUnit(m.unit);
      setUnitPrice(m.rap_unit_price);
      setQuantity(m.remaining_to_purchase && m.remaining_to_purchase > 0 ? m.remaining_to_purchase : m.planned_quantity);
      if (m.vendor_id) setVendorId(String(m.vendor_id));
    }
  };

  const totalPrice = quantity * unitPrice;

  // Check for volume warning
  useEffect(() => {
    const m = materials.find((item) => item.id === selectedMaterialId);
    if (m) {
      const existing = m.purchased_quantity || 0;
      if (existing + quantity > m.planned_quantity) {
        setWarningMessage(
          `Peringatan: Total pembelian (${existing + quantity} ${m.unit}) melebihi volume RAP (${m.planned_quantity} ${m.unit}).`
        );
      } else {
        setWarningMessage(null);
      }
    }
  }, [selectedMaterialId, quantity, materials]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setInvoiceFileUrl(data.file_url);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah file invoice.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          vendor_id: vendorId ? Number(vendorId) : null,
          purchase_date: purchaseDate,
          quantity: Number(quantity),
          unit,
          unit_price: Number(unitPrice),
          payment_status: paymentStatus,
          dp_amount: paymentStatus === 'DP' ? Number(dpAmount) : 0,
          paid_amount: paymentStatus === 'PAID' ? totalPrice : (paymentStatus === 'DP' ? Number(dpAmount) : Number(paidAmount)),
          invoice_number: invoiceNumber,
          invoice_file_url: invoiceFileUrl,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record purchase');

      setIsModalOpen(false);
      loadPurchases();
      onRefreshAll();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus transaksi pembelian ini?')) return;
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus pembelian.');
        return;
      }
      loadPurchases();
      onRefreshAll();
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch = 
      (p.material_name && p.material_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.invoice_number && p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.vendor_name && p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVendor = selectedVendor === 'ALL' || String(p.vendor_id) === selectedVendor;
    const matchesStatus = selectedStatus === 'ALL' || p.payment_status === selectedStatus;

    return matchesSearch && matchesVendor && matchesStatus;
  });

  const totalFilteredValue = filteredPurchases.reduce((acc, p) => acc + p.total_price, 0);
  const totalFilteredPaid = filteredPurchases.reduce((acc, p) => acc + p.paid_amount, 0);
  const totalFilteredRemaining = filteredPurchases.reduce((acc, p) => acc + p.remaining_payment, 0);

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              <span>Pengadaan Material & Manajemen Uang Muka (DP)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan Purchase Order, pembayaran DP/Lunas, dan pengendalian harga beli aktual.
            </p>
          </div>

          <button
            onClick={() => {
              if (materials.length > 0) handleMaterialChange(materials[0].id);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pembelian Baru</span>
          </button>
        </div>

        {/* Summary Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Total Nilai Transaksi PO</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{formatRupiah(totalFilteredValue)}</div>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-700 uppercase">Sudah Dibayar / DP</span>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{formatRupiah(totalFilteredPaid)}</div>
          </div>
          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
            <span className="text-[11px] font-medium text-rose-700 uppercase">Sisa Tagihan / Hutang</span>
            <div className="text-base font-bold text-rose-700 mt-0.5">{formatRupiah(totalFilteredRemaining)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari material, invoice, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              aria-label="Filter Berdasarkan Vendor"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Semua Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>{v.vendor_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              aria-label="Filter Berdasarkan Status Pembayaran"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="DP">DP (Uang Muka)</option>
              <option value="PAID">Lunas (Paid)</option>
              <option value="UNPAID">Belum Dibayar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchases List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Tanggal & PO</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Material</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Vendor</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Volume</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right">Total Transaksi</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Status Pembayaran</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right">Terbayar / DP</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right">Sisa Tagihan</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Lampiran</th>
                <th className="py-2.5 px-2 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Memuat data pembelian...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Belum ada transaksi pembelian yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (p.payment_status === 'PAID') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (p.payment_status === 'DP') statusBadge = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                  if (p.payment_status === 'UNPAID') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & PO */}
                      <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDate(p.purchase_date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.invoice_number || `PO-${String(p.id).padStart(4, '0')}`}
                        </div>
                      </td>

                      {/* Material */}
                      <td className="py-2.5 px-3 border-r border-slate-100 max-w-[200px]">
                        <button
                          onClick={() => onSelectMaterial(p.material_id)}
                          className="font-bold text-slate-900 hover:text-amber-600 truncate text-left block w-full"
                          title={p.material_name}
                        >
                          {p.material_name}
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono">{p.material_code}</div>
                      </td>

                      {/* Vendor */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700 font-medium whitespace-nowrap">
                        {p.vendor_name || '-'}
                      </td>

                      {/* Quantity & Unit */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-slate-900">
                        {formatNumber(p.quantity)} <span className="font-normal text-slate-500 text-[10px]">{p.unit}</span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono text-slate-700">
                        {formatRupiah(p.unit_price)}
                      </td>

                      {/* Total Price */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(p.total_price)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                          {p.payment_status === 'DP' ? 'Uang Muka (DP)' : p.payment_status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono font-semibold text-emerald-700">
                        {formatRupiah(p.paid_amount)}
                        {p.payment_status === 'DP' && p.dp_amount > 0 && (
                          <div className="text-[10px] text-amber-700 font-sans">
                            (DP: {formatRupiah(p.dp_amount)})
                          </div>
                        )}
                      </td>

                      {/* Remaining Payment */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-right font-mono font-semibold text-rose-600">
                        {formatRupiah(p.remaining_payment)}
                      </td>

                      {/* Attachment */}
                      <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                        {p.invoice_file_url ? (
                          <a
                            href={p.invoice_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                          >
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span>Invoice</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectMaterial(p.material_id)}
                            title="Detail Material"
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUserRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDeletePurchase(p.id)}
                              title="Hapus PO"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                <span>Catat Pembelian / PO Material</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            {warningMessage && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{warningMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
              {/* Select Material */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Material RAP *</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleMaterialChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_code} - {m.material_name} (RAP: {m.planned_quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor & Purchase Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Toko / Vendor *</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Toko / Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembelian *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Quantity, Unit, Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume Beli *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    readOnly
                    value={unit}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                <span className="font-semibold text-slate-800">Total Harga Transaksi:</span>
                <span className="font-mono font-bold text-base text-amber-900">{formatRupiah(totalPrice)}</span>
              </div>

              {/* Payment Status & DP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-semibold"
                  >
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="PAID">Lunas (Paid in Full)</option>
                    <option value="UNPAID">Belum Dibayar (Unpaid)</option>
                  </select>
                </div>

                {paymentStatus === 'DP' ? (
                  <div>
                    <label className="block font-semibold text-amber-800 mb-1">Nominal DP (Rp) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={totalPrice}
                      value={dpAmount}
                      onChange={(e) => setDpAmount(Number(e.target.value))}
                      placeholder="Contoh: 2000000"
                      className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg font-mono font-bold text-amber-900 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. Invoice / Kwitansi</label>
                    <input
                      type="text"
                      placeholder="INV-M10-8821"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Invoice File Upload */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unggah Bukti PO / Invoice Toko</label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Mengunggah...' : 'Pilih Foto / PDF'}</span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {invoiceFileUrl && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>File terunggah</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pembelian</label>
                <input
                  type="text"
                  placeholder="Keterangan termin, pengiriman bertahap, dll"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan PO...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
