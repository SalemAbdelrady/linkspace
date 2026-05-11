import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── صفحة سياسة الخصوصية ──────────────────────────────────────────────
function PrivacyModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          padding: 28,
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* رأس */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>🔒 سياسة الخصوصية</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Link Space — آخر تحديث: مايو 2026</div>
          </div>
          <button onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {[
          {
            title: '1. البيانات التي نجمعها',
            body: 'نجمع الاسم الكامل، رقم الموبايل، البريد الإلكتروني، وبيانات الجلسات والفواتير داخل المكان. لا نجمع أي بيانات خارج نطاق الخدمة.',
          },
          {
            title: '2. كيف نستخدم بياناتك',
            body: 'تُستخدم بياناتك حصرياً لإدارة حسابك، معالجة الفواتير، إرسال إشعارات الخدمة، واستعادة كلمة السر عند الحاجة.',
          },
          {
            title: '3. حماية البيانات',
            body: 'كلمات السر مشفّرة بخوارزمية bcrypt. الاتصالات محمية بـ HTTPS. لا يمكن لأي موظف الاطلاع على كلمة سرك.',
          },
          {
            title: '4. مشاركة البيانات مع أطراف ثالثة',
            body: 'لا نبيع ولا نشارك بياناتك مع أي طرف ثالث. نستخدم Neon (قاعدة بيانات) وCloudinary (الصور) وResend (البريد) — وجميعها ملتزمة بمعايير GDPR.',
          },
          {
            title: '5. حقوقك',
            body: 'يحق لك طلب حذف حسابك وبياناتك كاملةً في أي وقت عن طريق التواصل مع الإدارة. يمكنك تعديل بياناتك الشخصية من صفحة الإعدادات.',
          },
          {
            title: '6. ملفات تعريف الارتباط (Cookies)',
            body: 'نستخدم التخزين المحلي (localStorage) فقط لحفظ جلسة الدخول. لا نستخدم cookies للتتبع أو الإعلانات.',
          },
          {
            title: '7. التواصل',
            body: 'لأي استفسار بشأن بياناتك أو هذه السياسة، تواصل مع إدارة Link Space مباشرةً.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{body}</div>
          </div>
        ))}

        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8 }}
        >
          فهمت ✅
        </button>
      </div>
    </div>
  );
}

// ── LoginPage ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [loading,      setLoading]      = useState(false);
  const [showPrivacy,  setShowPrivacy]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // ── التحقق من صحة المدخلات ──
  function validate() {
    if (mode === 'register') {
      if (!form.firstName.trim() || form.firstName.trim().length < 2)
        return 'الاسم الأول يجب أن يكون حرفين على الأقل';
      if (!form.lastName.trim() || form.lastName.trim().length < 2)
        return 'اسم العائلة يجب أن يكون حرفين على الأقل';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return 'أدخل بريداً إلكترونياً صحيحاً';
      if (form.password.length < 6)
        return 'كلمة السر 6 أحرف على الأقل';
      if (form.password !== form.confirmPassword)
        return 'كلمتا السر غير متطابقتين';
      if (!form.agreeTerms)
        return 'يجب الموافقة على سياسة الخصوصية للمتابعة';
    }
    if (!form.phone.match(/^01[0125][0-9]{8}$/))
      return 'رقم الموبايل غير صحيح (01xxxxxxxxx)';
    if (!form.password)
      return 'كلمة السر مطلوبة';
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.phone, form.password);
      } else {
        const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
        user = await register(fullName, form.phone, form.password, form.email.trim());
      }
      if (user.role === 'admin' || user.role === 'staff') navigate('/admin');
      else navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'حدث خطأ، حاول مرة أخرى';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'var(--font)',
  };

  const labelStyle = {
    fontSize: 12,
    color: 'var(--muted)',
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
  };

  const fieldWrap = { marginBottom: 14 };

  return (
    <>
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg)',
      }}>

        {/* ── Logo ── */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            fontSize: 36, fontWeight: 900,
            color: 'var(--accent)',
            letterSpacing: -1.5,
            lineHeight: 1,
          }}>
            Link Space
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, letterSpacing: 0.3 }}>
            نظام إدارة مساحة العمل المشتركة
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          borderRadius: 20,
          padding: 28,
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 24,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, padding: 4,
          }}>
            {[['login', 'تسجيل الدخول'], ['register', 'حساب جديد']].map(([m, label]) => (
              <button key={m}
                onClick={() => { setMode(m); setForm({ firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '', agreeTerms: false }); }}
                style={{
                  flex: 1, padding: '9px 0',
                  borderRadius: 9,
                  border: 'none',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#000' : 'var(--muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>

            {/* ── حقول التسجيل ── */}
            {mode === 'register' && (
              <>
                {/* الاسم الأول + اسم العائلة */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>
                      الاسم الأول <span style={{ color: '#ff4757' }}>*</span>
                    </label>
                    <input
                      style={inputStyle}
                      value={form.firstName}
                      onChange={set('firstName')}
                      placeholder="أحمد"
                      required
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      اسم العائلة <span style={{ color: '#ff4757' }}>*</span>
                    </label>
                    <input
                      style={inputStyle}
                      value={form.lastName}
                      onChange={set('lastName')}
                      placeholder="محمد"
                      required
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                {/* البريد الإلكتروني */}
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    البريد الإلكتروني <span style={{ color: '#ff4757' }}>*</span>
                  </label>
                  <input
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="example@email.com"
                    required
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                    📌 مطلوب لاستعادة كلمة السر لاحقاً
                  </div>
                </div>
              </>
            )}

            {/* رقم الموبايل */}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                رقم الموبايل <span style={{ color: '#ff4757' }}>*</span>
              </label>
              <input
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
                value={form.phone}
                onChange={set('phone')}
                placeholder="01xxxxxxxxx"
                type="tel"
                required
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* كلمة السر */}
            <div style={fieldWrap}>
              <label style={labelStyle}>
                كلمة السر <span style={{ color: '#ff4757' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle, paddingLeft: 44 }}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none',
                    color: 'var(--muted)', cursor: 'pointer', fontSize: 15,
                  }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {mode === 'register' && form.password && form.password.length < 6 && (
                <div style={{ fontSize: 10, color: '#ff4757', marginTop: 4 }}>⚠️ 6 أحرف على الأقل</div>
              )}
            </div>

            {/* تأكيد كلمة السر */}
            {mode === 'register' && (
              <div style={fieldWrap}>
                <label style={labelStyle}>
                  تأكيد كلمة السر <span style={{ color: '#ff4757' }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div style={{ fontSize: 10, color: '#ff4757', marginTop: 4 }}>⚠️ كلمتا السر غير متطابقتين</div>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6 && (
                  <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 4 }}>✅ كلمة السر متطابقة</div>
                )}
              </div>
            )}

            {/* الموافقة على سياسة الخصوصية */}
            {mode === 'register' && (
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginBottom: 18, cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={set('agreeTerms')}
                  style={{ marginTop: 2, accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                  أوافق على{' '}
                  <button type="button"
                    onClick={() => setShowPrivacy(true)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--accent)', fontSize: 12,
                      cursor: 'pointer', textDecoration: 'underline',
                      padding: 0,
                    }}>
                    سياسة الخصوصية وشروط الاستخدام
                  </button>
                  {' '}الخاصة بـ Link Space
                </span>
              </label>
            )}

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading || (mode === 'register' && !form.agreeTerms)}
              style={{
                width: '100%', padding: '13px',
                borderRadius: 12, border: 'none',
                background: loading || (mode === 'register' && !form.agreeTerms)
                  ? 'rgba(0,212,170,0.4)' : 'var(--accent)',
                color: '#000', fontSize: 14, fontWeight: 800,
                cursor: loading || (mode === 'register' && !form.agreeTerms) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: 0.3,
              }}
            >
              {loading ? '⏳ جارٍ المعالجة...' : mode === 'login' ? '🔐 تسجيل الدخول' : '🚀 إنشاء الحساب'}
            </button>

          </form>

          {/* نسيت كلمة السر */}
          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--accent)', fontSize: 13,
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                نسيت كلمة السر؟
              </button>
            </div>
          )}

          {/* divider + Privacy link for login mode */}
          {mode === 'login' && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--muted)', fontSize: 11,
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                🔒 سياسة الخصوصية
              </button>
            </div>
          )}
        </div>

        {/* ── Copyright ── */}
        <div style={{
          marginTop: 28,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            © {new Date().getFullYear()} <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Link Space</span>
            {' — '}جميع الحقوق محفوظة
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            مساحة العمل المشتركة · نظام الإدارة الرقمي
          </div>
        </div>

      </div>
    </>
  );
}
