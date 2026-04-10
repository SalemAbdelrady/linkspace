const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const POINTS_THRESHOLD = parseInt(process.env.COUPON_POINTS_THRESHOLD) || 100;
const COUPON_DISCOUNT  = parseInt(process.env.COUPON_DISCOUNT_PERCENT)  || 20;

// ✅ توليد كود عشوائي — يُستخدم في النظام التلقائي والإنشاء اليدوي
function generateCode(prefix = 'LINK') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─────────────────────────────────────────────────────────────────────
// CLIENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// POST /api/coupons/redeem — استبدال نقاط بكوبون [client]
router.post('/redeem', auth, async (req, res) => {
  const client = req.user;
  if (client.points < POINTS_THRESHOLD) {
    return res.status(400).json({
      error: `تحتاج ${POINTS_THRESHOLD} نقطة للاستبدال. لديك ${client.points} نقطة فقط.`
    });
  }

  try {
    const code      = generateCode('LINK' + COUPON_DISCOUNT);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [POINTS_THRESHOLD, client.id]
    );

    const { rows } = await db.query(`
      INSERT INTO coupons (user_id, code, discount_pct, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [client.id, code, COUPON_DISCOUNT, expiresAt]);

    res.status(201).json({ coupon: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/coupons/my — كوبوناتي [client]
router.get('/my', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM coupons WHERE user_id = $1 ORDER BY created_at DESC
    `, [req.user.id]);
    res.json({ coupons: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// STAFF / ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// POST /api/coupons/validate — التحقق من كوبون [staff/admin]
router.post('/validate', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { code, user_id } = req.body;
  try {
    // ✅ الكوبون العام (user_id = NULL) أو لعميل معين
    const { rows } = await db.query(`
      SELECT c.*, u.name as user_name
      FROM coupons c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.code       = $1
        AND c.is_used    = false
        AND c.expires_at > NOW()
        AND (c.user_id = $2 OR c.user_id IS NULL)
    `, [code, user_id]);

    if (!rows[0]) return res.status(404).json({ valid: false, error: 'كوبون غير صالح أو منتهي' });
    res.json({ valid: true, coupon: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/coupons/use — تفعيل الكوبون بعد الفاتورة [staff/admin]
router.post('/use', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { code, user_id } = req.body;
  if (!code || !user_id) {
    return res.status(400).json({ error: 'code و user_id مطلوبان' });
  }

  try {
    // ✅ يقبل الكوبون العام أو المخصص للعميل
    const { rows } = await db.query(`
      UPDATE coupons
      SET is_used = true
      WHERE code       = $1
        AND is_used    = false
        AND expires_at > NOW()
        AND (user_id = $2 OR user_id IS NULL)
      RETURNING *
    `, [code, user_id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'كوبون غير صالح أو مستخدم مسبقاً' });
    }

    res.json({ success: true, coupon: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

// GET /api/coupons/admin/all — كل الكوبونات [admin]
router.get('/admin/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        c.*,
        u.name  AS user_name,
        u.phone AS user_phone
      FROM coupons c
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
    `);
    res.json({ coupons: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/coupons/admin/create — إنشاء كوبون يدوي [admin]
//  body: { code?, discount, days, user_id? }
//  - code    : اختياري — لو فارغ يتولد تلقائياً
//  - discount: نسبة الخصم %
//  - days    : صلاحية بالأيام
//  - user_id : اختياري — لو NULL الكوبون عام لأي عميل
router.post('/admin/create', auth, requireRole('admin'), async (req, res) => {
  const { code, discount, days, user_id } = req.body;

  if (!discount || !days) {
    return res.status(400).json({ error: 'discount و days مطلوبان' });
  }
  if (discount < 1 || discount > 100) {
    return res.status(400).json({ error: 'نسبة الخصم يجب أن تكون بين 1 و 100' });
  }

  try {
    // لو في كود يدوي — تأكد إنه مش موجود قبل كده
    const finalCode = code?.trim().toUpperCase() || generateCode('PROMO');

    const { rows: existing } = await db.query(
      'SELECT id FROM coupons WHERE code = $1', [finalCode]
    );
    if (existing[0]) {
      return res.status(409).json({ error: 'الكود موجود مسبقاً — اختر كوداً مختلفاً' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));

    const { rows } = await db.query(`
      INSERT INTO coupons (user_id, code, discount_pct, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id || null, finalCode, parseInt(discount), expiresAt]);

    res.status(201).json({ coupon: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/coupons/admin/revoke/:id — إلغاء كوبون [admin]
//  بيعمله is_used = true عشان ميتستخدمش — مش بيحذفه من الـ DB
router.post('/admin/revoke/:id', auth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(`
      UPDATE coupons
      SET is_used = true
      WHERE id = $1 AND is_used = false
      RETURNING *
    `, [id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'الكوبون غير موجود أو مُلغى مسبقاً' });
    }

    res.json({ success: true, coupon: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
