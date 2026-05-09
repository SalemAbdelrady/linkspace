const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// ── migration guard ───────────────────────────────────────────────────
;(async () => {
  try {
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS wallet_paid  NUMERIC(10,2) NOT NULL DEFAULT 0`);
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cash_paid    NUMERIC(10,2) NOT NULL DEFAULT 0`);
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS space_key    VARCHAR(20)   DEFAULT 'cowork'`);
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS space_name   VARCHAR(100)  DEFAULT 'منطقة العمل المشتركة'`);
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  } catch (e) { /* الأعمدة موجودة مسبقاً */ }
})();

// POST /api/invoices — حفظ فاتورة [staff/admin]
router.post('/', auth, requireRole('staff', 'admin'), async (req, res) => {
  const {
    invoice_number, session_id, user_id,
    client_name, client_phone,
    space_key, space_name,
    session_cost, duration_min, price_per_hr,
    services, services_cost,
    coupon_code, discount_pct, discount_amount,
    subtotal, total,
    payment_method, note,
    wallet_paid: walletPaidFromFrontend,
    cash_paid:   cashPaidFromFrontend,
  } = req.body;

  if (!invoice_number || !user_id || !client_name) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE', [user_id]
    );
    if (!userRows[0]) throw new Error('العميل غير موجود');

    const currentBalance = parseFloat(userRows[0].balance);
    const totalAmount    = parseFloat(total || 0);

    let walletPaid = 0;
    let cashPaid   = 0;

    if (walletPaidFromFrontend !== undefined && walletPaidFromFrontend !== null) {
      walletPaid = parseFloat(walletPaidFromFrontend) || 0;
      cashPaid   = parseFloat(cashPaidFromFrontend)   || 0;
    } else {
      if (payment_method === 'cash' || payment_method === 'subscription') {
        walletPaid = 0; cashPaid = totalAmount;
      } else if (payment_method === 'wallet') {
        walletPaid = Math.min(currentBalance, totalAmount);
        cashPaid   = parseFloat((totalAmount - walletPaid).toFixed(2));
      } else if (payment_method === 'partial') {
        walletPaid = currentBalance;
        cashPaid   = parseFloat((totalAmount - walletPaid).toFixed(2));
      } else {
        walletPaid = 0; cashPaid = totalAmount;
      }
    }

    if (walletPaid > 0) {
      if (currentBalance < walletPaid) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `الرصيد غير كافٍ — الرصيد الحالي: ${currentBalance.toFixed(2)} ج`,
        });
      }
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [walletPaid, user_id]
      );
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, description)
        VALUES ($1, 'debit', $2, $3)
      `, [
        user_id,
        walletPaid,
        `فاتورة #${invoice_number}${cashPaid > 0 ? ` (+ ${cashPaid.toFixed(2)} ج كاش)` : ''}`,
      ]);
    }

    const { rows } = await client.query(`
      INSERT INTO invoices (
        invoice_number, session_id, user_id,
        client_name, client_phone,
        space_key, space_name,
        session_cost, duration_min, price_per_hr,
        services, services_cost,
        coupon_code, discount_pct, discount_amount,
        subtotal, total,
        wallet_paid, cash_paid,
        payment_method, note,
        created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,$21,
        $22
      )
      ON CONFLICT (invoice_number) DO NOTHING
      RETURNING *
    `, [
      invoice_number, session_id || null, user_id,
      client_name, client_phone,
      space_key || 'cowork', space_name || 'منطقة العمل المشتركة',
      session_cost || 0, duration_min || 0, price_per_hr || 0,
      JSON.stringify(services || []), services_cost || 0,
      coupon_code || null, discount_pct || 0, discount_amount || 0,
      subtotal || 0, totalAmount,
      walletPaid, cashPaid,
      payment_method || 'cash', note || null,
      req.user.id,
    ]);

    await client.query('COMMIT');
    res.status(201).json({
      invoice    : rows[0],
      wallet_paid: walletPaid,
      cash_paid  : cashPaid,
      new_balance: parseFloat((currentBalance - walletPaid).toFixed(2)),
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'خطأ في حفظ الفاتورة' });
  } finally {
    client.release();
  }
});

// GET /api/invoices/my — فواتير العميل الحالي [client]
router.get('/my', auth, async (req, res) => {
  const page   = parseInt(req.query.page) || 1;
  const limit  = 10;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(`
      SELECT * FROM invoices WHERE user_id = $1
      ORDER BY created_at DESC LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM invoices WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      invoices: rows,
      total   : parseInt(countRows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب الفواتير' });
  }
});

// GET /api/invoices — كل الفواتير [staff/admin]
router.get('/', auth, requireRole('staff', 'admin'), async (req, res) => {
  const page     = parseInt(req.query.page) || 1;
  const limit    = 20;
  const offset   = (page - 1) * limit;
  const search   = req.query.search   || '';
  const date     = req.query.date     || '';
  const staff_id = req.query.staff_id || '';

  try {
    // ── الفواتير مع pagination ──
    const { rows } = await db.query(`
      SELECT i.*, u.name AS created_by_name, c.email AS client_email
      FROM invoices i
      LEFT JOIN users u ON u.id = i.created_by
      LEFT JOIN users c ON c.id = i.user_id
      WHERE
        ($1 = '' OR i.client_name ILIKE '%' || $1 || '%' OR i.client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(i.created_at) = $2::date)
        AND ($3 = '' OR i.created_by = $3::integer)
      ORDER BY i.created_at DESC
      LIMIT $4 OFFSET $5
    `, [search, date, staff_id, limit, offset]);

    // ── عدد الفواتير الكلي ──
    const { rows: countRows } = await db.query(`
      SELECT COUNT(*) FROM invoices i
      WHERE
        ($1 = '' OR i.client_name ILIKE '%' || $1 || '%' OR i.client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(i.created_at) = $2::date)
        AND ($3 = '' OR i.created_by = $3::integer)
    `, [search, date, staff_id]);

    // ✅ ── مجاميع الفواتير (للـ Summary Bar) ──
    const { rows: summary } = await db.query(`
      SELECT
        COALESCE(SUM(i.total),        0) AS total_amount,
        COALESCE(SUM(i.cash_paid),    0) AS total_cash,
        COALESCE(SUM(i.wallet_paid),  0) AS total_wallet
      FROM invoices i
      WHERE
        ($1 = '' OR i.client_name ILIKE '%' || $1 || '%' OR i.client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(i.created_at) = $2::date)
        AND ($3 = '' OR i.created_by = $3::integer)
    `, [search, date, staff_id]);

    res.json({
      invoices    : rows,
      total       : parseInt(countRows[0].count),
      page,
      limit,
      // ✅ مجاميع تظهر في الـ Summary Bar في الفرونت
      total_amount: parseFloat(summary[0].total_amount),
      total_cash  : parseFloat(summary[0].total_cash),
      total_wallet: parseFloat(summary[0].total_wallet),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب الفواتير' });
  }
});

// GET /api/invoices/export — كل الفواتير بدون pagination للتصدير
router.get('/export', auth, requireRole('staff', 'admin'), async (req, res) => {
  const search   = req.query.search   || '';
  const date     = req.query.date     || '';
  const staff_id = req.query.staff_id || '';

  try {
    const { rows } = await db.query(`
      SELECT i.*, u.name AS created_by_name
      FROM invoices i
      LEFT JOIN users u ON u.id = i.created_by
      WHERE
        ($1 = '' OR i.client_name ILIKE '%' || $1 || '%' OR i.client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(i.created_at) = $2::date)
        AND ($3 = '' OR i.created_by = $3::integer)
      ORDER BY i.created_at DESC
    `, [search, date, staff_id]);

    res.json({ invoices: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في التصدير' });
  }
});

// GET /api/invoices/:id [staff/admin]
router.get('/:id', auth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT i.*, u.name AS created_by_name, c.email AS client_email
      FROM invoices i
      LEFT JOIN users u ON u.id = i.created_by
      LEFT JOIN users c ON c.id = i.user_id
      WHERE i.id = $1
    `, [req.params.id]);

    if (!rows[0]) return res.status(404).json({ error: 'فاتورة غير موجودة' });
    res.json({ invoice: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

