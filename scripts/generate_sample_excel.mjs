import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const data = [
  // Header row
  [
    'No',
    'Uraian Pekerjaan',
    'Material',
    'Spesifikasi',
    'Satuan',
    'Volume',
    'Harga Satuan (Rp)',
    'Total Harga (Rp)',
    'Toko / Vendor',
    'Keterangan',
    'Lampiran / Lokasi'
  ],
  // Category 1: Pekerjaan Lantai & Dinding
  [
    1,
    'Pekerjaan Lantai & Dinding',
    'Granit Tile 60x60',
    'Roman dCastello Cream Glazed Polished Grade A',
    'm2',
    28.5,
    265000,
    7552500,
    'Mitra 10 Cibubur',
    'Lantai utama kamar tidur & dressing area',
    'Kamar Master - Lantai 2'
  ],
  [
    2,
    'Pekerjaan Lantai & Dinding',
    'Keramik Dinding Kamar Mandi 30x60',
    'Habitat Calacatta White Satin Finish',
    'm2',
    22.0,
    195000,
    4290000,
    'Mitra 10 Cibubur',
    'Dinding basah & area shower',
    'Kamar Mandi Dalam'
  ],
  [
    3,
    'Pekerjaan Lantai & Dinding',
    'Semen Instan Perekat Keramik (Tile Adhesive)',
    'MU-400 GranitFix 40kg',
    'sak',
    12,
    115000,
    1380000,
    'Depo Bangunan',
    'Untuk pemasangan granit & dinding keramik',
    'Kamar & KM'
  ],
  [
    4,
    'Pekerjaan Lantai & Dinding',
    'Tile Grout Pengisi Nat',
    'AM 53 Tile Grout Anti Jamur White & Cream',
    'sak',
    8,
    28000,
    224000,
    'Depo Bangunan',
    'Warna disesuaikan warna keramik & granit',
    'Kamar & KM'
  ],
  [
    5,
    'Pekerjaan Lantai & Dinding',
    'Plint Granit 10x60',
    'Roman dCastello Cream Custom Cutting Bevel',
    'm1',
    18.0,
    45000,
    810000,
    'Mitra 10 Cibubur',
    'Keliling perimeter dinding kamar tidur',
    'Kamar Master'
  ],
  // Category 2: Pekerjaan Plafon & Finishing Cat
  [
    6,
    'Pekerjaan Plafon & Finishing Cat',
    'Gypsum Board 9mm',
    'Jayaboard Sheetrock 9mm 120x240cm',
    'lbr',
    16,
    82000,
    1312000,
    'Toko Baja & Gypsum Sejahtera',
    'Plafon flat & drop ceiling ambalan LED',
    'Plafon Kamar'
  ],
  [
    7,
    'Pekerjaan Plafon & Finishing Cat',
    'Rangka Hollow Galvanis 4x4 & 2x4',
    'Galvanis Tebal 0.35mm Banci Sni',
    'btg',
    24,
    36000,
    864000,
    'Toko Baja & Gypsum Sejahtera',
    'Rangka utama plafon kamar tidur & KM',
    'Plafon Kamar'
  ],
  [
    8,
    'Pekerjaan Plafon & Finishing Cat',
    'Compound Gypsum & Cornice',
    'Aplus Cornice Adhesive 20kg',
    'sak',
    3,
    78000,
    234000,
    'Toko Baja & Gypsum Sejahtera',
    'Penyambungan nat gypsum & perataan',
    'Plafon Kamar'
  ],
  [
    9,
    'Pekerjaan Plafon & Finishing Cat',
    'Cat Dasar Interior (Alkali Resisting Primer)',
    'Dulux Catylac Alkali Killer Sealer 20L',
    'pail',
    1,
    890000,
    890000,
    'Toko Cat Maju Jaya',
    'Primer sebelum cat dinding utama',
    'Dinding Kamar'
  ],
  [
    10,
    'Pekerjaan Plafon & Finishing Cat',
    'Cat Dinding Interior Premium',
    'Dulux Pentalite EasyClean Warm Cashmere 20L',
    'pail',
    2,
    1450000,
    2900000,
    'Toko Cat Maju Jaya',
    'Warna interior warm tone mewah kode 40YY 77/110',
    'Dinding Kamar'
  ],
  [
    11,
    'Pekerjaan Plafon & Finishing Cat',
    'Cat Plafon Anti Lembab',
    'Propan Eco Emulsion Ceiling White 5kg',
    'galon',
    2,
    145000,
    290000,
    'Toko Cat Maju Jaya',
    'Warna putih super matte',
    'Plafon Kamar & KM'
  ],
  // Category 3: Pekerjaan Elektrikal & Lighting
  [
    12,
    'Pekerjaan Elektrikal & Lighting',
    'Downlight LED Recessed 9W',
    'Philips Meson 9W 6500K / 3000K Warm White 4 inch',
    'bh',
    10,
    62000,
    620000,
    'Toko Listrik Terang Abadi',
    'Titik lampu plafon kamar & walk-in area',
    'Plafon Kamar'
  ],
  [
    13,
    'Pekerjaan Elektrikal & Lighting',
    'LED Strip Cove Light 2835',
    'In-Lite COB LED Strip 24V 3000K Warm + Trafo Meanwell',
    'roll',
    2,
    385000,
    770000,
    'Toko Listrik Terang Abadi',
    'Pencahayaan hidden drop ceiling & ambalan headboard',
    'Drop Ceiling & Headboard'
  ],
  [
    14,
    'Pekerjaan Elektrikal & Lighting',
    'Saklar & Stop Kontak Modul Designer',
    'Schneider Vivace Dark Grey Metallic (1 & 2 Gang)',
    'set',
    12,
    58000,
    696000,
    'Toko Listrik Terang Abadi',
    'Saklar lampu kamar, bedside stop kontak USB, AC',
    'Dinding Kamar'
  ],
  [
    15,
    'Pekerjaan Elektrikal & Lighting',
    'Kabel Listrik Tembaga NYM 3x2.5mm',
    'Supreme NYM 3x2.5mm Roll 50 Meter',
    'roll',
    1,
    785000,
    785000,
    'Toko Listrik Terang Abadi',
    'Instalasi jalur stop kontak & AC kamar',
    'Instalasi Jalur Dinding'
  ],
  // Category 4: Pekerjaan Sanitair Kamar Mandi
  [
    16,
    'Pekerjaan Sanitair Kamar Mandi',
    'Kloset Duduk Eco Washer',
    'Toto CW421J / SW420JP White Soft Closing Dual Flush',
    'set',
    1,
    2850000,
    2850000,
    'Depo Bangunan',
    'Lengkap tee stop kran flexible & jet washer toto',
    'Kamar Mandi'
  ],
  [
    17,
    'Pekerjaan Sanitair Kamar Mandi',
    'Shower Column Set Mixer Panas Dingin',
    'Wasser Rain Shower Set ESS-D330 Black Matte',
    'set',
    1,
    1850000,
    1850000,
    'Depo Bangunan',
    'Mixer kran panas dingin dengan hand shower',
    'Area Shower KM'
  ],
  [
    18,
    'Pekerjaan Sanitair Kamar Mandi',
    'Wastafel Meja & Keran Dingin',
    'Toto LW246J Countertop Basin + Keran Dingin TX109LD',
    'set',
    1,
    1420000,
    1420000,
    'Depo Bangunan',
    'Dipasang di atas meja marmer wastafel',
    'Area Vanity KM'
  ],
  [
    19,
    'Pekerjaan Sanitair Kamar Mandi',
    'Floor Drain Anti Bau & Serangga',
    'Paloma Brass Floor Drain Square 4 inch Black',
    'bh',
    2,
    185000,
    370000,
    'Depo Bangunan',
    'Area shower & area kering KM',
    'Lantai KM'
  ],
  // Category 5: Pekerjaan Custom Furniture (Wardrobe & Bed)
  [
    20,
    'Pekerjaan Custom Furniture',
    'Plywood Multiplek 18mm Meranti',
    'Palem Multiplek 18mm 122x244cm Grade A',
    'lbr',
    10,
    245000,
    2450000,
    'Panglong Kayu Samara',
    'Badan lemari pakaian wardrobe & frame dipan kasur',
    'Furniture Kamar'
  ],
  [
    21,
    'Pekerjaan Custom Furniture',
    'Plywood Multiplek 9mm Meranti',
    'Palem Multiplek 9mm 122x244cm Grade A',
    'lbr',
    5,
    135000,
    675000,
    'Panglong Kayu Samara',
    'Alas laci lemari & backing panel backdrop',
    'Furniture Kamar'
  ],
  [
    22,
    'Pekerjaan Custom Furniture',
    'HPL Taco Woodgrain & Solid Matte',
    'Taco HPL TH-128 AA Warm Teak Woodgrain',
    'lbr',
    8,
    210000,
    1680000,
    'Hafele & Taco Center',
    'Pelapis luar & dalam lemari wardrobe & headboard',
    'Furniture Kamar'
  ],
  [
    23,
    'Pekerjaan Custom Furniture',
    'Engsel Sendok Slow Motion Soft Closing',
    'Dekkson Soft Close Clip-On Full Bengkok 35mm',
    'psg',
    12,
    35000,
    420000,
    'Hafele & Taco Center',
    'Pintu lemari pakaian 6 daun pintu',
    'Wardrobe'
  ],
  [
    24,
    'Pekerjaan Custom Furniture',
    'Rel Laci Tandem Undermount Slow Motion 45cm',
    'Hafele Matrix Box P Soft Close 450mm',
    'psg',
    6,
    185000,
    1110000,
    'Hafele & Taco Center',
    'Laci pakaian pakaian dalam & bedside table meja rias',
    'Wardrobe & Nakas'
  ],
  [
    25,
    'Pekerjaan Custom Furniture',
    'Lem Kuning Aica Aibon Super 2.5kg',
    'Aica Aibon Super Sintetis Adhesive',
    'blek',
    3,
    140000,
    420000,
    'Panglong Kayu Samara',
    'Perekat HPL ke multiplek',
    'Workshop & Kamar'
  ],
  // Category 6: Pekerjaan Pintu, Kusen & Kaca
  [
    26,
    'Pekerjaan Pintu, Kusen & Kaca',
    'Pintu Solid Core Wood Kamper Samarinda',
    'Ukuran 82x215cm Finishing Melamic Natural Doft',
    'unit',
    1,
    2600000,
    2600000,
    'Panglong Kayu Samara',
    'Pintu masuk utama kamar tidur',
    'Akses Masuk Kamar'
  ],
  [
    27,
    'Pekerjaan Pintu, Kusen & Kaca',
    'Handle Pintu Digital / Smart Door Lock',
    'Dekkson Smart Lock ELC-9318 Fingerprint & Card',
    'set',
    1,
    1850000,
    1850000,
    'Mitra 10 Cibubur',
    'Kunci pintu master bedroom',
    'Pintu Kamar'
  ],
  [
    28,
    'Pekerjaan Pintu, Kusen & Kaca',
    'Kaca Partisi Tempered Shower 10mm',
    'Asahimas Tempered Glass Clear 90x200cm + Fitting Stainless 304',
    'set',
    1,
    2150000,
    2150000,
    'Kaca Maju Cemerlang',
    'Partisi pemisah area basah dan kering shower',
    'Kamar Mandi'
  ],
  [
    29,
    'Pekerjaan Pintu, Kusen & Kaca',
    'Cermin Rias LED Touch Screen Oval 60x100cm',
    'LED Backlit Defogger Touch Mirror 5mm',
    'unit',
    1,
    850000,
    850000,
    'Depo Bangunan',
    'Cermin meja rias & wastafel kamar mandi',
    'Vanity & Kamar Mandi'
  ]
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Adjust column widths
ws['!cols'] = [
  { wch: 6 },  // No
  { wch: 28 }, // Uraian Pekerjaan
  { wch: 38 }, // Material
  { wch: 45 }, // Spesifikasi
  { wch: 8 },  // Satuan
  { wch: 10 }, // Volume
  { wch: 18 }, // Harga Satuan
  { wch: 18 }, // Total Harga
  { wch: 26 }, // Vendor
  { wch: 40 }, // Keterangan
  { wch: 25 }  // Lampiran
];

XLSX.utils.book_append_sheet(wb, ws, 'RAP Kamar Samara');

// Summary Sheet
const summaryData = [
  ['PROYEK RENOVASI INTERIOR KAMAR TIDUR SAMARA'],
  ['Lokasi: Cluster Samara Residence Blok B2/14'],
  ['Tanggal RAP: 01 September 2026'],
  [''],
  ['Kategori Pekerjaan', 'Jumlah Item', 'Total RAP (Rp)'],
  ['Pekerjaan Lantai & Dinding', 5, 14256500],
  ['Pekerjaan Plafon & Finishing Cat', 6, 6490000],
  ['Pekerjaan Elektrikal & Lighting', 4, 2871000],
  ['Pekerjaan Sanitair Kamar Mandi', 4, 6490000],
  ['Pekerjaan Custom Furniture', 6, 6765000],
  ['Pekerjaan Pintu, Kusen & Kaca', 4, 7450000],
  [''],
  ['GRAND TOTAL ANGGARAN PELAKSANAAN (RAP)', 29, 44322500]
];
const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

// Ensure directories exist
const rootFile = path.resolve('RAP - Kamar - Samara copy.xlsx');
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicFile = path.resolve('public/RAP - Kamar - Samara copy.xlsx');

XLSX.writeFile(wb, rootFile);
XLSX.writeFile(wb, publicFile);

console.log('Successfully created:', rootFile);
console.log('Successfully created:', publicFile);
