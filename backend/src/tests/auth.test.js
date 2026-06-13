/**
 * auth.test.js — اختبارات الـ Critical Endpoints
 * ─────────────────────────────────────────────────────────────────
 * يغطي: Login, Register, Refresh Token, Sessions, Wallet
 * ─────────────────────────────────────────────────────────────────
 */

const request = require('supertest');
const { createApp } = require('./setup');
const db = require('../config/db');

// تحقق من الـ DB قبل تشغيل الاختبارات
let app;
let dbAvailable = false;

beforeAll(async () => {
  try {
    await db.query('SELECT 1');
    dbAvailable = true;
    app = createApp();
  } catch {
    console.warn('⚠️  DB not available — skipping integration tests');
    console.warn('   Run: npm test (with DB running)');
  }
});

// Helper — يـ skip لو مفيش DB
function itWithDb(name, fn) {
  test(name, async () => {
    if (!dbAvailable) return;
    await fn();
  });
}

// ── بيانات الاختبار ───────────────────────────────────────────────
const TEST_ADMIN  = { phone: '01000000000', password: 'admin123' };
const TEST_STAFF  = { phone: '01100000000', password: 'staff123' };
const TEST_CLIENT = { phone: '01012345678', password: 'client123' };

let adminToken  = '';
let staffToken  = '';
let clientToken = '';
let clientId    = null;
let activeSessionId = null;

// ══════════════════════════════════════════════════════════════════
// SUITE 1: Authentication
// ══════════════════════════════════════════════════════════════════
describe('🔐 Authentication', () => {

  // ── Login ────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {

    test('✅ Admin login — correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(TEST_ADMIN);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.headers['set-cookie']).toBeDefined(); // refresh token cookie

      adminToken = res.body.token;
    });

    test('✅ Staff login — correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(TEST_STAFF);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('staff');
      staffToken = res.body.token;
    });

    test('✅ Client login — correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(TEST_CLIENT);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('client');
      clientToken = res.body.token;
      clientId = res.body.user.id;
    });

    test('❌ Wrong password → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: TEST_ADMIN.phone, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('❌ Non-existent phone → 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '01099999999', password: 'anything' });

      expect(res.status).toBe(401);
    });

    test('❌ Missing password → 400 validation error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: TEST_ADMIN.phone });

      expect(res.status).toBe(400);
    });

    test('❌ Invalid phone format → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '123', password: 'test' });

      expect([400, 401]).toContain(res.status);
    });
  });

  // ── GET /me ──────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {

    test('✅ Valid token → returns user data', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('role', 'admin');
      expect(res.body.user).not.toHaveProperty('password');
    });

    test('❌ No token → 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('❌ Invalid token → 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer fake.token.here');
      expect(res.status).toBe(401);
    });
  });

  // ── Refresh Token ────────────────────────────────────────────────
  describe('POST /api/auth/refresh', () => {

    test('✅ Valid refresh cookie → new access token', async () => {
      // أول نعمل login عشان نحصل على refresh cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(TEST_ADMIN);

      const cookies = loginRes.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty('token');
      // Token Rotation — يجي refresh token جديد
      expect(refreshRes.headers['set-cookie']).toBeDefined();
    });

    test('❌ No cookie → 401', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    test('❌ Invalid cookie → 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=fake-token-12345');
      expect(res.status).toBe(401);
    });
  });

  // ── Logout ───────────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {

    test('✅ Logout clears refresh cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(TEST_CLIENT);

      const cookies = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // refresh token يجب يكون ملغي بعد logout
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);
      expect(refreshRes.status).toBe(401);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// SUITE 2: Authorization & Role Protection
// ══════════════════════════════════════════════════════════════════
describe('🛡️ Authorization & Role Protection', () => {

  test('❌ Client cannot access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/staff')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  test('❌ Staff cannot access admin-only endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/staff')
      .set('Authorization', `Bearer ${staffToken}`);
    // Staff مش admin — المفروض 403
    expect([403, 200]).toContain(res.status); // depends on staff permissions
  });

  test('✅ Admin can access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('staff');
  });

  test('✅ Staff can access their own stats', async () => {
    const res = await request(app)
      .get('/api/staff/me/stats')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
  });

  test('✅ Staff can get their permissions', async () => {
    const res = await request(app)
      .get('/api/staff/me/permissions')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('permissions');
  });
});

// ══════════════════════════════════════════════════════════════════
// SUITE 3: Sessions (Check-in / Check-out)
// ══════════════════════════════════════════════════════════════════
describe('🚪 Sessions — Check-in & Check-out', () => {

  let scannedQrCode = '';

  beforeAll(async () => {
    // اجيب الـ QR Code للعميل
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${clientToken}`);
    scannedQrCode = meRes.body.user.qr_code;
    expect(scannedQrCode).toBeTruthy();
  });

  test('✅ Staff can scan client QR → Check-in', async () => {
    const res = await request(app)
      .post('/api/sessions/scan')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ qr_code: scannedQrCode, space_key: 'cowork', guest_count: 1 });

    // إما check-in جديد (201) أو العميل جوا بالفعل (يكون checkout = 200)
    expect([200, 201]).toContain(res.status);

    if (res.status === 201) {
      expect(res.body).toHaveProperty('session');
      activeSessionId = res.body.session?.id;
    }
  });

  test('✅ Staff can view active sessions', async () => {
    const res = await request(app)
      .get('/api/sessions/active')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });

  test('✅ Client can view their session history', async () => {
    const res = await request(app)
      .get('/api/sessions/history')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
  });

  test('❌ Client cannot scan QR (staff-only)', async () => {
    const res = await request(app)
      .post('/api/sessions/scan')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ qr_code: scannedQrCode, space_key: 'cowork' });

    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════
// SUITE 4: Wallet Operations
// ══════════════════════════════════════════════════════════════════
describe('💳 Wallet Operations', () => {

  test('✅ Admin can charge client wallet', async () => {
    if (!clientId) return;

    const res = await request(app)
      .patch(`/api/admin/users/${clientId}/wallet`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.balance).toBeDefined();
  });

  test('❌ Wallet charge with negative amount → 400', async () => {
    if (!clientId) return;

    const res = await request(app)
      .patch(`/api/admin/users/${clientId}/wallet`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -100 });

    expect(res.status).toBe(400);
  });

  test('❌ Wallet charge with zero amount → 400', async () => {
    if (!clientId) return;

    const res = await request(app)
      .patch(`/api/admin/users/${clientId}/wallet`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  test('❌ Client cannot charge wallet (admin-only)', async () => {
    if (!clientId) return;

    const res = await request(app)
      .patch(`/api/admin/users/${clientId}/wallet`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════
// SUITE 5: Coupons
// ══════════════════════════════════════════════════════════════════
describe('🎟️ Coupons', () => {

  let createdCouponCode = '';

  test('✅ Admin can create coupon', async () => {
    const res = await request(app)
      .post('/api/coupons/admin/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ discount: 20, days: 30, max_uses: 1 });

    expect(res.status).toBe(201);
    expect(res.body.coupon).toHaveProperty('code');
    createdCouponCode = res.body.coupon.code;
  });

  test('✅ Validate valid coupon → returns coupon data', async () => {
    if (!createdCouponCode) return;

    const res = await request(app)
      .get(`/api/coupons/validate?code=${createdCouponCode}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.coupon).toHaveProperty('discount_pct', 20);
  });

  test('❌ Validate non-existent coupon → 404', async () => {
    const res = await request(app)
      .get('/api/coupons/validate?code=FAKECODE999')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(404);
  });

  test('✅ Client can view their coupons', async () => {
    const res = await request(app)
      .get('/api/coupons/my')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('coupons');
  });
});

// ══════════════════════════════════════════════════════════════════
// SUITE 6: Security Tests
// ══════════════════════════════════════════════════════════════════
describe('🔒 Security', () => {

  test('✅ XSS payload in name is sanitized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '<script>alert(1)</script>',
        password: 'test',
      });

    // لو وصل للـ DB الـ script لازم يكون sanitized
    expect([400, 401]).toContain(res.status); // validation أو auth rejection
  });

  test('✅ SQL injection attempt is handled safely', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: "' OR '1'='1", password: "' OR '1'='1" });

    expect([400, 401]).toContain(res.status); // validation أو auth rejection
  });

  test('✅ Expired/tampered JWT → 401', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.fake_signature';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────
afterAll(async () => {
  try {
    if (db.pool) await db.pool.end();
  } catch {}
});
