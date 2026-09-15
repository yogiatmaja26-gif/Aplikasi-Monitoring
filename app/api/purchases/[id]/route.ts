import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = Number(id);
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const {
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

    const db = await getDb();
    const existing = db.exec(`SELECT material_id FROM purchase_transactions WHERE id = ${purchaseId};`);
    if (!existing || existing.length === 0 || !existing[0].values[0]) {
      return NextResponse.json({ error: 'Purchase transaction not found' }, { status: 404 });
    }
    const materialId = existing[0].values[0][0] as number;

    const qty = Number(quantity);
    const price = Number(unit_price);
    const totalPrice = qty * price;
    let dp = Number(dp_amount) || 0;
    let paid = Number(paid_amount) || 0;

    let status = payment_status || 'UNPAID';
    if (status === 'PAID') {
      paid = totalPrice;
      dp = 0;
    }
    const remaining = Math.max(0, totalPrice - paid);

    const now = new Date().toISOString();

    db.run(
      `UPDATE purchase_transactions SET 
        vendor_id = ?, purchase_date = ?, quantity = ?, unit = ?, unit_price = ?, total_price = ?,
        payment_status = ?, dp_amount = ?, paid_amount = ?, remaining_payment = ?,
        invoice_number = ?, invoice_file_url = ?, notes = ?, updated_at = ?
      WHERE id = ?`,
      [
        vendor_id ? Number(vendor_id) : null,
        purchase_date,
        qty,
        unit,
        price,
        totalPrice,
        status,
        dp,
        paid,
        remaining,
        invoice_number || null,
        invoice_file_url || null,
        notes || null,
        now,
        purchaseId,
      ]
    );

    recalculateMaterialStatus(db, materialId);
    persistDb();

    logActivity(user ? user.id : null, 'UPDATE_PURCHASE', 'PURCHASE', purchaseId, `Updated purchase transaction ID ${purchaseId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchaseId = Number(id);
    const user = await getUserFromRequest(req);
    const db = await getDb();

    const existing = db.exec(`SELECT material_id FROM purchase_transactions WHERE id = ${purchaseId};`);
    if (!existing || existing.length === 0 || !existing[0].values[0]) {
      return NextResponse.json({ error: 'Purchase transaction not found' }, { status: 404 });
    }
    const materialId = existing[0].values[0][0] as number;

    // Check if receipts exist for this purchase
    const recCheck = db.exec(`SELECT COUNT(*) FROM material_receipts WHERE purchase_transaction_id = ${purchaseId};`);
    const recCount = (recCheck[0]?.values[0][0] as number) || 0;
    if (recCount > 0) {
      return NextResponse.json({ error: `Cannot delete purchase transaction with ${recCount} linked delivery receipts. Delete receipts first.` }, { status: 400 });
    }

    db.run(`DELETE FROM purchase_transactions WHERE id = ${purchaseId};`);
    recalculateMaterialStatus(db, materialId);
    persistDb();

    logActivity(user ? user.id : null, 'DELETE_PURCHASE', 'PURCHASE', purchaseId, `Deleted purchase transaction ID ${purchaseId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
