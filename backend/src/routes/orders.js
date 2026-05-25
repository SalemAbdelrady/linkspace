const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// ── Migration guard ───────────────────────────────────────────────────
;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS session_orders (
        id           SERIAL PRIMARY KEY,
        session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        service_id   INTEGER REFERENCES services(id)          ON DELETE SET NULL,
        service_name VARCHAR(100) NOT NULL,
        price        NUMERIC(10,2) NOT NULL,
        qty          INTEGER NOT NULL DEFAULT 1,
        added_by     VARCHAR(20) NOT NULL DEFAULT 'staff', -- 'staff' | 'client'
        added_by_name VARCHAR(100),
        can_remove   BOOLEAN NOT NULL DEFAULT true,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_session_orders_session ON session_orders(session_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_session_orders_user    ON session_orders(user_id);`);
  } catch (e) { console.error('session_orders migration:', e.message); }
})();

// ─────────────────────────────────────────────────────────────────────
// GET /api/orders/session/:session_id — جيب طلبات جلسة معينة
// ─────────────────────────────────────────────────────────────────────
router.get('/session/:session_id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM session_orders
      WHERE session_id = $1
      ORDER BY created_at ASC
    `, [req.params.session_id]);

    const total = rows.reduce((sum, r) => sum + parseFloat(r.price) * r.qty, 0);
    res.json({ orders: rows, total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/orders/my-session — العميل يجيب طلبات جلسته النشطة
// ─────────────────────────────────────────────────────────────────────
router.get('/my-session', auth, async (req, res) => {
  try {
    // جيب الجلسة النشطة للعميل
    const { rows: sessionRows } = await db.query(`
      SELECT id FROM sessions
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `, [req.user.id]);

    if (!sessionRows[0]) {
      return res.json({ orders: [], total: 0, session_id: null });
    }

    const session_id = sessionRows[0].id;
    const { rows } = await db.query(`
      SELECT * FROM session_orders
      WHERE session_id = $1
      ORDER BY created_at ASC
    `, [session_id]);

    const total = rows.reduce((sum, r) => sum + parseFloat(r.price) * r.qty, 0);
    res.json({ orders: rows, total: parseFloat(total.toFixed(2)), session_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/orders/add — staff/admin يضيف طلب على جلسة
// ─────────────────────────────────────────────────────────────────────
router.post('/add', ...isStaffOrAdmin, async (req, res) => {
  const { session_id, service_id, service_name, price, qty = 1 } = req.body;
  if (!session_id || !service_name || price === undefined) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  try {
    // تحقق إن الجلسة نشطة
    const { rows: sessionRows } = await db.query(
      `SELECT id, user_id FROM sessions WHERE id = $1 AND status = 'active'`,
      [session_id]
    );
    if (!sessionRows[0]) {
      return res.status(404).json({ error: 'الجلسة غير موجودة أو منتهية' });
    }

    const { rows } = await db.query(`
      INSERT INTO session_orders
        (session_id, user_id, service_id, service_name, price, qty, added_by, added_by_name, can_remove)
      VALUES ($1, $2, $3, $4, $5, $6, 'staff', $7, true)
      RETURNING *
    `, [
      session_id,
      sessionRows[0].user_id,
      service_id || null,
      service_name,
      parseFloat(price),
      parseInt(qty),
      req.user.name || 'Staff',
    ]);

    res.status(201).json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/orders/client-add — العميل يضيف طلب على جلسته النشطة
// ─────────────────────────────────────────────────────────────────────
router.post('/client-add', auth, async (req, res) => {
  const { service_id, service_name, price, qty = 1 } = req.body;
  if (!service_name || price === undefined) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  try {
    // جيب الجلسة النشطة للعميل
    const { rows: sessionRows } = await db.query(`
      SELECT id FROM sessions
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `, [req.user.id]);

    if (!sessionRows[0]) {
      return res.status(404).json({ error: 'لا توجد جلسة نشطة' });
    }

    const session_id = sessionRows[0].id;

    const { rows } = await db.query(`
      INSERT INTO session_orders
        (session_id, user_id, service_id, service_name, price, qty, added_by, added_by_name, can_remove)
      VALUES ($1, $2, $3, $4, $5, $6, 'client', $7, false)
      RETURNING *
    `, [
      session_id,
      req.user.id,
      service_id || null,
      service_name,
      parseFloat(price),
      parseInt(qty),
      req.user.name,
    ]);

    res.status(201).json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/orders/:id — staff/admin يمسح طلب
// ─────────────────────────────────────────────────────────────────────
router.delete('/:id', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM session_orders WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json({ success: true, order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

