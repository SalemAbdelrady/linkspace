require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const migrate = require('./utils/migrate');
const seed = require('./utils/seed');

const app = express();

const invoicesRouter = require('./routes/invoices');
app.use('/api/invoices', invoicesRouter);

// Trust proxy for Railway
app.set('trust proxy', 1);

// CORS أولاً قبل أي حاجة
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

// Helmet بعد CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'محاولات كثيرة جداً، انتظر 15 دقيقة' } });
app.use('/api/auth', authLimiter);
app.use(limiter);

// Body parsing & logging
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// ✅ Routes كلها هنا قبل startServer
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/services', require('./routes/services'));
app.use('/api/subscriptions', require('./routes/subscriptions'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await migrate();
    await seed();
  } catch (err) {
    console.error('Startup warning:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Link Space API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

