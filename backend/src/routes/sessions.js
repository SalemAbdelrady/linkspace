const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

async function getCurrentPrice() {
  const { rows } = await db.query(
    `SELECT first_hour FROM space_settings WHERE space_key = 'cowork' LIMIT 1`
  );
  return parseFloat(rows[0]?.first_hour || 30);
}

async function getMaxHours() {
  const { rows } = await db.query(
    `SELECT max_hours FROM space_settings WHERE space_key = 'cowork' LIMIT 1`
  );
  return parseInt(rows[0]?.max_hours || 4);
}

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
      // ✅ مجرد إغلاق الجلسة وحساب التكلفة — بدون أي خصم
      // الخصم هيحصل في /pay بعد ما الموظف يختار طريقة الدفع
      const session     = activeSessions[0];
      const checkOut    = new Date();
      const checkOutISO = checkOut.toISOString();
      const checkIn     = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);

      const maxHours = await getMaxHours();
      const cost     = calculateCost(durationMin, session.price_per_hr, maxHours);

      // ✅ النقاط بتتحسب هنا عشان مش مرتبطة بطريقة الدفع
      const pointsEarned = Math.floor(cost / 10);

      await client.query(`
        UPDATE sessions SET
          check_out    = $1,
          duration_min = $2,
          cost         = $3,
          status       = 'completed'
        WHERE id = $4
      `, [checkOutISO, durationMin, cost, session.id]);

      if (pointsEarned > 0) {
        await client.query(
          'UPDATE users SET points = points + $1 WHERE id = $2',
          [pointsEarned, user.id]
        );
      }

      await client.query('COMMIT');

      return res.json({
        action : 'checkout',
        client : {
          id     : user.id,
          name   : user.name,
          phone  : user.phone,
          balance: parseFloat(user.balance), // ✅ الرصيد الحالي للعميل (قبل الخصم)
        },
        session: {
          id          : session.id,
          durationMin,
          cost,
          pointsEarned,
          pricePerHr  : session.price_per_hr,
          checkIn     : session.check_in,
          checkOut    : checkOutISO,
          // ✅ paymentMethod مش موجود هنا — الموظف هيختاره في InvoicePage
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

// ─────────────────────────────────────────────────────────────────────
// POST /api/sessions/pay — خصم الرصيد بعد اختيار الموظف لطريقة الدفع
//  body: { session_id, user_id, payment_method, cost }
//  payment_method: 'wallet' | 'cash' | 'partial'
//
//  wallet  → اخصم كل الـ cost من المحفظة
//  cash    → لا تخصم شيء
//  partial → اخصم الرصيد الموجود بس، والباقي كاش
// ─────────────────────────────────────────────────────────────────────
router.post('/pay', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { session_id, user_id, payment_method, cost } = req.body;

  if (!session_id || !user_id || !payment_method || cost === undefined) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // جيب بيانات العميل وقفلها
    const { rows: userRows } = await client.query(
      'SELECT id, balance FROM users WHERE id = $1 FOR UPDATE',
      [user_id]
    );
    const user = userRows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const balance     = parseFloat(user.balance);
    const totalCost   = parseFloat(cost);
    let   walletDebit = 0;
    let   finalMethod = payment_method;

    if (payment_method === 'wallet') {
      // ✅ محفظة كاملة
      if (balance < totalCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `الرصيد غير كافٍ — الرصيد الحالي: ${balance.toFixed(2)} ج`,
        });
      }
      walletDebit = totalCost;

    } else if (payment_method === 'partial') {
      // ✅ جزء من المحفظة والباقي كاش
      walletDebit = Math.min(balance, totalCost);
      finalMethod = 'partial';

    } else {
      // ✅ كاش — لا خصم
      walletDebit = 0;
      finalMethod = 'cash';
    }

    // نفذ الخصم من المحفظة لو في خصم
    if (walletDebit > 0) {
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [walletDebit, user_id]
      );
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, description)
        VALUES ($1, 'debit', $2, 'خصم تكلفة جلسة')
      `, [user_id, walletDebit]);
    }

    // حدّث الـ session بطريقة الدفع الفعلية
    await client.query(
      `UPDATE sessions SET payment_method = $1 WHERE id = $2`,
      [finalMethod, session_id]
    );

    await client.query('COMMIT');

    // الرصيد الجديد
    const newBalance = parseFloat((balance - walletDebit).toFixed(2));

    res.json({
      success      : true,
      payment_method: finalMethod,
      wallet_debit : walletDebit,
      cash_amount  : parseFloat((totalCost - walletDebit).toFixed(2)),
      new_balance  : newBalance,
    });

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

