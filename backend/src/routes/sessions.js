const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

async function getSpaceSettings(spaceKey = 'cowork') {
  const { rows } = await db.query(
    `SELECT name, first_hour, extra_hour, max_hours
     FROM space_settings WHERE space_key = $1 LIMIT 1`,
    [spaceKey]
  );
  return rows[0] || { name: 'منطقة العمل المشتركة', first_hour: 30, extra_hour: 30, max_hours: 4 };
}

function calculateCost(durationMin, pricePerHr, maxHours = 4) {
  const rawHours    = durationMin / 60;
  const billedHours = Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
  return parseFloat((billedHours * pricePerHr).toFixed(2));
}

// ✅ تحقق من اشتراك نشط للعميل
async function getActiveSubscription(userId) {
  const { rows } = await db.query(`
    SELECT us.*, sp.covers_cowork, sp.discount_rooms
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = $1
      AND us.status = 'active'
      AND us.end_date > NOW()
    LIMIT 1
  `, [userId]);
  return rows[0] || null;
}

// POST /api/sessions/scan
router.post('/scan', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { qr_code, space_key = 'cowork' } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'QR Code مطلوب' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `SELECT id, name, phone, balance, points
       FROM users WHERE qr_code = $1 AND is_active = true FOR UPDATE`,
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
      // ─── CHECK-OUT ────────────────────────────────────────────────
      const session     = activeSessions[0];
      const checkOut    = new Date();
      const checkOutISO = checkOut.toISOString();
      const checkIn     = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);
      const maxHours    = parseInt(session.max_hours) || 4;

      // ✅ لو جلسة اشتراك → التكلفة صفر والنقاط صفر
      const isSubSession = session.is_subscription_session || false;
      const cost         = isSubSession ? 0 : calculateCost(durationMin, session.price_per_hr, maxHours);
      const pointsEarned = isSubSession ? 0 : Math.floor(cost / 10);

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
        client : { id: user.id, name: user.name, phone: user.phone, balance: parseFloat(user.balance) },
        session: {
          id                  : session.id,
          durationMin,
          cost,
          pointsEarned,
          pricePerHr          : session.price_per_hr,
          spaceKey            : session.space_key,
          spaceName           : session.space_name,
          maxHours,
          checkIn             : session.check_in,
          checkOut            : checkOutISO,
          isSubscriptionSession: isSubSession,  // ✅ للـ InvoicePage
          subscriptionId      : session.subscription_id,
        },
      });

    } else {
      // ─── CHECK-IN ─────────────────────────────────────────────────
      const space        = await getSpaceSettings(space_key);
      const subscription = await getActiveSubscription(user.id);

      // ✅ لو عنده اشتراك نشط يغطي الـ cowork → سعر صفر
      const isSubSession  = !!(subscription && subscription.covers_cowork && space_key === 'cowork');
      const effectivePrice = isSubSession ? 0 : space.first_hour;

      const { rows: newSession } = await client.query(`
        INSERT INTO sessions
          (user_id, price_per_hr, space_key, space_name, max_hours,
           is_subscription_session, subscription_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id
      `, [
        user.id,
        effectivePrice,
        space_key,
        space.name,
        space.max_hours,
        isSubSession,
        subscription?.id || null,
      ]);

      await client.query('COMMIT');

      return res.json({
        action    : 'checkin',
        client    : { name: user.name, phone: user.phone, balance: user.balance },
        pricePerHr: effectivePrice,
        spaceKey  : space_key,
        spaceName : space.name,
        maxHours  : space.max_hours,
        // ✅ معلومات الاشتراك للـ ScannerPage
        isSubscriptionSession: isSubSession,
        subscription: subscription ? {
          id       : subscription.id,
          planName : subscription.plan_name,
          endDate  : subscription.end_date,
        } : null,
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

// POST /api/sessions/pay
router.post('/pay', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { session_id, user_id, payment_method, cost } = req.body;
  if (!session_id || !user_id || !payment_method || cost === undefined) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  // ✅ لو التكلفة صفر (جلسة اشتراك) → مش محتاج تعمل حاجة
  if (parseFloat(cost) === 0) {
    await db.query(`UPDATE sessions SET payment_method = 'subscription' WHERE id = $1`, [session_id]);
    return res.json({ success: true, payment_method: 'subscription', wallet_debit: 0, cash_amount: 0 });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      'SELECT id, balance FROM users WHERE id = $1 FOR UPDATE', [user_id]
    );
    const user = userRows[0];
    if (!user) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'العميل غير موجود' }); }

    const balance   = parseFloat(user.balance);
    const totalCost = parseFloat(cost);
    let walletDebit = 0;
    let finalMethod = payment_method;

    if (payment_method === 'wallet') {
      if (balance < totalCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `الرصيد غير كافٍ — الرصيد الحالي: ${balance.toFixed(2)} ج` });
      }
      walletDebit = totalCost;
    } else if (payment_method === 'partial') {
      walletDebit = Math.min(balance, totalCost);
    } else {
      walletDebit = 0; finalMethod = 'cash';
    }

    if (walletDebit > 0) {
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [walletDebit, user_id]);
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, description)
        VALUES ($1, 'debit', $2, 'خصم تكلفة جلسة')
      `, [user_id, walletDebit]);
    }

    await client.query(`UPDATE sessions SET payment_method = $1 WHERE id = $2`, [finalMethod, session_id]);
    await client.query('COMMIT');

    res.json({
      success       : true,
      payment_method: finalMethod,
      wallet_debit  : walletDebit,
      cash_amount   : parseFloat((totalCost - walletDebit).toFixed(2)),
      new_balance   : parseFloat((balance - walletDebit).toFixed(2)),
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
      SELECT id, check_in, check_out, duration_min, cost,
             payment_method, status, space_key, space_name, max_hours,
             is_subscription_session
      FROM sessions WHERE user_id = $1
      ORDER BY check_in DESC LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM sessions WHERE user_id = $1', [req.user.id]
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
             s.space_key, s.space_name, s.max_hours,
             s.is_subscription_session, s.subscription_id,
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

