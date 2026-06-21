import axios from 'axios';

const api = axios.create({
  baseURL       : process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
  timeout       : 10000,
  withCredentials: true,  // يرسل الـ httpOnly cookie مع كل request
});

// ── Request Interceptor — أضف الـ access token ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ls_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor — Refresh Token Rotation ─────────────────────
let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // لو 401 ومش محاولة تجديد أو logout — نحاول نجدد تلقائياً
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers['Authorization'] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.token;
        localStorage.setItem('ls_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        original.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshErr) {
        // refresh فشل — امسح كل حاجة وروح login
        processQueue(new Error('Session expired'), null);
        localStorage.removeItem('ls_token');
        localStorage.removeItem('ls_user');
        // لو مش في صفحة login خليه يروح لها
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // أي 401 تاني — اطرده للـ login
    if (err.response?.status === 401) {
      localStorage.removeItem('ls_token');
      localStorage.removeItem('ls_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

// Sessions
export const sessionsAPI = {
 // scan:    (qr_code, space_key = 'cowork') => api.post('/sessions/scan', { qr_code, space_key }),
  history: (page = 1)                      => api.get(`/sessions/history?page=${page}`),
  active:  ()                              => api.get('/sessions/active'),
  pay:     (body)                          => api.post('/sessions/pay', body),
  scan: (qrCode, spaceKey, guestCount, sessionDurationHours = null) => 
    api.post('/sessions/scan', { 
      qr_code: qrCode, 
      space_key: spaceKey, 
      guest_count: guestCount,
      session_duration_hours: sessionDurationHours, // ✅ جديد
    }),
  
  updateGuestCount: (sessionId, guestCount) =>
    api.patch(`/sessions/${sessionId}/guest-count`, { guest_count: guestCount }),
};

// Coupons
export const couponsAPI = {
  redeem:       ()     => api.post('/coupons/redeem'),
  myCoupons:    ()     => api.get('/coupons/my'),
  validate:     (code) => api.get(`/coupons/validate?code=${encodeURIComponent(code)}`),
  use:          (body) => api.post('/coupons/use', body),
  adminAll:     ()     => api.get('/coupons/admin/all'),
  adminCreate:  (body) => api.post('/coupons/admin/create', body),
  adminRevoke:  (id)   => api.post(`/coupons/admin/revoke/${id}`),
  adminDetails: (id) => api.get(`/coupons/admin/${id}/details`),

};

// Admin
export const adminAPI = {
users: (search = '', page = 1, filters = {}) =>
  api.get('/admin/users', { params: { search, page, ...filters } }),  chargeWallet:  (id, amount, note)      => api.patch(`/admin/users/${id}/wallet`, { amount, note }),
  addPoints:     (id, points)            => api.patch(`/admin/users/${id}/points`, { points }),
  toggleUser:    (id)                    => api.patch(`/admin/users/${id}/toggle`),
  dailyReport:   (date)                  => api.get(`/admin/reports/daily?date=${date}`),
  monthlyReport: (year, month)           => api.get(`/admin/reports/monthly?year=${year}&month=${month}`),
  getPrices:     ()                      => api.get('/admin/prices'),
  updatePrice:   (id, price_per_hr)      => api.put(`/admin/prices/${id}`, { price_per_hr }),
  // ✅ endpoint قائمة الموظفين لفلتر الفواتير
  staff:         ()                      => api.get('/admin/staff'),
  exportUsers: (search = '') => api.get(`/admin/users/export?search=${encodeURIComponent(search)}`),
  overviewStats: () => api.get('/admin/overview-stats'),
  referrals: () => api.get('/admin/referrals'),
};

// Spaces
export const spacesAPI = {
  getAll: () => api.get('/spaces'),
  
  // ✅ الجديد — مع عداد الأماكن المتاحة
  getAllWithAvailability: (date) => 
    api.get(`/spaces/with-availability${date ? `?date=${date}` : ''}`),
  
  update: (key, data) => api.put(`/spaces/${key}`, data),
  
  // ✅ الجديد
  create: (data) => api.post('/spaces', data),
  delete: (key) => api.delete(`/spaces/${key}`),
};

// Services
export const servicesAPI = {
  getAll: ()          => api.get('/services'),
  create: (data)      => api.post('/services', data),
  update: (id, data)  => api.put(`/services/${id}`, data),
  delete: (id)        => api.delete(`/services/${id}`),
  reorder: (items) => api.put('/services/reorder', { items }),
};

// Orders
export const ordersAPI = {
  getBySession: (sessionId) => api.get(`/orders/session/${sessionId}`),
  getMySession: ()          => api.get('/orders/my-session'),
  add:          (body)      => api.post('/orders/add', body),
  clientAdd:    (body)      => api.post('/orders/client-add', body),
  remove:       (id)        => api.delete(`/orders/${id}`),
};

// Subscriptions
export const subscriptionsAPI = {
  getPlans:   ()           => api.get('/subscriptions/plans'),
  createPlan: (data)       => api.post('/subscriptions/plans', data),
  updatePlan: (id, data)   => api.put(`/subscriptions/plans/${id}`, data),
  deletePlan: (id)         => api.delete(`/subscriptions/plans/${id}`),
  subscribe:  (body)       => api.post('/subscriptions/subscribe', body),
  cancel: (id, reason) => api.post(`/subscriptions/cancel/${id}`, { cancel_reason: reason }),  getAll:     ()           => api.get('/subscriptions/all'),
};

// Invoices
export const invoicesAPI = {
  create:            (body)   => api.post('/invoices', body),
  getAll:            (params) => api.get('/invoices', { params }),
  getOne:            (id)     => api.get(`/invoices/${id}`),
  getClientInvoices: (params) => api.get('/invoices/my', { params }),
  exportAll: (params) => api.get('/invoices/export', { params }),
};

// Staff
export const staffAPI = {
  getAll:            ()                => api.get('/staff'),
  create:            (data)            => api.post('/staff', data),
  update:            (id, data)        => api.patch(`/staff/${id}`, data),
  updatePermissions: (id, data)        => api.patch(`/staff/${id}/permissions`, data),
  changePassword:    (id, password)    => api.patch(`/staff/${id}/password`, { password }),
  toggle:            (id)              => api.patch(`/staff/${id}/toggle`),
  delete:            (id)              => api.delete(`/staff/${id}`),           // ✅ مضاف
  myPermissions:     ()                => api.get('/staff/me/permissions'),
  searchClients:     (q)               => api.get(`/staff/clients/search?q=${encodeURIComponent(q)}`),
  myStats:           (date)            => api.get(`/staff/me/stats?date=${date || ''}`),
  myInvoices:        (params)          => api.get('/staff/me/invoices', { params }),
  staffStats:        (id, year, month) => api.get(`/staff/${id}/stats?year=${year}&month=${month}`),
  chargeWallet:      (id, amount)      => api.patch(`/admin/users/${id}/wallet`, { amount }),
  addPoints:         (id, points)      => api.patch(`/admin/users/${id}/points`, { points }),
  dailyReport:       (date)            => api.get(`/admin/reports/daily?date=${date}`),
  monthlyReport:     (year, month)     => api.get(`/admin/reports/monthly?year=${year}&month=${month}`),
  createCoupon:      (data)            => api.post('/coupons/admin/create', data),
  allCoupons:        ()                => api.get('/coupons/admin/all'),
  revokeCoupon:      (id)              => api.post(`/coupons/admin/revoke/${id}`),
  compare:           (year, month)     => api.get(`/staff/compare?year=${year}&month=${month}`),
};

//quickSaleAPI 
export const quickSaleAPI = {
  create: (data) => api.post('/invoices/quick-sale', data),
};

export default api;

// Bookings
export const bookingsAPI = {
  availability : (date, space_key)  => api.get(`/bookings/availability?date=${date}&space_key=${space_key}`),
  create       : (data)             => api.post('/bookings', data),
  my           : ()                 => api.get('/bookings/my'),
  all          : (params)           => api.get('/bookings', { params }),
  today        : ()                 => api.get('/bookings/today'),
  confirm      : (id)               => api.patch(`/bookings/${id}/confirm`),
  cancel       : (id, reason)       => api.patch(`/bookings/${id}/cancel`, { cancel_reason: reason }),
};

// Settings — نُقل من App.jsx لهنا عشان نحافظ على مبدأ فصل المسؤوليات
export const settingsAPI = {
  update         : (data)              => api.patch('/auth/settings', data),
  changePassword : (data)              => api.patch('/auth/change-password', data),
  forgotPassword : (email)             => api.post('/auth/forgot-password', { email }),
  resetPassword  : (email, otp, pass)  => api.post('/auth/reset-password', { email, otp, new_password: pass }),
};

// Notifications
export const notificationsAPI = {
  getAll:      () => api.get('/notifications'),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};