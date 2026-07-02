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
import BookingPage from './pages/BookingPage';
import './index.css';
// settingsAPI نُقل إلى utils/api.js — استوردوه من هناك
export { settingsAPI } from './utils/api';
import ReportsPage from './pages/ReportsPage';


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
if (loading) return (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    flexDirection: 'column',
    gap: 0,
  }}>
    <style>{`
      @keyframes ls-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.5; transform: scale(0.96); }
      }
      @keyframes ls-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes ls-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ls-bar {
        0%   { width: 0%; opacity: 1; }
        70%  { width: 85%; opacity: 1; }
        100% { width: 95%; opacity: 0.7; }
      }
      .ls-logo   { animation: ls-pulse 2s ease-in-out infinite; }
      .ls-ring   { animation: ls-spin 1.2s linear infinite; }
      .ls-text   { animation: ls-fade-in 0.6s ease forwards; animation-delay: 0.2s; opacity: 0; }
      .ls-sub    { animation: ls-fade-in 0.6s ease forwards; animation-delay: 0.5s; opacity: 0; }
      .ls-bar    { animation: ls-bar 2.5s cubic-bezier(0.4,0,0.2,1) forwards; }
    `}</style>

    {/* الحلقة الدوارة */}
    <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 28 }}>
      {/* الخلفية الدائرية */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: 'rgba(0,212,170,0.06)',
        border: '1px solid rgba(0,212,170,0.15)',
      }} />
      {/* الحلقة الدوارة */}
      <svg
        className="ls-ring"
        width="72" height="72"
        viewBox="0 0 72 72"
        style={{ position: 'absolute', inset: 0 }}
      >
        <circle
          cx="36" cy="36" r="32"
          fill="none"
          stroke="rgba(0,212,170,0.15)"
          strokeWidth="2"
        />
        <circle
          cx="36" cy="36" r="32"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="50 150"
          strokeDashoffset="0"
        />
      </svg>
      {/* الأيقونة في المنتصف */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="ls-logo" style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'rgba(0,212,170,0.1)',
          border: '1px solid rgba(0,212,170,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: 'var(--accent)',
          fontFamily: 'Cairo, sans-serif',
          letterSpacing: -0.5,
        }}>
          LS
        </div>
      </div>
    </div>

    {/* الاسم */}
    <div className="ls-text" style={{
      fontSize: 26,
      fontWeight: 800,
      color: 'var(--accent)',
      fontFamily: 'Cairo, sans-serif',
      letterSpacing: -0.5,
      marginBottom: 8,
    }}>
      Link Space
    </div>

    {/* النص الصغير */}
    <div className="ls-sub" style={{
      fontSize: 12,
      color: 'var(--muted)',
      fontFamily: 'Cairo, sans-serif',
      marginBottom: 32,
      letterSpacing: 0.3,
    }}>
      نظام إدارة مساحة العمل
    </div>

    {/* شريط التحميل */}
    <div style={{
      width: 180,
      height: 3,
      background: 'rgba(0,212,170,0.1)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div className="ls-bar" style={{
        height: '100%',
        background: 'linear-gradient(90deg, var(--accent), rgba(0,212,170,0.5))',
        borderRadius: 10,
        width: 0,
      }} />
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

      {/* الحجوزات — للكل */}
      <Route path="/bookings" element={
        <ProtectedRoute>
          <BookingPage />
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

      {/* الحجوزات — للكل */}
      <Route path="/bookings" element={
        <ProtectedRoute>
          <BookingPage />
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
