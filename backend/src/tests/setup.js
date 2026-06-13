/**
 * setup.js — إعداد بيئة الاختبار
 * ─────────────────────────────────────────────────────────────────
 * يُنشئ نسخة من الـ express app بدون تشغيل الـ server
 * عشان Supertest يتعامل مع الـ HTTP requests مباشرةً
 * ─────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
process.env.NODE_ENV = 'test';
process.env.JWT_EXPIRES_IN = '15m';

const express       = require('express');
const cors          = require('cors');
const cookieParser  = require('cookie-parser');
const xss           = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp           = require('hpp');

// Routes
const authRouter          = require('../routes/auth');
const sessionsRouter      = require('../routes/sessions');
const adminRouter         = require('../routes/admin');
const staffRouter         = require('../routes/staff');
const invoicesRouter      = require('../routes/invoices');
const couponsRouter       = require('../routes/coupons');
const subscriptionsRouter = require('../routes/subscriptions');

function createApp() {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(xss());
  app.use(mongoSanitize({ replaceWith: '_' }));
  app.use(hpp({ whitelist: ['filter', 'fields', 'sort'] }));

  app.use('/api/auth',          authRouter);
  app.use('/api/sessions',      sessionsRouter);
  app.use('/api/admin',         adminRouter);
  app.use('/api/staff',         staffRouter);
  app.use('/api/invoices',      invoicesRouter);
  app.use('/api/coupons',       couponsRouter);
  app.use('/api/subscriptions', subscriptionsRouter);

  return app;
}

module.exports = { createApp };
