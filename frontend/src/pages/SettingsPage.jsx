import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

function isValidName(name) {
  return /^[\u0600-\u06FF\u0750-\u077F a-zA-Z\s'-]{2,100}$/.test(name.trim());
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate  = useNavigate();
  const fileInput = useRef(null);

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [savingInfo,    setSavingInfo]     = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass,  setSavingPass]  = useState(false);
  const [showPass,    setShowPass]    = useState(false);

  // ✅ sync البيانات لما يتحمّل الـ user
  useEffect(() => {
    if (user) {
      setName(user.name   || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // ── رفع الصورة على Cloudinary ──────────────────────────────────────
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من النوع والحجم
    if (!file.type.startsWith('image/')) return toast.error('اختر صورة فقط');
    if (file.size > 5 * 1024 * 1024)     return toast.error('الصورة أكبر من 5MB');

    setUploadingAvatar(true);
    try {
      // رفع الصورة للباكند اللي يرفعها لـ Cloudinary
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // تحديث الـ user في الـ context مباشرة
      setUser((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      toast.success('✅ تم تحديث الصورة');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في رفع الصورة');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  async function saveInfo() {
    if (!name.trim())    return toast.error('الاسم مطلوب');
    if (!isValidName(name)) return toast.error('الاسم يجب أن يحتوي على حروف فقط وليس أرقاماً');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error('البريد الإلكتروني غير صحيح');

    setSavingInfo(true);
    try {
      const { data } = await api.patch('/auth/settings', {
        name:  name.trim(),
        email: email || null,
      });
      setUser(data.user);
      toast.success('✅ تم حفظ البيانات');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الحفظ');
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword() {
    if (!currentPass || !newPass || !confirmPass) return toast.error('أدخل كل الحقول');
    if (newPass !== confirmPass)  return toast.error('كلمة السر الجديدة غير متطابقة');
    if (newPass.length < 6)       return toast.error('كلمة السر 6 أحرف على الأقل');

    setSavingPass(true);
    try {
      await api.patch('/auth/change-password', {
        current_password: currentPass,
        new_password:     newPass,
      });
      toast.success('✅ تم تغيير كلمة السر');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التغيير');
    } finally {
      setSavingPass(false);
    }
  }

  const hasChanges = (
    name.trim()    !== (user?.name  || '').trim() ||
    (email || '')  !== (user?.email || '')
  );

  // الأحرف الأولى للاسم — fallback لو ما في صورة
  const initials = (user?.name || 'U')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '0 0 60px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted)', padding: '6px 12px', borderRadius: 8,
          fontSize: 12, cursor: 'pointer',
        }}>
          ← رجوع
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)' }}>⚙️ إعدادات الحساب</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>تعديل بياناتك الشخصية</div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Avatar + بيانات مختصرة ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
          background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 16,
        }}>
          {/* Avatar مع زر التغيير */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent)',
                }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 22, color: '#fff',
              }}>
                {initials}
              </div>
            )}

            {/* زر رفع الصورة */}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploadingAvatar}
              title="تغيير الصورة"
              style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 22, height: 22, borderRadius: '50%',
                background: uploadingAvatar ? 'var(--muted)' : 'var(--accent)',
                border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                fontSize: 11, color: '#000',
              }}
            >
              {uploadingAvatar ? '⏳' : '📷'}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
            {user?.email && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>✉️ {user.email}</div>
            )}
            <div
              onClick={() => fileInput.current?.click()}
              style={{
                fontSize: 11, color: 'var(--muted)', marginTop: 6,
                cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              {user?.avatar_url ? 'تغيير الصورة' : 'إضافة صورة شخصية'}
            </div>
          </div>
        </div>

        {/* ── بيانات الحساب ── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--accent)' }}>
            👤 البيانات الشخصية
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              الاسم الكامل <span style={{ color: '#ff4757' }}>*</span>
            </label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل..."
            />
            {name && !isValidName(name) && (
              <div style={{ fontSize: 11, color: '#ff4757', marginTop: 4 }}>
                ⚠️ الاسم يجب أن يحتوي على حروف فقط
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              رقم الموبايل
            </label>
            <input
              className="input-field"
              value={user?.phone || ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              🔒 رقم الموبايل لا يمكن تعديله
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              البريد الإلكتروني
              {!user?.email && (
                <span style={{ color: 'var(--warning)', marginRight: 6, fontSize: 11 }}>
                  ⚠️ مطلوب لاستعادة كلمة السر
                </span>
              )}
            </label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          {!user?.email && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,165,2,0.08)',
              border: '1px solid rgba(255,165,2,0.3)',
              borderRadius: 10, fontSize: 12,
              color: 'var(--warning)', marginBottom: 16,
            }}>
              💡 أضف بريدك الإلكتروني لتتمكن من استعادة كلمة السر لاحقاً
            </div>
          )}

          <button
            onClick={saveInfo}
            disabled={savingInfo || !hasChanges}
            className="btn btn-primary"
            style={{ width: '100%', opacity: hasChanges ? 1 : 0.5 }}
          >
            {savingInfo ? '⏳ جارٍ الحفظ...' : '💾 حفظ التغييرات'}
          </button>
        </div>

        {/* ── تغيير كلمة السر ── */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--accent)' }}>
            🔐 تغيير كلمة السر
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              كلمة السر الحالية
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="أدخل كلمة السر الحالية..."
                style={{ paddingLeft: 40 }}
              />
              <button
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)', background: 'transparent',
                  border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              كلمة السر الجديدة
            </label>
            <input
              className="input-field"
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="6 أحرف على الأقل..."
            />
            {newPass && newPass.length < 6 && (
              <div style={{ fontSize: 11, color: '#ff4757', marginTop: 4 }}>⚠️ 6 أحرف على الأقل</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              تأكيد كلمة السر الجديدة
            </label>
            <input
              className="input-field"
              type={showPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="أعد كتابة كلمة السر..."
            />
            {confirmPass && newPass !== confirmPass && (
              <div style={{ fontSize: 11, color: '#ff4757', marginTop: 4 }}>⚠️ كلمة السر غير متطابقة</div>
            )}
            {confirmPass && newPass === confirmPass && confirmPass.length >= 6 && (
              <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>✅ كلمة السر متطابقة</div>
            )}
          </div>

          <button
            onClick={changePassword}
            disabled={
              savingPass || !currentPass || !newPass || !confirmPass ||
              newPass !== confirmPass || newPass.length < 6
            }
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {savingPass ? '⏳ جارٍ التغيير...' : '🔑 تغيير كلمة السر'}
          </button>
        </div>

        {/* ── تسجيل الخروج ── */}
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,71,87,0.3)',
            background: 'rgba(255,71,87,0.06)',
            color: '#ff4757', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          🚪 تسجيل الخروج
        </button>

      </div>
    </div>
  );
}
