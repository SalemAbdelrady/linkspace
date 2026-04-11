const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// ── migration guard: أضف الأعمدة الجديدة لو مش موجودة ──────────────
;(async () => {
  try {
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS wallet_paid NUMERIC(10,2) NOT NULL DEFAULT 0`);
    await db.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cash_paid   NUMERIC(10,2) NOT NULL DEFAULT 0`);
  } catch (e) { /* تجاهل — الأعمدة موجودة مسبقاً */ }
})();

// POST /api/invoices — حفظ فاتورة + خصم المحفظة في transaction واحدة [staff/admin]
router.post('/', auth, requireRole('staff', 'admin'), async (req, res) => {
  const {
    invoice_number,
    session_id,
    user_id,
    client_name,
    client_phone,
    session_cost,
    duration_min,
    price_per_hr,
    services,
    services_cost,
    coupon_code,
    discount_pct,
    discount_amount,
    subtotal,
    total,
    payment_method,
    note,
  } = req.body;

  if (!invoice_number || !user_id || !client_name) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // ── 1. جلب الرصيد الحالي للعميل ──────────────────────────────────
    const { rows: userRows } = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [user_id]
    );
    if (!userRows[0]) throw new Error('العميل غير موجود');

    const currentBalance = parseFloat(userRows[0].balance);
    const totalAmount    = parseFloat(total || 0);

    // ── 2. حساب المبالغ بحسب طريقة الدفع ────────────────────────────
    let walletPaid = 0;
    let cashPaid   = 0;

    if (payment_method === 'wallet') {
      // دفع كامل من المحفظة
      walletPaid = Math.min(currentBalance, totalAmount);
      cashPaid   = parseFloat((totalAmount - walletPaid).toFixed(2));
    } else if (payment_method === 'partial') {
      // رصيد جزئي + كاش
      walletPaid = Math.min(currentBalance, totalAmount);
      cashPaid   = parseFloat((totalAmount - walletPaid).toFixed(2));
    } else {
      // كاش فقط
      walletPaid = 0;
      cashPaid   = totalAmount;
    }

    // ── 3. خصم الرصيد من المحفظة لو في مبلغ محفظة ──────────────────
    if (walletPaid > 0) {
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

    // ── 4. حفظ الفاتورة ───────────────────────────────────────────────
    const { rows } = await client.query(`
      INSERT INTO invoices (
        invoice_number, session_id, user_id,
        client_name, client_phone,
        session_cost, duration_min, price_per_hr,
        services, services_cost,
        coupon_code, discount_pct, discount_amount,
        subtotal, total,
        wallet_paid, cash_paid,
        payment_method, note
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      ON CONFLICT (invoice_number) DO NOTHING
      RETURNING *
    `, [
      invoice_number,
      session_id     || null,
      user_id,
      client_name,
      client_phone,
      session_cost   || 0,
      duration_min   || 0,
      price_per_hr   || 0,
      JSON.stringify(services || []),
      services_cost  || 0,
      coupon_code    || null,
      discount_pct   || 0,
      discount_amount|| 0,
      subtotal       || 0,
      totalAmount,
      walletPaid,
      cashPaid,
      payment_method || 'cash',
      note           || null,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      invoice:     rows[0],
      wallet_paid: walletPaid,
      cash_paid:   cashPaid,
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

// GET /api/invoices — كل الفواتير [staff/admin]
router.get('/', auth, requireRole('staff', 'admin'), async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const date   = req.query.date   || '';

  try {
    const { rows } = await db.query(`
      SELECT *
      FROM invoices
      WHERE
        ($1 = '' OR client_name ILIKE '%' || $1 || '%' OR client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(created_at) = $2::date)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `, [search, date, limit, offset]);

    const { rows: countRows } = await db.query(`
      SELECT COUNT(*) FROM invoices
      WHERE
        ($1 = '' OR client_name ILIKE '%' || $1 || '%' OR client_phone ILIKE '%' || $1 || '%')
        AND ($2 = '' OR DATE(created_at) = $2::date)
    `, [search, date]);

    res.json({ invoices: rows, total: parseInt(countRows[0].count), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في جلب الفواتير' });
  }
});

// GET /api/invoices/:id — فاتورة واحدة [staff/admin]
router.get('/:id', auth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM invoices WHERE id = $1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'فاتورة غير موجودة' });
    res.json({ invoice: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
