const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { requirePermission }  = require('../middleware/permissions');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/services — متاح للكل، لكن يظهر بالكامل للأدمن/الموظف ويُخفي عن العميل العادي
router.get('/', auth, async (req, res) => {
  try {
    let query = 'SELECT * FROM services WHERE hidden_from_client = false ORDER BY sort_order ASC, id ASC';
    
    // ✅ إذا كان المستخدم أدمن أو موظف، اجلب له كل الخدمات (حتى المخفية) ليراها في لوحة التحكم
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
      query = 'SELECT * FROM services ORDER BY sort_order ASC, id ASC';
    }

    const { rows } = await db.query(query);
    res.json({ services: rows });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/services — أدمن أو موظف عنده can_edit_prices
router.post('/', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, price } = req.body;

  if (!name || price === undefined || price === null || price === '') {
    return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  }

  try {
    // 1. حساب أكبر sort_order حالي في قاعدة البيانات لكي نضع العنصر الجديد بعده مباشرة
    const maxOrderRes = await db.query('SELECT MAX(sort_order) as max_order FROM services');
    const nextOrder = (maxOrderRes.rows[0].max_order || 0) + 1;

    // 2. إدراج الخدمة الجديدة مع الترتيب المحسوب تلقائياً
    const { rows } = await db.query(
      'INSERT INTO services (name, price, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name, price, nextOrder]
    );

    res.status(201).json({ service: rows[0] });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PUT /api/services/reorder
router.put('/reorder', auth, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'بيانات غير صحيحة' });
  }
  try {
    await db.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);
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

// PUT /api/services/:id — أدمن أو موظف عنده can_edit_prices
router.put('/:id', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, price, hidden_from_client } = req.body;
  const { id } = req.params;

  try {
    await db.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS hidden_from_client BOOLEAN DEFAULT false
    `);

    const currentServiceRes = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    if (currentServiceRes.rows.length === 0) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }
    const current = currentServiceRes.rows[0];

    const finalName   = name  !== undefined ? name  : current.name;
    const finalPrice  = price !== undefined ? price : current.price;
    const finalHidden = hidden_from_client !== undefined ? hidden_from_client : current.hidden_from_client;

    const { rows } = await db.query(`
      UPDATE services 
      SET name = $1, price = $2, hidden_from_client = $3, updated_at = NOW()
      WHERE id = $4 
      RETURNING *
    `, [finalName, finalPrice, finalHidden, id]);

    res.json({ service: rows[0] });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'خطأ في الخادم أثناء تحديث الخدمة' });
  }
});

// DELETE /api/services/:id — أدمن أو موظف عنده can_edit_prices
router.delete('/:id', auth, requireRole('staff', 'admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM services WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الخدمة غير موجودة' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

{/* 
const router = require('express').Router();
const db     = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { requirePermission }  = require('../middleware/permissions');

const isStaffOrAdmin = [auth, requireRole('staff', 'admin')];

// GET /api/services — متاح لكل المستخدمين المسجلين
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM services WHERE hidden_from_client = false ORDER BY sort_order ASC, id ASC'
    );
    res.json({ services: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/services — أدمن أو موظف عنده can_edit_prices
router.post('/', ...isStaffOrAdmin, requirePermission('can_edit_prices'), async (req, res) => {
  const { name, price, hidden_from_client } = req.body;
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

module.exports = router;
*/}