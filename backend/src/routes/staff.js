// ============================================================
//  backend/src/routes/staff.js   (ملف جديد)
//  routes خاصة بإدارة الموظفين وتقاريرهم
// ============================================================

const router = require('express').Router();
const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const { auth, requireRole } = require('../middleware/auth');

const isAdmin        = [auth, requireRole('admin')];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// ════════════════════════════════════════════════════════════
//  ADMIN ONLY — إدارة حسابات الموظفين
// ════════════════════════════════════════════════════════════

// GET /api/staff — قائمة كل الموظفين
router.get('/', ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.phone, u.email, u.role,
        u.is_active, u.created_at,
        sp.can_view_all, sp.can_edit_prices,
        sp.can_charge_wallet, sp.can_add_points,
        -- إحصائيات سريعة
        COUNT(DISTINCT i.id)  AS total_invoices,
        COALESCE(SUM(i.total), 0) AS total_revenue
      FROM users u
      LEFT JOIN staff_permissions sp ON sp.user_id = u.id
      LEFT JOIN invoices i ON i.created_by = u.id
      WHERE u.role IN ('staff', 'admin')
      GROUP BY u.id, sp.can_view_all, sp.can_edit_prices,
               sp.can_charge_wallet, sp.can_add_points
      ORDER BY u.created_at DESC
    `);
    res.json({ staff: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/staff — إنشاء حساب موظف جديد
router.post('/', ...isAdmin, async (req, res) => {
  const { name, phone, password, email,
          can_view_all = false,
          can_edit_prices = false,
          can_charge_wallet = true,
          can_add_points = true } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'الاسم والموبايل وكلمة السر مطلوبة' });
  }

  try {
    // تحقق من عدم تكرار الموبايل
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'رقم الموبايل مسجّل مسبقاً' });
    }

    const hashed = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const { rows } = await db.query(`
      INSERT INTO users (name, phone, password, email, role)
      VALUES ($1, $2, $3, $4, 'staff')
      RETURNING id, name, phone, email, role, is_active, created_at
    `, [name, phone, hashed, email || null]);

    const newStaff = rows[0];

    // إنشاء صلاحياته
    await db.query(`
      INSERT INTO staff_permissions
        (user_id, can_view_all, can_edit_prices, can_charge_wallet, can_add_points)
      VALUES ($1, $2, $3, $4, $5)
    `, [newStaff.id, can_view_all, can_edit_prices, can_charge_wallet, can_add_points]);

    res.status(201).json({ success: true, staff: newStaff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/staff/:id — تعديل بيانات موظف
router.patch('/:id', ...isAdmin, async (req, res) => {
  const { name, email,
          can_view_all, can_edit_prices,
          can_charge_wallet, can_add_points } = req.body;

  try {
    // تعديل البيانات الأساسية
    if (name || email !== undefined) {
      await db.query(`
        UPDATE users SET
          name       = COALESCE($1, name),
          email      = COALESCE($2, email),
          updated_at = NOW()
        WHERE id = $3 AND role = 'staff'
      `, [name || null, email ?? null, req.params.id]);
    }

    // تعديل الصلاحيات — INSERT or UPDATE
    if ([can_view_all, can_edit_prices, can_charge_wallet, can_add_points]
        .some(v => v !== undefined)) {
      await db.query(`
        INSERT INTO staff_permissions
          (user_id, can_view_all, can_edit_prices, can_charge_wallet, can_add_points)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE SET
          can_view_all      = COALESCE($2, staff_permissions.can_view_all),
          can_edit_prices   = COALESCE($3, staff_permissions.can_edit_prices),
          can_charge_wallet = COALESCE($4, staff_permissions.can_charge_wallet),
          can_add_points    = COALESCE($5, staff_permissions.can_add_points),
          updated_at        = NOW()
      `, [req.params.id,
          can_view_all ?? null, can_edit_prices ?? null,
          can_charge_wallet ?? null, can_add_points ?? null]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/staff/:id/password — تغيير كلمة سر موظف
router.patch('/:id/password', ...isAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'كلمة السر يجب أن تكون 6 أحرف على الأقل' });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2 AND role = $3',
      [hashed, req.params.id, 'staff']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/staff/:id/toggle — تفعيل / تعطيل موظف
router.patch('/:id/toggle', ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      UPDATE users SET is_active = NOT is_active
      WHERE id = $1 AND role = 'staff'
      RETURNING is_active, name
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json({ success: true, is_active: rows[0].is_active, name: rows[0].name });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ════════════════════════════════════════════════════════════
//  تقارير الموظف — كل موظف يرى نفسه فقط / أدمن يرى الكل
// ════════════════════════════════════════════════════════════

// GET /api/staff/me/stats — إحصائياتي الشخصية (للموظف نفسه)
router.get('/me/stats', ...isStaffOrAdmin, async (req, res) => {
  const staffId = req.user.id;
  const date    = req.query.date || new Date().toISOString().split('T')[0];

  try {
    // إحصائيات اليوم
    const { rows: today } = await db.query(`
      SELECT
        COUNT(*)                     AS invoices_count,
        COALESCE(SUM(total), 0)      AS total_revenue,
        COALESCE(SUM(cash_paid), 0)  AS cash_revenue,
        COALESCE(SUM(wallet_paid), 0) AS wallet_revenue
      FROM invoices
      WHERE created_by = $1
        AND DATE(created_at) = $2
    `, [staffId, date]);

    // إحصائيات الشهر الحالي
    const { rows: monthly } = await db.query(`
      SELECT
        COUNT(*)                AS invoices_count,
        COALESCE(SUM(total), 0) AS total_revenue
      FROM invoices
      WHERE created_by = $1
        AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    `, [staffId]);

    // آخر 10 فواتير
    const { rows: recent } = await db.query(`
      SELECT
        i.id, i.invoice_number, i.client_name,
        i.total, i.payment_method, i.invoice_type,
        i.space_name, i.created_at
      FROM invoices i
      WHERE i.created_by = $1
      ORDER BY i.created_at DESC
      LIMIT 10
    `, [staffId]);

    res.json({
      today:   today[0],
      monthly: monthly[0],
      recent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/staff/:id/stats — تقرير موظف محدد (للأدمن)
router.get('/:id/stats', ...isAdmin, async (req, res) => {
  const staffId = req.params.id;
  const year    = req.query.year  || new Date().getFullYear();
  const month   = req.query.month || new Date().getMonth() + 1;

  try {
    // تفاصيل الموظف
    const { rows: staff } = await db.query(
      'SELECT id, name, phone, email, is_active FROM users WHERE id = $1 AND role = $2',
      [staffId, 'staff']
    );
    if (!staff[0]) return res.status(404).json({ error: 'الموظف غير موجود' });

    // إجماليات الشهر
    const { rows: totals } = await db.query(`
      SELECT
        COUNT(*)                AS invoices_count,
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(SUM(cash_paid), 0)   AS cash_revenue,
        COALESCE(SUM(wallet_paid), 0) AS wallet_revenue
      FROM invoices
      WHERE created_by = $1
        AND EXTRACT(YEAR  FROM created_at) = $2
        AND EXTRACT(MONTH FROM created_at) = $3
    `, [staffId, year, month]);

    // تفصيل يومي
    const { rows: daily } = await db.query(`
      SELECT
        DATE(created_at)        AS day,
        COUNT(*)                AS invoices_count,
        COALESCE(SUM(total), 0) AS revenue
      FROM invoices
      WHERE created_by = $1
        AND EXTRACT(YEAR  FROM created_at) = $2
        AND EXTRACT(MONTH FROM created_at) = $3
      GROUP BY day ORDER BY day
    `, [staffId, year, month]);

    res.json({
      staff: staff[0],
      year, month,
      totals: totals[0],
      daily
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/staff/compare — مقارنة أداء كل الموظفين (أدمن فقط)
router.get('/compare', ...isAdmin, async (req, res) => {
  const year  = req.query.year  || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.is_active,
        COUNT(i.id)             AS invoices_count,
        COALESCE(SUM(i.total), 0) AS total_revenue,
        COALESCE(SUM(i.cash_paid), 0)   AS cash_revenue,
        COALESCE(SUM(i.wallet_paid), 0) AS wallet_revenue
      FROM users u
      LEFT JOIN invoices i
        ON i.created_by = u.id
        AND EXTRACT(YEAR  FROM i.created_at) = $1
        AND EXTRACT(MONTH FROM i.created_at) = $2
      WHERE u.role IN ('staff', 'admin')
      GROUP BY u.id, u.name, u.is_active
      ORDER BY total_revenue DESC
    `, [year, month]);

    res.json({ year, month, staff: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
