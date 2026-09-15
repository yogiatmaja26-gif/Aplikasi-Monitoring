import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const db = await getDb();
    const res = db.exec(`
      SELECT 
        v.*,
        (SELECT COUNT(*) FROM materials WHERE vendor_id = v.id) as supplied_materials_count,
        (SELECT COUNT(*) FROM purchase_transactions WHERE vendor_id = v.id) as total_purchases_count,
        (SELECT COALESCE(SUM(total_price), 0) FROM purchase_transactions WHERE vendor_id = v.id) as total_purchase_value,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM purchase_transactions WHERE vendor_id = v.id) as total_paid_amount,
        (SELECT COALESCE(SUM(remaining_payment), 0) FROM purchase_transactions WHERE vendor_id = v.id) as outstanding_payment
      FROM vendors v
      ORDER BY v.id ASC;
    `);

    if (!res || res.length === 0) return NextResponse.json({ vendors: [] });

    const columns = res[0].columns;
    const vendors = res[0].values.map((row: any[]) => {
      const obj: Record<string, any> = {};
      columns.forEach((c, idx) => { obj[c] = row[idx]; });
      return obj;
    });

    return NextResponse.json({ vendors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const { vendor_name, contact_person, phone, email, address, notes } = body;

    if (!vendor_name) {
      return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO vendors (vendor_name, contact_person, phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vendor_name.trim(), contact_person || null, phone || null, email || null, address || null, notes || null, now]
    );

    const newId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);
    persistDb();

    logActivity(user ? user.id : null, 'CREATE_VENDOR', 'VENDOR', newId, `Created vendor ${vendor_name}`);

    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
