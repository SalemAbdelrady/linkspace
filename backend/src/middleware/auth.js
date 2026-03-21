const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

// توليد رقم عشوائي 7 أرقام
function generateQrCode() {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب'),
  body('phone').matches(/^01[0125][0-9]{8}$/).withMessage('رقم موبايل غير صحيح'),
  body('password').isLength({ min: 6 }).withMessage('كلمة السر 6 أحرف على الأقل'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone, password } = req.body;

  try {
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'رقم الموبايل مسجل بالفعل' });
    }

    const hash = await bcrypt.hash(password, 12);
    const qrToken = generateQrCode();

    const { rows } = await db.query(`
      INSERT INTO users (name, phone, password, role, qr_code)
      VALUES ($1, $2, $3, 'client', $4)
      RETURNING id, name, phone, role, balance, points, qr_code
    `, [name, phone, hash, qrToken]);

    const user = rows[0];
    const qrDataUrl = await QRCode.toDataURL(qrToken, { width: 200, margin: 1 });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ token, user: { ...user, qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('phone').notEmpty().withMessage('رقم الموبايل مطلوب'),
  body('password').notEmpty().withMessage('كلمة السر مطلوبة'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE phone = $1 AND is_active = true',
      [phone]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'رقم الموبايل أو كلمة السر غلط' });
    }

    const qrDataUrl = await QRCode.toDataURL(user.qr_code, { width: 200, margin: 1 });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const { password: _, ...safeUser } = user;
    res.json({ token, user: { ...safeUser, qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(req.user.qr_code, { width: 200, margin: 1 });
    res.json({ 
      user: { 
        ...req.user, 
        qr_image: qrDataUrl,
        qr_code: req.user.qr_code
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
