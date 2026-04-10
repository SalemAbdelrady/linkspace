const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isAdmin        = [auth, requireRole('admin')];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/admin/users
router.get('/users', ...isStaffOrAdmin, async (req, res) => {
  const { search = '', page = 1 } = req.query;
  const limit  = 20;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT id, name, phone, role, balance, points,
             qr_code,
             is_active, created_at
      FROM users
      WHERE (name ILIKE $1 OR phone ILIKE $1) AND role = 'client'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, limit, offset]);

    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/users/:id/wallet — charge wallet
router.patch('/users/:id/wallet', ...isStaffOrAdmin, async (req, res) => {
  const { amount, note } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'المبلغ غير صحيح' });
  }

  try {
    await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.params.id]);
    await db.query(`
      INSERT INTO wallet_transactions (user_id, type, amount, description)
      VALUES ($1, 'credit', $2, $3)
    `, [req.params.id, amount, note || 'شحن يدوي من الإدارة']);

    const { rows } = await db.query('SELECT balance FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, new_balance: rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/users/:id/points — add points
router.patch('/users/:id/points', ...isStaffOrAdmin, async (req, res) => {
  const { points } = req.body;
  if (!points || isNaN(points)) return res.status(400).json({ error: 'النقاط غير صحيحة' });

  try {
    await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [points, req.params.id]);
    const { rows } = await db.query('SELECT points FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, new_points: rows[0].points });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/users/:id/toggle — activate/deactivate
router.patch('/users/:id/toggle', ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
      [req.params.id]
    );
    res.json({ is_active: rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/admin/reports/daily
router.get('/reports/daily', ...isStaffOrAdmin, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const { rows: revenue } = await db.query(`
      SELECT
        COUNT(*) AS visits,
        COALESCE(SUM(cost), 0) AS total_revenue,
        COALESCE(AVG(duration_min), 0) AS avg_duration
      FROM sessions
      WHERE DATE(check_in) = $1 AND status = 'completed'
    `, [date]);

    const { rows: byHour } = await db.query(`
      SELECT EXTRACT(HOUR FROM check_in) AS hour, COUNT(*) AS visits
      FROM sessions
      WHERE DATE(check_in) = $1
      GROUP BY hour ORDER BY hour
    `, [date]);

    const { rows: activeNow } = await db.query(`
      SELECT COUNT(*) AS count FROM sessions WHERE status = 'active'
    `);

    res.json({ date, summary: revenue[0], by_hour: byHour, active_now: activeNow[0].count });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/admin/reports/monthly
router.get('/reports/monthly', ...isStaffOrAdmin, async (req, res) => {
  const year  = req.query.year  || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  try {
    const { rows: daily } = await db.query(`
      SELECT
        DATE(check_in) AS day,
        COUNT(*) AS visits,
        COALESCE(SUM(cost), 0) AS revenue
      FROM sessions
      WHERE EXTRACT(YEAR  FROM check_in) = $1
        AND EXTRACT(MONTH FROM check_in) = $2
        AND status = 'completed'
      GROUP BY day ORDER BY day
    `, [year, month]);

    const { rows: totals } = await db.query(`
      SELECT
        COUNT(*) AS total_visits,
        COALESCE(SUM(cost), 0) AS total_revenue,
        COALESCE(AVG(duration_min), 0) AS avg_duration
      FROM sessions
      WHERE EXTRACT(YEAR  FROM check_in) = $1
        AND EXTRACT(MONTH FROM check_in) = $2
        AND status = 'completed'
    `, [year, month]);

    res.json({ year, month, daily, totals: totals[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET/PUT /api/admin/prices
router.get('/prices', ...isStaffOrAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM price_settings ORDER BY id');
  res.json({ prices: rows });
});

router.put('/prices/:id', ...isAdmin, async (req, res) => {
  const { price_per_hr } = req.body;
  if (!price_per_hr || isNaN(price_per_hr) || price_per_hr <= 0) {
    return res.status(400).json({ error: 'السعر غير صحيح' });
  }

  try {
    const { rows } = await db.query(`
      UPDATE price_settings SET price_per_hr = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [price_per_hr, req.params.id]);
    res.json({ price: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
