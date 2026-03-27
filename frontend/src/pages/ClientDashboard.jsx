import React, { useEffect, useState } from 'react';
import { sessionsAPI, couponsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function ProgressBar({ value, max }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 10, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function LiveTimer({ checkIn, pricePerHr }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(checkIn);
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  
  // ✅ الحد الأقصى 4 ساعات
  const MAX_SECONDS = 4 * 3600;
  const billableSeconds = Math.min(elapsed, MAX_SECONDS);
  const cost = ((billableSeconds / 3600) * pricePerHr).toFixed(2);
  
  const fmt = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');

  return (
    <div style={{ background: 'rgba(46,213,115,0.07)', border: '1px solid rgba(46,213,115,0.3)', borderRadius: 'var(--radius)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="pulse-dot" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>جلسة نشطة</span>
      </div>
      <div className="stat-row"><span className="stat-label">المدة</span><span className="stat-val" style={{ fontFamily: 'var(--mono)' }}>{fmt}</span></div>
      <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">التكلفة</span><span className="stat-val" style={{ color: 'var(--warning)' }}>{cost} ج</span></div>
    </div>
  );
}

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [histRes, couponRes] = await Promise.all([
        sessionsAPI.history(),
        couponsAPI.myCoupons(),
      ]);
      const allSessions = histRes.data.sessions;
      const active = allSessions.find(s => s.status === 'active');
      setActiveSession(active || null);
      setSessions(allSessions.filter(s => s.status !== 'active'));
      setCoupons(couponRes.data.coupons);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoadingSessions(false);
    }
  }

  async function redeemPoints() {
    try {
      await couponsAPI.redeem();
      toast.success('تم إنشاء الكوبون بنجاح! 🎫');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الاستبدال');
    }
  }

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('');

  return (
    <div className="page-wrap" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      {/* Profile */}
      <div className="card fade-up" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="card"><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>الرصيد</div><div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(user?.balance || 0).toFixed(2)} ج</div></div>
        <div className="card"><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>النقاط</div><div style={{ fontSize: 26, fontWeight: 700, color: 'var(--warning)' }}>{user?.points || 0}</div></div>
      </div>

      {/* Points Progress */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>نقاط نحو الكوبون</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{user?.points || 0} / 100</span>
        </div>
        <ProgressBar value={user?.points || 0} max={100} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          {user?.points >= 100 ? '🎉 لديك نقاط كافية! استبدلها الآن' : `${100 - (user?.points || 0)} نقطة متبقية للحصول على خصم 20%`}
        </div>
      </div>

      {/* QR Code */}
<div className="section-title">كود الدخول</div>
<div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
  {user?.qr_image ? (
    <>
      <div style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 12, border: '3px solid var(--accent)' }}>
        <img src={user.qr_image} alt="QR Code" style={{ width: 160, height: 160, display: 'block' }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, fontFamily: 'var(--mono)', letterSpacing: 2 }}>
        {user.qr_code}
      </div>
    </>
  ) : (
    <div style={{ width: 160, height: 160, margin: '0 auto', background: 'rgba(0,212,170,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      جارٍ التحميل...
    </div>
  )}
  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>اعرض هذا الكود عند الدخول والخروج</div>
</div>

      {/* Active Session */}
      {activeSession && (
        <>
          <div className="section-title">الجلسة الحالية</div>
          <div style={{ marginBottom: 12 }}>
            <LiveTimer checkIn={activeSession.check_in} pricePerHr={activeSession.price_per_hr || 15} />
          </div>
        </>
      )}

      {/* History */}
      <div className="section-title">سجل الزيارات</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        {loadingSessions ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>جارٍ التحميل...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>لا توجد زيارات بعد</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>التاريخ</th><th>المدة</th><th>التكلفة</th><th>الحالة</th></tr></thead>
              <tbody>
                {sessions.slice(0, 8).map(s => (
                  <tr key={s.id}>
                    <td>{format(new Date(s.check_in), 'dd MMM', { locale: ar })}</td>
                    <td>{s.duration_min ? `${Math.floor(s.duration_min / 60)}س ${s.duration_min % 60}د` : '—'}</td>
                    <td style={{ color: 'var(--accent)' }}>{s.cost ? `${parseFloat(s.cost).toFixed(2)} ج` : '—'}</td>
                    <td><span className={`badge badge-${s.payment_method === 'wallet' ? 'info' : 'warning'}`}>{s.payment_method === 'wallet' ? 'محفظة' : 'كاش'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coupons */}
      <div className="section-title">الكوبونات</div>
      {coupons.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>لا توجد كوبونات حتى الآن</div>
      )}
      {coupons.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: c.is_used ? 'rgba(255,255,255,0.02)' : 'rgba(0,212,170,0.06)', border: `1px dashed ${c.is_used ? 'var(--border)' : 'var(--accent)'}`, borderRadius: 'var(--radius)', padding: 14, marginBottom: 10, opacity: c.is_used ? 0.5 : 1 }}>
          <span style={{ fontSize: 22 }}>🎫</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 500 }}>{c.code}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>خصم {c.discount_pct}% — ينتهي {format(new Date(c.expires_at), 'dd MMM yyyy', { locale: ar })}</div>
          </div>
          <span className={`badge ${c.is_used ? 'badge-danger' : 'badge-success'}`}>{c.is_used ? 'مستخدم' : 'فعّال'}</span>
        </div>
      ))}
      {(user?.points || 0) >= 100 && (
        <button onClick={redeemPoints} className="btn btn-outline btn-full">استبدال 100 نقطة بكوبون خصم 20%</button>
      )}
    </div>
  );
}
