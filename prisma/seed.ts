import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting RAP Material Control Seed ---');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const pmHash = await bcrypt.hash('pm123', 10);
  const purchHash = await bcrypt.hash('purchasing123', 10);
  const supHash = await bcrypt.hash('supervisor123', 10);
  const viewHash = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rapcontrol.com' },
    update: {},
    create: {
      name: 'Yogi Atmaja (System Administrator)',
      email: 'admin@rapcontrol.com',
      password_hash: passwordHash,
      role: 'ADMIN' as any,
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@rapcontrol.com' },
    update: {},
    create: {
      name: 'Budi Santoso (Project Manager)',
      email: 'pm@rapcontrol.com',
      password_hash: pmHash,
      role: 'PROJECT_MANAGER' as any,
    },
  });

  const purchasing = await prisma.user.upsert({
    where: { email: 'purchasing@rapcontrol.com' },
    update: {},
    create: {
      name: 'Dewi Lestari (Purchasing Officer)',
      email: 'purchasing@rapcontrol.com',
      password_hash: purchHash,
      role: 'PURCHASING' as any,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@rapcontrol.com' },
    update: {},
    create: {
      name: 'Hendra Wijaya (Site Supervisor)',
      email: 'supervisor@rapcontrol.com',
      password_hash: supHash,
      role: 'SUPERVISOR' as any,
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@rapcontrol.com' },
    update: {},
    create: {
      name: 'Owner Representative (Viewer)',
      email: 'viewer@rapcontrol.com',
      password_hash: viewHash,
      role: 'VIEWER' as any,
    },
  });

  // 2. Seed Project
  const project = await prisma.project.upsert({
    where: { project_code: 'PRJ-SMR-001' },
    update: {},
    create: {
      project_code: 'PRJ-SMR-001',
      project_name: 'Renovasi Interior Kamar Samara',
      description: 'Proyek renovasi interior luxury master bedroom & ensuite bathroom Samara Residence.',
      location: 'Cluster Samara Residence Blok B2/14',
      start_date: new Date('2026-09-01'),
      target_end_date: new Date('2026-11-30'),
      status: 'ONGOING' as any,
    },
  });

  // 3. Seed Work Categories
  const categoryNames = [
    { name: 'Pekerjaan Lantai & Dinding', desc: 'Granit, keramik dinding KM, semen perekat dan nat' },
    { name: 'Pekerjaan Plafon & Finishing Cat', desc: 'Gypsum, rangka hollow galvanis, cat primer & cat warna' },
    { name: 'Pekerjaan Elektrikal & Lighting', desc: 'Lampu LED, downlight, saklar schneider, kabel NYM' },
    { name: 'Pekerjaan Sanitair Kamar Mandi', desc: 'Kloset Toto, shower set wasser, wastafel & floor drain' },
    { name: 'Pekerjaan Custom Furniture', desc: 'Wardrobe lemari pakaian, dipan tempat tidur, meja rias, HPL Taco' },
    { name: 'Pekerjaan Pintu, Kusen & Kaca', desc: 'Pintu solid wood, handle digital dekkson, partisi shower tempered' },
  ];

  const categoriesMap: Record<string, number> = {};
  for (const cat of categoryNames) {
    const created = await prisma.workCategory.create({
      data: {
        project_id: project.id,
        category_name: cat.name,
        description: cat.desc,
      },
    });
    categoriesMap[cat.name] = created.id;
  }

  // 4. Seed Vendors
  const vendorList = [
    { name: 'Mitra 10 Cibubur', contact: 'Bpk. Ridwan', phone: '0812-3456-7890', address: 'Jl. Raya Alternatif Cibubur KM 3' },
    { name: 'Depo Bangunan', contact: 'Ibu Ratna', phone: '0813-8888-2233', address: 'Jl. Raya Bogor KM 28' },
    { name: 'Toko Baja & Gypsum Sejahtera', contact: 'Bpk. Asep', phone: '0815-4422-1100', address: 'Jl. Akses UI Kelapa Dua' },
    { name: 'Toko Cat Maju Jaya', contact: 'Koh Willy', phone: '0818-9900-5511', address: 'Jl. Margonda Raya No. 45' },
    { name: 'Toko Listrik Terang Abadi', contact: 'Bpk. Anton', phone: '0811-3322-9988', address: 'Pertokoan Glodok Makmur' },
    { name: 'Hafele & Taco Center', contact: 'Sales Project Dept', phone: '021-537-8899', address: 'Taman Tekno BSD' },
    { name: 'Panglong Kayu Samara', contact: 'H. Mansyur', phone: '0812-7711-4433', address: 'Jl. Raya Kranggan No. 12' },
    { name: 'Kaca Maju Cemerlang', contact: 'Bpk. Steven', phone: '0817-6655-2244', address: 'Jl. Pangeran Jayakarta No. 88' },
  ];

  const vendorsMap: Record<string, number> = {};
  for (const v of vendorList) {
    const created = await prisma.vendor.create({
      data: {
        vendor_name: v.name,
        contact_person: v.contact,
        phone: v.phone,
        address: v.address,
      },
    });
    vendorsMap[v.name] = created.id;
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
