'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  Truck, 
  Wrench, 
  Check, 
  AlertCircle,
  X,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Material, WorkCategory, Vendor, Role } from '@/lib/types';
import { formatRupiah, formatNumber, getProcurementBadge, getReceivingBadge, getInstallationBadge } from '@/lib/utils';

interface MaterialMasterViewProps {
  materials: Material[];
  categories: WorkCategory[];
  vendors: Vendor[];
  currentUserRole: Role;
  loading: boolean;
  onRefresh: () => void;
  onSelectMaterial: (id: number) => void;
  onOpenQuickPurchase: (material: Material) => void;
  onOpenQuickReceipt: (material: Material) => void;
  onOpenQuickInstall: (material: Material) => void;
}

export const MaterialMasterView: React.FC<MaterialMasterViewProps> = ({
  materials,
  categories,
  vendors,
  currentUserRole,
  loading,
  onRefresh,
  onSelectMaterial,
  onOpenQuickPurchase,
  onOpenQuickReceipt,
  onOpenQuickInstall,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [selectedProcStatus, setSelectedProcStatus] = useState<string>('ALL');
  const [selectedRecStatus, setSelectedRecStatus] = useState<string>('ALL');
  const [selectedInstStatus, setSelectedInstStatus] = useState<string>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    category_id: categories[0]?.id || 1,
    vendor_id: '',
    specification: '',
    unit: 'm2',
    planned_quantity: 1,
    rap_unit_price: 0,
    location: '',
    notes: '',
  });

  // Role permissions
  const canModify = ['ADMIN', 'PROJECT_MANAGER'].includes(currentUserRole);

  // Filter Logic
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = 
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.specification && m.specification.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.category_name && m.category_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || String(m.category_id) === selectedCategory;
    const matchesVendor = selectedVendor === 'ALL' || String(m.vendor_id) === selectedVendor;
    const matchesProc = selectedProcStatus === 'ALL' || m.procurement_status === selectedProcStatus;
    const matchesRec = selectedRecStatus === 'ALL' || m.receiving_status === selectedRecStatus;
    const matchesInst = selectedInstStatus === 'ALL' || m.installation_status === selectedInstStatus;

    return matchesSearch && matchesCategory && matchesVendor && matchesProc && matchesRec && matchesInst;
  });

  // Calculate filtered totals
  const totalFilteredRap = filteredMaterials.reduce((acc, m) => acc + m.rap_total_price, 0);
  const totalFilteredActual = filteredMaterials.reduce((acc, m) => acc + (m.actual_total_cost || 0), 0);

  const handleOpenAdd = () => {
    setFormData({
      material_code: '',
      material_name: '',
      category_id: categories[0]?.id || 1,
      vendor_id: '',
      specification: '',
      unit: 'm2',
      planned_quantity: 1,
      rap_unit_price: 0,
      location: '',
      notes: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMaterial(m);
    setFormData({
      material_code: m.material_code,
      material_name: m.material_name,
      category_id: m.category_id,
      vendor_id: m.vendor_id ? String(m.vendor_id) : '',
      specification: m.specification || '',
      unit: m.unit,
      planned_quantity: m.planned_quantity,
      rap_unit_price: m.rap_unit_price,
      location: m.location || '',
      notes: m.notes || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingMaterial ? `/api/materials/${editingMaterial.id}` : '/api/materials';
      const method = editingMaterial ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planned_quantity: Number(formData.planned_quantity),
          rap_unit_price: Number(formData.rap_unit_price),
          vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
          category_id: Number(formData.category_id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save material');
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus material "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus material.');
        return;
      }
      onRefresh();
    } catch (err: any) {
      alert('Terjadi kesalahan saat menghapus material.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Master RAP & Kontrol Material</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {filteredMaterials.length} dari {materials.length} Material
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Perencanaan volume & harga satuan RAP vs realisasi PO, pengiriman, dan pemasangan.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/api/reports/export?type=master"
              download
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </a>

            {canModify && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode, material, spesifikasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              aria-label="Filter Berdasarkan Kategori"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              aria-label="Filter Berdasarkan Toko atau Vendor"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Semua Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Procurement Filter */}
          <div>
            <select
              aria-label="Filter Berdasarkan Status Pengadaan"
              value={selectedProcStatus}
              onChange={(e) => setSelectedProcStatus(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Status Pengadaan</option>
              <option value="NOT_PURCHASED">Belum Dibeli</option>
              <option value="DP_PARTIALLY_PURCHASED">DP / Sebagian</option>
              <option value="PURCHASED">Sudah Dibeli</option>
            </select>
          </div>

          {/* Installation Filter */}
          <div>
            <select
              aria-label="Filter Berdasarkan Status Pemasangan"
              value={selectedInstStatus}
              onChange={(e) => setSelectedInstStatus(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            >
              <option value="ALL">Status Pasang</option>
              <option value="NOT_INSTALLED">Belum Pasang</option>
              <option value="PARTIALLY_INSTALLED">Sebagian</option>
              <option value="INSTALLED">Selesai Terpasang</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Badge */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span>Menampilkan <b>{filteredMaterials.length}</b> baris material</span>
          <div className="flex items-center space-x-3">
            <span>Total RAP: <b className="text-slate-900">{formatRupiah(totalFilteredRap)}</b></span>
            <span>Total Realisasi PO: <b className="text-amber-700">{formatRupiah(totalFilteredActual)}</b></span>
          </div>
        </div>
      </div>

      {/* Main Excel-like Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-20 select-none shadow-sm">
              <tr>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 w-12 text-center">No</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 min-w-[100px]">Kode</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 min-w-[140px]">Kategori</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 min-w-[200px]">Material & Spesifikasi</th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 text-center w-14">Sat</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right min-w-[80px]">Vol RAP</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right min-w-[100px]">Harga (Rp)</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-right min-w-[110px]">Total RAP</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center min-w-[100px]">Vol Beli</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center min-w-[100px]">Vol Terima</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center min-w-[100px]">Vol Pasang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 min-w-[110px]">Status Beli</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 min-w-[110px]">Status Pasang</th>
                <th className="py-2.5 px-3 font-semibold text-center min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    Tidak ada material yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m, idx) => {
                  const procBadge = getProcurementBadge(m.procurement_status);
                  const instBadge = getInstallationBadge(m.installation_status);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        isEven ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* Code */}
                      <td className="py-2 px-3 border-r border-slate-100">
                        <button
                          onClick={() => onSelectMaterial(m.id)}
                          className="font-mono text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
                        >
                          {m.material_code}
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-600 truncate max-w-[140px]" title={m.category_name}>
                        {m.category_name}
                      </td>

                      {/* Material Name & Spec */}
                      <td className="py-2 px-3 border-r border-slate-100 max-w-[240px]">
                        <div 
                          onClick={() => onSelectMaterial(m.id)}
                          className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer truncate"
                          title={m.material_name}
                        >
                          {m.material_name}
                        </div>
                        {m.specification && (
                          <div className="text-[11px] text-slate-500 truncate" title={m.specification}>
                            {m.specification}
                          </div>
                        )}
                        {m.vendor_name && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Vendor: <span className="font-medium text-slate-600">{m.vendor_name}</span>
                          </div>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-2 px-2 text-center border-r border-slate-100 text-slate-600">
                        {m.unit}
                      </td>

                      {/* Planned Quantity */}
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 border-r border-slate-100">
                        {formatNumber(m.planned_quantity)}
                      </td>

                      {/* RAP Unit Price */}
                      <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-100 font-mono">
                        {formatRupiah(m.rap_unit_price)}
                      </td>

                      {/* RAP Total Price */}
                      <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-100 font-mono">
                        {formatRupiah(m.rap_total_price)}
                      </td>

                      {/* Purchased Qty */}
                      <td className="py-2 px-3 text-center border-r border-slate-100">
                        <div className="font-bold text-slate-800">
                          {formatNumber(m.purchased_quantity || 0)} / {m.planned_quantity}
                        </div>
                        {m.remaining_to_purchase !== undefined && m.remaining_to_purchase > 0 && (
                          <div className="text-[10px] text-rose-500">
                            Sisa: {formatNumber(m.remaining_to_purchase)}
                          </div>
                        )}
                      </td>

                      {/* Received Qty */}
                      <td className="py-2 px-3 text-center border-r border-slate-100">
                        <div className="font-bold text-slate-800">
                          {formatNumber(m.received_quantity || 0)} / {formatNumber(m.purchased_quantity || 0)}
                        </div>
                        {(m.purchased_quantity || 0) > (m.received_quantity || 0) && (
                          <div className="text-[10px] text-orange-500">
                            Pending: {formatNumber((m.purchased_quantity || 0) - (m.received_quantity || 0))}
                          </div>
                        )}
                      </td>

                      {/* Installed Qty & Progress */}
                      <td className="py-2 px-3 text-center border-r border-slate-100">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="font-bold text-slate-900">{formatNumber(m.installed_quantity || 0)}</span>
                          <span className="text-[10px] text-slate-400">({m.progress_percentage || 0}%)</span>
                        </div>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${m.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Procurement Status Badge */}
                      <td className="py-2 px-3 border-r border-slate-100">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${procBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${procBadge.dot}`}></span>
                          <span>{procBadge.label}</span>
                        </span>
                      </td>

                      {/* Installation Status Badge */}
                      <td className="py-2 px-3 border-r border-slate-100">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${instBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${instBadge.dot}`}></span>
                          <span>{instBadge.label}</span>
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Detail */}
                          <button
                            onClick={() => onSelectMaterial(m.id)}
                            title="Lihat Detail & Histori"
                            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Purchase */}
                          <button
                            onClick={() => onOpenQuickPurchase(m)}
                            title="Catat Pembelian / DP"
                            className="p-1 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Receipt */}
                          <button
                            onClick={() => onOpenQuickReceipt(m)}
                            title="Catat Penerimaan Lapangan"
                            className="p-1 rounded text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Install */}
                          <button
                            onClick={() => onOpenQuickInstall(m)}
                            title="Catat Pemasangan & Progres"
                            className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit (PM/Admin) */}
                          {canModify && (
                            <button
                              onClick={() => handleOpenEdit(m)}
                              title="Edit RAP"
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {currentUserRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteMaterial(m.id, m.material_name)}
                              title="Hapus Material"
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

      {/* Add / Edit Material Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingMaterial ? 'Edit Material RAP' : 'Tambah Material Baru ke RAP'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Material</label>
                  <input
                    type="text"
                    placeholder="Auto (cth: MAT-SMR-030)"
                    value={formData.material_code}
                    onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Pekerjaan *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Material *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Granit Tile 60x60 Cream"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Detail</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Roman dCastello Cream Glazed Polished Grade A"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="m2, btg, unit, sak"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume RAP *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    value={formData.planned_quantity}
                    onChange={(e) => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0"
                    value={formData.rap_unit_price}
                    onChange={(e) => setFormData({ ...formData, rap_unit_price: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-slate-800 flex justify-between items-center">
                <span className="font-semibold">Perhitungan Total Harga RAP:</span>
                <span className="font-mono font-bold text-amber-900 text-sm">
                  {formatRupiah(Number(formData.planned_quantity || 0) * Number(formData.rap_unit_price || 0))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rekomendasi Toko / Vendor</label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Pemasangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kamar Master - Lantai 2"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan spesifikasi atau syarat pemesanan"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingMaterial ? 'Perbarui Material' : 'Simpan Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
