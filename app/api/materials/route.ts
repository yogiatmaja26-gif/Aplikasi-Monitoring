import { NextRequest, NextResponse } from 'next/server';
import { getMaterials, getDb, persistDb, logActivity, recalculateMaterialStatus } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const projectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const vendorId = searchParams.get('vendorId') ? Number(searchParams.get('vendorId')) : undefined;
    const procurementStatus = searchParams.get('procurementStatus') || undefined;
    const receivingStatus = searchParams.get('receivingStatus') || undefined;
    const installationStatus = searchParams.get('installationStatus') || undefined;
    const search = searchParams.get('search') || undefined;

    const materials = await getMaterials({
      projectId,
      categoryId,
      vendorId,
      procurementStatus,
      receivingStatus,
      installationStatus,
      search,
    });

    return NextResponse.json({ materials });
  } catch (error: any) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json();
    const {
      project_id,
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
      source_excel_reference,
    } = body;

    // Validation
    if (!material_name || !material_name.trim()) {
      return NextResponse.json({ error: 'Material name is required.' }, { status: 400 });
    }
    if (!unit || !unit.trim()) {
      return NextResponse.json({ error: 'Unit (satuan) is required.' }, { status: 400 });
    }
    const plannedQty = Number(planned_quantity);
    if (isNaN(plannedQty) || plannedQty <= 0) {
      return NextResponse.json({ error: 'Planned quantity must be greater than 0.' }, { status: 400 });
    }
    const unitPrice = Number(rap_unit_price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return NextResponse.json({ error: 'RAP unit price cannot be negative.' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    // Generate code if not provided
    let code = material_code ? material_code.trim() : '';
    if (!code) {
      const countRes = db.exec("SELECT COUNT(*) FROM materials;");
      const nextNum = (countRes[0]?.values[0][0] as number || 0) + 1;
      code = `MAT-SMR-${String(nextNum).padStart(3, '0')}`;
    }

    // Check code uniqueness
    const codeCheck = db.exec(`SELECT id FROM materials WHERE material_code = '${code.replace(/'/g, "''")}';`);
    if (codeCheck && codeCheck.length > 0 && codeCheck[0].values.length > 0) {
      return NextResponse.json({ error: `Material code '${code}' already exists.` }, { status: 400 });
    }

    const totalPrice = plannedQty * unitPrice;

    db.run(
      `INSERT INTO materials (
        project_id, category_id, vendor_id, material_code, material_name, specification, unit,
        planned_quantity, rap_unit_price, rap_total_price, location, notes, source_excel_reference,
        procurement_status, receiving_status, installation_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_PURCHASED', 'NOT_RECEIVED', 'NOT_INSTALLED', ?)`,
      [
        Number(project_id) || 1,
        Number(category_id) || 1,
        vendor_id ? Number(vendor_id) : null,
        code,
        material_name.trim(),
        specification || null,
        unit.trim(),
        plannedQty,
        unitPrice,
        totalPrice,
        location || null,
        notes || null,
        source_excel_reference || 'Manual Entry',
        now,
      ]
    );

    const newId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);
    recalculateMaterialStatus(db, newId);
    persistDb();

    logActivity(user ? user.id : null, 'CREATE_MATERIAL', 'MATERIAL', newId, `Created material ${material_name} (${code})`);

    return NextResponse.json({ success: true, id: newId, material_code: code }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
