import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const materialId = Number(id);
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const {
      category_id,
      vendor_id,
      material_code,
      material_name,
      specification,
      unit,
      planned_quantity,
      rap_unit_price,
      location,
      notes,
    } = body;

    const plannedQty = Number(planned_quantity);
    const unitPrice = Number(rap_unit_price);
    if (isNaN(plannedQty) || plannedQty <= 0) {
      return NextResponse.json({ error: 'Planned quantity must be greater than 0.' }, { status: 400 });
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: 'Price cannot be negative.' }, { status: 400 });
    }

    const totalPrice = plannedQty * unitPrice;
    const db = await getDb();
    const now = new Date().toISOString();

    db.run(
      `UPDATE materials SET 
        category_id = ?, 
        vendor_id = ?, 
        material_code = ?, 
        material_name = ?, 
        specification = ?, 
        unit = ?, 
        planned_quantity = ?, 
        rap_unit_price = ?, 
        rap_total_price = ?, 
        location = ?, 
        notes = ?, 
        updated_at = ?
      WHERE id = ?`,
      [
        Number(category_id) || 1,
        vendor_id ? Number(vendor_id) : null,
        material_code,
        material_name,
        specification,
        unit,
        plannedQty,
        unitPrice,
        totalPrice,
        location,
        notes,
        now,
        materialId
      ]
    );

    recalculateMaterialStatus(db, materialId);
    persistDb();

    logActivity(user ? user.id : null, 'UPDATE_MATERIAL', 'MATERIAL', materialId, `Updated material ${material_name}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const materialId = Number(id);
    const user = await getUserFromRequest(req);
    const db = await getDb();

    // Check if transactions exist
    const pCheck = db.exec(`SELECT COUNT(*) FROM purchase_transactions WHERE material_id = ${materialId};`);
    const pCount = (pCheck[0]?.values[0][0] as number) || 0;
    if (pCount > 0) {
      return NextResponse.json({ error: `Cannot delete material with ${pCount} associated purchase transactions.` }, { status: 400 });
    }

    db.run(`DELETE FROM materials WHERE id = ${materialId};`);
    persistDb();

    logActivity(user ? user.id : null, 'DELETE_MATERIAL', 'MATERIAL', materialId, `Deleted material ID ${materialId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
