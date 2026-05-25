require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const migrate = require('./utils/migrate');
const seed = require('./utils/seed');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// ✅ CORS config — مرن ومحمي
const ALLOWED_ORIGINS = [
  'https://linkspace-topaz.vercel.app',
  'https://linkspace-vojd.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // السماح لـ Postman وserver-to-server (بدون origin)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS: ${origin} غير مسموح`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // ✅ مهم لبعض المتصفحات القديمة
};

// ✅ OPTIONS preflight لازم يجي قبل كل middleware تاني
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Helmet بعد CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'محاولات كثيرة جداً، انتظر 15 دقيقة' },
});
app.use('/api/auth', authLimiter);
app.use(limiter);

// Body parsing & logging
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// ✅ Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/coupons',       require('./routes/coupons'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/spaces',        require('./routes/spaces'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/invoices',      require('./routes/invoices'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/staff',         require('./routes/staff'));

// Health check
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// 404
app.use((req, res) =>
  res.status(404).json({ error: 'المسار غير موجود' })
);

// Error handler
app.use((err, req, res, next) => {
  // ✅ CORS errors تعطي رسالة واضحة
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

// ✅ initialize مرة واحدة
let initialized = false;
async function initialize() {
  if (initialized) return;
  initialized = true;
  try {
    await migrate();
    await seed();
    console.log('✅ DB initialized');
  } catch (err) {
    console.error('Startup warning:', err.message);
  }
}

// ✅ Vercel serverless mode
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await initialize();
    return app(req, res);
  };
} else {
  const PORT = process.env.PORT || 5000;
  async function startServer() {
    await initialize();
    app.listen(PORT, () => {
      console.log(`🚀 Link Space API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  }
  startServer();
}
