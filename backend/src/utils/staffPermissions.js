/**
 * staffPermissions.js
 * ─────────────────────────────────────────────────────────
 * مصدر واحد لكل منطق صلاحيات الموظفين.
 * كل الـ routes (staff.js / admin.js) تستورد من هنا فقط.
 * ─────────────────────────────────────────────────────────
 */

const db = require('../config/db');

// ── الصلاحيات المتاحة وقيمها الافتراضية ─────────────────
const PERMISSION_DEFAULTS = {
  can_charge_wallet  : true,
  can_add_points     : true,
  can_edit_prices    : false,
  can_create_coupons : false,
  can_view_reports   : false,
  can_view_all       : false,
};

// قائمة أسماء الصلاحيات — للتحقق من الـ input
const PERMISSION_KEYS = Object.keys(PERMISSION_DEFAULTS);

/**
 * extractPermissions(body)
 * يسحب قيم الصلاحيات من الـ request body مع الـ defaults
 */
function extractPermissions(body) {
  const perms = {};
  for (const key of PERMISSION_KEYS) {
    perms[key] = key in body ? Boolean(body[key]) : PERMISSION_DEFAULTS[key];
  }
  return perms;
}

/**
 * createPermissions(userId, perms, client?)
 * ينشئ سجل صلاحيات جديد لموظف — يُستخدم عند إنشاء حساب
 * client: اختياري — يُمرَّر لو كنا داخل transaction
 */
async function createPermissions(userId, perms, client = db) {
  const p = { ...PERMISSION_DEFAULTS, ...perms };
  await client.query(
    `INSERT INTO staff_permissions
       (user_id,
        can_charge_wallet, can_add_points,
        can_edit_prices,   can_create_coupons,
        can_view_reports,  can_view_all)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      userId,
      p.can_charge_wallet, p.can_add_points,
      p.can_edit_prices,   p.can_create_coupons,
      p.can_view_reports,  p.can_view_all,
    ]
  );
}

/**
 * upsertPermissions(userId, perms, client?)
 * يُنشئ أو يُحدِّث الصلاحيات — يُستخدم عند التعديل
 */
async function upsertPermissions(userId, perms, client = db) {
  const p = { ...PERMISSION_DEFAULTS, ...perms };
  await client.query(
    `INSERT INTO staff_permissions
       (user_id,
        can_charge_wallet, can_add_points,
        can_edit_prices,   can_create_coupons,
        can_view_reports,  can_view_all)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_id) DO UPDATE SET
       can_charge_wallet  = $2,
       can_add_points     = $3,
       can_edit_prices    = $4,
       can_create_coupons = $5,
       can_view_reports   = $6,
       can_view_all       = $7,
       updated_at         = NOW()`,
    [
      userId,
      p.can_charge_wallet, p.can_add_points,
      p.can_edit_prices,   p.can_create_coupons,
      p.can_view_reports,  p.can_view_all,
    ]
  );
}

/**
 * getPermissions(userId)
 * يجيب صلاحيات موظف — يرجع object أو null لو مفيش سجل
 */
async function getPermissions(userId) {
  const { rows } = await db.query(
    `SELECT ${PERMISSION_KEYS.join(', ')}
     FROM staff_permissions WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * checkPermission(userId, permKey)
 * يتحقق من صلاحية واحدة — يرجع true/false
 */
async function checkPermission(userId, permKey) {
  if (!PERMISSION_KEYS.includes(permKey)) return false;
  const { rows } = await db.query(
    `SELECT ${permKey} FROM staff_permissions WHERE user_id = $1`,
    [userId]
  );
  return rows[0]?.[permKey] === true;
}

module.exports = {
  PERMISSION_DEFAULTS,
  PERMISSION_KEYS,
  extractPermissions,
  createPermissions,
  upsertPermissions,
  getPermissions,
  checkPermission,
};
