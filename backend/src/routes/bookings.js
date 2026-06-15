/**
 * bookings.js — نظام الحجز المسبق للمساحات
 * ─────────────────────────────────────────────────────────────────
 * Client:  يحجز / يلغي حجزه
 * Staff:   يشوف الحجوزات / يأكد / يلغي
 * Admin:   كامل الصلاحيات
 * ─────────────────────────────────────────────────────────────────
 */

const router = require('express').Router();
const db     = require('../config/db');
const logger = require('../utils/logger');
const { auth, requireRole } = require('../middleware/auth');

const isAuth         = [auth];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];
const isAdmin        = [auth, requireRole('admin')];

// ── GET /api/bookings/availability — التحقق من توفر مساحة ────────────
// Public-ish: أي مستخدم مسجَّل يقدر يشوف التوفر
router.get('/availability', auth, async (req, res) => {
  const { date, space_key } = req.query;
  if (!date || !space_key) return res.status(400).json({ error: 'أدخل التاريخ ونوع المساحة' });

  try {
    const { rows } = await db.query(
      `SELECT id, start_time, end_time, guest_count, status
       FROM bookings
       WHERE date = $1
         AND space_key = $2
         AND status IN ('pending', 'confirmed')
       ORDER BY start_time ASC`,
      [date, space_key]
    );
    res.json({ booked_slots: rows, date, space_key });
  } catch (err) {
    logger.error('availability check error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── POST /api/bookings — إنشاء حجز جديد ──────────────────────────────
router.post('/', ...isAuth, async (req, res) => {
  const { space_key, space_name, date, start_time, end_time,
          guest_count = 1, note, client_user_id } = req.body;

  if (!space_key || !date || !start_time || !end_time)
    return res.status(400).json({ error: 'أدخل المساحة والتاريخ ووقت البداية والنهاية' });

  // الموظف/Admin يقدر يحجز باسم عميل آخر
  const bookingUserId = (client_user_id && req.user.role !== 'client')
    ? parseInt(client_user_id)
    : req.user.id;

  // التحقق من إن الوقت مستقبلي
  const bookingStart = new Date(`${date}T${start_time}`);
  if (bookingStart < new Date())
    return res.status(400).json({ error: 'لا يمكن الحجز في وقت ماضٍ' });

  // التحقق من إن النهاية بعد البداية
  if (end_time <= start_time)
    return res.status(400).json({ error: 'وقت النهاية يجب أن يكون بعد وقت البداية' });

  try {
    // التحقق من عدم وجود تعارض في نفس المساحة والوقت
    const { rows: conflicts } = await db.query(
      `SELECT id FROM bookings
       WHERE date = $1
         AND space_key = $2
         AND status IN ('pending', 'confirmed')
         AND (start_time, end_time) OVERLAPS ($3::time, $4::time)`,
      [date, space_key, start_time, end_time]
    );

    if (conflicts.length > 0)
      return res.status(409).json({ error: 'المساحة محجوزة في هذا الوقت — اختر وقتاً آخر' });

    // إنشاء الحجز
    const { rows } = await db.query(
      `INSERT INTO bookings
         (user_id, space_key, space_name, date, start_time, end_time, guest_count, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [bookingUserId, space_key, space_name || space_key, date,
       start_time, end_time, guest_count, note || null, req.user.id]
    );

    logger.info('booking created', { bookingId: rows[0].id, userId: req.user.id, date, space_key });
    res.status(201).json({ booking: rows[0], message: 'تم إنشاء الحجز — في انتظار التأكيد' });
  } catch (err) {
    logger.error('create booking error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/bookings/my — حجوزاتي (للعميل) ────────────────────────
router.get('/my', ...isAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*,
              u.name AS confirmed_by_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.confirmed_by
       WHERE b.user_id = $1
       ORDER BY b.date DESC, b.start_time DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ bookings: rows });
  } catch (err) {
    logger.error('my bookings error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/bookings — كل الحجوزات (للموظفين والأدمن) ─────────────
router.get('/', ...isStaffOrAdmin, async (req, res) => {
  const { date, space_key, status } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date) {
      params.push(date);
      whereClause += ` AND b.date = $${params.length}`;
    }
    if (space_key) {
      params.push(space_key);
      whereClause += ` AND b.space_key = $${params.length}`;
    }
    if (status) {
      params.push(status);
      whereClause += ` AND b.status = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT b.*,
              c.name  AS client_name,
              c.phone AS client_phone,
              u.name  AS confirmed_by_name
       FROM bookings b
       JOIN  users c ON c.id = b.user_id
       LEFT JOIN users u ON u.id = b.confirmed_by
       ${whereClause}
       ORDER BY b.date ASC, b.start_time ASC`,
      params
    );
    res.json({ bookings: rows });
  } catch (err) {
    logger.error('get bookings error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/bookings/:id/confirm — تأكيد الحجز (staff/admin) ──────
router.patch('/:id/confirm', ...isStaffOrAdmin, async (req, res) => {
  try {
    await db.query(
      `UPDATE bookings
       SET status = 'confirmed', confirmed_by = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending'`,
      [req.user.id, req.params.id]
    );

    // جيب البيانات مع اسم الموظف المؤكِّد
    const { rows } = await db.query(
      `SELECT b.*, u.name AS confirmed_by_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.confirmed_by
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'الحجز غير موجود أو تم تأكيده مسبقاً' });

    logger.info('booking confirmed', { bookingId: rows[0].id, staffId: req.user.id, staffName: req.user.name });
    res.json({ booking: rows[0], message: `تم تأكيد الحجز ✅ بواسطة ${req.user.name || 'الموظف'}` });
  } catch (err) {
    logger.error('confirm booking error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/bookings/:id/cancel — إلغاء الحجز ────────────────────
router.patch('/:id/cancel', auth, async (req, res) => {
  const { cancel_reason } = req.body;

  try {
    // العميل يقدر يلغي حجزه فقط — الموظف والأدمن يقدروا يلغوا أي حجز
    const { rows: existing } = await db.query(
      'SELECT * FROM bookings WHERE id = $1', [req.params.id]
    );

    if (!existing[0]) return res.status(404).json({ error: 'الحجز غير موجود' });

    const booking = existing[0];

    // تحقق من الصلاحية
    if (req.user.role === 'client' && booking.user_id !== req.user.id)
      return res.status(403).json({ error: 'ليس لديك صلاحية لإلغاء هذا الحجز' });

    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'الحجز ملغي مسبقاً' });

    if (booking.status === 'completed')
      return res.status(400).json({ error: 'لا يمكن إلغاء حجز مكتمل' });

    const { rows } = await db.query(
      `UPDATE bookings
       SET status = 'cancelled',
           cancelled_at = NOW(),
           cancel_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [cancel_reason || null, req.params.id]
    );

    logger.info('booking cancelled', { bookingId: rows[0].id, by: req.user.id });
    res.json({ booking: rows[0], message: 'تم إلغاء الحجز' });
  } catch (err) {
    logger.error('cancel booking error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── GET /api/bookings/today — حجوزات اليوم للـ Dashboard ─────────────
router.get('/today', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*,
              c.name  AS client_name,
              c.phone AS client_phone
       FROM bookings b
       JOIN users c ON c.id = b.user_id
       WHERE b.date = CURRENT_DATE AT TIME ZONE 'Africa/Cairo'
         AND b.status IN ('pending', 'confirmed')
       ORDER BY b.start_time ASC`
    );
    res.json({ bookings: rows });
  } catch (err) {
    logger.error('today bookings error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
