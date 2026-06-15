/**
 * LogoutConfirmModal.jsx
 * نافذة تأكيد تسجيل الخروج — مشتركة بين كل الـ dashboards
 */

import React from 'react';

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          padding: '32px 24px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* أيقونة */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          border: '2px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          🚪
        </div>

        {/* العنوان */}
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>
          تسجيل الخروج
        </div>

        {/* الوصف */}
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
          هل أنت متأكد من تسجيل الخروج؟
          <br />
          ستحتاج إلى تسجيل الدخول مجدداً للوصول لحسابك.
        </div>

        {/* الأزرار */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🚪 تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
