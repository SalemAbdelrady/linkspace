/**
 * notifications.js — نظام الإشعارات للأدمن
 * ─────────────────────────────────────────────────────────────────
 * يعرض إشعارات المستخدم الحالي (غالباً الأدمن) المتعلقة بالحجوزات
 * وأي أحداث أخرى تستدعي المتابعة.
 * ─────────────────────────────────────────────────────────────────
 */

const router = require('express').Router();
const db     = require('../config/db');
const logger = require('../utils/logger');
const { auth } = require('../middleware/auth');

// ── GET /api/notifications — إشعارات المستخدم الحالي ─────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({
      notifications: rows,
      unread_count: parseInt(countRows[0].count),
    });
  } catch (err) {
    logger.error('get notifications error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/notifications/:id/read — تعليم إشعار كمقروء ──────────
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'الإشعار غير موجود' });
    res.json({ success: true });
  } catch (err) {
    logger.error('mark notification read error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── PATCH /api/notifications/read-all — تعليم الكل كمقروء ───────────
router.patch('/read-all', auth, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('mark all notifications read error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── DELETE /api/notifications/:id — حذف إشعار ────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('delete notification error', { stack: err.stack });
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
