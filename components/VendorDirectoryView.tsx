'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Vendor, Role } from '@/lib/types';

interface VendorDirectoryViewProps {
  vendors: Vendor[];
  currentUserRole: Role;
  onRefreshAll: () => void;
  onSelectVendorFilter: (vendorId: number) => void;
}

export const VendorDirectoryView: React.FC<VendorDirectoryViewProps> = ({
  vendors,
  currentUserRole,
  onRefreshAll,
  onSelectVendorFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    vendor_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_account_info: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canModify = ['ADMIN', 'PROJECT_MANAGER', 'PURCHASING'].includes(currentUserRole);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      vendor_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      bank_account_info: '',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({
      vendor_name: v.vendor_name,
      contact_person: v.contact_person || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      bank_account_info: v.bank_account_info || '',
      notes: v.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vendor');

      setIsModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: number, name: string) => {
    if (!window.confirm(`Hapus vendor "${name}"?`)) return;
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus vendor.');
        return;
      }
      onRefreshAll();
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const filteredVendors = vendors.filter((v) => {
    return (
      v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Direktori Vendor & Toko Bangunan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Daftar rekanan supplier material, kontak person, alamat toko, dan nomor rekening pembayaran termin.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canModify && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        <input
          type="text"
          placeholder="Cari toko / vendor, nama sales, alamat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((v) => (
          <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:border-amber-400 transition">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{v.vendor_name}</h3>
                  {v.contact_person && (
                    <div className="text-xs text-slate-500 mt-0.5">PIC: <span className="font-semibold text-slate-700">{v.contact_person}</span></div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {canModify && (
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {currentUserRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteVendor(v.id, v.vendor_name)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {v.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{v.phone}</span>
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{v.email}</span>
                  </div>
                )}
                {v.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{v.address}</span>
                  </div>
                )}
                {v.bank_account_info && (
                  <div className="flex items-start space-x-2 pt-1 border-t border-slate-100 text-slate-700 font-mono text-[11px]">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{v.bank_account_info}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">ID: VND-{String(v.id).padStart(3, '0')}</span>
              <button
                onClick={() => onSelectVendorFilter(v.id)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center space-x-1"
              >
                <span>Lihat Material ({v.total_items_supplied || 0})</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingVendor ? 'Edit Vendor / Rekanan' : 'Tambah Vendor Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Toko / Vendor *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Toko Bangunan Samara Jaya"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Sales / PIC</label>
                  <input
                    type="text"
                    placeholder="Bpk. Hendra"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Gudang / Toko</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Utama No. 12, Kota..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Info Rekening Bank (Pembayaran Termin/DP)</label>
                <input
                  type="text"
                  placeholder="BCA 827-019-2234 a/n PT Samara Bangun"
                  value={formData.bank_account_info}
                  onChange={(e) => setFormData({ ...formData, bank_account_info: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Ketentuan pengiriman, potongan harga, tempo bayar"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {submitting ? 'Menyimpan...' : editingVendor ? 'Perbarui Vendor' : 'Simpan Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
