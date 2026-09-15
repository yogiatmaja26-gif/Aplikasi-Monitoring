import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('RAP - Kamar - Samara copy.xlsx');
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

console.log('=== EXCEL INSPECTION RESULT ===');
console.log('Sheet Names:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  console.log(`Dimensions: ${sheet['!ref']} (Rows: ${range.e.r + 1}, Cols: ${range.e.c + 1})`);
  
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (rows.length > 0) {
    console.log('Row 1 (Header/Title):', rows[0]);
    if (rows.length > 1) {
      console.log('Row 2:', rows[1]);
    }
    if (rows.length > 2) {
      console.log('Row 3:', rows[2]);
    }
  }
}
