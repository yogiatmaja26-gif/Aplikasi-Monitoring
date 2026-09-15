import { NextRequest, NextResponse } from 'next/server';
import XLSX from 'xlsx';
import { getMaterials } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type') || 'master'; // 'master' | 'procurement' | 'installation'

    const materials = await getMaterials();

    let exportData: any[] = [];
    let sheetName = 'RAP Materials';

    if (type === 'procurement') {
      sheetName = 'Procurement Report';
      exportData = materials.map((m, idx) => ({
        'No': idx + 1,
        'Kode Material': m.material_code,
        'Nama Material': m.material_name,
        'Kategori': m.category_name,
        'Vendor': m.vendor_name || '-',
        'Satuan': m.unit,
        'Volume RAP': m.planned_quantity,
        'Volume Dibeli': m.purchased_quantity || 0,
        'Sisa Pembelian': m.remaining_to_purchase || 0,
        'Harga Satuan RAP (Rp)': m.rap_unit_price,
        'Total RAP (Rp)': m.rap_total_price,
        'Total Realisasi Beli (Rp)': m.actual_total_cost || 0,
        'Selisih / Varian (Rp)': m.rap_total_price - (m.actual_total_cost || 0),
        'Total DP (Rp)': m.total_dp_amount || 0,
        'Total Dibayar (Rp)': m.total_paid_amount || 0,
        'Sisa Hutang / Tagihan (Rp)': Math.max(0, (m.actual_total_cost || 0) - (m.total_paid_amount || 0)),
        'Status Pengadaan': m.procurement_status,
      }));
    } else if (type === 'installation') {
      sheetName = 'Installation Report';
      exportData = materials.map((m, idx) => ({
        'No': idx + 1,
        'Kode Material': m.material_code,
        'Nama Material': m.material_name,
        'Kategori': m.category_name,
        'Lokasi Pasang': m.location || '-',
        'Satuan': m.unit,
        'Volume Rencana': m.planned_quantity,
        'Volume Diterima di Proyek': m.received_quantity || 0,
        'Volume Terpasang': m.installed_quantity || 0,
        'Stok di Proyek (Belum Pasang)': m.remaining_to_install || 0,
        'Progres Fisik (%)': m.progress_percentage || 0,
        'Status Pemasangan': m.installation_status,
      }));
    } else {
      sheetName = 'RAP Master Materials';
      exportData = materials.map((m, idx) => ({
        'No': idx + 1,
        'Kode Material': m.material_code,
        'Kategori Pekerjaan': m.category_name,
        'Nama Material': m.material_name,
        'Spesifikasi': m.specification || '-',
        'Satuan': m.unit,
        'Volume': m.planned_quantity,
        'Harga Satuan (Rp)': m.rap_unit_price,
        'Total Harga RAP (Rp)': m.rap_total_price,
        'Vendor / Toko': m.vendor_name || '-',
        'Lokasi': m.location || '-',
        'Keterangan': m.notes || '-',
        'Vol. Beli': m.purchased_quantity || 0,
        'Vol. Terima': m.received_quantity || 0,
        'Vol. Pasang': m.installed_quantity || 0,
        'Status Pengadaan': m.procurement_status,
        'Status Penerimaan': m.receiving_status,
        'Status Pemasangan': m.installation_status,
        'Progres (%)': m.progress_percentage || 0,
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="RAP_Report_${type}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
