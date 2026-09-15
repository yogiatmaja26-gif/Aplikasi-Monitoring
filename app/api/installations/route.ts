import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { InstallationTransaction } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const materialId = searchParams.get('materialId');

    const db = await getDb();
    let query = `
      SELECT 
        it.*,
        m.material_name,
        m.material_code,
        u.name as creator_name
      FROM installation_transactions it
      JOIN materials m ON it.material_id = m.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE 1=1
    `;

    if (materialId) query += ` AND it.material_id = ${Number(materialId)}`;

    query += ` ORDER BY it.installation_date DESC, it.id DESC;`;

    const res = db.exec(query);
    if (!res || res.length === 0) return NextResponse.json({ installations: [] });

    const cols = res[0].columns;
    const installations: InstallationTransaction[] = res[0].values.map((row: any[]) => {
      const it: Record<string, any> = {};
      cols.forEach((c, idx) => { it[c] = row[idx]; });
      return it as InstallationTransaction;
    });

    return NextResponse.json({ installations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const {
      material_id,
      installation_date,
      quantity_installed,
      unit,
      location,
      installer_name,
      installation_photo_url,
      notes,
    } = body;

    // Validation
    if (!material_id) {
      return NextResponse.json({ error: 'Material is required.' }, { status: 400 });
    }
    if (!installation_date) {
      return NextResponse.json({ error: 'Installation date is required.' }, { status: 400 });
    }
    const qty = Number(quantity_installed);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity installed must be greater than 0.' }, { status: 400 });
    }

    const db = await getDb();

    // Check received vs installed quantities
    const sumsRes = db.exec(`
      SELECT 
        m.material_name,
        m.unit,
        m.planned_quantity,
        COALESCE((SELECT SUM(quantity_received) FROM material_receipts WHERE material_id = m.id), 0) as total_received,
        COALESCE((SELECT SUM(quantity_installed) FROM installation_transactions WHERE material_id = m.id), 0) as total_installed
      FROM materials m
      WHERE m.id = ${Number(material_id)};
    `);

    if (!sumsRes || sumsRes.length === 0 || !sumsRes[0].values[0]) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
    }

    const matName = sumsRes[0].values[0][0] as string;
    const matUnit = sumsRes[0].values[0][1] as string;
    const plannedQty = Number(sumsRes[0].values[0][2]) || 0;
    const totalReceived = Number(sumsRes[0].values[0][3]) || 0;
    const totalInstalled = Number(sumsRes[0].values[0][4]) || 0;

    if (totalReceived <= 0) {
      return NextResponse.json({
        error: `Material "${matName}" belum memiliki bukti penerimaan di lokasi proyek (received quantity = 0). Material harus diterima terlebih dahulu sebelum dipasang.`,
      }, { status: 400 });
    }

    const availableToInstall = totalReceived - totalInstalled;
    if (qty > availableToInstall) {
      return NextResponse.json({
        error: `Jumlah yang ingin dipasang (${qty} ${matUnit}) melebihi stok yang sudah diterima di proyek (${availableToInstall} ${matUnit} tersisa dari total diterima ${totalReceived} ${matUnit}).`,
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO installation_transactions (
        material_id, installation_date, quantity_installed, unit, location,
        installer_name, installation_photo_url, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(material_id),
        installation_date,
        qty,
        unit || matUnit,
        location || null,
        installer_name || 'Tim Tukang',
        installation_photo_url || null,
        notes || null,
        user ? user.id : 1,
        now,
      ]
    );

    const newId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

    // Save photo to material_images
    if (installation_photo_url) {
      db.run(
        `INSERT INTO material_images (material_id, image_type, image_url, caption, uploaded_by, created_at) VALUES (?, 'INSTALLATION', ?, ?, ?, ?)`,
        [Number(material_id), installation_photo_url, `Foto Progres Pemasangan ${qty} ${matUnit} di ${location || 'Lokasi'}`, user ? user.id : 1, now]
      );
    }

    recalculateMaterialStatus(db, Number(material_id));
    persistDb();

    const newTotalInstalled = totalInstalled + qty;
    const progressPct = plannedQty > 0 ? Math.min(100, Math.round((newTotalInstalled / plannedQty) * 100)) : 100;

    logActivity(
      user ? user.id : null,
      'INSTALL_MATERIAL',
      'INSTALLATION',
      newId,
      `Installed ${qty} ${matUnit} of ${matName} (Progress: ${progressPct}%)`
    );

    return NextResponse.json({
      success: true,
      id: newId,
      new_total_installed: newTotalInstalled,
      progress_percentage: progressPct,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
