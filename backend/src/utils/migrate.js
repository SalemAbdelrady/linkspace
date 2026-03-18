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
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      check_in      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      check_out     TIMESTAMPTZ,
      duration_min  INTEGER,
      price_per_hr  NUMERIC(10,2) NOT NULL,
      cost          NUMERIC(10,2),
      payment_method VARCHAR(20) DEFAULT 'wallet',
      status        VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code          VARCHAR(30) UNIQUE NOT NULL,
      discount_pct  INTEGER NOT NULL DEFAULT 20,
      is_used       BOOLEAN NOT NULL DEFAULT false,
      expires_at    TIMESTAMPTZ NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
      id          SERIAL PRIMARY KEY,
      period_name VARCHAR(30) NOT NULL,
      start_hour  INTEGER NOT NULL,
      end_hour    INTEGER NOT NULL,
      price_per_hr NUMERIC(10,2) NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Insert default prices if not exist
  await db.query(`
    INSERT INTO price_settings (period_name, start_hour, end_hour, price_per_hr)
    VALUES
      ('morning', 6, 14, 10),
      ('evening', 14, 22, 15),
      ('night',   22, 6,  12)
    ON CONFLICT DO NOTHING;
  `);

  // Indexes for performance
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet_transactions(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`);

  console.log('✅ Migrations completed!');
  // process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
