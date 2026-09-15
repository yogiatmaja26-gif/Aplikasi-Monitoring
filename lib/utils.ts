import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num: number, decimals: number = 1): string {
  if (num === undefined || num === null) return '0';
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(decimals);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getProcurementBadge(status: string) {
  switch (status) {
    case 'PURCHASED':
      return {
        label: 'Sudah Dibeli',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'DP_PARTIALLY_PURCHASED':
      return {
        label: 'DP / Sebagian',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    default:
      return {
        label: 'Belum Dibeli',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
  }
}

export function getReceivingBadge(status: string) {
  switch (status) {
    case 'FULLY_RECEIVED':
      return {
        label: 'Diterima Penuh',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'PARTIALLY_RECEIVED':
      return {
        label: 'Sebagian Diterima',
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
      };
    default:
      return {
        label: 'Belum Diterima',
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getInstallationBadge(status: string) {
  switch (status) {
    case 'INSTALLED':
      return {
        label: 'Terpasang',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'PARTIALLY_INSTALLED':
      return {
        label: 'Sebagian Pasang',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    default:
      return {
        label: 'Belum Terpasang',
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}
