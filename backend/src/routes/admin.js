const router = require("express").Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs"); // ✅ في الأعلى مش جوف الـ route
const QRCode = require("qrcode");
const { auth, requireRole } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");

const isAdmin = [auth, requireRole("admin")];
const isStaffOrAdmin = [auth, requireRole("staff", "admin")];

// GET /api/admin/overview-stats
router.get("/overview-stats", auth, requireRole("admin"), async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
    const cairoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const firstOfMonthStr = `${cairoNow.getFullYear()}-${String(cairoNow.getMonth() + 1).padStart(2, '0')}-01`;

    const [clients, invoices, sessions, ambassadors, staff] = await Promise.all([

      // إحصائيات العملاء
      db.query(`
        SELECT
          COUNT(*)                                                           AS total_clients,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month,
          COALESCE(SUM(balance), 0)                                         AS total_balance,
          COUNT(*) FILTER (WHERE is_active = false)                         AS banned_count,
          (SELECT COUNT(DISTINCT user_id) FROM sessions
          WHERE status = 'active')                                         AS active_now,
          (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions
          WHERE status = 'active' AND end_date > NOW())                    AS active_subscribers
        FROM users WHERE role = 'client'
      `),

      // إحصائيات الفواتير — الشهر الحالي فقط للجلسات والبيع السريع
      db.query(`
        SELECT
          COUNT(*)                                                         AS total_invoices,
          COALESCE(SUM(total), 0)                                          AS total_revenue,
          COALESCE(SUM(total) FILTER (
            WHERE DATE(created_at AT TIME ZONE 'Africa/Cairo') = $1::date
          ), 0)                                                            AS today_revenue,
          COUNT(*) FILTER (
            WHERE DATE(created_at AT TIME ZONE 'Africa/Cairo') = $1::date
          )                                                                AS today_invoices,
          COALESCE(SUM(total) FILTER (
            WHERE created_at AT TIME ZONE 'Africa/Cairo' >= $2::date
          ), 0)                                                            AS month_revenue,
          COUNT(*) FILTER (
            WHERE invoice_type = 'quick_sale'
              AND created_at AT TIME ZONE 'Africa/Cairo' >= $2::date
          )                                                                AS month_quick_sale_count,
          COUNT(*) FILTER (
            WHERE (invoice_type = 'session' OR invoice_type IS NULL)
              AND created_at AT TIME ZONE 'Africa/Cairo' >= $2::date
          )                                                                AS month_session_count
        FROM invoices
      `, [today, firstOfMonthStr]),

      // إحصائيات الجلسات
      db.query(`
        SELECT
          COUNT(*) AS total_sessions,
          COUNT(*) FILTER (WHERE DATE(check_in AT TIME ZONE 'Africa/Cairo') = $1) AS today_sessions,
          COALESCE(AVG(duration_min) FILTER (WHERE duration_min > 0), 0) AS avg_duration
        FROM sessions WHERE status = 'completed'
      `, [today]),

      // أكثر العملاء دعوةً — مرتبة على referral_count
      db.query(`
        SELECT
          u.id, u.name, u.phone, u.avatar_url,
          u.referral_count,
          COALESCE(SUM(GREATEST(s.guest_count - 1, 0)), 0) AS guests_count
        FROM users u
        LEFT JOIN sessions s ON s.user_id = u.id 
          AND s.guest_count > 1 
          AND s.status = 'completed'
        WHERE u.role = 'client'
          AND u.referral_count > 0
        GROUP BY u.id, u.name, u.phone, u.avatar_url, u.referral_count
        ORDER BY u.referral_count DESC
        LIMIT 5
      `),

      // عدد الموظفين
      db.query(`
        SELECT
          COUNT(*) AS total_staff,
          COUNT(*) FILTER (WHERE is_active = true) AS active_staff
        FROM users WHERE role IN ('staff', 'admin')
      `),
    ]);

    res.json({
      clients: clients.rows[0],
      invoices: invoices.rows[0],
      sessions: sessions.rows[0],
      staff: staff.rows[0],
      ambassadors: ambassadors.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في جلب الإحصائيات" });
  }
});

// GET /api/admin/users
router.get("/users", ...isStaffOrAdmin, async (req, res) => {
  const { search = "", page = 1, date_from = "", date_to = "" } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, u.name, u.phone, u.email, u.role, u.balance, u.points,
        u.qr_code, u.is_active, u.created_at, u.avatar_url,
        us.plan_name AS subscription_name,
        us.end_date  AS subscription_end
      FROM users u
      LEFT JOIN user_subscriptions us 
        ON us.user_id = u.id 
       AND us.status = 'active' 
       AND us.end_date >= NOW()
      WHERE (u.name ILIKE $1 OR u.phone ILIKE $1)
        AND u.role = 'client'
        AND ($2 = '' OR u.created_at >= $2::date)
        AND ($3 = '' OR u.created_at <  ($3::date + INTERVAL '1 day'))
      ORDER BY u.created_at DESC
      LIMIT $4 OFFSET $5
    `, [`%${search}%`, date_from, date_to, limit, offset]);

    const usersWithQR = await Promise.all(
      rows.map(async (u) => {
        if (!u.qr_code) return { ...u, qr_image: null };
        const qr_image = await QRCode.toDataURL(u.qr_code, {
          width: 200,
          margin: 1,
        });
        return { ...u, qr_image };
      }),
    );

    const { rows: stats } = await db.query(`
  SELECT
    COUNT(*)                                                     AS total_clients,
    (SELECT COUNT(DISTINCT user_id) FROM sessions 
     WHERE status = 'active')                                    AS active_clients,
    COALESCE(SUM(balance), 0)                                    AS total_balance,
    COUNT(*) FILTER (
      WHERE created_at >= date_trunc('month', NOW())
    )                                                            AS new_this_month,
    (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions 
     WHERE status = 'active' 
       AND end_date >= NOW())                                     AS active_subscribers
  FROM users WHERE role = 'client'
`);

    res.json({ users: usersWithQR, stats: stats[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// PATCH /api/admin/users/:id/wallet — شحن المحفظة
router.patch(
  "/users/:id/wallet",
  ...isStaffOrAdmin,
  requirePermission("can_charge_wallet"),
  async (req, res) => {
    const { amount, note } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "المبلغ غير صحيح" });
    }
    try {
      await db.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
        amount,
        req.params.id,
      ]);
      await db.query(
        `
        INSERT INTO wallet_transactions (user_id, type, amount, description)
        VALUES ($1, 'credit', $2, $3)
      `,
        [req.params.id, amount, note || "شحن يدوي من الإدارة"],
      );

      const { rows } = await db.query(
        "SELECT balance FROM users WHERE id = $1",
        [req.params.id],
      );
      res.json({ success: true, new_balance: rows[0].balance });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

// PATCH /api/admin/users/:id/points — إضافة نقاط
router.patch(
  "/users/:id/points",
  ...isStaffOrAdmin,
  requirePermission("can_add_points"),
  async (req, res) => {
    const { points } = req.body;
    if (!points || isNaN(points))
      return res.status(400).json({ error: "النقاط غير صحيحة" });
    try {
      await db.query("UPDATE users SET points = points + $1 WHERE id = $2", [
        points,
        req.params.id,
      ]);
      const { rows } = await db.query(
        "SELECT points FROM users WHERE id = $1",
        [req.params.id],
      );
      res.json({ success: true, new_points: rows[0].points });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

// PATCH /api/admin/users/:id/toggle — تفعيل/تعطيل عميل (أدمن فقط)
router.patch("/users/:id/toggle", ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active",
      [req.params.id],
    );
    res.json({ is_active: rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /api/admin/reports/daily
router.get("/reports/daily", ...isStaffOrAdmin, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  try {
    const { rows: revenue } = await db.query(`
      SELECT
        COUNT(*) AS visits,
        COALESCE(SUM(cost), 0) AS total_revenue,
        COALESCE(AVG(duration_min), 0) AS avg_duration
      FROM sessions
      WHERE DATE(check_in AT TIME ZONE 'Africa/Cairo') = $1
        AND status = 'completed'
    `, [date]);

    const { rows: byHour } = await db.query(`
      SELECT EXTRACT(HOUR FROM check_in AT TIME ZONE 'Africa/Cairo') AS hour,
            COUNT(*) AS visits
      FROM sessions
      WHERE DATE(check_in AT TIME ZONE 'Africa/Cairo') = $1
      GROUP BY hour ORDER BY hour
    `, [date]);

    const { rows: activeNow } = await db.query(`
      SELECT COUNT(*) AS count FROM sessions WHERE status = 'active'
    `);

    res.json({
      date,
      summary: revenue[0],
      by_hour: byHour,
      active_now: activeNow[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /api/admin/reports/monthly
router.get("/reports/monthly", ...isStaffOrAdmin, async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;
  try {
    const { rows: daily } = await db.query(
      `
      SELECT
        DATE(check_in) AS day,
        COUNT(*) AS visits,
        COALESCE(SUM(cost), 0) AS revenue
      FROM sessions
      WHERE EXTRACT(YEAR  FROM check_in AT TIME ZONE 'Africa/Cairo') = $1
        AND EXTRACT(MONTH FROM check_in AT TIME ZONE 'Africa/Cairo') = $2
        AND status = 'completed'
      GROUP BY day ORDER BY day
    `,
      [year, month],
    );

    const { rows: totals } = await db.query(
      `
      SELECT
        COUNT(*) AS total_visits,
        COALESCE(SUM(cost), 0) AS total_revenue,
        COALESCE(AVG(duration_min), 0) AS avg_duration
      FROM sessions
      WHERE EXTRACT(YEAR  FROM check_in AT TIME ZONE 'Africa/Cairo') = $1
        AND EXTRACT(MONTH FROM check_in AT TIME ZONE 'Africa/Cairo') = $2
        AND status = 'completed'
    `,
      [year, month],
    );

    res.json({ year, month, daily, totals: totals[0] });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /api/admin/prices
router.get("/prices", ...isStaffOrAdmin, async (req, res) => {
  const { rows } = await db.query("SELECT * FROM price_settings ORDER BY id");
  res.json({ prices: rows });
});

// PUT /api/admin/prices/:id — تعديل أسعار الأوقات
router.put(
  "/prices/:id",
  ...isStaffOrAdmin,
  requirePermission("can_edit_prices"),
  async (req, res) => {
    const { price_per_hr } = req.body;
    if (price_per_hr === undefined || isNaN(price_per_hr) || price_per_hr < 0) {
      return res.status(400).json({ error: "السعر غير صحيح" });
    }
    try {
      const { rows } = await db.query(
        `
        UPDATE price_settings SET price_per_hr = $1, updated_at = NOW()
        WHERE id = $2 RETURNING *
      `,
        [price_per_hr, req.params.id],
      );
      res.json({ price: rows[0] });
    } catch (err) {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

// GET /api/admin/staff — قائمة الموظفين
router.get("/staff", ...isStaffOrAdmin, async (req, res) => {
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
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /api/admin/staff — إضافة موظف جديد
router.post("/staff", ...isAdmin, async (req, res) => {
  const { name, phone, password, role = "staff" } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ error: "أدخل الاسم والموبايل وكلمة السر" });
  if (!["staff", "admin"].includes(role))
    return res.status(400).json({ error: "دور غير صحيح" });

  try {
    // ✅ bcrypt في أعلى الملف — لا مشكلة هنا
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `
      INSERT INTO users (name, phone, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, phone, role, is_active,
                can_charge_wallet, can_add_points,
                can_edit_prices, can_create_coupons, can_view_reports
    `,
      [name, phone, hash, role],
    );
    res.status(201).json({ staff: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "رقم الموبايل مسجل مسبقاً" });
    }
    console.error(err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// PATCH /api/admin/staff/:id/toggle — تفعيل/تعطيل موظف
router.patch("/staff/:id/toggle", ...isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING is_active",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "موظف غير موجود" });
    res.json({ is_active: rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// PATCH /api/admin/staff/:id/permissions — تعديل صلاحيات موظف
router.patch("/staff/:id/permissions", ...isAdmin, async (req, res) => {
  const {
    can_charge_wallet = false,
    can_add_points = false,
    can_edit_prices = false,
    can_create_coupons = false,
    can_view_reports = false,
  } = req.body;

  try {
    await db.query(
      `
      UPDATE users
      SET can_charge_wallet  = $1,
          can_add_points     = $2,
          can_edit_prices    = $3,
          can_create_coupons = $4,
          can_view_reports   = $5
      WHERE id = $6 AND role = 'staff'
    `,
      [
        can_charge_wallet,
        can_add_points,
        can_edit_prices,
        can_create_coupons,
        can_view_reports,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// DELETE /api/admin/staff/:id — حذف موظف
router.delete("/staff/:id", ...isAdmin, async (req, res) => {
  try {
    // ✅ حماية: لا يحذف الأدمن الوحيد
    const { rows: adminCount } = await db.query(
      `SELECT COUNT(*) FROM users WHERE role = 'admin'`,
    );
    const { rows: target } = await db.query(
      "SELECT role FROM users WHERE id = $1",
      [req.params.id],
    );
    if (!target.length)
      return res.status(404).json({ error: "موظف غير موجود" });
    if (target[0].role === "admin" && parseInt(adminCount[0].count) <= 1) {
      return res.status(400).json({ error: "لا يمكن حذف الأدمن الوحيد" });
    }

    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /api/admin/users/export
router.get("/users/export", ...isStaffOrAdmin, async (req, res) => {
  const { search = "" } = req.query;
  try {
    const { rows } = await db.query(
      `
      SELECT id, name, phone, email, balance, points,
             is_active, created_at
      FROM users
      WHERE (name ILIKE $1 OR phone ILIKE $1) AND role = 'client'
      ORDER BY created_at DESC
    `,
      [`%${search}%`],
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في التصدير" });
  }
});

// GET /api/admin/users/:id/referrals — من سجّل من خلال العميل
router.get("/users/:id/referrals", ...isStaffOrAdmin, async (req, res) => {
  const { rows } = await db.query(`
    SELECT u.id, u.name, u.phone, u.created_at,
           rl.points_given, rl.reason, rl.created_at AS log_date
    FROM users u
    LEFT JOIN referral_logs rl ON rl.referred_id = u.id AND rl.referrer_id = $1
    WHERE u.referred_by = $1
    ORDER BY u.created_at DESC
  `, [req.params.id]);
  res.json({ referrals: rows });
});

// GET /api/admin/referrals — صفحة برنامج الدعوات
router.get('/referrals', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, u.name, u.phone, u.avatar_url,
        u.referral_code, u.referral_count,
        u.referral_earned_points, u.created_at,
        ref.name  AS referred_by_name,
        ref.phone AS referred_by_phone,
        COALESCE(
          (SELECT SUM(GREATEST(s.guest_count - 1, 0))
           FROM sessions s
           WHERE s.user_id = u.id AND s.status = 'completed' AND s.guest_count > 1),
          0
        ) AS guests_count,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id',         inv.id,
            'name',       inv.name,
            'phone',      inv.phone,
            'created_at', inv.created_at,
            'referral_points', rl.points_given
          ) ORDER BY inv.created_at DESC)
           FROM users inv
           LEFT JOIN referral_logs rl ON rl.referred_id = inv.id AND rl.referrer_id = u.id AND rl.reason = 'signup'
           WHERE inv.referred_by = u.id),
          '[]'
        ) AS invited_users
      FROM users u
      LEFT JOIN users ref ON ref.id = u.referred_by
      WHERE u.role = 'client'
      ORDER BY u.referral_count DESC, u.created_at ASC
    `);
    res.json({ referrals: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
