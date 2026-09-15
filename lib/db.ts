import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';
import { Material, PurchaseTransaction, MaterialReceipt, InstallationTransaction, MaterialImage, ActivityLog, DashboardSummary } from './types';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'rap_material_control.db');

// Helper to format rows from sql.js query results
function formatRows(res: any[]): any[] {
  if (!res || res.length === 0) return [];
  const columns = res[0].columns;
  const values = res[0].values;
  return values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Failed to read existing DB, creating fresh one:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  persistDb();
  await ensureSeedData(dbInstance);
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      project_name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_date TEXT,
      target_end_date TEXT,
      status TEXT NOT NULL DEFAULT 'PLANNING',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS work_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      vendor_id INTEGER,
      material_code TEXT NOT NULL UNIQUE,
      material_name TEXT NOT NULL,
      specification TEXT,
      unit TEXT NOT NULL,
      planned_quantity REAL NOT NULL,
      rap_unit_price REAL NOT NULL,
      rap_total_price REAL NOT NULL,
      location TEXT,
      notes TEXT,
      source_excel_reference TEXT,
      procurement_status TEXT NOT NULL DEFAULT 'NOT_PURCHASED',
      receiving_status TEXT NOT NULL DEFAULT 'NOT_RECEIVED',
      installation_status TEXT NOT NULL DEFAULT 'NOT_INSTALLED',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES work_categories(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      vendor_id INTEGER,
      purchase_date TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'UNPAID',
      dp_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining_payment REAL NOT NULL DEFAULT 0,
      invoice_number TEXT,
      invoice_file_url TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS material_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      purchase_transaction_id INTEGER NOT NULL,
      received_date TEXT NOT NULL,
      quantity_received REAL NOT NULL,
      receiver_name TEXT,
      delivery_photo_url TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (purchase_transaction_id) REFERENCES purchase_transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS installation_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      installation_date TEXT NOT NULL,
      quantity_installed REAL NOT NULL,
      unit TEXT NOT NULL,
      location TEXT,
      installer_name TEXT,
      installation_photo_url TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS material_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      image_type TEXT NOT NULL DEFAULT 'REFERENCE',
      image_url TEXT NOT NULL,
      caption TEXT,
      uploaded_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      material_id INTEGER,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

async function ensureSeedData(db: Database) {
  const userCheck = db.exec("SELECT COUNT(*) as cnt FROM users;");
  const count = userCheck[0]?.values[0][0] as number;
  if (count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial data from RAP - Kamar - Samara copy.xlsx...');
  const now = new Date().toISOString();

  // 1. Users
  const adminHash = await bcrypt.hash('admin123', 10);
  const pmHash = await bcrypt.hash('pm123', 10);
  const purchHash = await bcrypt.hash('purchasing123', 10);
  const supHash = await bcrypt.hash('supervisor123', 10);
  const viewHash = await bcrypt.hash('viewer123', 10);

  db.run(`
    INSERT INTO users (name, email, password_hash, role, created_at) VALUES 
    ('Yogi Atmaja', 'admin@rapcontrol.com', '${adminHash}', 'ADMIN', '${now}'),
    ('Budi Santoso', 'pm@rapcontrol.com', '${pmHash}', 'PROJECT_MANAGER', '${now}'),
    ('Dewi Lestari', 'purchasing@rapcontrol.com', '${purchHash}', 'PURCHASING', '${now}'),
    ('Hendra Wijaya', 'supervisor@rapcontrol.com', '${supHash}', 'SUPERVISOR', '${now}'),
    ('Owner Representative', 'viewer@rapcontrol.com', '${viewHash}', 'VIEWER', '${now}');
  `);

  // 2. Projects
  db.run(`
    INSERT INTO projects (project_code, project_name, description, location, start_date, target_end_date, status, created_at) VALUES
    ('PRJ-SMR-001', 'Renovasi Interior Kamar Samara', 'Proyek renovasi interior luxury master bedroom & ensuite bathroom Samara Residence.', 'Cluster Samara Residence Blok B2/14', '2026-09-01', '2026-11-30', 'ONGOING', '${now}');
  `);

  // 3. Work Categories
  const categories = [
    'Pekerjaan Lantai & Dinding',
    'Pekerjaan Plafon & Finishing Cat',
    'Pekerjaan Elektrikal & Lighting',
    'Pekerjaan Sanitair Kamar Mandi',
    'Pekerjaan Custom Furniture',
    'Pekerjaan Pintu, Kusen & Kaca'
  ];

  for (const cat of categories) {
    db.run(`INSERT INTO work_categories (project_id, category_name, description, created_at) VALUES (1, '${cat}', 'Kategori pekerjaan RAP Samara', '${now}');`);
  }

  // 4. Vendors
  const vendorList = [
    { name: 'Mitra 10 Cibubur', contact: 'Bpk. Ridwan', phone: '0812-3456-7890', address: 'Jl. Raya Alternatif Cibubur KM 3' },
    { name: 'Depo Bangunan', contact: 'Ibu Ratna', phone: '0813-8888-2233', address: 'Jl. Raya Bogor KM 28' },
    { name: 'Toko Baja & Gypsum Sejahtera', contact: 'Bpk. Asep', phone: '0815-4422-1100', address: 'Jl. Akses UI Kelapa Dua' },
    { name: 'Toko Cat Maju Jaya', contact: 'Koh Willy', phone: '0818-9900-5511', address: 'Jl. Margonda Raya No. 45' },
    { name: 'Toko Listrik Terang Abadi', contact: 'Bpk. Anton', phone: '0811-3322-9988', address: 'Pertokoan Glodok Makmur' },
    { name: 'Hafele & Taco Center', contact: 'Sales Project', phone: '021-537-8899', address: 'Taman Tekno BSD' },
    { name: 'Panglong Kayu Samara', contact: 'H. Mansyur', phone: '0812-7711-4433', address: 'Jl. Raya Kranggan No. 12' },
    { name: 'Kaca Maju Cemerlang', contact: 'Bpk. Steven', phone: '0817-6655-2244', address: 'Jl. Pangeran Jayakarta No. 88' }
  ];

  for (const v of vendorList) {
    db.run(`INSERT INTO vendors (vendor_name, contact_person, phone, address, created_at) VALUES ('${v.name}', '${v.contact}', '${v.phone}', '${v.address}', '${now}');`);
  }

  // Map category and vendor IDs
  const catRows = formatRows(db.exec("SELECT id, category_name FROM work_categories;"));
  const catMap: Record<string, number> = {};
  catRows.forEach(r => { catMap[r.category_name] = r.id; });

  const venRows = formatRows(db.exec("SELECT id, vendor_name FROM vendors;"));
  const venMap: Record<string, number> = {};
  venRows.forEach(r => { venMap[r.vendor_name] = r.id; });

  // 5. Read from Excel file to seed materials!
  const excelPath = path.resolve('RAP - Kamar - Samara copy.xlsx');
  if (fs.existsSync(excelPath)) {
    const fileBuffer = fs.readFileSync(excelPath);
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Row 0 is header
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1] || !row[2]) continue;

      const num = row[0] || i;
      const categoryName = String(row[1] || '').trim();
      const materialName = String(row[2] || '').trim();
      const spec = String(row[3] || '').trim();
      const unit = String(row[4] || 'unit').trim();
      const volume = Number(row[5]) || 1;
      const unitPrice = Number(row[6]) || 0;
      const totalPrice = Number(row[7]) || (volume * unitPrice);
      const vendorName = String(row[8] || '').trim();
      const notes = String(row[9] || '').trim();
      const location = String(row[10] || '').trim();

      const catId = catMap[categoryName] || 1;
      const venId = venMap[vendorName] || null;
      const code = `MAT-SMR-${String(num).padStart(3, '0')}`;

      db.run(
        `INSERT INTO materials (project_id, category_id, vendor_id, material_code, material_name, specification, unit, planned_quantity, rap_unit_price, rap_total_price, location, notes, source_excel_reference, procurement_status, receiving_status, installation_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_PURCHASED', 'NOT_RECEIVED', 'NOT_INSTALLED', ?)`,
        [1, catId, venId, code, materialName, spec, unit, volume, unitPrice, totalPrice, location, notes, `RAP Kamar Samara Row ${i + 1}`, now]
      );
    }
  }

  // 6. Seed Realistic Multi-stage Transactions for Granit Tile 60x60 (Material ID 1)
  // Purchase 1: 20 m2
  db.run(
    `INSERT INTO purchase_transactions (material_id, vendor_id, purchase_date, quantity, unit, unit_price, total_price, payment_status, dp_amount, paid_amount, remaining_payment, invoice_number, invoice_file_url, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, venMap['Mitra 10 Cibubur'] || 1, '2026-09-03', 20, 'm2', 265000, 5300000, 'DP', 2000000, 2000000, 3300000, 'INV-M10-8821', '/uploads/sample_invoice_mitra10.jpg', 'DP 40% pembelian batch 1 granit kamar utama', 3, now]
  );
  const purch1Id = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

  // Purchase 2: 8.5 m2 (completing planned 28.5 m2!)
  db.run(
    `INSERT INTO purchase_transactions (material_id, vendor_id, purchase_date, quantity, unit, unit_price, total_price, payment_status, dp_amount, paid_amount, remaining_payment, invoice_number, invoice_file_url, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, venMap['Mitra 10 Cibubur'] || 1, '2026-09-05', 8.5, 'm2', 265000, 2252500, 'PAID', 0, 2252500, 0, 'INV-M10-8910', '/uploads/sample_invoice_mitra10.jpg', 'Pelunasan sisa kekurangan granit kamar tidur', 3, now]
  );
  const purch2Id = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

  // Receiving for Granit: 18 m2 received from Purchase 1
  db.run(
    `INSERT INTO material_receipts (material_id, purchase_transaction_id, received_date, quantity_received, receiver_name, delivery_photo_url, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, purch1Id, '2026-09-06', 18, 'Hendra Wijaya', '/uploads/sample_delivery_granite.jpg', 'Surat Jalan No. SJ-8821/M10 diterima mulus tanpa pecah', 4, now]
  );

  // Installation for Granit: 12 m2 installed
  db.run(
    `INSERT INTO installation_transactions (material_id, installation_date, quantity_installed, unit, location, installer_name, installation_photo_url, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, '2026-09-08', 12, 'm2', 'Lantai Area Tidur Utama', 'Mandor Kusnadi & Team', '/uploads/sample_install_granite.jpg', 'Pemasangan granit nat rapi 2mm menggunakan MU-400', 4, now]
  );

  // Material 6: Gypsum Board 9mm (Purchased 16 lbr, fully received 16 lbr, installed 8 lbr)
  db.run(
    `INSERT INTO purchase_transactions (material_id, vendor_id, purchase_date, quantity, unit, unit_price, total_price, payment_status, dp_amount, paid_amount, remaining_payment, invoice_number, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [6, venMap['Toko Baja & Gypsum Sejahtera'] || 3, '2026-09-04', 16, 'lbr', 82000, 1312000, 'PAID', 0, 1312000, 0, 'INV-GYP-104', 'Lunas Jayaboard plafon', 3, now]
  );
  const purchGypId = (db.exec("SELECT last_insert_rowid() as id;")[0].values[0][0] as number);

  db.run(
    `INSERT INTO material_receipts (material_id, purchase_transaction_id, received_date, quantity_received, receiver_name, delivery_photo_url, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [6, purchGypId, '2026-09-06', 16, 'Hendra Wijaya', '/uploads/sample_delivery_gypsum.jpg', 'Semua lembar gypsum tersimpan di area kering', 4, now]
  );

  db.run(
    `INSERT INTO installation_transactions (material_id, installation_date, quantity_installed, unit, location, installer_name, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [6, '2026-09-09', 8, 'lbr', 'Plafon Kamar Tidur', 'Tukang Plafon Solihin', 'Pemasangan rangka & penutupan 8 lembar pertama', 4, now]
  );

  // Reference Photos
  db.run(`
    INSERT INTO material_images (material_id, image_type, image_url, caption, uploaded_by, created_at) VALUES
    (1, 'REFERENCE', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 'Referensi Pola Lantai Granit 60x60 Cream', 2, '${now}'),
    (1, 'DELIVERY', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80', 'Dokumentasi Kedatangan Granit di Lokasi Proyek', 4, '${now}'),
    (1, 'INSTALLATION', 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80', 'Pemasangan Granit oleh Tim Mandor Kusnadi', 4, '${now}'),
    (6, 'REFERENCE', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 'Model Drop Ceiling Plafon Kamar Tidur Samara', 2, '${now}'),
    (16, 'REFERENCE', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 'Spesifikasi Kloset Duduk Toto Eco Washer', 3, '${now}'),
    (20, 'REFERENCE', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', 'Desain 3D Custom Wardrobe Multiplek HPL Taco Woodgrain', 2, '${now}');
  `);

  // Activity Logs
  db.run(`
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, created_at) VALUES
    (1, 'IMPORT_EXCEL', 'PROJECT', 1, 'Imported 29 RAP Material items from Excel "RAP - Kamar - Samara copy.xlsx"', '${now}'),
    (3, 'CREATE_PURCHASE', 'PURCHASE', 1, 'Created DP purchase for Granit Tile 60x60 (20 m2) at Mitra 10 Cibubur', '${now}'),
    (3, 'CREATE_PURCHASE', 'PURCHASE', 2, 'Created second purchase for Granit Tile 60x60 (8.5 m2) at Mitra 10 Cibubur', '${now}'),
    (4, 'RECEIVE_MATERIAL', 'RECEIPT', 1, 'Received 18 m2 Granit Tile 60x60 on site (Surat Jalan SJ-8821/M10)', '${now}'),
    (4, 'INSTALL_MATERIAL', 'INSTALLATION', 1, 'Installed 12 m2 Granit Tile in Master Bedroom area', '${now}');
  `);

  // Recalculate automatic status for all materials
  recalculateAllMaterialStatuses(db);
  persistDb();
  console.log('Database initialization and seeding completed successfully!');
}

export function recalculateMaterialStatus(db: Database, materialId: number) {
  // 1. Calculate sums
  const res = db.exec(`
    SELECT 
      m.id,
      m.planned_quantity,
      COALESCE((SELECT SUM(quantity) FROM purchase_transactions WHERE material_id = m.id), 0) as purchased_qty,
      COALESCE((SELECT SUM(quantity_received) FROM material_receipts WHERE material_id = m.id), 0) as received_qty,
      COALESCE((SELECT SUM(quantity_installed) FROM installation_transactions WHERE material_id = m.id), 0) as installed_qty
    FROM materials m
    WHERE m.id = ${materialId};
  `);

  if (!res || res.length === 0 || !res[0].values[0]) return;
  const row = res[0].values[0];
  const planned = Number(row[1]) || 0;
  const purchased = Number(row[2]) || 0;
  const received = Number(row[3]) || 0;
  const installed = Number(row[4]) || 0;

  // Procurement Status Rule:
  // - purchased == 0: NOT_PURCHASED
  // - purchased > 0 && purchased < planned: DP_PARTIALLY_PURCHASED
  // - purchased >= planned: PURCHASED
  let procStatus = 'NOT_PURCHASED';
  if (purchased >= planned && planned > 0) {
    procStatus = 'PURCHASED';
  } else if (purchased > 0) {
    procStatus = 'DP_PARTIALLY_PURCHASED';
  }

  // Receiving Status Rule:
  // - received == 0: NOT_RECEIVED
  // - received > 0 && received < purchased: PARTIALLY_RECEIVED
  // - received >= purchased && purchased > 0: FULLY_RECEIVED
  let recStatus = 'NOT_RECEIVED';
  if (received >= purchased && purchased > 0) {
    recStatus = 'FULLY_RECEIVED';
  } else if (received > 0) {
    recStatus = 'PARTIALLY_RECEIVED';
  }

  // Installation Status Rule:
  // - installed == 0: NOT_INSTALLED
  // - installed > 0 && installed < planned: PARTIALLY_INSTALLED
  // - installed >= planned: INSTALLED
  let instStatus = 'NOT_INSTALLED';
  if (installed >= planned && planned > 0) {
    instStatus = 'INSTALLED';
  } else if (installed > 0) {
    instStatus = 'PARTIALLY_INSTALLED';
  }

  db.run(
    `UPDATE materials SET procurement_status = ?, receiving_status = ?, installation_status = ?, updated_at = ? WHERE id = ?`,
    [procStatus, recStatus, instStatus, new Date().toISOString(), materialId]
  );
}

export function recalculateAllMaterialStatuses(db: Database) {
  const materials = db.exec("SELECT id FROM materials;");
  if (!materials || materials.length === 0) return;
  for (const row of materials[0].values) {
    const id = row[0] as number;
    recalculateMaterialStatus(db, id);
  }
}

// Model accessors
export async function getMaterials(filters?: {
  projectId?: number;
  categoryId?: number;
  vendorId?: number;
  procurementStatus?: string;
  receivingStatus?: string;
  installationStatus?: string;
  search?: string;
}): Promise<Material[]> {
  const db = await getDb();
  let query = `
    SELECT 
      m.*,
      c.category_name,
      v.vendor_name,
      p.project_name,
      COALESCE((SELECT SUM(quantity) FROM purchase_transactions WHERE material_id = m.id), 0) as purchased_quantity,
      COALESCE((SELECT SUM(quantity_received) FROM material_receipts WHERE material_id = m.id), 0) as received_quantity,
      COALESCE((SELECT SUM(quantity_installed) FROM installation_transactions WHERE material_id = m.id), 0) as installed_quantity,
      COALESCE((SELECT SUM(total_price) FROM purchase_transactions WHERE material_id = m.id), 0) as actual_total_cost,
      COALESCE((SELECT SUM(dp_amount) FROM purchase_transactions WHERE material_id = m.id), 0) as total_dp_amount,
      COALESCE((SELECT SUM(paid_amount) FROM purchase_transactions WHERE material_id = m.id), 0) as total_paid_amount,
      (SELECT image_url FROM material_images WHERE material_id = m.id ORDER BY id ASC LIMIT 1) as primary_image_url
    FROM materials m
    LEFT JOIN work_categories c ON m.category_id = c.id
    LEFT JOIN vendors v ON m.vendor_id = v.id
    LEFT JOIN projects p ON m.project_id = p.id
    WHERE 1=1
  `;

  if (filters?.projectId) query += ` AND m.project_id = ${Number(filters.projectId)}`;
  if (filters?.categoryId) query += ` AND m.category_id = ${Number(filters.categoryId)}`;
  if (filters?.vendorId) query += ` AND m.vendor_id = ${Number(filters.vendorId)}`;
  if (filters?.procurementStatus) query += ` AND m.procurement_status = '${filters.procurementStatus.replace(/'/g, "''")}'`;
  if (filters?.receivingStatus) query += ` AND m.receiving_status = '${filters.receivingStatus.replace(/'/g, "''")}'`;
  if (filters?.installationStatus) query += ` AND m.installation_status = '${filters.installationStatus.replace(/'/g, "''")}'`;
  if (filters?.search) {
    const s = filters.search.replace(/'/g, "''");
    query += ` AND (m.material_name LIKE '%${s}%' OR m.material_code LIKE '%${s}%' OR m.specification LIKE '%${s}%' OR c.category_name LIKE '%${s}%')`;
  }

  query += ` ORDER BY m.id ASC;`;
  const res = db.exec(query);
  const rows = formatRows(res);

  return rows.map((r: any) => {
    const planned = Number(r.planned_quantity) || 0;
    const purchased = Number(r.purchased_quantity) || 0;
    const received = Number(r.received_quantity) || 0;
    const installed = Number(r.installed_quantity) || 0;

    // Remaining calculations required by formula:
    // remaining_to_purchase = planned_quantity - purchased_quantity
    // remaining_to_receive = purchased_quantity - received_quantity
    // remaining_to_install = received_quantity - installed_quantity
    const remaining_to_purchase = Math.max(0, planned - purchased);
    const remaining_to_receive = Math.max(0, purchased - received);
    const remaining_to_install = Math.max(0, received - installed);
    const progress_percentage = planned > 0 ? Math.min(100, Math.round((installed / planned) * 100)) : 0;

    return {
      ...r,
      planned_quantity: planned,
      rap_unit_price: Number(r.rap_unit_price) || 0,
      rap_total_price: Number(r.rap_total_price) || 0,
      purchased_quantity: purchased,
      received_quantity: received,
      installed_quantity: installed,
      remaining_to_purchase,
      remaining_to_receive,
      remaining_to_install,
      actual_total_cost: Number(r.actual_total_cost) || 0,
      total_dp_amount: Number(r.total_dp_amount) || 0,
      total_paid_amount: Number(r.total_paid_amount) || 0,
      progress_percentage
    };
  });
}

export async function getMaterialDetail(id: number) {
  const db = await getDb();
  const list = await getMaterials();
  const mat = list.find(m => m.id === Number(id));
  if (!mat) return null;

  const purchasesRes = db.exec(`
    SELECT pt.*, v.vendor_name, u.name as creator_name
    FROM purchase_transactions pt
    LEFT JOIN vendors v ON pt.vendor_id = v.id
    LEFT JOIN users u ON pt.created_by = u.id
    WHERE pt.material_id = ${id}
    ORDER BY pt.purchase_date DESC, pt.id DESC;
  `);
  const purchases = formatRows(purchasesRes);

  const receiptsRes = db.exec(`
    SELECT mr.*, pt.invoice_number, u.name as creator_name
    FROM material_receipts mr
    LEFT JOIN purchase_transactions pt ON mr.purchase_transaction_id = pt.id
    LEFT JOIN users u ON mr.created_by = u.id
    WHERE mr.material_id = ${id}
    ORDER BY mr.received_date DESC, mr.id DESC;
  `);
  const receipts = formatRows(receiptsRes);

  const installationsRes = db.exec(`
    SELECT it.*, u.name as creator_name
    FROM installation_transactions it
    LEFT JOIN users u ON it.created_by = u.id
    WHERE it.material_id = ${id}
    ORDER BY it.installation_date DESC, it.id DESC;
  `);
  const installations = formatRows(installationsRes);

  const imagesRes = db.exec(`
    SELECT mi.*, u.name as uploader_name
    FROM material_images mi
    LEFT JOIN users u ON mi.uploaded_by = u.id
    WHERE mi.material_id = ${id}
    ORDER BY mi.id DESC;
  `);
  const images = formatRows(imagesRes);

  return {
    material: mat,
    purchases,
    receipts,
    installations,
    images
  };
}

export async function getDashboardSummary(projectId: number = 1): Promise<DashboardSummary> {
  const db = await getDb();
  const materials = await getMaterials({ projectId });

  const totalMaterials = materials.length;
  let totalRapBudget = 0;
  let totalActualPurchase = 0;
  let totalDp = 0;
  let totalPaid = 0;
  let totalPurchasedItems = 0;
  let totalFullyReceivedItems = 0;
  let totalInstalledItems = 0;

  materials.forEach(m => {
    totalRapBudget += m.rap_total_price;
    totalActualPurchase += (m.actual_total_cost || 0);
    totalDp += (m.total_dp_amount || 0);
    totalPaid += (m.total_paid_amount || 0);
    if (m.procurement_status === 'PURCHASED') totalPurchasedItems++;
    if (m.receiving_status === 'FULLY_RECEIVED') totalFullyReceivedItems++;
    if (m.installation_status === 'INSTALLED') totalInstalledItems++;
  });

  const totalOutstandingPayment = Math.max(0, totalActualPurchase - totalPaid);

  // Status distributions
  const procCounts: Record<string, number> = { NOT_PURCHASED: 0, DP_PARTIALLY_PURCHASED: 0, PURCHASED: 0 };
  const recCounts: Record<string, number> = { NOT_RECEIVED: 0, PARTIALLY_RECEIVED: 0, FULLY_RECEIVED: 0 };
  const instCounts: Record<string, number> = { NOT_INSTALLED: 0, PARTIALLY_INSTALLED: 0, INSTALLED: 0 };

  materials.forEach(m => {
    if (procCounts[m.procurement_status] !== undefined) procCounts[m.procurement_status]++;
    if (recCounts[m.receiving_status] !== undefined) recCounts[m.receiving_status]++;
    if (instCounts[m.installation_status] !== undefined) instCounts[m.installation_status]++;
  });

  // Progress calculations
  const totalPlannedSum = materials.reduce((acc, m) => acc + m.planned_quantity, 0);
  const totalPurchasedSum = materials.reduce((acc, m) => acc + (m.purchased_quantity || 0), 0);
  const totalInstalledSum = materials.reduce((acc, m) => acc + (m.installed_quantity || 0), 0);

  const procProgress = totalPlannedSum > 0 ? Math.min(100, Math.round((totalPurchasedSum / totalPlannedSum) * 100)) : 0;
  const instProgress = totalPlannedSum > 0 ? Math.min(100, Math.round((totalInstalledSum / totalPlannedSum) * 100)) : 0;

  // RAP vs Actual by Category
  const catMap: Record<string, { rap: number; actual: number; count: number }> = {};
  materials.forEach(m => {
    const cat = m.category_name || 'Umum';
    if (!catMap[cat]) catMap[cat] = { rap: 0, actual: 0, count: 0 };
    catMap[cat].rap += m.rap_total_price;
    catMap[cat].actual += (m.actual_total_cost || 0);
    catMap[cat].count += 1;
  });

  const rap_vs_actual_by_category = Object.keys(catMap).map(k => ({
    category_name: k,
    rap_budget: catMap[k].rap,
    actual_spent: catMap[k].actual,
    item_count: catMap[k].count
  }));

  // Attention lists
  const not_purchased = materials.filter(m => m.procurement_status === 'NOT_PURCHASED');
  const dp_status = materials.filter(m => m.procurement_status === 'DP_PARTIALLY_PURCHASED');
  const awaiting_delivery = materials.filter(m => (m.purchased_quantity || 0) > (m.received_quantity || 0));
  const awaiting_installation = materials.filter(m => (m.received_quantity || 0) > (m.installed_quantity || 0));

  // Recent purchases
  const recentPurchRes = db.exec(`
    SELECT pt.*, m.material_name, m.material_code, v.vendor_name, u.name as creator_name
    FROM purchase_transactions pt
    LEFT JOIN materials m ON pt.material_id = m.id
    LEFT JOIN vendors v ON pt.vendor_id = v.id
    LEFT JOIN users u ON pt.created_by = u.id
    ORDER BY pt.purchase_date DESC, pt.id DESC
    LIMIT 6;
  `);
  const recent_purchases = formatRows(recentPurchRes);

  // Recent installations
  const recentInstRes = db.exec(`
    SELECT it.*, m.material_name, m.material_code, u.name as creator_name
    FROM installation_transactions it
    LEFT JOIN materials m ON it.material_id = m.id
    LEFT JOIN users u ON it.created_by = u.id
    ORDER BY it.installation_date DESC, it.id DESC
    LIMIT 6;
  `);
  const recent_installations = formatRows(recentInstRes);

  return {
    total_projects: 1,
    total_material_items: totalMaterials,
    total_rap_budget: totalRapBudget,
    total_actual_purchase: totalActualPurchase,
    total_dp: totalDp,
    total_paid: totalPaid,
    total_outstanding_payment: totalOutstandingPayment,
    total_purchased_items: totalPurchasedItems,
    total_fully_received_items: totalFullyReceivedItems,
    total_installed_items: totalInstalledItems,
    procurement_progress_percentage: procProgress,
    installation_progress_percentage: instProgress,
    status_distributions: {
      procurement: [
        { name: 'Belum Beli (Not Purchased)', value: procCounts.NOT_PURCHASED, color: '#ef4444' },
        { name: 'DP / Sebagian (Partial)', value: procCounts.DP_PARTIALLY_PURCHASED, color: '#eab308' },
        { name: 'Sudah Dibeli (Purchased)', value: procCounts.PURCHASED, color: '#22c55e' }
      ],
      receiving: [
        { name: 'Belum Diterima (Not Received)', value: recCounts.NOT_RECEIVED, color: '#9ca3af' },
        { name: 'Sebagian Diterima (Partial)', value: recCounts.PARTIALLY_RECEIVED, color: '#f97316' },
        { name: 'Diterima Penuh (Fully Received)', value: recCounts.FULLY_RECEIVED, color: '#3b82f6' }
      ],
      installation: [
        { name: 'Belum Terpasang (Not Installed)', value: instCounts.NOT_INSTALLED, color: '#9ca3af' },
        { name: 'Sebagian Terpasang (Partial)', value: instCounts.PARTIALLY_INSTALLED, color: '#f97316' },
        { name: 'Sudah Terpasang (Installed)', value: instCounts.INSTALLED, color: '#3b82f6' }
      ]
    },
    rap_vs_actual_by_category,
    attention_lists: {
      not_purchased,
      dp_status,
      awaiting_delivery,
      awaiting_installation
    },
    recent_purchases,
    recent_installations
  };
}

export function logActivity(userId: number | null, action: string, entityType: string, entityId: number | null, description: string) {
  if (!dbInstance) return;
  const now = new Date().toISOString();
  dbInstance.run(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, entityType, entityId, description, now]
  );
  persistDb();
}
