/**
 * bookings.js — نظام الحجز المسبق للمساحات
 * ─────────────────────────────────────────────────────────────────
 * Client:  يحجز / يلغي حجزه — يستلم إشعار بكل حركة تخص حجزه
 * Staff:   يشوف الحجوزات / يأكد / يلغي
 * Admin:   كامل الصلاحيات — يستلم إشعار بكل حجز/تأكيد/إلغاء
 * ─────────────────────────────────────────────────────────────────
 */

const router = require('express').Router();
const db     = require('../config/db');
const logger = require('../utils/logger');
const { auth, requireRole } = require('../middleware/auth');

const isAuth         = [auth];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];
const isAdmin        = [auth, requireRole('admin')];

// ── دالة مساعدة: إشعار لكل الأدمن ─────────────────────────────────────
async function notifyAdmins({ type, title, message, related_id, related_type = 'booking' }) {
  try {
    const { rows: admins } = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
    if (admins.length === 0) return;

    const values = [];
    const params = [];
    admins.forEach((a, i) => {
      const base = i * 6;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      params.push(a.id, type, title, message, related_id, related_type);
    });

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES ${values.join(',')}`,
      params
    );
  } catch (err) {
    logger.error('notifyAdmins error', { stack: err.stack });
  }
}

// ── دالة مساعدة: إشعار لمستخدم واحد (عادة العميل) ─────────────────────
async function notifyUser(userId, { type, title, message, related_id, related_type = 'booking' }) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, related_id, related_type]
    );
  } catch (err) {
    logger.error('notifyUser error', { stack: err.stack });
  }
}

// ── GET /api/bookings/availability — التحقق من توفر مساحة ────────────
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

    // ✅ يحسب عدد الحجوزات المتعارضة ويقارنها بالطاقة
    const { rows: conflicts } = await db.query(`
      SELECT COUNT(*) as conflict_count
      FROM bookings
      WHERE space_key = $1
        AND date = $2
        AND status IN ('pending','confirmed')
        AND start_time < $4
        AND end_time   > $3
    `, [space_key, date, start_time, end_time]);

    const conflictCount = parseInt(conflicts[0].conflict_count);

    // جيب الطاقة الاستيعابية للمساحة
    const { rows: spaceRows } = await db.query(
      'SELECT capacity, name FROM space_settings WHERE space_key = $1',
      [space_key]
    );
    const capacity    = parseInt(spaceRows[0]?.capacity) || 1;
    const spaceNameDb = spaceRows[0]?.name || 'المساحة';

    // ✅ احسب الجلسات النشطة حالياً في نفس المساحة
    const { rows: activeSessions } = await db.query(`
      SELECT COUNT(*) as active_count
      FROM sessions
      WHERE space_key = $1 AND status = 'active'
    `, [space_key]);
    const activeCount = parseInt(activeSessions[0].active_count);

    // ✅ لو التاريخ هو اليوم، اعتبر الجلسات النشطة جزء من الاحتلال
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    let totalOccupied = conflictCount;
    if (isToday && start_time <= currentTime) {
      totalOccupied = Math.max(conflictCount, activeCount);
    }

    if (totalOccupied >= capacity) {
      return res.status(400).json({
        error: `${spaceNameDb} محجوزة بالكامل في هذا الوقت — اختر وقتاً آخر`
      });
    }

    // إنشاء الحجز
    const { rows } = await db.query(
      `INSERT INTO bookings
         (user_id, space_key, space_name, date, start_time, end_time, guest_count, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [bookingUserId, space_key, space_name || space_key, date,
       start_time, end_time, guest_count, note || null, req.user.id]
    );

    const newBooking = rows[0];

    logger.info('booking created', { bookingId: newBooking.id, userId: req.user.id, date, space_key });

    // ✅ إشعار للأدمن بحجز جديد
    const { rows: clientRows } = await db.query(
      'SELECT name FROM users WHERE id = $1', [bookingUserId]
    );
    const clientName = clientRows[0]?.name || 'عميل';

    await notifyAdmins({
      type: 'booking_created',
      title: '📅 حجز جديد',
      message: `${clientName} طلب حجز ${newBooking.space_name} يوم ${date} (${start_time}–${end_time}) — بواسطة ${req.user.name}`,
      related_id: newBooking.id,
    });

    // ✅ إشعار للعميل نفسه — يوضح مين عمل الحجز (هو نفسه أو موظف/أدمن بالنيابة عنه)
    const bookedByText = req.user.id === bookingUserId
      ? 'بنجاح'
      : `بواسطة ${req.user.name}`;
    await notifyUser(bookingUserId, {
      type: 'booking_created',
      title: '📅 تم إرسال طلب حجزك',
      message: `تم إنشاء حجز لـ ${newBooking.space_name} يوم ${date} (${start_time}–${end_time}) ${bookedByText} — في انتظار التأكيد`,
      related_id: newBooking.id,
    });

    res.status(201).json({ booking: newBooking, message: 'تم إنشاء الحجز — في انتظار التأكيد' });
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
  const { date, space_key, status, date_from, date_to, sort = 'desc' } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      whereClause += ` AND b.status = $${params.length}`;
    }
    if (space_key) {
      params.push(space_key);
      whereClause += ` AND b.space_key = $${params.length}`;
    }
    // ✅ فلترة بنطاق التاريخ
    if (date_from) {
      params.push(date_from);
      whereClause += ` AND b.date >= $${params.length}::date`;
    }
    if (date_to) {
      params.push(date_to);
      whereClause += ` AND b.date <= $${params.length}::date`;
    }
    // ✅ فلترة بتاريخ محدد (للتوافق مع الكود القديم)
    if (date) {
      params.push(date);
      whereClause += ` AND b.date = $${params.length}::date`;
    }

    // ✅ الترتيب ديناميكي
    const orderDir = sort === 'asc' ? 'ASC' : 'DESC';

    const { rows } = await db.query(
      `SELECT b.*,
              c.name  AS client_name,
              c.phone AS client_phone,
              u.name  AS confirmed_by_name
       FROM bookings b
       JOIN  users c ON c.id = b.user_id
       LEFT JOIN users u ON u.id = b.confirmed_by
       ${whereClause}
       ORDER BY b.date ${orderDir}, b.start_time ${orderDir}`,
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
      `SELECT b.*, u.name AS confirmed_by_name, c.name AS client_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.confirmed_by
       LEFT JOIN users c ON c.id = b.user_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'الحجز غير موجود أو تم تأكيده مسبقاً' });

    const booking = rows[0];

    logger.info('booking confirmed', { bookingId: booking.id, staffId: req.user.id, staffName: req.user.name });

    // ✅ إشعار للأدمن بالتأكيد (لو اللي أكّد موظف، عشان الأدمن يتابع)
    if (req.user.role !== 'admin') {
      await notifyAdmins({
        type: 'booking_confirmed',
        title: '✅ تأكيد حجز',
        message: `${req.user.name} أكّد حجز ${booking.client_name} (${booking.space_name})`,
        related_id: booking.id,
      });
    }

    // ✅ إشعار للعميل بتأكيد حجزه — الأهم بالنسبة له
    const bookingDate = booking.date?.toISOString ? booking.date.toISOString().slice(0, 10) : booking.date;
    await notifyUser(booking.user_id, {
      type: 'booking_confirmed',
      title: '✅ تم تأكيد حجزك',
      message: `تم تأكيد حجزك لـ ${booking.space_name} يوم ${bookingDate} (${booking.start_time?.slice(0,5)}–${booking.end_time?.slice(0,5)})`,
      related_id: booking.id,
    });

    res.json({ booking, message: `تم تأكيد الحجز ✅ بواسطة ${req.user.name || 'الموظف'}` });
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
      `SELECT b.*, c.name AS client_name
       FROM bookings b
       LEFT JOIN users c ON c.id = b.user_id
       WHERE b.id = $1`,
      [req.params.id]
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
       SET status            = 'cancelled',
           cancelled_at      = NOW(),
           cancel_reason     = $1,
           cancelled_by_id   = $2,
           cancelled_by_name = $3,
           updated_at        = NOW()
       WHERE id = $4
       RETURNING *`,
      [cancel_reason || null, req.user.id, req.user.name, req.params.id]
    );

    const cancelled = rows[0];

    logger.info('booking cancelled', { bookingId: cancelled.id, by: req.user.id, byName: req.user.name });

    // ✅ إشعار للأدمن بالإلغاء
    await notifyAdmins({
      type: 'booking_cancelled',
      title: '❌ إلغاء حجز',
      message: `تم إلغاء حجز ${booking.client_name} (${booking.space_name}) بواسطة ${req.user.name}` +
                (cancel_reason ? ` — السبب: ${cancel_reason}` : ''),
      related_id: cancelled.id,
    });

    // ✅ إشعار للعميل بإلغاء حجزه — لو اللي ألغى مش هو نفسه
    // (لو هو اللي ألغى بنفسه، معروف ومش محتاج إشعار)
    if (req.user.id !== booking.user_id) {
      await notifyUser(booking.user_id, {
        type: 'booking_cancelled',
        title: '❌ تم إلغاء حجزك',
        message: `تم إلغاء حجزك لـ ${booking.space_name} بواسطة ${req.user.name}` +
                  (cancel_reason ? ` — السبب: ${cancel_reason}` : ' — بدون سبب محدد'),
        related_id: cancelled.id,
      });
    }

    res.json({ booking: cancelled, message: 'تم إلغاء الحجز' });
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
