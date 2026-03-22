import React, { useState, useEffect } from 'react';
import { adminAPI, sessionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [prices, setPrices] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amounts, setAmounts] = useState({});

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  useEffect(() => { loadOverview(); }, []);
  useEffect(() => { if (tab === 'users') { loadUsers(); loadActiveSessions(); } }, [tab, search]);

  async function loadOverview() {
    try {
      const [d, m, p] = await Promise.all([
        adminAPI.dailyReport(today),
        adminAPI.monthlyReport(now.getFullYear(), now.getMonth() + 1),
        adminAPI.getPrices(),
      ]);
      setDaily(d.data);
      setMonthly(m.data);
      setPrices(p.data.prices);
    } catch { toast.error('خطأ في تحميل البيانات'); }
  }

  async function loadUsers() {
    try {
      const { data } = await adminAPI.users(search);
      setUsers(data.users);
    } catch { toast.error('خطأ في تحميل العملاء'); }
  }

  async function loadActiveSessions() {
    try {
      const { data } = await sessionsAPI.active();
      const ids = new Set(data.sessions.map(s => s.user_id));
      setActiveSessionIds(ids);
    } catch { }
  }

  function getAmount(userId, type) {
    return amounts[userId]?.[type] || '';
  }

  function setAmount(userId, type, value) {
    setAmounts(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [type]: value }
    }));
  }

  async function chargeWallet(u) {
    const amount = getAmount(u.id, 'wallet');
    if (!amount || parseFloat(amount) <= 0) return toast.error('أدخل مبلغ صحيح');
    try {
      await adminAPI.chargeWallet(u.id, parseFloat(amount));
      toast.success(`تم شحن ${amount} ج للعميل ${u.name}`);
      setAmount(u.id, 'wallet', '');
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  async function addPoints(u) {
    const points = getAmount(u.id, 'points');
    if (!points || parseInt(points) <= 0) return toast.error('أدخل نقاط صحيحة');
    try {
      await adminAPI.addPoints(u.id, parseInt(points));
      toast.success(`تم إضافة ${points} نقطة`);
      setAmount(u.id, 'points', '');
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  async function updatePrice(id, val) {
    try {
      await adminAPI.updatePrice(id, val);
      setPrices(prev => prev.map(p => p.id === id ? { ...p, price_per_hr: val } : p));
      toast.success('تم تحديث السعر');
    } catch { toast.error('خطأ في التحديث'); }
  }

  const periodName = { morning: 'الصباحية ٦ص-٢م', evening: 'المسائية ٢م-١٠م', night: 'الليلية ١٠م-٦ص' };

  const chartData = monthly?.daily?.slice(-7).map(d => ({
    name: format(new Date(d.day), 'EEE', { locale: ar }),
    revenue: parseFloat(d.revenue),
    visits: parseInt(d.visits),
  })) || [];

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>لوحة التحكم — {user?.name}</div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[['overview', 'نظرة عامة'], ['users', 'العملاء'], ['prices', 'الأسعار']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', borderColor: tab === k ? 'var(--accent)' : 'var(--border)', background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#000' : 'var(--muted)' }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* === OVERVIEW === */}
        {tab === 'overview' && (
          <div className="fade-up">
            <div className="section-title">إحصائيات اليوم</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              {[
                ['الإيرادات', `${parseFloat(daily?.summary?.total_revenue || 0).toFixed(0)} ج`, 'var(--accent)'],
                ['الزيارات', daily?.summary?.visits || 0, 'var(--text)'],
                ['نشط الآن', daily?.active_now || 0, 'var(--success)'],
              ].map(([label, val, color]) => (
                <div key={label} className="card" style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>

            <div className="section-title">إيرادات آخر 7 أيام</div>
            <div className="card" style={{ marginBottom: 12 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 12 }} cursor={{ fill: 'rgba(0,212,170,0.08)' }} formatter={(v) => [`${v} ج`, 'الإيراد']} />
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>لا توجد بيانات بعد</div>
              )}
            </div>

            <div className="section-title">إجماليات الشهر الحالي</div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="stat-row"><span className="stat-label">إجمالي الإيرادات</span><span className="stat-val" style={{ color: 'var(--accent)' }}>{parseFloat(monthly?.totals?.total_revenue || 0).toFixed(2)} ج</span></div>
              <div className="stat-row"><span className="stat-label">عدد الزيارات</span><span className="stat-val">{monthly?.totals?.total_visits || 0}</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">متوسط مدة الزيارة</span><span className="stat-val">{Math.round(monthly?.totals?.avg_duration || 0)} دقيقة</span></div>
            </div>

            {daily?.by_hour?.length > 0 && (
              <>
                <div className="section-title">توزيع الزيارات بالساعة</div>
                <div className="card">
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Array.from({ length: 24 }, (_, h) => {
                      const found = daily.by_hour.find(r => parseInt(r.hour) === h);
                      const count = found ? parseInt(found.visits) : 0;
                      const maxCount = Math.max(...daily.by_hour.map(r => parseInt(r.visits)), 1);
                      const opacity = count ? 0.2 + (count / maxCount) * 0.8 : 0.05;
                      return (
                        <div key={h} title={`${h}:00 — ${count} زيارة`} style={{ width: 28, height: 28, borderRadius: 4, background: `rgba(0,212,170,${opacity})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: count ? 'var(--accent)' : 'var(--muted)' }}>{h}</div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>اللون الأغمق = أكثر زحمة</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* === USERS === */}
        {tab === 'users' && (
          <div className="fade-up">
            <div className="input-wrap">
              <input className="input-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الموبايل..." />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {users.map(u => {
                const isInSession = activeSessionIds.has(u.id);
                return (
                  <div key={u.id} onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                    className="card" style={{ cursor: 'pointer', borderColor: selectedUser?.id === u.id ? 'var(--accent)' : 'var(--border)', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.phone}</div>
                      </div>
                      {/* ✅ دايماً بيظهر نشط أو غير نشط */}
                      <span className={`badge badge-${isInSession ? 'success' : 'danger'}`}>
                        {isInSession ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13 }}>
                      <span>💰 <strong style={{ color: 'var(--accent)' }}>{parseFloat(u.balance).toFixed(2)} ج</strong></span>
                      <span>⭐ <strong style={{ color: 'var(--warning)' }}>{u.points} نقطة</strong></span>
                    </div>

                    {selectedUser?.id === u.id && (
                      <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>شحن رصيد (ج)</div>
                            <input className="input-field" style={{ marginBottom: 6 }} type="number" min="0"
                              value={getAmount(u.id, 'wallet')}
                              onChange={e => setAmount(u.id, 'wallet', e.target.value)}
                              placeholder="0.00" />
                            <button className="btn btn-primary" style={{ width: '100%', padding: '8px' }}
                              onClick={() => chargeWallet(u)}>شحن</button>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>إضافة نقاط</div>
                            <input className="input-field" style={{ marginBottom: 6 }} type="number" min="0"
                              value={getAmount(u.id, 'points')}
                              onChange={e => setAmount(u.id, 'points', e.target.value)}
                              placeholder="0" />
                            <button className="btn btn-outline" style={{ width: '100%', padding: '8px' }}
                              onClick={() => addPoints(u)}>إضافة</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {users.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 13 }}>لا توجد نتائج</div>}
            </div>
          </div>
        )}

        {/* === PRICES === */}
        {tab === 'prices' && (
          <div className="fade-up">
            <div className="section-title">إعدادات الأسعار</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>الحساب بالدقيقة: سعر الساعة ÷ 60 × عدد الدقائق</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {prices.map(p => (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{periodName[p.period_name] || p.period_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>آخر تحديث: {format(new Date(p.updated_at), 'dd MMM yyyy', { locale: ar })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => updatePrice(p.id, Math.max(1, parseFloat(p.price_per_hr) - 1))}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>−</button>
                      <div style={{ textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(p.price_per_hr).toFixed(0)}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>ج/ساعة</div>
                      </div>
                      <button onClick={() => updatePrice(p.id, parseFloat(p.price_per_hr) + 1)}
                        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
                    مثال: ساعة = <strong style={{ color: 'var(--accent)' }}>{parseFloat(p.price_per_hr).toFixed(2)} ج</strong> &nbsp;|&nbsp; 90 دقيقة = <strong style={{ color: 'var(--accent)' }}>{(parseFloat(p.price_per_hr) * 1.5).toFixed(2)} ج</strong> &nbsp;|&nbsp; 30 دقيقة = <strong style={{ color: 'var(--accent)' }}>{(parseFloat(p.price_per_hr) * 0.5).toFixed(2)} ج</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

