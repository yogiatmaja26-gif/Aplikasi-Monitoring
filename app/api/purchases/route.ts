import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { PurchaseTransaction } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const materialId = searchParams.get('materialId');
    const vendorId = searchParams.get('vendorId');
    const paymentStatus = searchParams.get('paymentStatus');

    const db = await getDb();
    let query = `
      SELECT 
        pt.*,
        m.material_name,
        m.material_code,
        v.vendor_name,
        u.name as creator_name
      FROM purchase_transactions pt
      JOIN materials m ON pt.material_id = m.id
      LEFT JOIN vendors v ON pt.vendor_id = v.id
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE 1=1
    `;

    if (materialId) query += ` AND pt.material_id = ${Number(materialId)}`;
    if (vendorId) query += ` AND pt.vendor_id = ${Number(vendorId)}`;
    if (paymentStatus) query += ` AND pt.payment_status = '${paymentStatus.replace(/'/g, "''")}'`;

    query += ` ORDER BY pt.purchase_date DESC, pt.id DESC;`;

    const res = db.exec(query);
    if (!res || res.length === 0) return NextResponse.json({ purchases: [] });

    const cols = res[0].columns;
    const purchases: PurchaseTransaction[] = res[0].values.map((row: any[]) => {
      const p: Record<string, any> = {};
      cols.forEach((c, idx) => { p[c] = row[idx]; });
      return p as PurchaseTransaction;
    });

    return NextResponse.json({ purchases });
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
      vendor_id,
      purchase_date,
      quantity,
      unit,
      unit_price,
      payment_status,
      dp_amount,
      paid_amount,
      invoice_number,
      invoice_file_url,
      notes,
    } = body;

    // Validation
    if (!material_id) {
      return NextResponse.json({ error: 'Material is required.' }, { status: 400 });
    }
    if (!purchase_date) {
      return NextResponse.json({ error: 'Purchase date is required.' }, { status: 400 });
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0.' }, { status: 400 });
    }
    const price = Number(unit_price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Unit price cannot be negative.' }, { status: 400 });
    }

    const totalPrice = qty * price;
    let dp = Number(dp_amount) || 0;
    let paid = Number(paid_amount) || 0;

    let status = payment_status || 'UNPAID';
    if (status === 'DP' && dp > 0 && paid === 0) {
      paid = dp;
    } else if (status === 'PAID') {
      paid = totalPrice;
      dp = 0;
    }

    const remaining = Math.max(0, totalPrice - paid);

    const db = await getDb();

    // Check material planned quantity for warning
    const matRes = db.exec(`
      SELECT m.material_name, m.planned_quantity, COALESCE(SUM(pt.quantity), 0) as existing_purchased
      FROM materials m
      LEFT JOIN purchase_transactions pt ON m.id = pt.material_id
      WHERE m.id = ${Number(material_id)}
      GROUP BY m.id;
    `);

    let warning: string | null = null;
    let materialName = 'Material';
    if (matRes && matRes.length > 0 && matRes[0].values[0]) {
      materialName = matRes[0].values[0][0] as string;
      const planned = Number(matRes[0].values[0][1]) || 0;
      const existing = Number(matRes[0].values[0][2]) || 0;
      if (existing + qty > planned) {
        warning = `Perhatian: Total pembelian (${existing + qty}) melebihi volume RAP yang direncanakan (${planned}).`;
      }
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO purchase_transactions (
        material_id, vendor_id, purchase_date, quantity, unit, unit_price, total_price,
        payment_status, dp_amount, paid_amount, remaining_payment, invoice_number,
        invoice_file_url, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(material_id),
        vendor_id ? Number(vendor_id) : null,
        purchase_date,
        qty,
        unit || 'unit',
        price,
        totalPrice,
        status,
        dp,
        paid,
        remaining,
        invoice_number || null,
        invoice_file_url || null,
        notes || null,
        user ? user.id : 1,
        now,
      ]
    );

    const newId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

    // Recalculate automatic status for this material
    recalculateMaterialStatus(db, Number(material_id));
    persistDb();

    logActivity(
      user ? user.id : null,
      'CREATE_PURCHASE',
      'PURCHASE',
      newId,
      `Purchased ${qty} ${unit} of ${materialName} (${status}) - Rp ${totalPrice.toLocaleString('id-ID')}`
    );

    return NextResponse.json({
      success: true,
      id: newId,
      total_price: totalPrice,
      warning,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
