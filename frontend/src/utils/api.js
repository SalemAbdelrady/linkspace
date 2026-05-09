import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ls_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
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
  scan:    (qr_code, space_key = 'cowork') => api.post('/sessions/scan', { qr_code, space_key }),
  history: (page = 1)                      => api.get(`/sessions/history?page=${page}`),
  active:  ()                              => api.get('/sessions/active'),
  pay:     (body)                          => api.post('/sessions/pay', body),
};

// Coupons
export const couponsAPI = {
  redeem:       ()     => api.post('/coupons/redeem'),
  myCoupons:    ()     => api.get('/coupons/my'),
  validate:     (body) => api.post('/coupons/validate', body),
  use:          (body) => api.post('/coupons/use', body),
  adminAll:     ()     => api.get('/coupons/admin/all'),
  adminCreate:  (body) => api.post('/coupons/admin/create', body),
  adminRevoke:  (id)   => api.post(`/coupons/admin/revoke/${id}`),
};

// Admin
export const adminAPI = {
  users:         (search = '', page = 1) => api.get(`/admin/users?search=${search}&page=${page}`),
  chargeWallet:  (id, amount, note)      => api.patch(`/admin/users/${id}/wallet`, { amount, note }),
  addPoints:     (id, points)            => api.patch(`/admin/users/${id}/points`, { points }),
  toggleUser:    (id)                    => api.patch(`/admin/users/${id}/toggle`),
  dailyReport:   (date)                  => api.get(`/admin/reports/daily?date=${date}`),
  monthlyReport: (year, month)           => api.get(`/admin/reports/monthly?year=${year}&month=${month}`),
  getPrices:     ()                      => api.get('/admin/prices'),
  updatePrice:   (id, price_per_hr)      => api.put(`/admin/prices/${id}`, { price_per_hr }),
  // ✅ endpoint قائمة الموظفين لفلتر الفواتير
  staff:         ()                      => api.get('/admin/staff'),
};

// Spaces
export const spacesAPI = {
  getAll: ()          => api.get('/spaces'),
  update: (key, data) => api.put(`/spaces/${key}`, data),
};

// Services
export const servicesAPI = {
  getAll: ()          => api.get('/services'),
  create: (data)      => api.post('/services', data),
  update: (id, data)  => api.put(`/services/${id}`, data),
  delete: (id)        => api.delete(`/services/${id}`),
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
  cancel:     (id)         => api.post(`/subscriptions/cancel/${id}`),
  getAll:     ()           => api.get('/subscriptions/all'),
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
  myStats:           (date)            => api.get(`/staff/me/stats?date=${date || ''}`),
  myInvoices:        (params)          => api.get('/staff/me/invoices', { params }),
  staffStats:        (id, year, month) => api.get(`/staff/${id}/stats?year=${year}&month=${month}`),
  compare:           (year, month)     => api.get(`/staff/compare?year=${year}&month=${month}`),
};

export default api;
