const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Seeding database...');

  const adminPass = await bcrypt.hash('admin123', 12);
  const staffPass = await bcrypt.hash('staff123', 12);
  const clientPass = await bcrypt.hash('client123', 12);

  // Admin
  await db.query(`
    INSERT INTO users (name, phone, password, role, balance, points, qr_code)
    VALUES ($1,$2,$3,'admin',0,0,$4)
    ON CONFLICT (phone) DO NOTHING
  `, ['مدير النظام', '01000000000', adminPass, uuidv4()]);

  // Staff
  await db.query(`
    INSERT INTO users (name, phone, password, role, balance, points, qr_code)
    VALUES ($1,$2,$3,'staff',0,0,$4)
    ON CONFLICT (phone) DO NOTHING
  `, ['موظف الاستقبال', '01100000000', staffPass, uuidv4()]);

  // Demo clients
  const clients = [
    ['أحمد محمد السيد', '01012345678', 145.50, 87],
    ['سارة خالد إبراهيم', '01123456789', 80.00, 45],
    ['محمد علي حسن', '01234567890', 200.00, 120],
    ['نورا حسن أحمد', '01345678901', 50.00, 20],
    ['كريم عبدالله', '01456789012', 310.00, 180],
  ];

  for (const [name, phone, balance, points] of clients) {
    const hash = await bcrypt.hash(clientPass, 12);
    const qr = uuidv4();
    await db.query(`
      INSERT INTO users (name, phone, password, role, balance, points, qr_code)
      VALUES ($1,$2,$3,'client',$4,$5,$6)
      ON CONFLICT (phone) DO NOTHING
    `, [name, phone, hash, balance, points, qr]);
  }

  console.log('✅ Seed completed!');
  console.log('👤 Admin:  01000000000 / admin123');
  console.log('👤 Staff:  01100000000 / staff123');
  console.log('👤 Client: 01012345678 / client123');
  process.exit(0);
}

module.exports = seed;
