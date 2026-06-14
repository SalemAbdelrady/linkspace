const router  = require('express').Router();
const logger  = require('../utils/logger');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode  = require('qrcode');
const { body, validationResult } = require('express-validator');
const db      = require('../config/db');
const { auth } = require('../middleware/auth');
const { uploadAvatar } = require('../utils/cloudinary');

// ── Resend email client ───────────────────────────────────────────────
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;
  
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

function generateReferralCode(name) {
  const prefix = (name || '')
    .trim()
    .split(' ')[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'REF';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

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
    logger.error('Email send error:', { message: err.message });
  }
}

// ── Refresh Token Helpers ────────────────────────────────────────────
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS) || 30;
// في Vercel بدون refresh_tokens table — نستخدم مدة أطول كـ fallback
// بعد تشغيل migration يُغيَّر إلى '15m' في .env
const ACCESS_TOKEN_EXP = process.env.JWT_EXPIRES_IN || '7d';

async function createRefreshToken(userId, req) {
  const token     = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, req.headers['user-agent'] || null, req.ip || null]
  );
  return token;
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  res.cookie('refreshToken', token, {
    httpOnly : true,
    secure   : isProd,                    // Vercel = HTTPS دائماً
    sameSite : isProd ? 'none' : 'lax',  // cross-origin في Vercel يحتاج 'none'
    maxAge   : REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path     : '/api/auth',
  });
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXP }
  );
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

  const { name, phone, password, email, referral_code: referralCodeUsed } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'الاسم يجب أن يحتوي على حروف فقط وليس أرقاماً' });
  }

  try {
    // تحقق من تكرار الموبايل
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows[0]) return res.status(409).json({ error: 'رقم الموبايل مسجل بالفعل' });

    // تحقق من تكرار الإيميل
    if (email) {
      const emailExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailExists.rows[0]) return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    // تحقق من كود الدعوة لو موجود
    let referrerId = null;
    if (referralCodeUsed && referralCodeUsed.trim()) {
      const { rows: referrerRows } = await db.query(
        `SELECT id FROM users WHERE referral_code = $1 AND role = 'client'`,
        [referralCodeUsed.trim().toUpperCase()]
      );
      if (referrerRows[0]) {
        referrerId = referrerRows[0].id;
      }
    }

    const hash      = await bcrypt.hash(password, 12);
    const qrToken   = generateQrCode();
    const myRefCode = generateReferralCode(name);

    // إنشاء الحساب مع referral_code و referred_by
    const { rows } = await db.query(`
      INSERT INTO users (name, phone, password, role, qr_code, email, referral_code, referred_by)
      VALUES ($1, $2, $3, 'client', $4, $5, $6, $7)
      RETURNING id, name, phone, email, role, balance, points, qr_code, avatar_url,
                referral_code, referral_count, referral_earned_points
    `, [name.trim(), phone, hash, qrToken, email || null, myRefCode, referrerId]);

    const user = rows[0];

    // لو في referrer — أعطيه نقاط على التسجيل
    if (referrerId) {
      const SIGNUP_POINTS = 50;
      await db.query(`
        UPDATE users
        SET points                 = points + $1,
            referral_count         = referral_count + 1,
            referral_earned_points = referral_earned_points + $1
        WHERE id = $2
      `, [SIGNUP_POINTS, referrerId]);

      await db.query(`
        INSERT INTO referral_logs (referrer_id, referred_id, points_given, reason)
        VALUES ($1, $2, $3, 'signup')
      `, [referrerId, user.id, SIGNUP_POINTS]);
    }

    const qrDataUrl      = await safeQRCode(user.qr_code);
    const token          = signAccessToken(user);
    const refreshToken   = await createRefreshToken(user.id, req);
    setRefreshCookie(res, refreshToken);

    if (email) {
      await sendEmail(email, `مرحباً بك في ${APP_NAME} 🎉`, `
        <div dir="rtl" style="font-family: Arial; padding: 20px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #00d4aa;">مرحباً ${name}! 👋</h2>
          <p>تم تسجيلك بنجاح في نظام <strong>${APP_NAME}</strong></p>
          <p>رقم موبايلك: <strong>${phone}</strong></p>
          <p>كود الدعوة الخاص بك:
            <strong style="color: #00d4aa; font-size: 18px; letter-spacing: 2px;">
              ${myRefCode}
            </strong>
          </p>
          <p style="color: #666;">شارك كودك مع أصدقائك واكسب 50 نقطة عند كل تسجيل!</p>
          <hr style="border-color: #00d4aa;">
          <p style="color: #999; font-size: 12px;">هذا بريد تلقائي، يرجى عدم الرد عليه.</p>
        </div>
      `);
    }

    res.status(201).json({ token, user: { ...user, qr_image: qrDataUrl } });
  } catch (err) {
    logger.error(err.message || err, { stack: err.stack });
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

    const qrDataUrl      = await safeQRCode(user.qr_code);
    const token          = signAccessToken(user);
    const refreshToken   = await createRefreshToken(user.id, req);
    setRefreshCookie(res, refreshToken);

    const { password: _, ...safeUser } = user;
    res.json({ token, user: { ...safeUser, qr_image: qrDataUrl } });
  } catch (err) {
    logger.error(err.message || err, { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, name, phone, email, role,
             balance, points, qr_code, avatar_url, is_active, created_at,
             referral_code, referral_count, referral_earned_points,
             referred_by
      FROM users
      WHERE id = $1 AND is_active = true
    `, [req.user.id]);

    if (!rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' });

    // جيب اسم من دعاك لو موجود
    let referred_by_name = null;
    if (rows[0].referred_by) {
      const { rows: refRows } = await db.query(
        'SELECT name FROM users WHERE id = $1', [rows[0].referred_by]
      );
      referred_by_name = refRows[0]?.name || null;
    }

    const qrDataUrl = await safeQRCode(rows[0].qr_code);
    res.json({ user: { ...rows[0], qr_image: qrDataUrl, referred_by_name } });
  } catch (err) {
    logger.error(err.message || err, { stack: err.stack });
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
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, phone, email, role, balance, points, qr_code, avatar_url,
                 referral_code, referral_count, referral_earned_points`,
      values
    );
    const qrDataUrl = await safeQRCode(rows[0].qr_code);
    res.json({ user: { ...rows[0], qr_image: qrDataUrl } });
  } catch (err) {
    logger.error(err.message || err, { stack: err.stack });
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
    logger.error(err.message || err, { stack: err.stack });
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
    logger.error(err.message || err, { stack: err.stack });
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
    logger.error(err.message || err, { stack: err.stack });
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
    logger.error(err.message || err, { stack: err.stack });
    res.status(500).json({ error: 'خطأ في رفع الصورة' });
  }
});

// ── POST /api/auth/refresh — تجديد الـ Access Token ──────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'لا يوجد refresh token' });

  try {
    const { rows } = await db.query(
      `SELECT rt.*, u.id as uid, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1
         AND rt.expires_at > NOW()
         AND rt.revoked_at IS NULL`,
      [refreshToken]
    );

    const record = rows[0];
    if (!record)       return res.status(401).json({ error: 'الـ refresh token منتهي أو ملغي' });
    if (!record.is_active) return res.status(401).json({ error: 'الحساب غير نشط' });

    // أصدر access token جديد
    const token = signAccessToken({ id: record.uid, role: record.role });

    // Refresh Token Rotation — أصدر refresh token جديد وألغِ القديم
    await db.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`, [refreshToken]);
    const newRefreshToken = await createRefreshToken(record.uid, req);
    setRefreshCookie(res, newRefreshToken);

    res.json({ token });
  } catch (err) {
    logger.error('refresh token error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/auth/logout — إلغاء الـ Refresh Token ──────────────────
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await db.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1`,
      [refreshToken]
    ).catch(() => {});
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true });
});

// ── DELETE /api/auth/logout-all — إلغاء كل الـ Sessions ─────────────
router.delete('/logout-all', auth, async (req, res) => {
  try {
    await db.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [req.user.id]
    );
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'تم تسجيل الخروج من كل الأجهزة' });
  } catch (err) {
    logger.error('logout-all error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
