import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1); // 1=إيميل, 2=OTP+كلمة سر جديدة
  const [email,      setEmail]      = useState('');
  const [otp,        setOtp]        = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [confirmPass,setConfirmPass]= useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  async function requestOTP() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error('أدخل بريد إلكتروني صحيح');
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('📧 تم إرسال الكود على بريدك');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الإرسال');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!otp || otp.length !== 6) return toast.error('أدخل الكود المكون من 6 أرقام');
    if (!newPass || newPass.length < 6) return toast.error('كلمة السر 6 أحرف على الأقل');
    if (newPass !== confirmPass) return toast.error('كلمة السر غير متطابقة');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPass });
      toast.success('✅ تم تغيير كلمة السر بنجاح');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'الكود غلط أو منتهي');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>استعادة كلمة السر</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            {step === 1 ? 'أدخل بريدك الإلكتروني وسيصلك كود التحقق' : `أدخل الكود الذي أُرسل إلى ${email}`}
          </div>
        </div>

        <div className="card">

          {/* Step 1: الإيميل */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  البريد الإلكتروني
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && requestOTP()}
                  placeholder="example@email.com"
                  dir="ltr"
                  autoFocus
                />
              </div>
              <button
                onClick={requestOTP}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 12 }}>
                {loading ? '⏳ جارٍ الإرسال...' : '📧 إرسال كود التحقق'}
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
                ← رجوع لتسجيل الدخول
              </button>
            </div>
          )}

          {/* Step 2: OTP + كلمة السر */}
          {step === 2 && (
            <div>
              {/* إشعار */}
              <div style={{ padding: '10px 14px', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 10, fontSize: 12, color: 'var(--accent)', marginBottom: 16, textAlign: 'center' }}>
                📧 تم إرسال الكود إلى <strong>{email}</strong>
              </div>

              {/* OTP Input */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  كود التحقق (6 أرقام)
                </label>
                <input
                  className="input-field"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  dir="ltr"
                  maxLength={6}
                  style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  كلمة السر الجديدة
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="6 أحرف على الأقل..."
                    style={{ paddingLeft: 40 }}
                  />
                  <button onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  تأكيد كلمة السر
                </label>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="أعد كتابة كلمة السر..."
                />
                {confirmPass && newPass !== confirmPass && (
                  <div style={{ fontSize: 11, color: '#ff4757', marginTop: 4 }}>⚠️ كلمة السر غير متطابقة</div>
                )}
                {confirmPass && newPass === confirmPass && confirmPass.length >= 6 && (
                  <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>✅ متطابقة</div>
                )}
              </div>

              <button
                onClick={resetPassword}
                disabled={loading || otp.length !== 6 || newPass.length < 6 || newPass !== confirmPass}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 12 }}>
                {loading ? '⏳ جارٍ التغيير...' : '✅ تغيير كلمة السر'}
              </button>

              <button
                onClick={() => setStep(1)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
                ← تغيير البريد الإلكتروني
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
