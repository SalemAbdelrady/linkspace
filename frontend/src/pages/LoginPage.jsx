import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.phone, form.password);
      } else {
        user = await register(form.name, form.phone, form.password);
      }
      if (user.role === 'admin' || user.role === 'staff') navigate('/admin');
      else navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || 'حدث خطأ، حاول مرة أخرى';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1 }}>Link Space</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>نظام إدارة مساحة العمل المشتركة</div>
      </div>

      <div className="card fade-up" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} className="btn"
              style={{ flex: 1, background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#000' : 'var(--muted)', border: '1px solid var(--border)' }}>
              {m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="input-wrap">
              <label className="input-label">الاسم الكامل</label>
              <input className="input-field" value={form.name} onChange={set('name')} placeholder="أحمد محمد" required />
            </div>
          )}
          <div className="input-wrap">
            <label className="input-label">رقم الموبايل</label>
            <input className="input-field" value={form.phone} onChange={set('phone')} placeholder="01xxxxxxxxx" type="tel" required />
          </div>
          <div className="input-wrap">
            <label className="input-label">كلمة السر</label>
            <input className="input-field" value={form.password} onChange={set('password')} placeholder="••••••••" type="password" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Demo: 01012345678 / client123
      </div>
    </div>
  );
}
