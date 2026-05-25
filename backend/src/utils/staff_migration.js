// ============================================================
//  staff_migration.js
//  أضف هذا الكود في نهاية دالة migrate() في migrate.js
//  أو شغّله مرة واحدة كـ standalone script
// ============================================================

const db = require('../config/db'); // عدّل المسار لو شغّلته standalone

async function staffMigration() {
  console.log('🔄 Running staff migration...');

  // ─── 1. إضافة created_by لجدول sessions ──────────────────────
  // من أصدر / أنهى هذه الجلسة (موظف أو أدمن)
  await db.query(`
    ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  // ─── 2. إضافة created_by لجدول invoices ──────────────────────
  // من أصدر هذه الفاتورة
  await db.query(`
    ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  // ─── 3. جدول staff_permissions ───────────────────────────────
  // صلاحيات إضافية لكل موظف — قابلة للتوسع مستقبلاً
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_permissions (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_view_all    BOOLEAN NOT NULL DEFAULT false,   -- يشوف فواتير كل الموظفين
      can_edit_prices BOOLEAN NOT NULL DEFAULT false,   -- يعدّل الأسعار
      can_charge_wallet BOOLEAN NOT NULL DEFAULT true,  -- يشحن المحفظة
      can_add_points  BOOLEAN NOT NULL DEFAULT true,    -- يضيف نقاط
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);

  // ─── 4. Indexes للأداء ────────────────────────────────────────
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_staff_perms_user    ON staff_permissions(user_id);`);

  console.log('✅ Staff migration completed!');
}

// ─── تشغيل standalone (اختياري) ──────────────────────────────
// node staff_migration.js
if (require.main === module) {
  const { Pool } = require('pg');
  staffMigration()
    .then(() => process.exit(0))
    .catch(err => { console.error('❌', err); process.exit(1); });
}

module.exports = staffMigration;
