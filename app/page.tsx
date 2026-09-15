'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { MaterialMasterView } from '@/components/MaterialMasterView';
import { ProcurementView } from '@/components/ProcurementView';
import { ReceivingView } from '@/components/ReceivingView';
import { InstallationView } from '@/components/InstallationView';
import { ExcelImportView } from '@/components/ExcelImportView';
import { VendorDirectoryView } from '@/components/VendorDirectoryView';
import { ReportsView } from '@/components/ReportsView';
import { MaterialDetailModal } from '@/components/MaterialDetailModal';
import { Material, WorkCategory, Vendor, DashboardSummary, Role } from '@/lib/types';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<Role>('ADMIN');

  // Master States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Detail Modal State
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  // Quick Action Preselection State
  const [preselectedMaterial, setPreselectedMaterial] = useState<Material | null>(null);

  // Load all master data
  const loadMasterData = async () => {
    try {
      const [matRes, catRes, venRes, sumRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/categories'),
        fetch('/api/vendors'),
        fetch('/api/dashboard/summary'),
      ]);

      const [matData, catData, venData, sumData] = await Promise.all([
        matRes.json(),
        catRes.json(),
        venRes.json(),
        sumRes.json(),
      ]);

      setMaterials(matData.materials || []);
      setCategories(catData.categories || []);
      setVendors(venData.vendors || []);
      setDashboardSummary(sumData);
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Quick action handlers from table or detail modal
  const handleOpenQuickPurchase = (mat: Material) => {
    setPreselectedMaterial(mat);
    setCurrentTab('procurement');
    setSelectedMaterialId(null);
  };

  const handleOpenQuickReceipt = (mat: Material) => {
    setPreselectedMaterial(mat);
    setCurrentTab('receiving');
    setSelectedMaterialId(null);
  };

  const handleOpenQuickInstall = (mat: Material) => {
    setPreselectedMaterial(mat);
    setCurrentTab('installation');
    setSelectedMaterialId(null);
  };

  const handleSelectVendorFilter = (vendorId: number) => {
    setCurrentTab('materials');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* Top Navbar & Role Switcher */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            summary={dashboardSummary}
            loading={loading}
            onSelectMaterial={(id) => setSelectedMaterialId(id)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'materials' && (
          <MaterialMasterView
            materials={materials}
            categories={categories}
            vendors={vendors}
            currentUserRole={currentUserRole}
            loading={loading}
            onRefresh={loadMasterData}
            onSelectMaterial={(id) => setSelectedMaterialId(id)}
            onOpenQuickPurchase={handleOpenQuickPurchase}
            onOpenQuickReceipt={handleOpenQuickReceipt}
            onOpenQuickInstall={handleOpenQuickInstall}
          />
        )}

        {currentTab === 'procurement' && (
          <ProcurementView
            materials={materials}
            vendors={vendors}
            currentUserRole={currentUserRole}
            onRefreshAll={loadMasterData}
            onSelectMaterial={(id) => setSelectedMaterialId(id)}
            preselectedMaterial={preselectedMaterial}
            onClearPreselected={() => setPreselectedMaterial(null)}
          />
        )}

        {currentTab === 'receiving' && (
          <ReceivingView
            materials={materials}
            currentUserRole={currentUserRole}
            onRefreshAll={loadMasterData}
            onSelectMaterial={(id) => setSelectedMaterialId(id)}
            preselectedMaterial={preselectedMaterial}
            onClearPreselected={() => setPreselectedMaterial(null)}
          />
        )}

        {currentTab === 'installation' && (
          <InstallationView
            materials={materials}
            currentUserRole={currentUserRole}
            onRefreshAll={loadMasterData}
            onSelectMaterial={(id) => setSelectedMaterialId(id)}
            preselectedMaterial={preselectedMaterial}
            onClearPreselected={() => setPreselectedMaterial(null)}
          />
        )}

        {currentTab === 'excel-import' && (
          <ExcelImportView
            onRefreshAll={loadMasterData}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'vendors' && (
          <VendorDirectoryView
            vendors={vendors}
            currentUserRole={currentUserRole}
            onRefreshAll={loadMasterData}
            onSelectVendorFilter={handleSelectVendorFilter}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView />
        )}
      </main>

      {/* Material Detail Modal (Lifecycle & Transactions & Photo Gallery) */}
      <MaterialDetailModal
        materialId={selectedMaterialId}
        onClose={() => setSelectedMaterialId(null)}
        currentUserRole={currentUserRole}
        onOpenQuickPurchase={handleOpenQuickPurchase}
        onOpenQuickReceipt={handleOpenQuickReceipt}
        onOpenQuickInstall={handleOpenQuickInstall}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">RAP Material Control System</span>
            <span>• Proyek: PRJ-SMR-001 (Samara Residence)</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            PLAN → PURCHASE → RECEIVE → INSTALL → MONITOR → REPORT
          </div>
        </div>
      </footer>
    </div>
  );
}
