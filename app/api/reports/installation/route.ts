import { NextRequest, NextResponse } from 'next/server';
import { getMaterials } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const installationStatus = searchParams.get('installationStatus') || undefined;

    const materials = await getMaterials({ categoryId, installationStatus });

    const installationReport = materials.map(m => {
      const planned = m.planned_quantity;
      const received = m.received_quantity || 0;
      const installed = m.installed_quantity || 0;
      const remainingInstall = Math.max(0, received - installed);
      const remainingToPlan = Math.max(0, planned - installed);
      const progress = planned > 0 ? Math.min(100, Math.round((installed / planned) * 100)) : 0;

      return {
        id: m.id,
        code: m.material_code,
        name: m.material_name,
        category: m.category_name,
        location: m.location,
        unit: m.unit,
        planned_quantity: planned,
        received_quantity: received,
        installed_quantity: installed,
        remaining_on_site: remainingInstall,
        remaining_to_install: remainingToPlan,
        progress_percentage: progress,
        installation_status: m.installation_status,
      };
    });

    const totalPlanned = installationReport.reduce((a, b) => a + b.planned_quantity, 0);
    const totalReceived = installationReport.reduce((a, b) => a + b.received_quantity, 0);
    const totalInstalled = installationReport.reduce((a, b) => a + b.installed_quantity, 0);
    const overallProgress = totalPlanned > 0 ? Math.min(100, Math.round((totalInstalled / totalPlanned) * 100)) : 0;

    return NextResponse.json({
      items: installationReport,
      summary: {
        total_items: installationReport.length,
        total_planned_volume: totalPlanned,
        total_received_volume: totalReceived,
        total_installed_volume: totalInstalled,
        overall_installation_progress: overallProgress,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
