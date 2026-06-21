const router = require('express').Router();
const db     = require('../config/db');
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

// ── دالة منح نقاط الدعوة عند أول جلسة ───────────────────────────────
async function giveReferralBonusIfFirstSession(userId) {
  try {
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    // لو دي أول جلسة مكتملة بالظبط
    if (parseInt(countRows[0].count) !== 1) return;

    const { rows: userRows } = await db.query(
      'SELECT referred_by FROM users WHERE id = $1',
      [userId]
    );
    const referrerId = userRows[0]?.referred_by;
    if (!referrerId) return;

    const FIRST_SESSION_POINTS = 100;

    await db.query(`
      UPDATE users
      SET points                 = points + $1,
          referral_earned_points = referral_earned_points + $1
      WHERE id = $2
    `, [FIRST_SESSION_POINTS, referrerId]);

    await db.query(`
      INSERT INTO referral_logs (referrer_id, referred_id, points_given, reason)
      VALUES ($1, $2, $3, 'first_session')
    `, [referrerId, userId, FIRST_SESSION_POINTS]);

  } catch (err) {
    // مش هنوقف العملية لو الـ referral bonus فشل
    console.error('Referral bonus error:', err.message);
  }
}

// ── POST /api/sessions/scan ───────────────────────────────────────────
router.post('/scan', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { qr_code, space_key = 'cowork', guest_count = 1 } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'QR Code مطلوب' });

  const guestCount = Math.max(1, parseInt(guest_count) || 1);
  const client     = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `SELECT id, name, phone, email, balance, points, is_active
       FROM users WHERE qr_code = $1 FOR UPDATE`,
      [qr_code]
    );
    const user = userRows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    if (!user.is_active) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error : '🚫 هذا العميل محظور من الدخول',
        banned: true,
        client: { name: user.name, phone: user.phone },
      });
    }

    const { rows: activeSessions } = await client.query(
      `SELECT * FROM sessions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user.id]
    );

    if (activeSessions[0]) {
      // ─── CHECK-OUT ────────────────────────────────────────────────
      const session       = activeSessions[0];
      const checkOut      = new Date();
      const checkOutISO   = checkOut.toISOString();
      const checkIn       = new Date(session.check_in);
      const durationMin   = Math.ceil((checkOut - checkIn) / 60000);
     // const maxHours      = parseInt(session.max_hours) || 4;
      const sessionGuests = parseInt(session.guest_count) || 1;
      const isSubSession  = session.is_subscription_session || false;
            
      // ✅ أعد جلب max_hours من DB عشان تاخد القيمة المحدّثة
      const { rows: freshSession } = await client.query(
        'SELECT max_hours FROM sessions WHERE id = $1',
        [session.id]
      );
      const maxHours = parseInt(freshSession[0]?.max_hours) || parseInt(session.max_hours) || 4;

      console.log('DEBUG checkout:', {
        max_hours: session.max_hours,
        typeof: typeof session.max_hours,
        durationMin,
      });

      const baseCost     = isSubSession ? 0 : calculateCost(durationMin, session.price_per_hr, maxHours);
      const cost         = parseFloat((baseCost * sessionGuests).toFixed(2));
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

      // ✅ بعد COMMIT — نقاط الدعوة عند أول جلسة (بدون transaction منفصلة)
      await giveReferralBonusIfFirstSession(user.id);

      return res.json({
        action : 'checkout',
        client : {
          id     : user.id,
          name   : user.name,
          phone  : user.phone,
          email  : user.email,
          balance: parseFloat(user.balance),
        },
        session: {
          id                   : session.id,
          durationMin,
          cost,
          pointsEarned,
          pricePerHr           : session.price_per_hr,
          spaceKey             : session.space_key,
          spaceName            : session.space_name,
          maxHours,
          guestCount           : sessionGuests,
          checkIn              : session.check_in,
          checkOut             : checkOutISO,
          isSubscriptionSession: isSubSession,
          subscriptionId       : session.subscription_id,
        },
      });

    } else {
      // ─── CHECK-IN ─────────────────────────────────────────────────
      const space        = await getSpaceSettings(space_key);
      const subscription = await getActiveSubscription(user.id);

      // ✅ تحقق من الطاقة الاستيعابية قبل الدخول
      const { rows: spaceSettingsRows } = await client.query(
        'SELECT capacity FROM space_settings WHERE space_key = $1',
        [space_key]
      );
      const capacity = spaceSettingsRows[0]?.capacity;
      
      if (capacity) {
        const { rows: activeInSpace } = await client.query(
          `SELECT COUNT(*) as cnt FROM sessions 
          WHERE space_key = $1 AND status = 'active'`,
          [space_key]
        );
        const occupied = parseInt(activeInSpace[0].cnt);
        
        if (occupied >= capacity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `${space.name} ممتلئة — لا توجد أماكن متاحة حالياً` 
          });
        }
      }

      // ✅ هل في حجز مؤكد لهذا العميل في هذا الوقت؟
      const { rows: userBooking } = await client.query(`
        SELECT b.* FROM bookings b
        WHERE b.user_id  = $1
          AND b.space_key = $2
          AND b.date      = CURRENT_DATE
          AND b.status    = 'confirmed'
          AND b.start_time <= NOW()::time
          AND b.end_time   >= NOW()::time
        LIMIT 1
      `, [user.id, space_key]);

      // احسب max_hours من الحجز لو موجود
      let effectiveMaxHours = space.max_hours;
      if (userBooking[0]) {
        const bookingStart = userBooking[0].start_time;
        const bookingEnd   = userBooking[0].end_time;
        const [sh, sm] = bookingStart.split(':').map(Number);
        const [eh, em] = bookingEnd.split(':').map(Number);
        const bookingHours = Math.ceil(((eh * 60 + em) - (sh * 60 + sm)) / 60);
        effectiveMaxHours  = bookingHours;
        
        // حدّث حالة الحجز لـ checked_in
        await client.query(
          `UPDATE bookings SET status = 'completed' WHERE id = $1`,
          [userBooking[0].id]
        );
      }

      const isSubSession   = !!(subscription && subscription.covers_cowork && space_key === 'cowork');
      const effectivePrice = isSubSession ? 0 : space.first_hour;

      await client.query(`
        INSERT INTO sessions
          (user_id, price_per_hr, space_key, space_name, max_hours,
           created_by, is_subscription_session, subscription_id, guest_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        user.id,
        effectivePrice,
        space_key,
        space.name,
        effectiveMaxHours,  // ← بدل space.max_hours
        req.user.id,
        isSubSession,
        subscription?.id || null,
        guestCount,
      ]);

      await client.query('COMMIT');

      return res.json({
        action    : 'checkin',
        client    : {
          name   : user.name,
          phone  : user.phone,
          email  : user.email,
          balance: user.balance,
        },
        pricePerHr           : effectivePrice,
        spaceKey             : space_key,
        spaceName            : space.name,
        maxHours             : space.max_hours,
        guestCount,
        isSubscriptionSession: isSubSession,
        subscription: subscription ? {
          id      : subscription.id,
          planName: subscription.plan_name,
          endDate : subscription.end_date,
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

// ── POST /api/sessions/pay ────────────────────────────────────────────
router.post('/pay', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { session_id, user_id, payment_method, cost } = req.body;
  if (!session_id || !user_id || !payment_method || cost === undefined) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  if (parseFloat(cost) === 0) {
    await db.query(
      `UPDATE sessions SET payment_method = 'subscription' WHERE id = $1`,
      [session_id]
    );
    return res.json({ success: true, payment_method: 'subscription', wallet_debit: 0, cash_amount: 0 });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      'SELECT id, balance FROM users WHERE id = $1 FOR UPDATE', [user_id]
    );
    const user = userRows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const balance   = parseFloat(user.balance);
    const totalCost = parseFloat(cost);
    let walletDebit = 0;
    let finalMethod = payment_method;

    if (payment_method === 'wallet') {
      if (balance < totalCost) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `الرصيد غير كافٍ — الرصيد الحالي: ${balance.toFixed(2)} ج`
        });
      }
      walletDebit = totalCost;
    } else if (payment_method === 'partial') {
      walletDebit = Math.min(balance, totalCost);
    } else {
      walletDebit = 0;
      finalMethod = 'cash';
    }

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

    await client.query(
      `UPDATE sessions SET payment_method = $1 WHERE id = $2`,
      [finalMethod, session_id]
    );
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

// ── GET /api/sessions/history ─────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  const page   = parseInt(req.query.page) || 1;
  const limit  = 10;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(`
      SELECT s.*, u.email AS client_email
      FROM sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
      ORDER BY s.check_in DESC
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

// ── GET /api/sessions/active ──────────────────────────────────────────
router.get('/active', auth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.id, s.check_in, s.price_per_hr,
             s.space_key, s.space_name, s.max_hours,
             s.is_subscription_session, s.subscription_id,
             s.guest_count,
             u.id AS user_id, u.name, u.phone, u.email, u.balance,
             EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'UTC' - s.check_in AT TIME ZONE 'UTC')) / 60 AS elapsed_min,
             s.check_in AT TIME ZONE 'UTC' AS check_in_utc
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

// PATCH /api/sessions/:id/guest-count
router.patch('/:id/guest-count', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { guest_count } = req.body;
  if (!guest_count || guest_count < 1) {
    return res.status(400).json({ error: 'عدد الأشخاص غير صحيح' });
  }
  try {
    const { rows } = await db.query(
      `UPDATE sessions SET guest_count = $1 WHERE id = $2 AND status = 'active' RETURNING id, guest_count`,
      [parseInt(guest_count), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الجلسة غير موجودة أو منتهية' });
    res.json({ success: true, guest_count: rows[0].guest_count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /api/sessions/:id/max-hours — تحديث الحد الأقصى للجلسة
router.patch('/:id/max-hours', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { max_hours } = req.body;
  if (!max_hours || max_hours < 1 || max_hours > 24) {
    return res.status(400).json({ error: 'مدة الجلسة غير صحيحة (1-24 ساعة)' });
  }
  try {
    const { rows } = await db.query(
      `UPDATE sessions 
       SET max_hours = $1 
       WHERE id = $2 AND status = 'active' 
       RETURNING id, max_hours`,
      [parseInt(max_hours), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الجلسة غير موجودة أو منتهية' });
    res.json({ success: true, max_hours: rows[0].max_hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
