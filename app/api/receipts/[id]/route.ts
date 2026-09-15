import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const receiptId = Number(id);
    const user = await getUserFromRequest(req);
    const db = await getDb();

    const existing = db.exec(`SELECT material_id FROM material_receipts WHERE id = ${receiptId};`);
    if (!existing || existing.length === 0 || !existing[0].values[0]) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    const materialId = existing[0].values[0][0] as number;

    db.run(`DELETE FROM material_receipts WHERE id = ${receiptId};`);
    recalculateMaterialStatus(db, materialId);
    persistDb();

    logActivity(user ? user.id : null, 'DELETE_RECEIPT', 'RECEIPT', receiptId, `Deleted receipt record ID ${receiptId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
