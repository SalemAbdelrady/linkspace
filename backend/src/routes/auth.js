const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const QRCode  = require('qrcode');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { auth } = require('../middleware/auth');
const authMiddleware = require('../middleware/auth');

// ✅ في الأعلى — مش في آخر الملف
const { uploadAvatar } = require('../utils/cloudinary');

// ── Resend email client ───────────────────────────────────────────────
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_NAME   = 'Link Space';
const FROM_EMAIL = 'onboarding@resend.dev';

// ── Helpers ───────────────────────────────────────────────────────────
function generateQrCode() {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function isValidName(name) {
  return /^[\u0600-\u06FF\u0750-\u077F a-zA-Z\s'-]{2,100}$/.test(name.trim());
}

// ✅ helper آمن — يرجع null لو مفيش qr_code
async function safeQRCode(qr_code) {
  if (!qr_code) return null;
  try {
    return await QRCode.toDataURL(qr_code, { width: 200, margin: 1 });
  } catch {
    return null;
  }
}

async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب'),
  body('phone').matches(/^01[0125][0-9]{8}$/).withMessage('رقم موبايل غير صحيح'),
  body('password').isLength({ min: 6 }).withMessage('كلمة السر 6 أحرف على الأقل'),
  body('email').isEmail().withMessage('البريد الإلكتروني مطلوب وغير صحيح'),
  ], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, password, email } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'الاسم يجب أن يحتوي على حروف فقط وليس أرقاماً' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows[0]) return res.status(409).json({ error: 'رقم الموبايل مسجل بالفعل' });

    if (email) {
      const emailExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailExists.rows[0]) return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const hash    = await bcrypt.hash(password, 12);
    const qrToken = generateQrCode();

    const { rows } = await db.query(`
      INSERT INTO users (name, phone, password, role, qr_code, email)
      VALUES ($1, $2, $3, 'client', $4, $5)
      RETURNING id, name, phone, email, role, balance, points, qr_code, avatar_url
    `, [name.trim(), phone, hash, qrToken, email || null]);

    const user      = rows[0];
    const qrDataUrl = await safeQRCode(user.qr_code);
    const token     = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    if (email) {
      await sendEmail(email, `مرحباً بك في ${APP_NAME} 🎉`, `
        <div dir="rtl" style="font-family: Arial; padding: 20px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">مرحباً ${name}! 👋</h2>
          <p>تم تسجيلك بنجاح في نظام <strong>${APP_NAME}</strong></p>
          <p>رقم موبايلك: <strong>${phone}</strong></p>
          <p style="color: #666;">يمكنك الآن الدخول باستخدام رقم موبايلك وكلمة السر.</p>
          <hr style="border-color: #00d4aa;">
          <p style="color: #999; font-size: 12px;">هذا بريد تلقائي، يرجى عدم الرد عليه.</p>
        </div>
      `);
    }

    res.status(201).json({ token, user: { ...user, qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', [
  body('phone').notEmpty().withMessage('رقم الموبايل مطلوب'),
  body('password').notEmpty().withMessage('كلمة السر مطلوبة'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE phone = $1 AND is_active = true', [phone]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'رقم الموبايل أو كلمة السر غلط' });
    }

    const qrDataUrl = await safeQRCode(user.qr_code);
    const token     = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...safeUser } = user;
    res.json({ token, user: { ...safeUser, qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────
// ✅ الإصلاح الجذري — يجيب البيانات من DB مش من req.user
// req.user جاي من الـ middleware وممكن يكون قديم أو ناقص email/avatar_url
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, name, phone, email, role,
             balance, points, qr_code, avatar_url, is_active
      FROM users
      WHERE id = $1 AND is_active = true
    `, [req.user.id]);

    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const qrDataUrl = await safeQRCode(rows[0].qr_code);
    res.json({ user: { ...rows[0], qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/auth/settings ──────────────────────────────────────────
router.patch('/settings', auth, async (req, res) => {
  const { name, email } = req.body;
  const updates = [];
  const values  = [];
  let idx = 1;

  if (name !== undefined) {
    if (!isValidName(name)) {
      return res.status(400).json({ error: 'الاسم يجب أن يحتوي على حروف فقط وليس أرقاماً' });
    }
    updates.push(`name = $${idx++}`);
    values.push(name.trim());
  }

  if (email !== undefined) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
    }
    if (email) {
      const { rows } = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]
      );
      if (rows[0]) return res.status(409).json({ error: 'البريد الإلكتروني مسجل لدى حساب آخر' });
    }
    updates.push(`email = $${idx++}`);
    values.push(email || null);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'لا توجد بيانات للتعديل' });

  updates.push(`updated_at = NOW()`);
  values.push(req.user.id);

  try {
    const { rows } = await db.query(
      // ✅ avatar_url مضاف في الـ RETURNING
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, phone, email, role, balance, points, qr_code, avatar_url`,
      values
    );
    const qrDataUrl = await safeQRCode(rows[0].qr_code);
    res.json({ user: { ...rows[0], qr_image: qrDataUrl } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/auth/change-password ──────────────────────────────────
router.patch('/change-password', auth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'كلمة السر الحالية والجديدة مطلوبتان' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'كلمة السر الجديدة 6 أحرف على الأقل' });
  }
  try {
    const { rows } = await db.query(
      'SELECT password FROM users WHERE id = $1', [req.user.id]
    );
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'كلمة السر الحالية غلط' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });

  try {
    const { rows } = await db.query(
      'SELECT id, name FROM users WHERE email = $1 AND is_active = true', [email]
    );
    if (!rows[0]) {
      return res.json({ success: true, message: 'لو الإيميل مسجل هيوصلك كود' });
    }

    const otp     = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      'UPDATE users SET reset_otp = $1, reset_otp_expires = $2 WHERE id = $3',
      [otp, expires, rows[0].id]
    );

    await sendEmail(email, `كود استعادة كلمة السر — ${APP_NAME}`, `
      <div dir="rtl" style="font-family: Arial; padding: 20px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #00d4aa;">استعادة كلمة السر 🔐</h2>
        <p>مرحباً ${rows[0].name}،</p>
        <p>تم طلب إعادة تعيين كلمة السر لحسابك.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f0fdfb; border: 2px solid #00d4aa; border-radius: 12px; padding: 20px; display: inline-block;">
            <div style="font-size: 11px; color: #666; margin-bottom: 8px;">كود التحقق</div>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00d4aa;">${otp}</div>
          </div>
        </div>
        <p style="color: #666;">⏰ الكود صالح لمدة <strong>15 دقيقة</strong> فقط.</p>
        <p style="color: #999; font-size: 12px;">لو ما طلبتش إعادة التعيين، تجاهل هذا البريد.</p>
      </div>
    `);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'البريد والكود وكلمة السر الجديدة مطلوبة' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'كلمة السر 6 أحرف على الأقل' });
  }

  try {
    const { rows } = await db.query(`
      SELECT id FROM users
      WHERE email = $1
        AND reset_otp = $2
        AND reset_otp_expires > NOW()
        AND is_active = true
    `, [email, otp]);

    if (!rows[0]) {
      return res.status(400).json({ error: 'الكود غلط أو منتهي الصلاحية' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await db.query(`
      UPDATE users SET
        password          = $1,
        reset_otp         = NULL,
        reset_otp_expires = NULL,
        updated_at        = NOW()
      WHERE id = $2
    `, [hash, rows[0].id]);

    res.json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/avatar ─────────────────────────────────────────────
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const avatar_url = req.file?.path;
    if (!avatar_url) return res.status(400).json({ error: 'لم يتم رفع الصورة' });

    await db.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatar_url, req.user.id]
    );
    res.json({ avatar_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في رفع الصورة' });
  }
});

// PUT /api/services/reorder
router.put('/reorder', authMiddleware, async (req, res) => {
  const { items } = req.body; // [{id, sort_order}]
  try {
    for (const item of items) {
      await db.query(
        'UPDATE services SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في حفظ الترتيب' });
  }
});

module.exports = router;
