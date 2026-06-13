require('dotenv').config();
const logger = require('./utils/logger');
const express          = require('express');
const cors             = require('cors');
const helmet           = require('helmet');
const morgan           = require('morgan');
const rateLimit        = require('express-rate-limit');
const xss              = require('xss-clean');
const mongoSanitize    = require('express-mongo-sanitize');
const hpp              = require('hpp');
const cookieParser     = require('cookie-parser');
const migrate          = require('./utils/migrate');
const seed             = require('./utils/seed');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// ✅ CORS config — مرن ومحمي
const ALLOWED_ORIGINS = [
  'https://linkspace-topaz.vercel.app',
  'https://linkspace-void.vercel.app',
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
      logger.warn(`CORS blocked: ${origin}`);
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
// 1) حد عام — كل الـ API: 200 طلب / 15 دقيقة
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'طلبات كثيرة جداً، انتظر قليلاً' },
});

// 2) حد صارم للـ login فقط — لمنع Brute Force على كلمة السر
// 20 محاولة / 15 دقيقة لكل IP (كافية للاستخدام الطبيعي)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'محاولات دخول كثيرة جداً، انتظر 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3) حد صارم لـ forgot-password — لمنع إغراق الإيميل
// 5 محاولات / ساعة لكل IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'تجاوزت الحد المسموح لطلبات استعادة كلمة السر، حاول بعد ساعة' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/forgot-password', forgotPasswordLimiter); // أصرم — يطبَّق أولاً
app.use('/api/auth/login',           loginLimiter);           // Brute force protection
app.use(limiter);                                              // عام على كل شيء

// Body parsing, cookies & logging
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ════════════════════════════════════════════════
// Input Sanitization — يُطبَّق بعد body parsing
// وقبل أي route عشان يضمن تنظيف كل البيانات
// ════════════════════════════════════════════════

// 1) XSS — يشفِّر الأكواد الخطيرة مثل <script> في body/query/params
//    مثال: <script>alert(1)</script>  →  &lt;script&gt;alert(1)&lt;/script&gt;
app.use(xss());

// 2) NoSQL Injection — يحذف المفاتيح التي تبدأ بـ $ أو تحتوي نقطة
//    مثال: { "$gt": "" }  →  {}   (يمنع تخطي شرط WHERE)
app.use(mongoSanitize({
  replaceWith: '_',          // بدل الحذف الكامل — أسهل في التتبع
  onSanitize: ({ req, key }) => {
    logger.warn(`[Sanitize] NoSQL injection attempt blocked — key: ${key} — IP: ${req.ip}`);
  },
}));

// 3) HTTP Parameter Pollution — يمنع إرسال نفس الـ param أكثر من مرة
//    مثال: ?sort=price&sort=hack  →  sort='price' (آخر قيمة فقط)
//    whitelist: الـ params المسموح لها بالتكرار الشرعي (مثل filter[])
app.use(hpp({
  whitelist: ['filter', 'fields', 'sort'],
}));

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
  logger.error(err.message || err, { stack: err.stack });
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
    logger.info('✅ DB initialized');
  } catch (err) {
    logger.error('Startup warning:', { message: err.message });
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
      logger.info(`🚀 Link Space API running on http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  }
  startServer();
}
