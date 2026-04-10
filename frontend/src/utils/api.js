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
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Sessions
export const sessionsAPI = {
  scan: (qr_code) => api.post('/sessions/scan', { qr_code }),
  history: (page = 1) => api.get(`/sessions/history?page=${page}`),
  active: () => api.get('/sessions/active'),
};

// Coupons
export const couponsAPI = {
  redeem: () => api.post('/coupons/redeem'),
  myCoupons: () => api.get('/coupons/my'),
  validate: (body) => api.post('/coupons/validate', body),
  use:      (body) => api.post('/coupons/use', body),
  // في couponsAPI:
adminAll:    ()       => api.get('/coupons/admin/all'),
adminCreate: (body)   => api.post('/coupons/admin/create', body),
adminRevoke: (id)     => api.post(`/coupons/admin/revoke/${id}`),
};

// Admin
export const adminAPI = {
  users: (search = '', page = 1) => api.get(`/admin/users?search=${search}&page=${page}`),
  chargeWallet: (id, amount, note) => api.patch(`/admin/users/${id}/wallet`, { amount, note }),
  addPoints: (id, points) => api.patch(`/admin/users/${id}/points`, { points }),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  dailyReport: (date) => api.get(`/admin/reports/daily?date=${date}`),
  monthlyReport: (year, month) => api.get(`/admin/reports/monthly?year=${year}&month=${month}`),
  getPrices: () => api.get('/admin/prices'),
  updatePrice: (id, price_per_hr) => api.put(`/admin/prices/${id}`, { price_per_hr }),
};

// Spaces
export const spacesAPI = {
  getAll: () => api.get('/spaces'),
  update: (key, data) => api.put(`/spaces/${key}`, data),
};

// Services
export const servicesAPI = {
  getAll: () => api.get('/services'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

// Subscription Plans
export const subscriptionsAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  createPlan: (data) => api.post('/subscriptions/plans', data),
  updatePlan: (id, data) => api.put(`/subscriptions/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/subscriptions/plans/${id}`),
};

// ✅ export default في الآخر
export default api;