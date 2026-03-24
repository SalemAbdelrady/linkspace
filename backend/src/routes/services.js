const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];
const isAdmin = [auth, requireRole('admin')];

// GET /api/services
router.get('/', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY id'
    );
    res.json({ services: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/services
router.post('/', ...isAdmin, async (req, res) => {
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

// PUT /api/services/:id
router.put('/:id', ...isAdmin, async (req, res) => {
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

// DELETE /api/services/:id
router.delete('/:id', ...isAdmin, async (req, res) => {
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

module.exports = router;