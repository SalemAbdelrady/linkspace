const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const POINTS_THRESHOLD = parseInt(process.env.COUPON_POINTS_THRESHOLD) || 100;
const COUPON_DISCOUNT  = parseInt(process.env.COUPON_DISCOUNT_PERCENT)  || 20;

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LINK' + COUPON_DISCOUNT + '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/coupons/redeem — exchange points for coupon
router.post('/redeem', auth, async (req, res) => {
  const client = req.user;
  if (client.points < POINTS_THRESHOLD) {
    return res.status(400).json({
      error: `تحتاج ${POINTS_THRESHOLD} نقطة للاستبدال. لديك ${client.points} نقطة فقط.`
    });
  }

  try {
    const code      = generateCode();
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

// GET /api/coupons/my — get my coupons
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

// POST /api/coupons/validate — validate a coupon code [staff/admin]
router.post('/validate', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { code, user_id } = req.body;
  try {
    const { rows } = await db.query(`
      SELECT * FROM coupons
      WHERE code = $1 AND user_id = $2 AND is_used = false AND expires_at > NOW()
    `, [code, user_id]);

    if (!rows[0]) return res.status(404).json({ valid: false, error: 'كوبون غير صالح أو منتهي' });
    res.json({ valid: true, coupon: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ✅ POST /api/coupons/use — mark coupon as used after invoice [staff/admin]
//    body: { code, user_id }
//    - بيتأكد إن الكوبون صالح وينتمي للعميل الصح
//    - بيعمله is_used = true atomically
router.post('/use', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { code, user_id } = req.body;
  if (!code || !user_id) {
    return res.status(400).json({ error: 'code و user_id مطلوبان' });
  }

  try {
    const { rows } = await db.query(`
      UPDATE coupons
      SET is_used = true
      WHERE code    = $1
        AND user_id = $2
        AND is_used = false
        AND expires_at > NOW()
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

module.exports = router;
