const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

const isAdmin = [auth, requireRole('admin')];
const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/subscriptions/plans
router.get('/plans', ...isStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json({ plans: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/subscriptions/plans
router.post('/plans', ...isAdmin, async (req, res) => {
  const { name, price, features, discount_rooms } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  try {
    const { rows } = await db.query(`
      INSERT INTO subscription_plans (name, price, features, discount_rooms)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, price, features, discount_rooms || 0]);
    res.status(201).json({ plan: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/subscriptions/plans/:id
router.put('/plans/:id', ...isAdmin, async (req, res) => {
  const { name, price, features, discount_rooms } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE subscription_plans 
      SET name = $1, price = $2, features = $3, discount_rooms = $4, updated_at = NOW()
      WHERE id = $5 RETURNING *
    `, [name, price, features, discount_rooms, req.params.id]);
    res.json({ plan: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /api/subscriptions/plans/:id
router.delete('/plans/:id', ...isAdmin, async (req, res) => {
  try {
    await db.query(
      'UPDATE subscription_plans SET is_active = false WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;