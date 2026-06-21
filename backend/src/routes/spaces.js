const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { requirePermission }  = require('../middleware/permissions');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/spaces — كل المستخدمين
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM space_settings ORDER BY id'
    );
    res.json({ spaces: rows });
  } catch {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /api/spaces/with-availability?date=YYYY-MM-DD
// يرجع كل المساحات مع عدد الأماكن المحجوزة في التاريخ المحدد
router.get('/with-availability', auth, async (req, res) => {
  const { date } = req.query;
  try {
    const { rows: spaces } = await db.query(
      'SELECT * FROM space_settings WHERE is_active = true ORDER BY id'
    );

    if (!date) return res.json({ spaces });

    // ✅ نحسب من الجلسات النشطة + الحجوزات المؤكدة لليوم
    const { rows: activeSessions } = await db.query(`
      SELECT space_key, COUNT(*) as active_count
      FROM sessions
      WHERE status = 'active'
      GROUP BY space_key
    `);

    const { rows: confirmedBookings } = await db.query(`
      SELECT space_key, COUNT(*) as booked_count
      FROM bookings
      WHERE date = $1 
        AND status = 'confirmed'
        AND start_time <= NOW()::time 
        AND end_time   >= NOW()::time
      GROUP BY space_key
    `, [date]);

    // دمج النتيجتين — خذ الأكبر (الجلسات النشطة هي الأهم)
    const activeMap  = {};
    const bookingMap = {};
    activeSessions.forEach(r   => { activeMap[r.space_key]  = parseInt(r.active_count);  });
    confirmedBookings.forEach(r => { bookingMap[r.space_key] = parseInt(r.booked_count); });

    const spacesWithAvail = spaces.map(s => {
      const occupiedByActive   = activeMap[s.space_key]  || 0;
      const occupiedByBookings = bookingMap[s.space_key] || 0;
      // الجلسات النشطة هي الاحتلال الفعلي
      const occupied = Math.max(occupiedByActive, occupiedByBookings);
      return {
        ...s,
        occupied,
        available_spots: Math.max(0, s.capacity - occupied),
      };
    });

    router.get('/with-availability', auth, async (req, res) => {
  const { date } = req.query;
  try {
    const { rows: spaces } = await db.query(
      'SELECT * FROM space_settings WHERE is_active = true ORDER BY id'
    );

    if (!date) return res.json({ spaces });

    const { rows: activeSessions } = await db.query(`
      SELECT space_key, COUNT(*) as active_count
      FROM sessions
      WHERE status = 'active'
      GROUP BY space_key
    `);

    const { rows: confirmedBookings } = await db.query(`
      SELECT space_key, COUNT(*) as booked_count
      FROM bookings
      WHERE date = $1 
        AND status = 'confirmed'
        AND start_time <= NOW()::time 
        AND end_time   >= NOW()::time
      GROUP BY space_key
    `, [date]);

    const activeMap  = {};
    const bookingMap = {};
    activeSessions.forEach(r   => { activeMap[r.space_key]  = parseInt(r.active_count);  });
    confirmedBookings.forEach(r => { bookingMap[r.space_key] = parseInt(r.booked_count); });

    const spacesWithAvail = spaces.map(s => {
      const occupiedByActive   = activeMap[s.space_key]  || 0;
      const occupiedByBookings = bookingMap[s.space_key] || 0;
      const occupied = Math.max(occupiedByActive, occupiedByBookings);
      return {
        ...s,
        occupied,
        available_spots: Math.max(0, s.capacity - occupied),
      };
    });

    res.json({ spaces: spacesWithAvail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});


    res.json({ spaces: spacesWithAvail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/spaces — إضافة مساحة جديدة (أدمن فقط)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { space_key, name, first_hour, extra_hour, max_hours, capacity, description } = req.body;
  if (!space_key || !name) return res.status(400).json({ error: 'space_key والاسم مطلوبان' });
  try {
    const { rows } = await db.query(`
      INSERT INTO space_settings 
        (space_key, name, first_hour, extra_hour, max_hours, capacity, description, updated_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [
      space_key.toLowerCase().replace(/\s/g,'_'),
      name,
      parseFloat(first_hour) || 0,
      parseFloat(extra_hour) || 0,
      parseInt(max_hours) || 12,
      parseInt(capacity) || 1,
      description || null,
      req.user.name,
    ]);
    res.json({ space: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'هذا الـ key موجود بالفعل' });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/spaces/:key — تعديل مساحة
router.put('/:key', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, first_hour, extra_hour, max_hours, capacity, is_active, description } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE space_settings
      SET 
        name        = COALESCE($1, name),
        first_hour  = COALESCE($2, first_hour),
        extra_hour  = COALESCE($3, extra_hour),
        max_hours   = COALESCE($4, max_hours),
        capacity    = COALESCE($5, capacity),
        is_active   = COALESCE($6, is_active),
        description = COALESCE($7, description),
        updated_at  = NOW(),
        updated_by  = $8
      WHERE space_key = $9
      RETURNING *
    `, [name, first_hour, extra_hour, max_hours, capacity, is_active, description, req.user.name, req.params.key]);

    if (!rows[0]) return res.status(404).json({ error: 'المساحة غير موجودة' });
    res.json({ space: rows[0] });
  } catch {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /api/spaces/:key — حذف مساحة (أدمن فقط)
router.delete('/:key', auth, requireRole('admin'), async (req, res) => {
  // منع حذف المساحات الأساسية
  const PROTECTED = ['cowork', 'meeting', 'lessons'];
  if (PROTECTED.includes(req.params.key)) {
    return res.status(400).json({ error: 'لا يمكن حذف المساحات الأساسية' });
  }
  try {
    await db.query('DELETE FROM space_settings WHERE space_key = $1', [req.params.key]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
