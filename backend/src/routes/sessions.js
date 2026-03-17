const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// Helper: get price for current hour
async function getCurrentPrice() {
  const hour = new Date().getHours();
  const { rows } = await db.query(`
    SELECT price_per_hr FROM price_settings
    WHERE start_hour <= $1 AND end_hour > $1
    LIMIT 1
  `, [hour]);
  // Night period wraps around midnight
  if (!rows[0]) {
    const { rows: nightRows } = await db.query(
      `SELECT price_per_hr FROM price_settings WHERE period_name = 'night' LIMIT 1`
    );
    return parseFloat(nightRows[0]?.price_per_hr || 12);
  }
  return parseFloat(rows[0].price_per_hr);
}

// POST /api/sessions/scan — used by scanner interface
router.post('/scan', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { qr_code } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'QR Code مطلوب' });

  try {
    const { rows: userRows } = await db.query(
      'SELECT id, name, phone, balance, points FROM users WHERE qr_code = $1 AND is_active = true',
      [qr_code]
    );
    const client = userRows[0];
    if (!client) return res.status(404).json({ error: 'العميل غير موجود' });

    // Check if already has active session
    const { rows: activeSessions } = await db.query(
      `SELECT * FROM sessions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [client.id]
    );

    if (activeSessions[0]) {
      // CHECK-OUT
      const session = activeSessions[0];
      const checkOut = new Date();
      const checkIn = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);
      const cost = parseFloat(((durationMin / 60) * session.price_per_hr).toFixed(2));

      await db.query(`
        UPDATE sessions SET
          check_out = $1, duration_min = $2, cost = $3, status = 'completed'
        WHERE id = $4
      `, [checkOut, durationMin, cost, session.id]);

      // Deduct from wallet if enough balance
      let paymentMethod = 'cash';
      if (parseFloat(client.balance) >= cost) {
        await db.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [cost, client.id]
        );
        await db.query(`
          INSERT INTO wallet_transactions (user_id, type, amount, description)
          VALUES ($1, 'debit', $2, 'خصم تكلفة جلسة')
        `, [client.id, cost]);
        paymentMethod = 'wallet';
      }

      // Award loyalty points: 1 point per 10 EGP
      const pointsEarned = Math.floor(cost / 10);
      if (pointsEarned > 0) {
        await db.query(
          'UPDATE users SET points = points + $1 WHERE id = $2',
          [pointsEarned, client.id]
        );
      }

      return res.json({
        action: 'checkout',
        client: { name: client.name, phone: client.phone },
        session: { durationMin, cost, paymentMethod, pointsEarned },
      });
    } else {
      // CHECK-IN
      const pricePerHr = await getCurrentPrice();
      await db.query(`
        INSERT INTO sessions (user_id, price_per_hr) VALUES ($1, $2)
      `, [client.id, pricePerHr]);

      return res.json({
        action: 'checkin',
        client: { name: client.name, phone: client.phone, balance: client.balance },
        pricePerHr,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/sessions/history — client's own history
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

// GET /api/sessions/active — currently active sessions (staff/admin)
router.get('/active', auth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.id, s.check_in, s.price_per_hr,
             u.name, u.phone, u.balance,
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
