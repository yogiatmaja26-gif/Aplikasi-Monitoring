import { NextRequest, NextResponse } from 'next/server';
import { getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { MaterialReceipt } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const materialId = searchParams.get('materialId');

    const db = await getDb();
    let query = `
      SELECT 
        mr.*,
        m.material_name,
        m.material_code,
        m.unit,
        pt.invoice_number,
        u.name as creator_name
      FROM material_receipts mr
      JOIN materials m ON mr.material_id = m.id
      LEFT JOIN purchase_transactions pt ON mr.purchase_transaction_id = pt.id
      LEFT JOIN users u ON mr.created_by = u.id
      WHERE 1=1
    `;

    if (materialId) query += ` AND mr.material_id = ${Number(materialId)}`;

    query += ` ORDER BY mr.received_date DESC, mr.id DESC;`;

    const res = db.exec(query);
    if (!res || res.length === 0) return NextResponse.json({ receipts: [] });

    const cols = res[0].columns;
    const receipts: MaterialReceipt[] = res[0].values.map((row: any[]) => {
      const r: Record<string, any> = {};
      cols.forEach((c, idx) => { r[c] = row[idx]; });
      return r as MaterialReceipt;
    });

    return NextResponse.json({ receipts });
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
      purchase_transaction_id,
      received_date,
      quantity_received,
      receiver_name,
      delivery_photo_url,
      notes,
    } = body;

    // Validation
    if (!material_id) {
      return NextResponse.json({ error: 'Material is required.' }, { status: 400 });
    }
    if (!purchase_transaction_id) {
      return NextResponse.json({ error: 'Purchase transaction is required before receiving material.' }, { status: 400 });
    }
    if (!received_date) {
      return NextResponse.json({ error: 'Received date is required.' }, { status: 400 });
    }
    const qty = Number(quantity_received);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity received must be greater than 0.' }, { status: 400 });
    }

    const db = await getDb();

    // Verify purchase transaction exists and check purchased qty
    const ptRes = db.exec(`
      SELECT pt.quantity, COALESCE(SUM(mr.quantity_received), 0) as existing_received, m.material_name, m.unit
      FROM purchase_transactions pt
      JOIN materials m ON pt.material_id = m.id
      LEFT JOIN material_receipts mr ON pt.id = mr.purchase_transaction_id
      WHERE pt.id = ${Number(purchase_transaction_id)}
      GROUP BY pt.id;
    `);

    if (!ptRes || ptRes.length === 0 || !ptRes[0].values[0]) {
      return NextResponse.json({ error: 'Purchase transaction not found.' }, { status: 404 });
    }

    const purchQty = Number(ptRes[0].values[0][0]) || 0;
    const existingRec = Number(ptRes[0].values[0][1]) || 0;
    const matName = ptRes[0].values[0][2] as string;
    const unit = ptRes[0].values[0][3] as string;

    const remainingToReceive = purchQty - existingRec;

    if (qty > remainingToReceive) {
      return NextResponse.json({
        error: `Jumlah penerimaan (${qty} ${unit}) melebihi sisa yang belum diterima pada invoice pembelian ini (${remainingToReceive} ${unit}).`,
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO material_receipts (
        material_id, purchase_transaction_id, received_date, quantity_received,
        receiver_name, delivery_photo_url, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(material_id),
        Number(purchase_transaction_id),
        received_date,
        qty,
        receiver_name || (user ? user.name : 'Supervisor'),
        delivery_photo_url || null,
        notes || null,
        user ? user.id : 1,
        now,
      ]
    );

    const newId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

    // Save image to material_images if delivery photo is uploaded
    if (delivery_photo_url) {
      db.run(
        `INSERT INTO material_images (material_id, image_type, image_url, caption, uploaded_by, created_at) VALUES (?, 'DELIVERY', ?, ?, ?, ?)`,
        [Number(material_id), delivery_photo_url, `Surat Jalan / Penerimaan ${qty} ${unit} - ${receiver_name || 'Site'}`, user ? user.id : 1, now]
      );
    }

    recalculateMaterialStatus(db, Number(material_id));
    persistDb();

    logActivity(
      user ? user.id : null,
      'RECEIVE_MATERIAL',
      'RECEIPT',
      newId,
      `Received ${qty} ${unit} of ${matName} on site (Penerima: ${receiver_name || 'Supervisor'})`
    );

    return NextResponse.json({ success: true, id: newId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
