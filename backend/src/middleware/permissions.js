/**
 * permissions.js middleware
 * يستخدم staffPermissions util — مصدر واحد للحقيقة
 */

const { checkPermission, PERMISSION_KEYS } = require('../utils/staffPermissions');

/**
 * requirePermission('can_edit_prices')
 * admin → يعدي دائماً
 * staff → يتحقق من staff_permissions
 */
function requirePermission(permission) {
  if (!PERMISSION_KEYS.includes(permission)) {
    throw new Error(`[permissions] صلاحية غير معروفة: ${permission}`);
  }

  return async (req, res, next) => {
    if (req.user.role === 'admin') return next();

    if (req.user.role === 'staff') {
      try {
        const allowed = await checkPermission(req.user.id, permission);
        if (allowed) return next();
        return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
      } catch (err) {
        console.error('[permissions middleware]', err);
        return res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
      }
    }

    return res.status(403).json({ error: 'ليس لديك صلاحية للوصول' });
  };
}

module.exports = { requirePermission };
