const db = require('../config/db');

async function migrate() {
  console.log('🔄 Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      phone       VARCHAR(20) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,
      role        VARCHAR(20) NOT NULL DEFAULT 'client',
      balance     NUMERIC(10,2) NOT NULL DEFAULT 0,
      points      INTEGER NOT NULL DEFAULT 0,
      qr_code     VARCHAR(100) UNIQUE,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      check_in       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      check_out      TIMESTAMPTZ,
      duration_min   INTEGER,
      price_per_hr   NUMERIC(10,2) NOT NULL,
      cost           NUMERIC(10,2),
      payment_method VARCHAR(20) DEFAULT 'wallet',
      status         VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ✅ user_id nullable — الكوبون العام مش مربوط بعميل
  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
      code         VARCHAR(30) UNIQUE NOT NULL,
      discount_pct INTEGER NOT NULL DEFAULT 20,
      is_used      BOOLEAN NOT NULL DEFAULT false,
      expires_at   TIMESTAMPTZ NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE coupons ALTER COLUMN user_id DROP NOT NULL;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        VARCHAR(20) NOT NULL,
      amount      NUMERIC(10,2) NOT NULL,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS price_settings (
      id           SERIAL PRIMARY KEY,
      period_name  VARCHAR(30) NOT NULL,
      start_hour   INTEGER NOT NULL,
      end_hour     INTEGER NOT NULL,
      price_per_hr NUMERIC(10,2) NOT NULL,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS space_settings (
      id         SERIAL PRIMARY KEY,
      space_key  VARCHAR(30) UNIQUE NOT NULL,
      name       VARCHAR(100) NOT NULL,
      first_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
      extra_hour NUMERIC(10,2) NOT NULL DEFAULT 0,
      max_hours  INTEGER NOT NULL DEFAULT 4,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS services (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      price      NUMERIC(10,2) NOT NULL,
      is_active  BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id             SERIAL PRIMARY KEY,
      name           VARCHAR(100) NOT NULL,
      price          NUMERIC(10,2) NOT NULL,
      features       TEXT,
      discount_rooms INTEGER NOT NULL DEFAULT 0,
      is_active      BOOLEAN NOT NULL DEFAULT true,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ✅ جدول الفواتير الكاملة
  //    session_id  → ربط بالجلسة
  //    services    → JSON مصفوفة الخدمات المضافة [{name, price, qty}]
  //    coupon_code → كود الكوبون لو اتستخدم
  //    discount_pct / discount_amount → تفاصيل الخصم
  //    subtotal    → قبل الخصم
  //    total       → بعد الخصم
  //    note        → ملاحظة الموظف
  await db.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id              SERIAL PRIMARY KEY,
      invoice_number  VARCHAR(20) UNIQUE NOT NULL,
      session_id      INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_name     VARCHAR(100) NOT NULL,
      client_phone    VARCHAR(20) NOT NULL,
      session_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
      duration_min    INTEGER,
      price_per_hr    NUMERIC(10,2),
      services        JSONB NOT NULL DEFAULT '[]',
      services_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
      coupon_code     VARCHAR(30),
      discount_pct    INTEGER NOT NULL DEFAULT 0,
      discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
      total           NUMERIC(10,2) NOT NULL DEFAULT 0,
      payment_method  VARCHAR(20) NOT NULL DEFAULT 'cash',
      note            TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Default data ──────────────────────────────────────────────────
  await db.query(`
    INSERT INTO price_settings (period_name, start_hour, end_hour, price_per_hr)
    VALUES ('morning',6,14,10), ('evening',14,22,15), ('night',22,6,12)
    ON CONFLICT DO NOTHING;
  `);

  await db.query(`
    INSERT INTO space_settings (space_key, name, first_hour, extra_hour, max_hours)
    VALUES
      ('cowork',  'منطقة العمل المشتركة', 30,  30,  4),
      ('meeting', 'غرفة الاجتماعات',      150, 100, 12),
      ('lessons', 'غرفة الدروس',           200, 100, 12)
    ON CONFLICT (space_key) DO NOTHING;
  `);

  await db.query(`
    INSERT INTO services (name, price)
    VALUES ('قهوة',15),('شاي',10),('مياه',5),('عصير',20),('طباعة (ورقة)',3),('سكانر',5)
    ON CONFLICT DO NOTHING;
  `);

  await db.query(`
    INSERT INTO subscription_plans (name, price, features, discount_rooms)
    VALUES
      ('باقة أساسية', 500,  'دخول غير محدود لمنطقة العمل', 0),
      ('باقة بريميوم', 900, 'دخول غير محدود + خصم 20% على الغرف', 20),
      ('باقة VIP', 1400,    'دخول غير محدود + خصم 40% على الغرف', 40)
    ON CONFLICT DO NOTHING;
  `);

  // ── Indexes ───────────────────────────────────────────────────────
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id  ON sessions(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_status   ON sessions(status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_coupons_user_id   ON coupons(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_wallet_user_id    ON wallet_transactions(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_users_phone       ON users(phone);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_invoices_user_id  ON invoices(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_invoices_created  ON invoices(created_at DESC);`);

  console.log('✅ Migrations completed!');
}

module.exports = migrate;

