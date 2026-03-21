const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'لا يوجد توكن مصادقة' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, name, phone, role, balance, points, qr_code, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'المستخدم غير موجود أو محظور' });
    }
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'توكن غير صالح أو منتهي' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'ليس لديك صلاحية للوصول' });
  }
  next();
};

module.exports = { auth, requireRole };
