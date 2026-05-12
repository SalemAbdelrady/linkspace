const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { requirePermission }  = require('../middleware/permissions');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/services — متاح لكل المستخدمين المسجلين
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM services ORDER BY sort_order ASC, id ASC'
    );
    res.json({ services: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/services — أدمن أو موظف عنده can_edit_prices
router.post('/', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  try {
    const { rows } = await db.query(
      'INSERT INTO services (name, price) VALUES ($1, $2) RETURNING *',
      [name, price]
    );
    res.status(201).json({ service: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/services/:id — أدمن أو موظف عنده can_edit_prices
router.put('/:id', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, price } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE services SET name = $1, price = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [name, price, req.params.id]);
    res.json({ service: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /api/services/:id — أدمن أو موظف عنده can_edit_prices
router.delete('/:id', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  try {
    await db.query(
      'UPDATE services SET is_active = false WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/services/reorder
router.put('/reorder', auth, async (req, res) => { // [{id, sort_order}]
  const { items } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'بيانات غير صحيحة' });
  }

  try {
    // أضف العمود لو مش موجود
    await db.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    // حدّث الترتيب لكل عنصر
    for (const item of items) {
      await db.query(
        'UPDATE services SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('reorder error:', err);
    res.status(500).json({ error: 'خطأ في حفظ الترتيب' });
  }
});

module.exports = router;
