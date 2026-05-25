# 🏢 Link Space CMS

نظام إدارة مساحة العمل المشتركة — Web App متكامل لإدارة الدخول والخروج والفواتير ونقاط الولاء.

---

## 🗂️ هيكل المشروع

```
linkspace/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/db.js      # اتصال PostgreSQL
│   │   ├── middleware/auth.js # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js       # تسجيل / دخول
│   │   │   ├── sessions.js   # check-in / check-out
│   │   │   ├── coupons.js    # نظام الكوبونات
│   │   │   └── admin.js      # لوحة التحكم
│   │   ├── utils/
│   │   │   ├── migrate.js    # إنشاء الجداول
│   │   │   └── seed.js       # بيانات تجريبية
│   │   └── index.js          # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # React.js SPA
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── utils/api.js      # Axios + endpoints
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ClientDashboard.jsx
│   │   │   ├── ScannerPage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx           # Router + Protected Routes
│   │   └── index.css         # Global styles
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml        # Full stack deployment
```

---

## 🚀 التشغيل — طريقتين

### الطريقة الأولى: Docker (الأسرع) ✅

```bash
# 1. انسخ المشروع
git clone <repo-url>
cd linkspace

# 2. اعمل ملف البيئة
cp backend/.env.example backend/.env
# عدّل كلمة السر في الملف

# 3. شغّل كل حاجة بأمر واحد
docker-compose up -d

# 4. افتح المتصفح
# العميل:    http://localhost:3000
# API:       http://localhost:5000/api/health
```

---

### الطريقة الثانية: Manual (للتطوير)

#### المتطلبات
- Node.js 18+
- PostgreSQL 14+

#### Backend

```bash
cd backend

# 1. نسخ ملف البيئة وتعديله
cp .env.example .env
# افتح .env وعدّل DB_PASSWORD و JWT_SECRET

# 2. تثبيت الباكدجز
npm install

# 3. إنشاء قاعدة البيانات
createdb linkspace_db   # أو من pgAdmin

# 4. تشغيل الـ migrations
npm run db:migrate

# 5. إضافة بيانات تجريبية
npm run db:seed

# 6. تشغيل الـ server
npm run dev
# ✅ API running on http://localhost:5000
```

#### Frontend

```bash
cd frontend

# 1. نسخ ملف البيئة
cp .env.example .env

# 2. تثبيت الباكدجز
npm install

# 3. تشغيل
npm start
# ✅ App running on http://localhost:3000
```

---

## 👤 بيانات الدخول التجريبية

| الدور | الموبايل | كلمة السر |
|-------|----------|-----------|
| مدير | 01000000000 | admin123 |
| موظف استقبال | 01100000000 | staff123 |
| عميل | 01012345678 | client123 |

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register     — تسجيل عميل جديد
POST /api/auth/login        — تسجيل الدخول
GET  /api/auth/me           — بيانات المستخدم الحالي
```

### Sessions
```
POST /api/sessions/scan     — مسح QR (check-in/out) [staff/admin]
GET  /api/sessions/history  — سجل زيارات العميل
GET  /api/sessions/active   — العملاء النشطون الآن [staff/admin]
```

### Coupons
```
POST /api/coupons/redeem    — استبدال 100 نقطة بكوبون
GET  /api/coupons/my        — كوبوناتي
POST /api/coupons/validate  — التحقق من كوبون [staff/admin]
```

### Admin
```
GET   /api/admin/users              — قائمة العملاء
PATCH /api/admin/users/:id/wallet   — شحن المحفظة
PATCH /api/admin/users/:id/points   — إضافة نقاط
PATCH /api/admin/users/:id/toggle   — تفعيل/حظر
GET   /api/admin/reports/daily      — تقرير يومي
GET   /api/admin/reports/monthly    — تقرير شهري
GET   /api/admin/prices             — الأسعار
PUT   /api/admin/prices/:id         — تعديل سعر
```

---

## 💡 منطق الحساب

- **الحساب بالدقيقة**: `(دقائق / 60) × سعر_الساعة`
- **النقاط**: كل 10 جنيه = نقطة واحدة
- **الكوبون**: 100 نقطة → خصم 20% (صالح 30 يوم)
- **الأسعار**: صباحي (6-14) / مسائي (14-22) / ليلي (22-6)

---

## 🔐 الأمان

- JWT مع expiry 7 أيام
- bcrypt للـ passwords (salt rounds: 12)
- Rate limiting: 10 محاولات login كل 15 دقيقة
- Helmet.js لـ security headers
- CORS محدود للـ frontend URL فقط
- Input validation على كل endpoint

---

## 📱 الواجهات

| الرابط | الواجهة | المستخدم |
|--------|---------|---------|
| `/` | داشبورد العميل (QR + رصيد + سجل) | client |
| `/scanner` | واجهة الاستقبال (مسح QR) | staff/admin |
| `/admin` | لوحة التحكم (تقارير + مستخدمين + أسعار) | admin/staff |

---

## 🛠️ التطوير المستقبلي

- [ ] QR Scanner حقيقي بالكاميرا (jsQR / ZXing)
- [ ] إشعارات WhatsApp عند الخروج
- [ ] اشتراكات شهرية (packages)
- [ ] تطبيق موبايل React Native
- [ ] تقارير PDF قابلة للتصدير
- [ ] نظام حجز مقاعد مسبقاً
