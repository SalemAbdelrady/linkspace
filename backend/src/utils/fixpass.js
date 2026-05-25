const bcrypt = require('bcryptjs');
// تأكد من المسار أدناه بناءً على مكان ملف db.js الفعلي
const db = require('../config/db'); 

async function fix() {
  try {
    console.log('Starting password update...');
    
    const hash = await bcrypt.hash('client123', 12);
    await db.query('UPDATE users SET password = $1 WHERE phone = $2', [hash, '01012345678']);
    
    const hash2 = await bcrypt.hash('admin123', 12);
    await db.query('UPDATE users SET password = $1 WHERE phone = $2', [hash2, '01000000000']);
    
    const hash3 = await bcrypt.hash('staff123', 12);
    await db.query('UPDATE users SET password = $1 WHERE phone = $2', [hash3, '01100000000']);
    
    console.log('✅ All passwords fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during update:', err);
    process.exit(1);
  }
}

fix();