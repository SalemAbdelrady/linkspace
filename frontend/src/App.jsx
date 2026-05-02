import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/ClientDashboard';
import ScannerPage from './pages/ScannerPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import SubscriptionsPage from './pages/SubscriptionsPage';
import InvoicePage from './pages/InvoicePage';
import SettingsPage from './pages/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import './index.css';
import api from './utils/api';

export const settingsAPI = {
  update         : (data)              => api.patch('/auth/settings', data),
  changePassword : (data)              => api.patch('/auth/change-password', data),
  forgotPassword : (email)             => api.post('/auth/forgot-password', { email }),
  resetPassword  : (email, otp, pass) => api.post('/auth/reset-password', { email, otp, new_password: pass }),
};

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginBottom: 12 }}>Link Space</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>جارٍ التحميل...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // redirect بعد اللوجين حسب الـ role
  function HomeRedirect() {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'staff') return <Navigate to="/staff" replace />;
    return <ClientDashboard />;
  }

  return (
    <Routes>
      {/* لو مسجّل دخوله يروح الـ home */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* الصفحة الرئيسية — redirect حسب الـ role */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomeRedirect />
        </ProtectedRoute>
      } />

      {/* Admin فقط */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Staff فقط */}
      <Route path="/staff" element={
        <ProtectedRoute roles={['staff']}>
          <StaffDashboard />
        </ProtectedRoute>
      } />

      {/* Staff + Admin */}
      <Route path="/scanner" element={
        <ProtectedRoute roles={['staff', 'admin']}>
          <ScannerPage />
        </ProtectedRoute>
      } />
      <Route path="/invoice" element={
        <ProtectedRoute roles={['staff', 'admin']}>
          <InvoicePage />
        </ProtectedRoute>
      } />

      {/* Admin فقط */}
      <Route path="/subscriptions" element={
        <ProtectedRoute roles={['admin']}>
          <SubscriptionsPage />
        </ProtectedRoute>
      } />

      {/* الإعدادات — لكل المسجّلين */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* أي مسار تاني */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e8f4f8',
              border: '1px solid rgba(0,212,170,0.3)',
              fontFamily: 'Cairo, sans-serif',
              fontSize: 14,
              direction: 'rtl',
            },
            success: { iconTheme: { primary: '#2ed573', secondary: '#000' } },
            error:   { iconTheme: { primary: '#ff4757', secondary: '#000' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
