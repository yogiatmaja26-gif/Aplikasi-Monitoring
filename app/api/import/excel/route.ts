import { NextRequest, NextResponse } from 'next/server';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { getDb, persistDb, logActivity, recalculateAllMaterialStatuses } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let selectedSheet: string | null = null;
    let executeImport = false;
    let projectId = 1;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      selectedSheet = (formData.get('sheet') as string) || null;
      executeImport = formData.get('execute') === 'true';
      if (formData.get('projectId')) {
        projectId = Number(formData.get('projectId'));
      }

      if (file) {
        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
      } else {
        // Fallback to default Excel file
        const defaultPath = path.resolve('RAP - Kamar - Samara copy.xlsx');
        if (!fs.existsSync(defaultPath)) {
          return NextResponse.json({ error: 'No file provided and default Excel not found.' }, { status: 400 });
        }
        buffer = fs.readFileSync(defaultPath);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      selectedSheet = body.sheet || null;
      executeImport = body.execute === true;
      if (body.projectId) projectId = Number(body.projectId);

      const defaultPath = path.resolve('RAP - Kamar - Samara copy.xlsx');
      if (!fs.existsSync(defaultPath)) {
        return NextResponse.json({ error: 'Default Excel file not found.' }, { status: 400 });
      }
      buffer = fs.readFileSync(defaultPath);
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      return NextResponse.json({ error: 'Excel file has no sheets.' }, { status: 400 });
    }

    const targetSheet = selectedSheet && sheetNames.includes(selectedSheet) ? selectedSheet : sheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rawRows.length <= 1) {
      return NextResponse.json({
        sheetNames,
        selectedSheet: targetSheet,
        message: 'Sheet contains no data or only headers',
        rows: [],
      });
    }

    // Header detection
    const headerRow = rawRows[0] || [];
    const parsedRows: any[] = [];
    const errors: string[] = [];

    let totalRapBudget = 0;
    const categoriesFound = new Set<string>();
    const vendorsFound = new Set<string>();

    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!r || r.length === 0) continue;

      // Extract fields based on detected headers or column indexes:
      // [No, Uraian Pekerjaan, Material, Spesifikasi, Satuan, Volume, Harga Satuan, Total Harga, Toko/Vendor, Keterangan, Lokasi]
      const num = r[0];
      const category = String(r[1] || '').trim();
      const material = String(r[2] || '').trim();
      const spec = String(r[3] || '').trim();
      const unit = String(r[4] || '').trim();
      const volume = Number(r[5]);
      const unitPrice = Number(r[6]);
      const totalPrice = Number(r[7]) || (volume * unitPrice);
      const vendor = String(r[8] || '').trim();
      const notes = String(r[9] || '').trim();
      const location = String(r[10] || '').trim();

      // Skip summary / total row
      if (category.toLowerCase().includes('total') || material.toLowerCase().includes('total') || (!material && !category)) {
        continue;
      }

      const rowValidationErrors: string[] = [];
      if (!material) rowValidationErrors.push('Material name missing');
      if (!unit) rowValidationErrors.push('Unit missing');
      if (isNaN(volume) || volume <= 0) rowValidationErrors.push('Volume must be > 0');
      if (isNaN(unitPrice) || unitPrice < 0) rowValidationErrors.push('Unit price invalid');

      if (category) categoriesFound.add(category);
      if (vendor) vendorsFound.add(vendor);
      if (!isNaN(totalPrice)) totalRapBudget += totalPrice;

      parsedRows.push({
        rowIndex: i + 1,
        no: num || i,
        category: category || 'Pekerjaan Umum',
        material,
        spec,
        unit: unit || 'unit',
        volume: volume || 0,
        unitPrice: unitPrice || 0,
        totalPrice: totalPrice || 0,
        vendor: vendor || null,
        notes: notes || null,
        location: location || null,
        isValid: rowValidationErrors.length === 0,
        validationErrors: rowValidationErrors,
      });
    }

    // If only preview was requested (executeImport === false), return preview and summary
    if (!executeImport) {
      return NextResponse.json({
        sheetNames,
        selectedSheet: targetSheet,
        totalRows: rawRows.length - 1,
        validRowsCount: parsedRows.filter(r => r.isValid).length,
        invalidRowsCount: parsedRows.filter(r => !r.isValid).length,
        categories: Array.from(categoriesFound),
        vendors: Array.from(vendorsFound),
        estimatedTotalBudget: totalRapBudget,
        preview: parsedRows.slice(0, 15),
      });
    }

    // EXECUTE IMPORT INTO DATABASE
    const db = await getDb();
    const now = new Date().toISOString();

    // 1. Ensure Categories exist
    const catMap: Record<string, number> = {};
    for (const cat of categoriesFound) {
      const existing = db.exec(`SELECT id FROM work_categories WHERE project_id = ${projectId} AND category_name = '${cat.replace(/'/g, "''")}';`);
      if (existing && existing.length > 0 && existing[0].values.length > 0) {
        catMap[cat] = existing[0].values[0][0] as number;
      } else {
        db.run(`INSERT INTO work_categories (project_id, category_name, description, created_at) VALUES (?, ?, 'Imported from Excel', ?)`, [projectId, cat, now]);
        catMap[cat] = db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number;
      }
    }

    // 2. Ensure Vendors exist
    const venMap: Record<string, number> = {};
    for (const ven of vendorsFound) {
      const existing = db.exec(`SELECT id FROM vendors WHERE vendor_name = '${ven.replace(/'/g, "''")}';`);
      if (existing && existing.length > 0 && existing[0].values.length > 0) {
        venMap[ven] = existing[0].values[0][0] as number;
      } else {
        db.run(`INSERT INTO vendors (vendor_name, notes, created_at) VALUES (?, 'Imported from Excel', ?)`, [ven, now]);
        venMap[ven] = db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number;
      }
    }

    // 3. Insert Materials
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of parsedRows) {
      if (!row.isValid) {
        skippedCount++;
        continue;
      }

      const catId = catMap[row.category] || 1;
      const venId = row.vendor ? venMap[row.vendor] || null : null;
      const code = `MAT-SMR-${String(row.no).padStart(3, '0')}`;

      // Check if material with same code or name already exists
      const existCheck = db.exec(`SELECT id FROM materials WHERE material_code = '${code}' OR (project_id = ${projectId} AND material_name = '${row.material.replace(/'/g, "''")}');`);
      if (existCheck && existCheck.length > 0 && existCheck[0].values.length > 0) {
        // Update planned volume and price
        const matId = existCheck[0].values[0][0] as number;
        db.run(
          `UPDATE materials SET 
            category_id = ?, vendor_id = ?, specification = ?, unit = ?,
            planned_quantity = ?, rap_unit_price = ?, rap_total_price = ?,
            location = ?, notes = ?, source_excel_reference = ?, updated_at = ?
          WHERE id = ?`,
          [
            catId,
            venId,
            row.spec || null,
            row.unit,
            row.volume,
            row.unitPrice,
            row.totalPrice,
            row.location || null,
            row.notes || null,
            `Excel ${targetSheet} Row ${row.rowIndex}`,
            now,
            matId,
          ]
        );
        importedCount++;
      } else {
        db.run(
          `INSERT INTO materials (
            project_id, category_id, vendor_id, material_code, material_name, specification,
            unit, planned_quantity, rap_unit_price, rap_total_price, location, notes,
            source_excel_reference, procurement_status, receiving_status, installation_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_PURCHASED', 'NOT_RECEIVED', 'NOT_INSTALLED', ?)`,
          [
            projectId,
            catId,
            venId,
            code,
            row.material,
            row.spec || null,
            row.unit,
            row.volume,
            row.unitPrice,
            row.totalPrice,
            row.location || null,
            row.notes || null,
            `Excel ${targetSheet} Row ${row.rowIndex}`,
            now,
          ]
        );
        importedCount++;
      }
    }

    recalculateAllMaterialStatuses(db);
    persistDb();

    logActivity(
      user ? user.id : null,
      'IMPORT_EXCEL',
      'PROJECT',
      projectId,
      `Imported ${importedCount} materials from sheet "${targetSheet}" (Total Budget: Rp ${totalRapBudget.toLocaleString('id-ID')})`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully processed Excel sheet "${targetSheet}".`,
      summary: {
        totalRowsInFile: parsedRows.length,
        importedItems: importedCount,
        skippedItems: skippedCount,
        categoriesCreated: Object.keys(catMap).length,
        vendorsCreated: Object.keys(venMap).length,
        totalRapBudget,
      },
    });
  } catch (error: any) {
    console.error('Excel import error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}
