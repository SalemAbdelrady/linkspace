/**
 * reports.js — تقارير شاملة للنظام
 */
const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// ── Helper: بناء شرط التاريخ ──────────────────────────────────────
function dateFilter(from, to, field, paramStart) {
  const conditions = [];
  const params = [];
  let idx = paramStart;
  if (from) { conditions.push(`${field} >= $${idx++}::date`); params.push(from); }
  if (to)   { conditions.push(`${field} <= $${idx++}::date`); params.push(to); }
  return { conditions, params, nextIdx: idx };
}

// ── GET /api/reports/summary — KPIs سريعة ─────────────────────────
router.get('/summary', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to } = req.query;
  const { conditions, params } = dateFilter(
    date_from, date_to,
    "DATE(i.created_at AT TIME ZONE 'Africa/Cairo')", 1
  );
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [revenue, sessions, clients, coupons] = await Promise.all([
      db.query(`
        SELECT
          COALESCE(SUM(total), 0)       AS total_revenue,
          COALESCE(SUM(cash_paid), 0)   AS total_cash,
          COALESCE(SUM(wallet_paid), 0) AS total_wallet,
          COUNT(*)                       AS invoice_count,
          COALESCE(AVG(total), 0)        AS avg_invoice
        FROM invoices i ${where}
      `, params),

      db.query(`
        SELECT
          COUNT(*) AS total_sessions,
          COALESCE(SUM(duration_min), 0) AS total_minutes,
          COALESCE(AVG(duration_min), 0) AS avg_duration
        FROM sessions s
        WHERE status = 'completed'
        ${date_from ? `AND DATE(check_in) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(check_in) <= '${date_to}'::date` : ''}
      `),

      db.query(`
        SELECT COUNT(DISTINCT user_id) AS unique_clients
        FROM sessions s
        WHERE status = 'completed'
        ${date_from ? `AND DATE(check_in) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(check_in) <= '${date_to}'::date` : ''}
      `),

        db.query(`
        SELECT COUNT(*) AS used_coupons
        FROM coupons
        WHERE is_used = true
        `),
    ]);

    res.json({
      revenue:      revenue.rows[0],
      sessions:     sessions.rows[0],
      unique_clients: parseInt(clients.rows[0].unique_clients),
      used_coupons:   parseInt(coupons.rows[0].used_coupons),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/revenue — تقرير الإيرادات ────────────────────
router.get('/revenue', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to, group_by = 'day' } = req.query;

  const groupFormat = group_by === 'month'
    ? `TO_CHAR(created_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM')`
    : `TO_CHAR(created_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD')`;

  try {
    const { rows } = await db.query(`
      SELECT
        ${groupFormat} AS period,
        COALESCE(SUM(total), 0)       AS revenue,
        COALESCE(SUM(cash_paid), 0)   AS cash,
        COALESCE(SUM(wallet_paid), 0) AS wallet,
        COUNT(*)                       AS count
      FROM invoices
      WHERE 1=1
        ${date_from ? `AND DATE(created_at AT TIME ZONE 'Africa/Cairo') >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(created_at AT TIME ZONE 'Africa/Cairo') <= '${date_to}'::date` : ''}
      GROUP BY period
      ORDER BY period ASC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/clients — تقرير العملاء ──────────────────────
router.get('/clients', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to, limit = 20 } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.phone, u.email,
        u.balance, u.points,
        COUNT(DISTINCT s.id)           AS session_count,
        COALESCE(SUM(s.duration_min), 0) AS total_minutes,
        COALESCE(SUM(s.cost), 0)       AS total_spent,
        MAX(s.check_in)                AS last_visit,
        u.created_at
      FROM users u
      LEFT JOIN sessions s ON s.user_id = u.id AND s.status = 'completed'
        ${date_from ? `AND DATE(s.check_in) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(s.check_in) <= '${date_to}'::date` : ''}
      WHERE u.role = 'client' AND u.is_active = true
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT $1
    `, [parseInt(limit)]);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/spaces — تقرير المساحات ──────────────────────
router.get('/spaces', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT
        s.space_key,
        s.space_name,
        COUNT(*)                         AS session_count,
        COALESCE(SUM(s.duration_min), 0) AS total_minutes,
        COALESCE(SUM(s.cost), 0)         AS total_revenue,
        COALESCE(AVG(s.duration_min), 0) AS avg_duration,
        COUNT(DISTINCT s.user_id)        AS unique_clients
      FROM sessions s
      WHERE s.status = 'completed'
        ${date_from ? `AND DATE(s.check_in) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(s.check_in) <= '${date_to}'::date` : ''}
      GROUP BY s.space_key, s.space_name
      ORDER BY total_revenue DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/staff — تقرير الموظفين ───────────────────────
router.get('/staff', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.phone,
        COUNT(DISTINCT i.id)           AS invoices_count,
        COALESCE(SUM(i.total), 0)      AS total_handled,
        COUNT(DISTINCT s.id)           AS sessions_handled,
        COUNT(DISTINCT b.id)           AS bookings_confirmed
      FROM users u
      LEFT JOIN invoices i ON i.created_by = u.id
        ${date_from ? `AND DATE(i.created_at) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(i.created_at) <= '${date_to}'::date` : ''}
      LEFT JOIN sessions s ON s.created_by = u.id
        ${date_from ? `AND DATE(s.check_in) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(s.check_in) <= '${date_to}'::date` : ''}
      LEFT JOIN bookings b ON b.confirmed_by = u.id
        ${date_from ? `AND DATE(b.updated_at) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(b.updated_at) <= '${date_to}'::date` : ''}
      WHERE u.role IN ('staff', 'admin')
      GROUP BY u.id
      ORDER BY total_handled DESC
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/coupons — تقرير الكوبونات ────────────────────
router.get('/coupons', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to } = req.query;
  try {
    const [stats, topUsers] = await Promise.all([
    db.query(`
    SELECT
        COUNT(*)                                    AS total_coupons,
        COUNT(*) FILTER (WHERE is_used = true)      AS used_count,
        COUNT(*) FILTER (WHERE is_used = false)     AS unused_count,
        COALESCE(SUM(discount_pct) FILTER (WHERE is_used = true), 0) AS total_discount_pct
    FROM coupons
    WHERE DATE(created_at) >= COALESCE($1::date, '2000-01-01'::date)
        AND DATE(created_at) <= COALESCE($2::date, NOW()::date)
    `, [date_from || null, date_to || null]),

    db.query(`
    SELECT
        u.name, u.phone,
        COUNT(c.id)         AS coupons_used,
        AVG(c.discount_pct) AS avg_discount
    FROM coupons c
    JOIN users u ON u.id = c.user_id
    WHERE c.is_used = true
        AND DATE(c.created_at) >= COALESCE($1::date, '2000-01-01'::date)
        AND DATE(c.created_at) <= COALESCE($2::date, NOW()::date)
    GROUP BY u.id, u.name, u.phone
    ORDER BY coupons_used DESC
    LIMIT 10
    `, [date_from || null, date_to || null]),
    ]);
    res.json({ stats: stats.rows[0], top_users: topUsers.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/reports/referrals — تقرير الدعوات ────────────────────
router.get('/referrals', ...isStaffOrAdmin, async (req, res) => {
  const { date_from, date_to } = req.query;
  try {
    const { rows } = await db.query(`
      SELECT
        u.id, u.name, u.phone,
        u.referral_code,
        u.referral_count,
        u.referral_earned_points,
        COUNT(rl.id) AS total_referrals,
        COALESCE(SUM(rl.points_given), 0) AS points_given,
        MAX(rl.created_at) AS last_referral
      FROM users u
      LEFT JOIN referral_logs rl ON rl.referrer_id = u.id
        ${date_from ? `AND DATE(rl.created_at) >= '${date_from}'::date` : ''}
        ${date_to   ? `AND DATE(rl.created_at) <= '${date_to}'::date` : ''}
      WHERE u.role = 'client' AND u.referral_count > 0
      GROUP BY u.id
      ORDER BY total_referrals DESC
      LIMIT 20
    `);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
