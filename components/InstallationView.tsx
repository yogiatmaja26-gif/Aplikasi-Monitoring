'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Trash2, 
  Eye, 
  Upload, 
  X, 
  MapPin, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { Material, InstallationTransaction, Role } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';

interface InstallationViewProps {
  materials: Material[];
  currentUserRole: Role;
  onRefreshAll: () => void;
  onSelectMaterial: (id: number) => void;
  preselectedMaterial?: Material | null;
  onClearPreselected?: () => void;
}

export const InstallationView: React.FC<InstallationViewProps> = ({
  materials,
  currentUserRole,
  onRefreshAll,
  onSelectMaterial,
  preselectedMaterial,
  onClearPreselected,
}) => {
  const [installations, setInstallations] = useState<InstallationTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number>(0);
  const [installationDate, setInstallationDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [quantityInstalled, setQuantityInstalled] = useState<number>(1);
  const [location, setLocation] = useState<string>('Kamar Tidur Utama - Lantai 2');
  const [installerName, setInstallerName] = useState<string>('Pak Joko (Mandor Finishing)');
  const [sitePhotoUrl, setSitePhotoUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Load installations
  const loadInstallations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/installations');
      const data = await res.json();
      setInstallations(data.installations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstallations();
  }, []);

  // Materials with stock on site (received > 0)
  const installableMaterials = materials.filter(
    (m) => (m.received_quantity || 0) > 0
  );

  const handleSelectMaterial = (matId: number) => {
    setSelectedMaterialId(matId);
    const m = materials.find((item) => item.id === matId);
    if (m) {
      if (m.location) setLocation(m.location);
      const remainingStock = (m.received_quantity || 0) - (m.installed_quantity || 0);
      setQuantityInstalled(remainingStock > 0 ? remainingStock : 1);
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
    if (installableMaterials.length > 0) {
      handleSelectMaterial(installableMaterials[0].id);
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
      setSitePhotoUrl(data.file_url);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          installation_date: installationDate,
          quantity_installed: Number(quantityInstalled),
          location,
          installer_name: installerName,
          site_photo_url: sitePhotoUrl || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pemasangan');

      setIsModalOpen(false);
      loadInstallations();
      onRefreshAll();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInstallation = async (id: number) => {
    if (!window.confirm('Hapus catatan pemasangan fisik ini?')) return;
    try {
      const res = await fetch(`/api/installations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus pemasangan.');
        return;
      }
      loadInstallations();
      onRefreshAll();
    } catch (err) {
      alert('Terjadi kesalahan.');
    }
  };

  const filteredInstallations = installations.filter((i) => {
    return (
      (i.material_name && i.material_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.material_code && i.material_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.installer_name && i.installer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.location && i.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);
  const currentStockOnSite = selectedMaterial ? (selectedMaterial.received_quantity || 0) - (selectedMaterial.installed_quantity || 0) : 0;

  return (
    <div className="space-y-4">
      {/* Top Header & Metrics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-indigo-600" />
              <span>Pemasangan Fisik Material & Monitoring Progres Lapangan</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan volume terpasang oleh tukang, lokasi titik pasang, dan dokumentasi foto progres lapangan.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pemasangan Baru</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari pemasangan berdasarkan material, kode, mandor, lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Installations List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Tanggal Pasang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Material</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Lokasi / Titik Pasang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Volume Terpasang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Mandor / Tukang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 text-center">Foto Terpasang</th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800">Catatan Progres</th>
                <th className="py-2.5 px-2 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data pemasangan...
                  </td>
                </tr>
              ) : filteredInstallations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada riwayat pemasangan material di proyek.
                  </td>
                </tr>
              ) : (
                filteredInstallations.map((i) => (
                  <tr key={i.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDate(i.installation_date)}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 max-w-[220px]">
                      <button
                        onClick={() => onSelectMaterial(i.material_id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 truncate text-left block w-full"
                      >
                        {i.material_name}
                      </button>
                      <div className="text-[10px] text-slate-400 font-mono">{i.material_code}</div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{i.location || 'Site Kamar Samara'}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                        {formatNumber(i.quantity_installed)} {i.unit}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-800 font-medium">
                      {i.installer_name || '-'}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      {i.site_photo_url ? (
                        <button
                          onClick={() => setPreviewPhoto(i.site_photo_url)}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]"
                        >
                          <Camera className="w-3 h-3 text-indigo-600" />
                          <span>Lihat Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600 text-[11px]">
                      {i.notes || 'Pemasangan rapi dan presisi'}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSelectMaterial(i.material_id)}
                          title="Detail Material"
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {['ADMIN', 'SUPERVISOR', 'PROJECT_MANAGER'].includes(currentUserRole) && (
                          <button
                            onClick={() => handleDeleteInstallation(i.id)}
                            title="Hapus Pemasangan"
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

      {/* Record Installation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>Catat Pemasangan Material Fisik</span>
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

            <form onSubmit={handleCreateInstallation} className="space-y-3 text-xs">
              {/* Select Material */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Material *</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleSelectMaterial(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {installableMaterials.length === 0 ? (
                    <option value="0">Belum ada material yang tiba di proyek.</option>
                  ) : (
                    installableMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.material_code} - {m.material_name} (Stok di Proyek: {(m.received_quantity || 0) - (m.installed_quantity || 0)} {m.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Stock info badge */}
              {selectedMaterial && (
                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-900 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600">Total Diterima di Proyek: </span>
                    <b>{selectedMaterial.received_quantity || 0} {selectedMaterial.unit}</b>
                  </div>
                  <div>
                    <span className="text-slate-600">Sisa Belum Dipasang: </span>
                    <b className="text-indigo-700">{formatNumber(currentStockOnSite)} {selectedMaterial.unit}</b>
                  </div>
                </div>
              )}

              {/* Date & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pasang *</label>
                  <input
                    type="date"
                    required
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume Dipasang *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.001"
                    max={currentStockOnSite > 0 ? currentStockOnSite : undefined}
                    value={quantityInstalled}
                    onChange={(e) => setQuantityInstalled(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Location & Mandor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Pemasangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Plafon Kamar Tidur Utama"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Mandor / Tukang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pak Joko (Mandor Finishing)"
                    value={installerName}
                    onChange={(e) => setInstallerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Site Photo Upload */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto Bukti Fisik Terpasang</label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-200">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Mengunggah...' : 'Upload Foto Lapangan'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {sitePhotoUrl && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Foto Terlampir</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pemasangan</label>
                <input
                  type="text"
                  placeholder="Kerapihan, sisa potongan, atau catatan teknis tukang"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
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
                  disabled={submitting || installableMaterials.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pemasangan'}
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
              <span className="text-xs font-bold">Bukti Fisik Material Terpasang di Lapangan</span>
              <button onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center">
              <img src={previewPhoto} alt="Site Photo" className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
