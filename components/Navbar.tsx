'use client';

import React from 'react';
import { 
  BarChart3, 
  Layers, 
  ShoppingCart, 
  Truck, 
  Wrench, 
  FileSpreadsheet, 
  Users, 
  FileText,
  Shield,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Role } from '@/lib/types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole: Role;
  setCurrentUserRole: (role: Role) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUserRole,
  setCurrentUserRole,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'materials', label: 'Material RAP', icon: Layers },
    { id: 'procurement', label: 'Pengadaan & DP', icon: ShoppingCart },
    { id: 'receiving', label: 'Penerimaan', icon: Truck },
    { id: 'installation', label: 'Pemasangan', icon: Wrench },
    { id: 'excel-import', label: 'Import Excel', icon: FileSpreadsheet },
    { id: 'vendors', label: 'Vendor', icon: Users },
    { id: 'reports', label: 'Laporan & Ekspor', icon: FileText },
  ];

  const roles: { role: Role; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin', desc: 'Akses Penuh' },
    { role: 'PROJECT_MANAGER', label: 'PM', desc: 'Project Manager' },
    { role: 'PURCHASING', label: 'Purchasing', desc: 'Pengadaan & DP' },
    { role: 'SUPERVISOR', label: 'Supervisor', desc: 'Penerimaan & Pasang' },
    { role: 'VIEWER', label: 'Viewer', desc: 'Hanya Lihat' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Bar: Brand & Project & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-sm">
              <Layers className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">RAP MATERIAL CONTROL</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">SYSTEM</span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium tracking-wide">
                PLAN → PURCHASE → RECEIVE → INSTALL → MONITOR → REPORT
              </p>
            </div>
          </div>

          {/* Project & Role Info */}
          <div className="flex items-center space-x-4">
            {/* Project Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Building2 className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-slate-400">Proyek: </span>
                <span className="font-semibold text-white">PRJ-SMR-001 (Samara Interior)</span>
              </div>
            </div>

            {/* Quick Role Switcher */}
            <div className="flex items-center space-x-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-amber-400 ml-1" />
              <span className="text-[11px] text-slate-400 hidden sm:inline">Role:</span>
              <select
                aria-label="Pilih Role Pengguna"
                value={currentUserRole}
                onChange={(e) => setCurrentUserRole(e.target.value as Role)}
                className="bg-slate-900 text-amber-300 text-xs font-semibold py-1 px-2 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {roles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label} - {r.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
