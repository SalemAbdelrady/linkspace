import React, { useState, useEffect } from 'react';
import { adminAPI, sessionsAPI, spacesAPI, servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amounts, setAmounts] = useState({});

  const [priceTab, setPriceTab] = useState('cowork');
  const [spaces, setSpaces] = useState({
    cowork:  { name: 'منطقة العمل المشتركة', first_hour: 30, extra_hour: 30, max_hours: 4 },
    meeting: { name: 'غرفة الاجتماعات', first_hour: 150, extra_hour: 100, max_hours: 12 },
    lessons: { name: 'غرفة الدروس', first_hour: 200, extra_hour: 100, max_hours: 12 },
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [editingService, setEditingService] = useState(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  useEffect(() => { loadOverview(); loadSpaces(); loadServices(); }, []);
  useEffect(() => { if (tab === 'users') { loadUsers(); loadActiveSessions(); } }, [tab, search]);

  async function loadOverview() {
    try {
      const [d, m] = await Promise.all([
        adminAPI.dailyReport(today),
        adminAPI.monthlyReport(now.getFullYear(), now.getMonth() + 1),
      ]);
      setDaily(d.data);
      setMonthly(m.data);
    } catch { toast.error('خطأ في تحميل البيانات'); }
  }

  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      const mapped = {};
      data.spaces.forEach(s => { mapped[s.space_key] = s; });
      setSpaces(prev => ({
        cowork: { ...prev.cowork, ...mapped.cowork },
        meeting: { ...prev.meeting, ...mapped.meeting },
        lessons: { ...prev.lessons, ...mapped.lessons },
      }));
    } catch { }
  }

  async function loadServices() {
    try {
      const { data } = await servicesAPI.getAll();
      setServices(data.services);
    } catch { }
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

  async function saveSpace(key) {
    setLoadingSpaces(true);
    try {
      await spacesAPI.update(key, spaces[key]);
      toast.success('تم حفظ التغييرات ✅');
    } catch { toast.error('خطأ في الحفظ'); }
    finally { setLoadingSpaces(false); }
  }

  async function addService() {
    if (!newService.name || !newService.price) return toast.error('أدخل الاسم والسعر');
    try {
      const { data } = await servicesAPI.create({ name: newService.name, price: parseFloat(newService.price) });
      setServices(prev => [...prev, data.service]);
      setNewService({ name: '', price: '' });
      toast.success('تمت الإضافة ✅');
    } catch { toast.error('خطأ في الإضافة'); }
  }

  async function saveService() {
    try {
      await servicesAPI.update(editingService.id, { name: editingService.name, price: parseFloat(editingService.price) });
      setServices(prev => prev.map(x => x.id === editingService.id ? editingService : x));
      setEditingService(null);
      toast.success('تم التعديل ✅');
    } catch { toast.error('خطأ في التعديل'); }
  }

  async function deleteService(id) {
    try {
      await servicesAPI.delete(id);
      setServices(prev => prev.filter(x => x.id !== id));
      toast.success('تم الحذف');
    } catch { toast.error('خطأ في الحذف'); }
  }

  function getAmount(userId, type) {
    return amounts[userId]?.[type] || '';
  }

  function setAmount(userId, type, value) {
    setAmounts(prev => ({ ...prev, [userId]: { ...prev[userId], [type]: value } }));
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/subscriptions')}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            📋 الاشتراكات
          </button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[['overview', 'نظرة عامة'], ['users', 'العملاء'], ['prices', 'الأسعار']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', borderColor: tab === k ? 'var(--accent)' : 'var(--border)', background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#000' : 'var(--muted)' }}>{label}</button>
        ))}
        <button onClick={() => navigate('/scanner')}
          style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', color: 'var(--muted)', transition: 'all 0.2s' }}>
          📡 Scanner
        </button>
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
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
              {[
                ['cowork',   '🖥️ منطقة العمل'],
                ['meeting',  '🤝 الاجتماعات'],
                ['lessons',  '📚 الدروس'],
                ['services', '☕ الخدمات'],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setPriceTab(k)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', borderColor: priceTab === k ? 'var(--accent)' : 'var(--border)', background: priceTab === k ? 'var(--accent)' : 'transparent', color: priceTab === k ? '#000' : 'var(--muted)' }}>{label}</button>
              ))}
            </div>

            {/* منطقة العمل */}
            {priceTab === 'cowork' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم المساحة</div>
                <input className="input-field" style={{ marginBottom: 14 }}
                  value={spaces.cowork.name}
                  onChange={e => setSpaces(prev => ({ ...prev, cowork: { ...prev.cowork, name: e.target.value } }))} />
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>سعر الساعة (ج)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <button onClick={() => setSpaces(prev => ({ ...prev, cowork: { ...prev.cowork, first_hour: Math.max(1, prev.cowork.first_hour - 5) } }))}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 20, cursor: 'pointer' }}>−</button>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{spaces.cowork.first_hour}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>ج/ساعة</div>
                  </div>
                  <button onClick={() => setSpaces(prev => ({ ...prev, cowork: { ...prev.cowork, first_hour: prev.cowork.first_hour + 5 } }))}
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 20, cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.cowork.first_hour} ج</strong> &nbsp;|&nbsp; 90 دقيقة = <strong style={{ color: 'var(--accent)' }}>{(spaces.cowork.first_hour * 1.5).toFixed(0)} ج</strong> &nbsp;|&nbsp; الحد الأقصى = <strong style={{ color: 'var(--accent)' }}>{spaces.cowork.first_hour * spaces.cowork.max_hours} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces}
                  onClick={() => saveSpace('cowork')}>
                  {loadingSpaces ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}

            {/* غرفة الاجتماعات */}
            {priceTab === 'meeting' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم الغرفة</div>
                <input className="input-field" style={{ marginBottom: 14 }}
                  value={spaces.meeting.name}
                  onChange={e => setSpaces(prev => ({ ...prev, meeting: { ...prev.meeting, name: e.target.value } }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  {[['first_hour', 'سعر أول ساعة'], ['extra_hour', 'كل ساعة إضافية']].map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{label} (ج)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setSpaces(prev => ({ ...prev, meeting: { ...prev.meeting, [key]: Math.max(1, prev.meeting[key] - 10) } }))}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>−</button>
                        <div style={{ textAlign: 'center', minWidth: 50 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{spaces.meeting[key]}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>ج</div>
                        </div>
                        <button onClick={() => setSpaces(prev => ({ ...prev, meeting: { ...prev.meeting, [key]: prev.meeting[key] + 10 } }))}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour} ج</strong> &nbsp;|&nbsp; ساعتين = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour + spaces.meeting.extra_hour} ج</strong> &nbsp;|&nbsp; 3 ساعات = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour + spaces.meeting.extra_hour * 2} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces}
                  onClick={() => saveSpace('meeting')}>
                  {loadingSpaces ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}

            {/* غرفة الدروس */}
            {priceTab === 'lessons' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم الغرفة</div>
                <input className="input-field" style={{ marginBottom: 14 }}
                  value={spaces.lessons.name}
                  onChange={e => setSpaces(prev => ({ ...prev, lessons: { ...prev.lessons, name: e.target.value } }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  {[['first_hour', 'سعر أول ساعة'], ['extra_hour', 'كل ساعة إضافية']].map(([key, label]) => (
                    <div key={key}>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{label} (ج)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setSpaces(prev => ({ ...prev, lessons: { ...prev.lessons, [key]: Math.max(1, prev.lessons[key] - 10) } }))}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>−</button>
                        <div style={{ textAlign: 'center', minWidth: 50 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{spaces.lessons[key]}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>ج</div>
                        </div>
                        <button onClick={() => setSpaces(prev => ({ ...prev, lessons: { ...prev.lessons, [key]: prev.lessons[key] + 10 } }))}
                          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18, cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour} ج</strong> &nbsp;|&nbsp; ساعتين = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour + spaces.lessons.extra_hour} ج</strong> &nbsp;|&nbsp; 3 ساعات = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour + spaces.lessons.extra_hour * 2} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces}
                  onClick={() => saveSpace('lessons')}>
                  {loadingSpaces ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}

            {/* الخدمات */}
            {priceTab === 'services' && (
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>➕ إضافة خدمة أو مشروب</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                    <input className="input-field" placeholder="اسم الخدمة أو المشروب..."
                      value={newService.name}
                      onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} />
                    <input className="input-field" placeholder="السعر" type="number" style={{ width: 90 }}
                      value={newService.price}
                      onChange={e => setNewService(prev => ({ ...prev, price: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={addService}>إضافة</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 13 }}>لا توجد خدمات بعد — أضف أول خدمة!</div>
                  )}
                  {services.map(s => (
                    <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {editingService?.id === s.id ? (
                        <>
                          <input className="input-field" style={{ flex: 1 }} value={editingService.name}
                            onChange={e => setEditingService(prev => ({ ...prev, name: e.target.value }))} />
                          <input className="input-field" type="number" style={{ width: 80 }} value={editingService.price}
                            onChange={e => setEditingService(prev => ({ ...prev, price: e.target.value }))} />
                          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={saveService}>حفظ</button>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent)' }}>{s.price} ج</div>
                          </div>
                          <button onClick={() => setEditingService(s)}
                            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => deleteService(s.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}