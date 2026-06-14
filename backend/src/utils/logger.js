/**
 * logger.js — Winston Logger
 * ─────────────────────────────────────────────────────────────────────
 * بديل console.error/log/warn في كل الـ backend.
 *
 * المستويات:
 *   logger.error()  → أخطاء حرجة (DB errors, unhandled exceptions)
 *   logger.warn()   → تحذيرات (CORS block, sanitize attempt, rate limit)
 *   logger.info()   → أحداث مهمة (server start, DB connected, migration)
 *   logger.debug()  → تفاصيل تطوير (تظهر في development فقط)
 *
 * الـ Output:
 *   - Console: ألوان في development، JSON في production
 *   - ملفات: logs/error.log (errors فقط) + logs/combined.log (كل شيء)
 *   - الملفات تُدار يومياً وتُحذف بعد 14 يوم تلقائياً
 * ─────────────────────────────────────────────────────────────────────
 */

const winston              = require('winston');
const DailyRotateFile      = require('winston-daily-rotate-file');
const path                 = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

// ── Format: Console (Development) ─────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? '\n  ' + JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')
      : '';
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  })
);

// ── Format: File (Production) ─────────────────────────────────────────
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ── Transports ────────────────────────────────────────────────────────
const transports = [];
const isVercel = !!process.env.VERCEL; // Vercel filesystem = read-only

// 1) Console — دائماً (الوحيد المتاح في Vercel)
transports.push(
  new winston.transports.Console({
    format: isDev ? devFormat : combine(timestamp(), errors({ stack: true }), json()),
    silent: process.env.NODE_ENV === 'test',
  })
);

// 2+3) ملفات — فقط خارج Vercel (local / Docker)
if (!isVercel) {
  transports.push(
    new DailyRotateFile({
      filename    : path.join(__dirname, '../../logs/error-%DATE%.log'),
      datePattern : 'YYYY-MM-DD',
      level       : 'error',
      format      : fileFormat,
      maxFiles    : '14d',
      maxSize     : '10m',
      zippedArchive: true,
    })
  );
  transports.push(
    new DailyRotateFile({
      filename    : path.join(__dirname, '../../logs/combined-%DATE%.log'),
      datePattern : 'YYYY-MM-DD',
      format      : fileFormat,
      maxFiles    : '14d',
      maxSize     : '20m',
      zippedArchive: true,
    })
  );
}

// ── Logger Instance ───────────────────────────────────────────────────
const logger = winston.createLogger({
  level      : isDev ? 'debug' : 'info',
  transports,
  exitOnError: false,
});

// ── HTTP Request Logger (Morgan stream) ───────────────────────────────
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
