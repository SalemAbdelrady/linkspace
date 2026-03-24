const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

async function getCurrentPrice() {
  const hour = new Date().getHours();
  const { rows } = await db.query(`
    SELECT price_per_hr FROM price_settings
    WHERE start_hour <= $1 AND end_hour > $1
    LIMIT 1
  `, [hour]);
  if (!rows[0]) {
    const { rows: nightRows } = await db.query(
      `SELECT price_per_hr FROM price_settings WHERE period_name = 'night' LIMIT 1`
    );
    return parseFloat(nightRows[0]?.price_per_hr || 12);
  }
  return parseFloat(rows[0].price_per_hr);
}

// ✅ دالة حساب التكلفة بالحد الأقصى 4 ساعات
function calculateCost(durationMin, pricePerHr) {
  const MAX_HOURS = 4;
  const hours = durationMin / 60;
  const billableHours = Math.min(hours, MAX_HOURS);
  return parseFloat((billableHours * pricePerHr).toFixed(2));
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
      // CHECK-OUT
      const session = activeSessions[0];
      const checkOut = new Date();
      const checkIn = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);

      // ✅ حساب التكلفة بالحد الأقصى 4 ساعات
      const cost = calculateCost(durationMin, session.price_per_hr);

      await client.query(`
        UPDATE sessions SET
          check_out = $1, duration_min = $2, cost = $3, status = 'completed'
        WHERE id = $4
      `, [checkOut, durationMin, cost, session.id]);

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
        action: 'checkout',
        client: { name: user.name, phone: user.phone },
        session: { durationMin, cost, paymentMethod, pointsEarned, pricePerHr: session.price_per_hr },
      });

    } else {
      // CHECK-IN
      const pricePerHr = await getCurrentPrice();
      await client.query(`
        INSERT INTO sessions (user_id, price_per_hr) VALUES ($1, $2)
      `, [user.id, pricePerHr]);

      await client.query('COMMIT');

      return res.json({
        action: 'checkin',
        client: { name: user.name, phone: user.phone, balance: user.balance },
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
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
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

    res.json({ sessions: rows, total: parseInt(countRows[0].count), page, limit });
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