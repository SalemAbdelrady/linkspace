const router  = require('express').Router();
const db      = require('../config/db');
const bcrypt  = require('bcryptjs');          // ✅ في الأعلى مش جوف الـ route
const QRCode  = require('qrcode');
const { auth, requireRole }   = require('../middleware/auth');
const { requirePermission }   = require('../middleware/permissions');

const isAdmin        = [auth, requireRole('admin')];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/admin/users
router.get('/users', ...isStaffOrAdmin, async (req, res) => {
  const { search = '', page = 1 } = req.query;
  const limit  = 20;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT id, name, phone, email, role, balance, points,
             qr_code, is_active, created_at
      FROM users
      WHERE (name ILIKE $1 OR phone ILIKE $1) AND role = 'client'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, limit, offset]);

    const usersWithQR = await Promise.all(
      rows.map(async (u) => {
        if (!u.qr_code) return { ...u, qr_image: null };
        const qr_image = await QRCode.toDataURL(u.qr_code, { width: 200, margin: 1 });
        return { ...u, qr_image };
      })
    );

    res.json({ users: usersWithQR });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/users/:id/wallet — شحن المحفظة
router.patch('/users/:id/wallet',
  ...isStaffOrAdmin,
  requirePermission('can_charge_wallet'),
  async (req, res) => {
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
  }
);

// PATCH /api/admin/users/:id/points — إضافة نقاط
router.patch('/users/:id/points',
  ...isStaffOrAdmin,
  requirePermission('can_add_points'),
  async (req, res) => {
    const { points } = req.body;
    if (!points || isNaN(points)) return res.status(400).json({ error: 'النقاط غير صحيحة' });
    try {
      await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [points, req.params.id]);
      const { rows } = await db.query('SELECT points FROM users WHERE id = $1', [req.params.id]);
      res.json({ success: true, new_points: rows[0].points });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في الخادم' });
    }
  }
);

// PATCH /api/admin/users/:id/toggle — تفعيل/تعطيل عميل (أدمن فقط)
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

// GET /api/admin/prices
router.get('/prices', ...isStaffOrAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM price_settings ORDER BY id');
  res.json({ prices: rows });
});

// PUT /api/admin/prices/:id — تعديل أسعار الأوقات
router.put('/prices/:id',
  ...isStaffOrAdmin,
  requirePermission('can_edit_prices'),
  async (req, res) => {
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
  }
);

// GET /api/admin/staff — قائمة الموظفين
router.get('/staff', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        id, name, phone, role, is_active,
        can_charge_wallet, can_add_points,
        can_edit_prices, can_create_coupons, can_view_reports
      FROM users
      WHERE role IN ('admin', 'staff')
      ORDER BY role DESC, name ASC
    `);
    res.json({ staff: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/admin/staff — إضافة موظف جديد
router.post('/staff', ...isAdmin, async (req, res) => {
  const { name, phone, password, role = 'staff' } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ error: 'أدخل الاسم والموبايل وكلمة السر' });
  if (!['staff', 'admin'].includes(role))
    return res.status(400).json({ error: 'دور غير صحيح' });

  try {
    // ✅ bcrypt في أعلى الملف — لا مشكلة هنا
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(`
      INSERT INTO users (name, phone, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, phone, role, is_active,
                can_charge_wallet, can_add_points,
                can_edit_prices, can_create_coupons, can_view_reports
    `, [name, phone, hash, role]);
    res.status(201).json({ staff: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'رقم الموبايل مسجل مسبقاً' });
    }
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/staff/:id/toggle — تفعيل/تعطيل موظف
router.patch('/staff/:id/toggle', ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'موظف غير موجود' });
    res.json({ is_active: rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/admin/staff/:id/permissions — تعديل صلاحيات موظف
router.patch('/staff/:id/permissions', ...isAdmin, async (req, res) => {
  const {
    can_charge_wallet  = false,
    can_add_points     = false,
    can_edit_prices    = false,
    can_create_coupons = false,
    can_view_reports   = false,
  } = req.body;

  try {
    await db.query(`
      UPDATE users
      SET can_charge_wallet  = $1,
          can_add_points     = $2,
          can_edit_prices    = $3,
          can_create_coupons = $4,
          can_view_reports   = $5
      WHERE id = $6 AND role = 'staff'
    `, [can_charge_wallet, can_add_points, can_edit_prices, can_create_coupons, can_view_reports, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /api/admin/staff/:id — حذف موظف
router.delete('/staff/:id', ...isAdmin, async (req, res) => {
  try {
    // ✅ حماية: لا يحذف الأدمن الوحيد
    const { rows: adminCount } = await db.query(
      `SELECT COUNT(*) FROM users WHERE role = 'admin'`
    );
    const { rows: target } = await db.query(
      'SELECT role FROM users WHERE id = $1', [req.params.id]
    );
    if (!target.length) return res.status(404).json({ error: 'موظف غير موجود' });
    if (target[0].role === 'admin' && parseInt(adminCount[0].count) <= 1) {
      return res.status(400).json({ error: 'لا يمكن حذف الأدمن الوحيد' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
