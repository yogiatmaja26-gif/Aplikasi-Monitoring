'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Trash2, 
  Eye, 
  Upload, 
  X,
  FileText,
  Clock
} from 'lucide-react';
import { Material, MaterialReceipt, PurchaseTransaction, Role } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';

interface ReceivingViewProps {
  materials: Material[];
  currentUserRole: Role;
  onRefreshAll: () => void;
  onSelectMaterial: (id: number) => void;
  preselectedMaterial?: Material | null;
  onClearPreselected?: () => void;
}

export const ReceivingView: React.FC<ReceivingViewProps> = ({
  materials,
  currentUserRole,
  onRefreshAll,
  onSelectMaterial,
  preselectedMaterial,
  onClearPreselected,
}) => {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(0);
  const [materialPurchases, setMaterialPurchases] = useState<PurchaseTransaction[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number>(0);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quantityReceived, setQuantityReceived] = useState<number>(1);
  const [receiverName, setReceiverName] = useState<string>('Hendra Wijaya (Site Supervisor)');
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Load receipts
  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/receipts');
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  // Filter materials that have purchase transactions
  const purchasableMaterials = materials.filter(
    (m) => (m.purchased_quantity || 0) > 0
  );

  // When material is selected, fetch its purchase transactions
  const handleSelectMaterial = async (matId: number) => {
    setSelectedMaterialId(matId);
    try {
      const res = await fetch(`/api/purchases?materialId=${matId}`);
      const data = await res.json();
      const pList: PurchaseTransaction[] = data.purchases || [];
      setMaterialPurchases(pList);
      if (pList.length > 0) {
        setSelectedPurchaseId(pList[0].id);
        const m = materials.find((item) => item.id === matId);
        const remaining = (m?.purchased_quantity || 0) - (m?.received_quantity || 0);
        setQuantityReceived(remaining > 0 ? remaining : pList[0].quantity);
      } else {
        setSelectedPurchaseId(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Preselected handling
  useEffect(() => {
    if (preselectedMaterial) {
      handleSelectMaterial(preselectedMaterial.id);
      setIsModalOpen(true);
      if (onClearPreselected) onClearPreselected();
    }
  }, [preselectedMaterial]);

  const handleOpenModal = () => {
    setFormError(null);
    if (purchasableMaterials.length > 0) {
      handleSelectMaterial(purchasableMaterials[0].id);
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setDeliveryPhotoUrl(data.file_url);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          purchase_transaction_id: selectedPurchaseId,
          received_date: receivedDate,
          quantity_received: Number(quantityReceived),
          receiver_name: receiverName,
          delivery_photo_url: deliveryPhotoUrl || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat penerimaan');

      setIsModalOpen(false);
      loadReceipts();
      onRefreshAll();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!window.confirm('Hapus data penerimaan surat jalan ini?')) return;
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus penerimaan.');
        return;
      }
      loadReceipts();
      onRefreshAll();
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const filteredReceipts = receipts.filter((r) => {
    return (
      (r.material_name && r.material_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.material_code && r.material_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.receiver_name && r.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.invoice_number && r.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Penerimaan Material di Lapangan (Surat Jalan & Gudang)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan kedatangan fisik material, verifikasi Surat Jalan, dan upload foto bukti pengiriman.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Penerimaan Baru</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari penerimaan berdasarkan material, kode, penerima, surat jalan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Tanggal Terima</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Material</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Ref. Invoice / PO</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Volume Diterima</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Penerima di Lapangan</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Foto Surat Jalan</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Catatan Kondisi Fisik</th>
                <th className="py-2.5 px-2 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data penerimaan...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada catatan penerimaan material di proyek.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(r.received_date)}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 max-w-[220px]">
                      <button
                        onClick={() => onSelectMaterial(r.material_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 truncate text-left block w-full"
                      >
                        {r.material_name}
                      </button>
                      <div className="text-[10px] text-slate-400 font-mono">{r.material_code}</div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600 font-mono">
                      {r.invoice_number || `PO-${r.purchase_transaction_id}`}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                        {formatNumber(r.quantity_received)} {r.unit}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-800 font-medium">
                      {r.receiver_name || '-'}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      {r.delivery_photo_url ? (
                        <button
                          onClick={() => setPreviewPhoto(r.delivery_photo_url)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                        >
                          <Camera className="w-3 h-3 text-blue-600" />
                          <span>Lihat Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600 text-[11px]">
                      {r.notes || 'Kondisi barang baik & sesuai pesanan'}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSelectMaterial(r.material_id)}
                          title="Detail Material"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {['ADMIN', 'SUPERVISOR', 'PROJECT_MANAGER'].includes(currentUserRole) && (
                          <button
                            onClick={() => handleDeleteReceipt(r.id)}
                            title="Hapus Penerimaan"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Catat Penerimaan Surat Jalan Lapangan</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReceipt} className="space-y-3 text-xs">
              {/* Select Material */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Material *</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleSelectMaterial(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  {purchasableMaterials.length === 0 ? (
                    <option value="0">Tidak ada material yang sudah dibeli.</option>
                  ) : (
                    purchasableMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.material_code} - {m.material_name} (Dibeli: {m.purchased_quantity} {m.unit}, Diterima: {m.received_quantity || 0})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Select Purchase Transaction */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Transaksi PO / Invoice *</label>
                {materialPurchases.length === 0 ? (
                  <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                    Material ini belum memiliki catatan transaksi pembelian (PO). Beli terlebih dahulu di tab Pengadaan.
                  </div>
                ) : (
                  <select
                    value={selectedPurchaseId}
                    onChange={(e) => setSelectedPurchaseId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    {materialPurchases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.invoice_number || `PO-${p.id}`} | Vol: {p.quantity} {p.unit} ({p.payment_status}) | {formatDate(p.purchase_date)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Terima *</label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume Diterima *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Receiver Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Penerima Lapangan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Wijaya (Site Supervisor)"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Delivery Photo Upload */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto Bukti Surat Jalan / Fisik Barang</label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-200">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Mengunggah...' : 'Upload Foto Lapangan'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {deliveryPhotoUrl && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Foto Terlampir</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Kondisi</label>
                <input
                  type="text"
                  placeholder="Kondisi barang, nomor surat jalan, tempat penyimpanan di lokasi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
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
                  disabled={submitting || materialPurchases.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Penerimaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-900 text-white">
              <span className="text-xs font-bold">Bukti Surat Jalan / Penerimaan Barang</span>
              <button onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center">
              <img src={previewPhoto} alt="Delivery Proof" className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
