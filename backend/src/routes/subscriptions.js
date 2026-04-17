const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isAdmin        = [auth, requireRole('admin')];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// ─────────────────────────────────────────────────────────────────────
// PLANS — إدارة الباقات
// ─────────────────────────────────────────────────────────────────────

// GET /api/subscriptions/plans
router.get('/plans', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json({ plans: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/subscriptions/plans [admin]
router.post('/plans', ...isAdmin, async (req, res) => {
  const { name, price, features, discount_rooms, covers_cowork } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  try {
    const { rows } = await db.query(`
      INSERT INTO subscription_plans (name, price, features, discount_rooms, covers_cowork)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [name, price, features, discount_rooms || 0, covers_cowork !== false]);
    res.status(201).json({ plan: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/subscriptions/plans/:id [admin]
router.put('/plans/:id', ...isAdmin, async (req, res) => {
  const { name, price, features, discount_rooms, covers_cowork } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE subscription_plans
      SET name=$1, price=$2, features=$3, discount_rooms=$4, covers_cowork=$5, updated_at=NOW()
      WHERE id=$6 RETURNING *
    `, [name, price, features, discount_rooms, covers_cowork !== false, req.params.id]);
    res.json({ plan: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /api/subscriptions/plans/:id [admin]
router.delete('/plans/:id', ...isAdmin, async (req, res) => {
  try {
    await db.query('UPDATE subscription_plans SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// USER SUBSCRIPTIONS — اشتراكات العملاء
// ─────────────────────────────────────────────────────────────────────

// GET /api/subscriptions/my
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT us.*, sp.name as plan_name_current, sp.features, sp.price as plan_price_current
      FROM user_subscriptions us
      JOIN subscription_plans sp ON sp.id = us.plan_id
      WHERE us.user_id = $1
        AND us.status = 'active'
        AND us.end_date > NOW()
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [req.user.id]);
    res.json({ subscription: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/subscriptions/user/:id [staff/admin]
router.get('/user/:id', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT us.*, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON sp.id = us.plan_id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `, [req.params.id]);
    res.json({ subscriptions: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/subscriptions/all [admin]
router.get('/all', ...isAdmin, async (req, res) => {
  const page   = parseInt(req.query.page) || 1;
  const limit  = 20;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(`
      SELECT us.*, u.name as client_name, u.phone as client_phone
      FROM user_subscriptions us
      JOIN users u ON u.id = us.user_id
      ORDER BY us.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const { rows: countRows } = await db.query('SELECT COUNT(*) FROM user_subscriptions');
    res.json({ subscriptions: rows, total: parseInt(countRows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/subscriptions/subscribe [staff/admin]
// body: { user_id, plan_id, payment_method, note? }
router.post('/subscribe', ...isStaffOrAdmin, async (req, res) => {
  const { user_id, plan_id, payment_method = 'cash', note } = req.body;
  if (!user_id || !plan_id) return res.status(400).json({ error: 'user_id و plan_id مطلوبان' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // جيب بيانات الباقة
    const { rows: planRows } = await client.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [plan_id]
    );
    const plan = planRows[0];
    if (!plan) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'الباقة غير موجودة' });
    }

    // جيب بيانات العميل
    const { rows: userRows } = await client.query(
      'SELECT id, name, phone, balance FROM users WHERE id = $1 FOR UPDATE', [user_id]
    );
    const user = userRows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    // تحقق من اشتراك نشط مسبق
    const { rows: existingSubs } = await client.query(`
      SELECT id FROM user_subscriptions
      WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
    `, [user_id]);
    if (existingSubs[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'العميل لديه اشتراك نشط بالفعل' });
    }

    // الدفع من المحفظة لو اختار wallet
    let walletPaid = 0;
    let cashPaid   = parseFloat(plan.price);

    if (payment_method === 'wallet') {
      const balance = parseFloat(user.balance);
      if (balance < plan.price) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `الرصيد غير كافٍ — الرصيد: ${balance.toFixed(2)} ج` });
      }
      walletPaid = parseFloat(plan.price);
      cashPaid   = 0;
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [walletPaid, user_id]);
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, description)
        VALUES ($1, 'debit', $2, $3)
      `, [user_id, walletPaid, `اشتراك ${plan.name}`]);
    }

    // ✅ إنشاء الاشتراك — 29 يوم من اليوم
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 29);

    const { rows: subRows } = await client.query(`
      INSERT INTO user_subscriptions
        (user_id, plan_id, plan_name, plan_price, discount_rooms, covers_cowork,
         start_date, end_date, status, payment_method, note)
      VALUES ($1,$2,$3,$4,$5,$6, NOW(),$7,'active',$8,$9)
      RETURNING *
    `, [
      user_id, plan_id, plan.name, plan.price,
      plan.discount_rooms, plan.covers_cowork,
      endDate, payment_method, note || null
    ]);

    const sub = subRows[0];

    // إنشاء فاتورة الاشتراك تلقائياً
    const invoiceNumber = `SUB-${Date.now().toString().slice(-6)}`;
    await client.query(`
      INSERT INTO invoices (
        invoice_number, user_id, client_name, client_phone,
        session_cost, subtotal, total,
        wallet_paid, cash_paid,
        payment_method, invoice_type, subscription_id,
        space_key, space_name, note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'subscription',$11,'cowork','اشتراك شهري',$12)
    `, [
      invoiceNumber, user_id, user.name, user.phone,
      plan.price, plan.price, plan.price,
      walletPaid, cashPaid,
      payment_method, sub.id,
      `اشتراك ${plan.name} — ${new Date().toLocaleDateString('ar-EG')}`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      subscription   : sub,
      invoice_number : invoiceNumber,
      wallet_paid    : walletPaid,
      cash_paid      : cashPaid,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────
// ✅ POST /api/subscriptions/cancel/:id [admin]
// الإلغاء الصحيح: يوقف الاشتراك + يغلق أي جلسة نشطة مرتبطة بيه
// ─────────────────────────────────────────────────────────────────────
router.post('/cancel/:id', ...isAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. جيب بيانات الاشتراك
    const { rows: subRows } = await client.query(
      `SELECT * FROM user_subscriptions WHERE id = $1`,
      [req.params.id]
    );
    const sub = subRows[0];
    if (!sub) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'الاشتراك غير موجود' });
    }

    // 2. ألغِ الاشتراك
    await client.query(
      `UPDATE user_subscriptions SET status = 'cancelled', end_date = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // 3. ✅ أغلق أي جلسة نشطة مرتبطة بهذا الاشتراك أو بنفس العميل
    //    (الجلسة كانت مجانية بسبب الاشتراك — نغلقها بتكلفة صفر)
    const { rows: activeSessions } = await client.query(`
      SELECT * FROM sessions
      WHERE user_id = $1
        AND status = 'active'
        AND is_subscription_session = true
    `, [sub.user_id]);

    for (const session of activeSessions) {
      const checkOut    = new Date();
      const checkIn     = new Date(session.check_in);
      const durationMin = Math.ceil((checkOut - checkIn) / 60000);

      await client.query(`
        UPDATE sessions SET
          check_out    = NOW(),
          duration_min = $1,
          cost         = 0,
          status       = 'completed',
          payment_method = 'subscription'
        WHERE id = $2
      `, [durationMin, session.id]);
    }

    await client.query('COMMIT');

    res.json({
      success          : true,
      subscription_id  : req.params.id,
      sessions_closed  : activeSessions.length,
      message          : `تم إلغاء الاشتراك وإغلاق ${activeSessions.length} جلسة نشطة`,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});

// GET /api/subscriptions/check/:user_id [staff/admin]
router.get('/check/:user_id', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT us.*, sp.discount_rooms, sp.covers_cowork, sp.name as plan_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON sp.id = us.plan_id
      WHERE us.user_id = $1
        AND us.status = 'active'
        AND us.end_date > NOW()
      LIMIT 1
    `, [req.params.user_id]);
    res.json({ subscription: rows[0] || null, has_active: !!rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

