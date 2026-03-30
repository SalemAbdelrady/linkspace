const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isAdmin = [auth, requireRole('admin')];

// GET /api/spaces — متاح لكل المستخدمين المسجلين
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM space_settings ORDER BY id');
    res.json({ spaces: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/spaces/:key — للأدمن فقط
router.put('/:key', ...isAdmin, async (req, res) => {
  const { name, first_hour, extra_hour, max_hours } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE space_settings 
      SET name = $1, first_hour = $2, extra_hour = $3, max_hours = $4, updated_at = NOW()
      WHERE space_key = $5
      RETURNING *
    `, [name, first_hour, extra_hour, max_hours, req.params.key]);

    if (!rows[0]) return res.status(404).json({ error: 'المساحة غير موجودة' });
    res.json({ space: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

