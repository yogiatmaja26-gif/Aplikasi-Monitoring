import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const vendorId = Number(id);

    const vendorRes = db.exec(`SELECT * FROM vendors WHERE id = ${vendorId};`);
    if (!vendorRes || vendorRes.length === 0 || !vendorRes[0].values[0]) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const cols = vendorRes[0].columns;
    const vendor: Record<string, any> = {};
    cols.forEach((c, idx) => { vendor[c] = vendorRes[0].values[0][idx]; });

    // Materials supplied
    const matRes = db.exec(`SELECT id, material_code, material_name, unit, planned_quantity, rap_total_price, procurement_status FROM materials WHERE vendor_id = ${vendorId};`);
    const materials = matRes && matRes.length > 0 ? matRes[0].values.map((row: any[]) => {
      const m: Record<string, any> = {};
      matRes[0].columns.forEach((c, i) => { m[c] = row[i]; });
      return m;
    }) : [];

    // Purchase history
    const purchRes = db.exec(`
      SELECT pt.*, m.material_name, m.material_code 
      FROM purchase_transactions pt 
      JOIN materials m ON pt.material_id = m.id 
      WHERE pt.vendor_id = ${vendorId}
      ORDER BY pt.purchase_date DESC;
    `);
    const purchases = purchRes && purchRes.length > 0 ? purchRes[0].values.map((row: any[]) => {
      const p: Record<string, any> = {};
      purchRes[0].columns.forEach((c, i) => { p[c] = row[i]; });
      return p;
    }) : [];

    return NextResponse.json({ vendor, materials, purchases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { vendor_name, contact_person, phone, email, address, notes } = body;

    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `UPDATE vendors SET vendor_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [vendor_name, contact_person, phone, email, address, notes, now, Number(id)]
    );
    persistDb();

    logActivity(user ? user.id : null, 'UPDATE_VENDOR', 'VENDOR', Number(id), `Updated vendor ${vendor_name}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    const db = await getDb();

    // Check if vendor has purchase transactions
    const checkPurch = db.exec(`SELECT COUNT(*) FROM purchase_transactions WHERE vendor_id = ${Number(id)};`);
    const purchCount = checkPurch[0]?.values[0][0] as number;
    if (purchCount > 0) {
      return NextResponse.json({ error: `Cannot delete vendor with ${purchCount} existing purchase transactions.` }, { status: 400 });
    }

    db.run(`DELETE FROM vendors WHERE id = ${Number(id)};`);
    persistDb();

    logActivity(user ? user.id : null, 'DELETE_VENDOR', 'VENDOR', Number(id), `Deleted vendor ID ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
