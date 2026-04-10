const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/invoices — حفظ فاتورة كاملة [staff/admin]
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
    services,       // [{name, price, qty}]
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

  try {
    const { rows } = await db.query(`
      INSERT INTO invoices (
        invoice_number, session_id, user_id,
        client_name, client_phone,
        session_cost, duration_min, price_per_hr,
        services, services_cost,
        coupon_code, discount_pct, discount_amount,
        subtotal, total,
        payment_method, note
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16,$17
      )
      ON CONFLICT (invoice_number) DO NOTHING
      RETURNING *
    `, [
      invoice_number, session_id || null, user_id,
      client_name, client_phone,
      session_cost   || 0,
      duration_min   || 0,
      price_per_hr   || 0,
      JSON.stringify(services || []),
      services_cost  || 0,
      coupon_code    || null,
      discount_pct   || 0,
      discount_amount|| 0,
      subtotal       || 0,
      total          || 0,
      payment_method || 'cash',
      note           || null,
    ]);

    res.status(201).json({ invoice: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في حفظ الفاتورة' });
  }
});

// GET /api/invoices — كل الفواتير [staff/admin]
//   query: ?page=1&search=اسم&date=2026-04-10
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
