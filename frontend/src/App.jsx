import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ClientDashboard from './pages/ClientDashboard';
import ScannerPage from './pages/ScannerPage';
import AdminDashboard from './pages/AdminDashboard';
import SubscriptionsPage from './pages/SubscriptionsPage';
import InvoicePage from './pages/InvoicePage';
import './index.css';

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
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'admin' || user?.role === 'staff'
            ? <Navigate to="/admin" replace />
            : <ClientDashboard />}
        </ProtectedRoute>
      } />
      <Route path="/scanner" element={
        <ProtectedRoute roles={['staff', 'admin']}>
          <ScannerPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute roles={['admin']}>
          <SubscriptionsPage />
        </ProtectedRoute>
      } />
      <Route path="/invoice" element={
        <ProtectedRoute roles={['staff', 'admin']}>
          <InvoicePage />
        </ProtectedRoute>
      } />
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
            style: { background: '#1a1a2e', color: '#e8f4f8', border: '1px solid rgba(0,212,170,0.3)', fontFamily: 'Cairo, sans-serif', fontSize: 14, direction: 'rtl' },
            success: { iconTheme: { primary: '#2ed573', secondary: '#000' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#000' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
