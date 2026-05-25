// backend/src/middleware/permissions.js
// ✅ middleware للتحقق من صلاحيات الموظفين

const db = require('../config/db');

/**
 * requirePermission('can_edit_prices')
 * يسمح للـ admin دائماً
 * يسمح للـ staff فقط لو عنده الصلاحية المطلوبة في staff_permissions
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    // الأدمن عنده كل الصلاحيات
    if (req.user.role === 'admin') return next();

    // الـ staff — نتحقق من الجدول
    if (req.user.role === 'staff') {
      try {
        const { rows } = await db.query(
          `SELECT ${permission} FROM staff_permissions WHERE user_id = $1`,
          [req.user.id]
        );
        if (rows[0]?.[permission] === true) return next();
        return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
      }
    }

    return res.status(403).json({ error: 'ليس لديك صلاحية للوصول' });
  };
}

module.exports = { requirePermission };
