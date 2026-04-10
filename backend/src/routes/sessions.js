const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// ✅ جيب السعر من space_settings
async function getCurrentPrice() {
  const { rows } = await db.query(
    `SELECT first_hour FROM space_settings WHERE space_key = 'cowork' LIMIT 1`
  );
  return parseFloat(rows[0]?.first_hour || 30);
}

// ✅ جيب الحد الأقصى من space_settings
async function getMaxHours() {
  const { rows } = await db.query(
    `SELECT max_hours FROM space_settings WHERE space_key = 'cowork' LIMIT 1`
  );
  return parseInt(rows[0]?.max_hours || 4);
}

// ✅ المنطق الجديد:
//    - Math.ceil  → أي كسر من ساعة = ساعة كاملة
//    - Math.max 1 → الحد الأدنى ساعة واحدة دايماً
//    - Math.min   → لا يتجاوز الحد الأقصى (default 4 ساعات)
//
//  أمثلة (pricePerHr = 30):
//    5  دقائق  → ceil(0.08) = 1h → 30 جنيه
//    30 دقيقة  → ceil(0.50) = 1h → 30 جنيه
//    61 دقيقة  → ceil(1.01) = 2h → 60 جنيه
//   121 دقيقة  → ceil(2.01) = 3h → 90 جنيه
//   300 دقيقة  → ceil(5.00) = 4h → 120 جنيه  (مقيّد بالحد الأقصى)
function calculateCost(durationMin, pricePerHr, maxHours = 4) {
  const rawHours    = durationMin / 60;
  const billedHours = Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
  return parseFloat((billedHours * pricePerHr).toFixed(2));
}

// POST /api/sessions/scan
router.post('/scan', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { qr_code } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'QR Code مطلوب' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `SELECT id, name, phone, balance, points 
       FROM users 
       WHERE qr_code = $1 AND is_active = true 
       FOR UPDATE`,
      [qr_code]
    );
    const user = userRows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const { rows: activeSessions } = await client.query(
      `SELECT * FROM sessions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user.id]
    );

    if (activeSessions[0]) {
      // ─── CHECK-OUT ───────────────────────────────────────────────
      const session     = activeSessions[0];
      const checkOut    = new Date();
      const checkOutISO = checkOut.toISOString();
      const checkIn     = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);

      const maxHours = await getMaxHours();
      const cost     = calculateCost(durationMin, session.price_per_hr, maxHours);

      await client.query(`
        UPDATE sessions SET
          check_out    = $1,
          duration_min = $2,
          cost         = $3,
          status       = 'completed'
        WHERE id = $4
      `, [checkOutISO, durationMin, cost, session.id]);

      let paymentMethod = 'cash';
      if (parseFloat(user.balance) >= cost) {
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [cost, user.id]
        );
        await client.query(`
          INSERT INTO wallet_transactions (user_id, type, amount, description)
          VALUES ($1, 'debit', $2, 'خصم تكلفة جلسة')
        `, [user.id, cost]);
        paymentMethod = 'wallet';
      }

      const pointsEarned = Math.floor(cost / 10);
      if (pointsEarned > 0) {
        await client.query(
          'UPDATE users SET points = points + $1 WHERE id = $2',
          [pointsEarned, user.id]
        );
      }

      await client.query('COMMIT');

      return res.json({
        action : 'checkout',
        client : { name: user.name, phone: user.phone, id: user.id },
        session: {
          id:          session.id,        // ✅ محتاجه في InvoicePage لحفظ الفاتورة
          durationMin,
          cost,
          paymentMethod,
          pointsEarned,
          pricePerHr:  session.price_per_hr,
          checkIn:     session.check_in,  // ✅ لعرض وقت الدخول في الفاتورة
          checkOut:    checkOutISO,        // ✅ لعرض وقت الخروج في الفاتورة
        },
      });

    } else {
      // ─── CHECK-IN ────────────────────────────────────────────────
      const pricePerHr = await getCurrentPrice();

      await client.query(`
        INSERT INTO sessions (user_id, price_per_hr) VALUES ($1, $2)
      `, [user.id, pricePerHr]);

      await client.query('COMMIT');

      return res.json({
        action    : 'checkin',
        client    : { name: user.name, phone: user.phone, balance: user.balance },
        pricePerHr,
      });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});

// GET /api/sessions/history
router.get('/history', auth, async (req, res) => {
  const page   = parseInt(req.query.page) || 1;
  const limit  = 10;
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(`
      SELECT id, check_in, check_out, duration_min, cost, payment_method, status
      FROM sessions WHERE user_id = $1
      ORDER BY check_in DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM sessions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      sessions : rows,
      total    : parseInt(countRows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/sessions/active
router.get('/active', auth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.id, s.check_in, s.price_per_hr,
             u.id as user_id, u.name, u.phone, u.balance,
             EXTRACT(EPOCH FROM (NOW() - s.check_in))/60 AS elapsed_min
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active'
      ORDER BY s.check_in ASC
    `);
    res.json({ sessions: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

