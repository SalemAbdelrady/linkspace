import React, { useState, useEffect } from 'react';
import { adminAPI, sessionsAPI, spacesAPI, servicesAPI, couponsAPI, invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function NumberInput({ value, onChange, min = 1, step = 1, suffix = '' }) {
  const num = parseFloat(value) || 0;
  function handleChange(e) { onChange(e.target.value); }
  function handleBlur()    { onChange(Math.max(min, parseFloat(value) || min)); }
  function increment()     { onChange(parseFloat((num + step).toFixed(2))); }
  function decrement()     { onChange(parseFloat(Math.max(min, num - step).toFixed(2))); }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={decrement} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>−</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
        <input type="number" value={value} onChange={handleChange} onBlur={handleBlur} min={min} step={step}
          style={{ width: 80, textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', padding: '2px 0', fontFamily: 'var(--mono)' }} />
        {suffix && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{suffix}</span>}
      </div>
      <button onClick={increment} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>+</button>
    </div>
  );
}

// ✅ مودال تفاصيل الفاتورة
function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;
  const services = typeof invoice.services === 'string'
    ? JSON.parse(invoice.services) : invoice.services || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* رأس */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>#{invoice.invoice_number}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {new Date(invoice.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' — '}
              {new Date(invoice.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* العميل */}
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>العميل</div>
          <div style={{ fontWeight: 700 }}>{invoice.client_name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.client_phone}</div>
        </div>

        {/* الجلسة */}
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>تفاصيل الجلسة</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>تكلفة الجلسة</span>
            <span style={{ fontWeight: 600 }}>{parseFloat(invoice.session_cost).toFixed(2)} ج</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            <span>المدة: {invoice.duration_min} د</span>
            <span>سعر الساعة: {invoice.price_per_hr} ج</span>
          </div>
        </div>

        {/* الخدمات */}
        {services.length > 0 && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>خدمات إضافية</div>
            {services.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{s.name} × {s.qty}</span>
                <span>{(s.price * s.qty).toFixed(2)} ج</span>
              </div>
            ))}
          </div>
        )}

        {/* الكوبون */}
        {invoice.coupon_code && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>كوبون خصم</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
              <span>🎫 {invoice.coupon_code} (خصم {invoice.discount_pct}%)</span>
              <span>− {parseFloat(invoice.discount_amount).toFixed(2)} ج</span>
            </div>
          </div>
        )}

        {/* الإجمالي */}
        <div style={{ marginBottom: 12 }}>
          {parseFloat(invoice.services_cost) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
              <span>الخدمات</span><span>{parseFloat(invoice.services_cost).toFixed(2)} ج</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
            <span>الإجمالي</span><span>{parseFloat(invoice.total).toFixed(2)} ج</span>
          </div>
        </div>

        {/* طريقة الدفع + ملاحظة */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge badge-${invoice.payment_method === 'wallet' ? 'info' : 'warning'}`}>
            {invoice.payment_method === 'wallet' ? '💳 محفظة' : '💵 كاش'}
          </span>
          {invoice.note && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.note}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const [daily,   setDaily]   = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [users,            setUsers]            = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState(new Set());
  const [search,           setSearch]           = useState('');
  const [selectedUser,     setSelectedUser]     = useState(null);
  const [amounts,          setAmounts]          = useState({});
  const [priceTab, setPriceTab] = useState('cowork');
  const [spaces, setSpaces] = useState({
    cowork:  { name: 'منطقة العمل المشتركة', first_hour: 30,  extra_hour: 30,  max_hours: 4  },
    meeting: { name: 'غرفة الاجتماعات',      first_hour: 150, extra_hour: 100, max_hours: 12 },
    lessons: { name: 'غرفة الدروس',           first_hour: 200, extra_hour: 100, max_hours: 12 },
  });
  const [services,       setServices]       = useState([]);
  const [newService,     setNewService]     = useState({ name: '', price: '' });
  const [editingService, setEditingService] = useState(null);
  const [loadingSpaces,  setLoadingSpaces]  = useState(false);

  const [allCoupons,         setAllCoupons]         = useState([]);
  const [couponLoading,      setCouponLoading]      = useState(false);
  const [couponFilter,       setCouponFilter]       = useState('all');
  const [newCoupon,          setNewCoupon]          = useState({ code: '', discount: 20, days: 30, targetType: 'global', targetUser: '' });
  const [couponUsers,        setCouponUsers]        = useState([]);
  const [selectedCouponUser, setSelectedCouponUser] = useState(null);

  // ── Invoices ──────────────────────────────────────────────────────
  const [invoices,       setInvoices]       = useState([]);
  const [invoiceTotal,   setInvoiceTotal]   = useState(0);
  const [invoicePage,    setInvoicePage]    = useState(1);
  const [invoiceSearch,  setInvoiceSearch]  = useState('');
  const [invoiceDate,    setInvoiceDate]    = useState('');
  const [selectedInvoice,setSelectedInvoice] = useState(null); // للمودال
  // ──────────────────────────────────────────────────────────────────

  const today = format(new Date(), 'yyyy-MM-dd');
  const now   = new Date();

  useEffect(() => { loadOverview(); loadSpaces(); loadServices(); }, []);
  useEffect(() => { if (tab === 'users')    { loadUsers(); loadActiveSessions(); } }, [tab, search]);
  useEffect(() => { if (tab === 'coupons')  { loadAllCoupons(); } }, [tab]);
  useEffect(() => { if (tab === 'invoices') { loadInvoices(); } }, [tab, invoicePage, invoiceSearch, invoiceDate]);

  async function loadOverview() {
    try {
      const [d, m] = await Promise.all([adminAPI.dailyReport(today), adminAPI.monthlyReport(now.getFullYear(), now.getMonth() + 1)]);
      setDaily(d.data); setMonthly(m.data);
    } catch { toast.error('خطأ في تحميل البيانات'); }
  }
  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      const mapped = {};
      data.spaces.forEach(s => { mapped[s.space_key] = s; });
      setSpaces(prev => ({ cowork: { ...prev.cowork, ...mapped.cowork }, meeting: { ...prev.meeting, ...mapped.meeting }, lessons: { ...prev.lessons, ...mapped.lessons } }));
    } catch { }
  }
  async function loadServices() {
    try { const { data } = await servicesAPI.getAll(); setServices(data.services); } catch { }
  }
  async function loadUsers() {
    try { const { data } = await adminAPI.users(search); setUsers(data.users); } catch { toast.error('خطأ في تحميل العملاء'); }
  }
  async function loadActiveSessions() {
    try { const { data } = await sessionsAPI.active(); setActiveSessionIds(new Set(data.sessions.map(s => s.user_id))); } catch { }
  }
  async function loadAllCoupons() {
    try { const { data } = await couponsAPI.adminAll(); setAllCoupons(data.coupons); } catch { }
  }

  // ✅ جلب الفواتير مع البحث والتاريخ والصفحات
  async function loadInvoices() {
    try {
      const { data } = await invoicesAPI.getAll({ page: invoicePage, search: invoiceSearch, date: invoiceDate });
      setInvoices(data.invoices);
      setInvoiceTotal(data.total);
    } catch { toast.error('خطأ في تحميل الفواتير'); }
  }

  async function saveSpace(key) {
    setLoadingSpaces(true);
    try { await spacesAPI.update(key, spaces[key]); toast.success('تم حفظ التغييرات ✅'); }
    catch { toast.error('خطأ في الحفظ'); } finally { setLoadingSpaces(false); }
  }
  async function addService() {
    if (!newService.name || !newService.price) return toast.error('أدخل الاسم والسعر');
    try {
      const { data } = await servicesAPI.create({ name: newService.name, price: parseFloat(newService.price) });
      setServices(prev => [...prev, data.service]); setNewService({ name: '', price: '' }); toast.success('تمت الإضافة ✅');
    } catch { toast.error('خطأ في الإضافة'); }
  }
  async function saveService() {
    try {
      await servicesAPI.update(editingService.id, { name: editingService.name, price: parseFloat(editingService.price) });
      setServices(prev => prev.map(x => x.id === editingService.id ? editingService : x)); setEditingService(null); toast.success('تم التعديل ✅');
    } catch { toast.error('خطأ في التعديل'); }
  }
  async function deleteService(id) {
    try { await servicesAPI.delete(id); setServices(prev => prev.filter(x => x.id !== id)); toast.success('تم الحذف'); }
    catch { toast.error('خطأ في الحذف'); }
  }

  function getAmount(userId, type)        { return amounts[userId]?.[type] ?? ''; }
  function setAmount(userId, type, value) { setAmounts(prev => ({ ...prev, [userId]: { ...prev[userId], [type]: value } })); }

  async function chargeWallet(u) {
    const amount = getAmount(u.id, 'wallet');
    if (!amount || parseFloat(amount) <= 0) return toast.error('أدخل مبلغ صحيح');
    try { await adminAPI.chargeWallet(u.id, parseFloat(amount)); toast.success(`تم شحن ${amount} ج`); setAmount(u.id, 'wallet', ''); loadUsers(); }
    catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }
  async function addPoints(u) {
    const points = getAmount(u.id, 'points');
    if (!points || parseInt(points) <= 0) return toast.error('أدخل نقاط صحيحة');
    try { await adminAPI.addPoints(u.id, parseInt(points)); toast.success(`تم إضافة ${points} نقطة`); setAmount(u.id, 'points', ''); loadUsers(); }
    catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  async function searchCouponUsers(q) {
    if (!q || q.length < 2) { setCouponUsers([]); return; }
    try { const { data } = await adminAPI.users(q); setCouponUsers(data.users.slice(0, 5)); } catch { }
  }
  async function createCoupon() {
    if (newCoupon.targetType === 'user' && !selectedCouponUser) return toast.error('اختر عميلاً أولاً');
    setCouponLoading(true);
    try {
      const { data } = await couponsAPI.adminCreate({ code: newCoupon.code.trim().toUpperCase() || null, discount: parseInt(newCoupon.discount), days: parseInt(newCoupon.days), user_id: newCoupon.targetType === 'user' ? selectedCouponUser.id : null });
      toast.success(`✅ تم إنشاء الكوبون: ${data.coupon.code}`);
      setNewCoupon({ code: '', discount: 20, days: 30, targetType: 'global', targetUser: '' }); setSelectedCouponUser(null); setCouponUsers([]); loadAllCoupons();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ في الإنشاء'); }
    finally { setCouponLoading(false); }
  }
  async function revokeCoupon(id) {
    try { await couponsAPI.adminRevoke(id); toast.success('تم إلغاء الكوبون'); loadAllCoupons(); }
    catch { toast.error('خطأ في الإلغاء'); }
  }

  const chartData = monthly?.daily?.slice(-7).map(d => ({ name: format(new Date(d.day), 'EEE', { locale: ar }), revenue: parseFloat(d.revenue), visits: parseInt(d.visits) })) || [];
  const filteredCoupons = allCoupons.filter(c => {
    if (couponFilter === 'active') return !c.is_used && new Date(c.expires_at) > new Date();
    if (couponFilter === 'used')   return c.is_used;
    return true;
  });
  const totalInvoicePages = Math.ceil(invoiceTotal / 20);

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>لوحة التحكم — {user?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/subscriptions')} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>📋 الاشتراكات</button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[['overview','نظرة عامة'], ['users','العملاء'], ['prices','الأسعار'], ['coupons','🎫 الكوبونات'], ['invoices','🧾 الفواتير']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', borderColor: tab === k ? 'var(--accent)' : 'var(--border)', background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#000' : 'var(--muted)' }}>{label}</button>
        ))}
        <button onClick={() => navigate('/scanner')} style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', color: 'var(--muted)' }}>📡 Scanner</button>
      </div>

      <div style={{ padding: 16 }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div className="fade-up">
            <div className="section-title">إحصائيات اليوم</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
              {[['الإيرادات',`${parseFloat(daily?.summary?.total_revenue||0).toFixed(0)} ج`,'var(--accent)'],['الزيارات',daily?.summary?.visits||0,'var(--text)'],['نشط الآن',daily?.active_now||0,'var(--success)']].map(([label,val,color]) => (
                <div key={label} className="card" style={{ padding: 12 }}><div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div></div>
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
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[4,4,0,0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>لا توجد بيانات بعد</div>}
            </div>
            <div className="section-title">إجماليات الشهر الحالي</div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="stat-row"><span className="stat-label">إجمالي الإيرادات</span><span className="stat-val" style={{ color: 'var(--accent)' }}>{parseFloat(monthly?.totals?.total_revenue||0).toFixed(2)} ج</span></div>
              <div className="stat-row"><span className="stat-label">عدد الزيارات</span><span className="stat-val">{monthly?.totals?.total_visits||0}</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">متوسط مدة الزيارة</span><span className="stat-val">{Math.round(monthly?.totals?.avg_duration||0)} دقيقة</span></div>
            </div>
            {daily?.by_hour?.length > 0 && (
              <><div className="section-title">توزيع الزيارات بالساعة</div>
              <div className="card">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {Array.from({ length: 24 }, (_, h) => {
                    const found = daily.by_hour.find(r => parseInt(r.hour) === h);
                    const count = found ? parseInt(found.visits) : 0;
                    const maxCount = Math.max(...daily.by_hour.map(r => parseInt(r.visits)), 1);
                    const opacity = count ? 0.2 + (count / maxCount) * 0.8 : 0.05;
                    return <div key={h} title={`${h}:00 — ${count} زيارة`} style={{ width: 28, height: 28, borderRadius: 4, background: `rgba(0,212,170,${opacity})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: count ? 'var(--accent)' : 'var(--muted)' }}>{h}</div>;
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>اللون الأغمق = أكثر زحمة</div>
              </div></>
            )}
          </div>
        )}

        {/* ══ USERS ══ */}
        {tab === 'users' && (
          <div className="fade-up">
            <div className="input-wrap"><input className="input-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الموبايل..." /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {users.map(u => {
                const isInSession = activeSessionIds.has(u.id);
                return (
                  <div key={u.id} onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)} className="card" style={{ cursor: 'pointer', borderColor: selectedUser?.id === u.id ? 'var(--accent)' : 'var(--border)', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div><div style={{ fontWeight: 700 }}>{u.name}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.phone}</div></div>
                      <span className={`badge badge-${isInSession ? 'success' : 'danger'}`}>{isInSession ? 'نشط' : 'غير نشط'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13 }}>
                      <span>💰 <strong style={{ color: 'var(--accent)' }}>{parseFloat(u.balance).toFixed(2)} ج</strong></span>
                      <span>⭐ <strong style={{ color: 'var(--warning)' }}>{u.points} نقطة</strong></span>
                    </div>
                    {selectedUser?.id === u.id && (
                      <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>شحن رصيد (ج)</div>
                            <NumberInput value={getAmount(u.id,'wallet')} onChange={val => setAmount(u.id,'wallet',val)} min={1} step={1} suffix="ج" />
                            <button className="btn btn-primary" style={{ width: '100%', padding: '8px', marginTop: 8 }} onClick={() => chargeWallet(u)}>شحن</button>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>إضافة نقاط</div>
                            <NumberInput value={getAmount(u.id,'points')} onChange={val => setAmount(u.id,'points',val)} min={1} step={1} suffix="نقطة" />
                            <button className="btn btn-outline" style={{ width: '100%', padding: '8px', marginTop: 8 }} onClick={() => addPoints(u)}>إضافة</button>
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

        {/* ══ PRICES ══ */}
        {tab === 'prices' && (
          <div className="fade-up">
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
              {[['cowork','🖥️ منطقة العمل'],['meeting','🤝 الاجتماعات'],['lessons','📚 الدروس'],['services','☕ الخدمات']].map(([k,label]) => (
                <button key={k} onClick={() => setPriceTab(k)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', borderColor: priceTab===k?'var(--accent)':'var(--border)', background: priceTab===k?'var(--accent)':'transparent', color: priceTab===k?'#000':'var(--muted)' }}>{label}</button>
              ))}
            </div>
            {priceTab === 'cowork' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم المساحة</div>
                <input className="input-field" style={{ marginBottom: 14 }} value={spaces.cowork.name} onChange={e => setSpaces(prev => ({ ...prev, cowork: { ...prev.cowork, name: e.target.value } }))} />
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>سعر الساعة (ج)</div>
                <NumberInput value={spaces.cowork.first_hour} onChange={val => setSpaces(prev => ({ ...prev, cowork: { ...prev.cowork, first_hour: parseFloat(val)||1 } }))} min={1} step={1} suffix="ج/ساعة" />
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', margin: '14px 0 12px' }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.cowork.first_hour} ج</strong> &nbsp;|&nbsp; 90 دقيقة = <strong style={{ color: 'var(--accent)' }}>{spaces.cowork.first_hour*2} ج</strong> &nbsp;|&nbsp; الحد الأقصى = <strong style={{ color: 'var(--accent)' }}>{spaces.cowork.first_hour*spaces.cowork.max_hours} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces} onClick={() => saveSpace('cowork')}>{loadingSpaces?'جارٍ الحفظ...':'حفظ التغييرات'}</button>
              </div>
            )}
            {priceTab === 'meeting' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم الغرفة</div>
                <input className="input-field" style={{ marginBottom: 14 }} value={spaces.meeting.name} onChange={e => setSpaces(prev => ({ ...prev, meeting: { ...prev.meeting, name: e.target.value } }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  {[['first_hour','سعر أول ساعة'],['extra_hour','كل ساعة إضافية']].map(([key,label]) => (
                    <div key={key}><div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{label} (ج)</div><NumberInput value={spaces.meeting[key]} onChange={val => setSpaces(prev => ({ ...prev, meeting: { ...prev.meeting, [key]: parseFloat(val)||1 } }))} min={1} step={1} suffix="ج" /></div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour} ج</strong> &nbsp;|&nbsp; ساعتين = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour+spaces.meeting.extra_hour} ج</strong> &nbsp;|&nbsp; 3 ساعات = <strong style={{ color: 'var(--accent)' }}>{spaces.meeting.first_hour+spaces.meeting.extra_hour*2} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces} onClick={() => saveSpace('meeting')}>{loadingSpaces?'جارٍ الحفظ...':'حفظ التغييرات'}</button>
              </div>
            )}
            {priceTab === 'lessons' && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم الغرفة</div>
                <input className="input-field" style={{ marginBottom: 14 }} value={spaces.lessons.name} onChange={e => setSpaces(prev => ({ ...prev, lessons: { ...prev.lessons, name: e.target.value } }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  {[['first_hour','سعر أول ساعة'],['extra_hour','كل ساعة إضافية']].map(([key,label]) => (
                    <div key={key}><div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{label} (ج)</div><NumberInput value={spaces.lessons[key]} onChange={val => setSpaces(prev => ({ ...prev, lessons: { ...prev.lessons, [key]: parseFloat(val)||1 } }))} min={1} step={1} suffix="ج" /></div>
                  ))}
                </div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  ساعة = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour} ج</strong> &nbsp;|&nbsp; ساعتين = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour+spaces.lessons.extra_hour} ج</strong> &nbsp;|&nbsp; 3 ساعات = <strong style={{ color: 'var(--accent)' }}>{spaces.lessons.first_hour+spaces.lessons.extra_hour*2} ج</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces} onClick={() => saveSpace('lessons')}>{loadingSpaces?'جارٍ الحفظ...':'حفظ التغييرات'}</button>
              </div>
            )}
            {priceTab === 'services' && (
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>➕ إضافة خدمة أو مشروب</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                    <input className="input-field" placeholder="اسم الخدمة أو المشروب..." value={newService.name} onChange={e => setNewService(prev => ({ ...prev, name: e.target.value }))} />
                    <input className="input-field" placeholder="السعر" type="number" style={{ width: 90 }} value={newService.price} onChange={e => setNewService(prev => ({ ...prev, price: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={addService}>إضافة</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 13 }}>لا توجد خدمات بعد — أضف أول خدمة!</div>}
                  {services.map(s => (
                    <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {editingService?.id === s.id ? (
                        <><input className="input-field" style={{ flex: 1 }} value={editingService.name} onChange={e => setEditingService(prev => ({ ...prev, name: e.target.value }))} /><input className="input-field" type="number" style={{ width: 80 }} value={editingService.price} onChange={e => setEditingService(prev => ({ ...prev, price: e.target.value }))} /><button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={saveService}>حفظ</button></>
                      ) : (
                        <><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--accent)' }}>{s.price} ج</div></div><button onClick={() => setEditingService(s)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️</button><button onClick={() => deleteService(s.id)} style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button></>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ COUPONS ══ */}
        {tab === 'coupons' && (
          <div className="fade-up">
            <div className="section-title">إنشاء كوبون جديد</div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>كود الكوبون <span style={{ opacity: 0.6 }}>(اتركه فارغاً للتوليد التلقائي)</span></div>
              <input className="input-field" style={{ marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }} placeholder="مثال: RAMADAN30 — أو اتركه فارغاً" value={newCoupon.code} onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                <div><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>نسبة الخصم %</div><NumberInput value={newCoupon.discount} onChange={val => setNewCoupon(prev => ({ ...prev, discount: val }))} min={1} step={1} suffix="%" /></div>
                <div><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>الصلاحية (أيام)</div><NumberInput value={newCoupon.days} onChange={val => setNewCoupon(prev => ({ ...prev, days: val }))} min={1} step={1} suffix="يوم" /></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>نوع الكوبون</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[['global','🌐 عام (لأي عميل)'],['user','👤 لعميل معين']].map(([type,label]) => (
                  <button key={type} onClick={() => { setNewCoupon(prev => ({ ...prev, targetType: type, targetUser: '' })); setSelectedCouponUser(null); setCouponUsers([]); }}
                    style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: newCoupon.targetType===type?'var(--accent)':'var(--border)', background: newCoupon.targetType===type?'rgba(0,212,170,0.1)':'transparent', color: newCoupon.targetType===type?'var(--accent)':'var(--muted)' }}>{label}</button>
                ))}
              </div>
              {newCoupon.targetType === 'user' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>ابحث عن العميل</div>
                  {selectedCouponUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 10 }}>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{selectedCouponUser.name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedCouponUser.phone}</div></div>
                      <button onClick={() => { setSelectedCouponUser(null); setNewCoupon(prev => ({ ...prev, targetUser: '' })); }} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input className="input-field" placeholder="اسم العميل أو رقم موبايله..." value={newCoupon.targetUser} onChange={e => { setNewCoupon(prev => ({ ...prev, targetUser: e.target.value })); searchCouponUsers(e.target.value); }} />
                      {couponUsers.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 20, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                          {couponUsers.map(u => (
                            <div key={u.id} onClick={() => { setSelectedCouponUser(u); setNewCoupon(prev => ({ ...prev, targetUser: u.name })); setCouponUsers([]); }}
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                              onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,170,0.08)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: '8px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                خصم <strong style={{ color: 'var(--accent)' }}>{newCoupon.discount}%</strong> &nbsp;·&nbsp; صالح <strong style={{ color: 'var(--accent)' }}>{newCoupon.days} يوم</strong> &nbsp;·&nbsp; {newCoupon.targetType==='global'?'لأي عميل':selectedCouponUser?`لـ ${selectedCouponUser.name}`:'حدد عميلاً'}
                {newCoupon.code && <> &nbsp;·&nbsp; كود: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{newCoupon.code}</strong></>}
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={couponLoading||(newCoupon.targetType==='user'&&!selectedCouponUser)} onClick={createCoupon}>{couponLoading?'جارٍ الإنشاء...':'🎫 إنشاء الكوبون'}</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>كل الكوبونات</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all','الكل'],['active','فعال'],['used','مستخدم']].map(([f,label]) => (
                  <button key={f} onClick={() => setCouponFilter(f)} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderColor: couponFilter===f?'var(--accent)':'var(--border)', background: couponFilter===f?'var(--accent)':'transparent', color: couponFilter===f?'#000':'var(--muted)' }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCoupons.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 24, fontSize: 13 }}>لا توجد كوبونات</div>}
              {filteredCoupons.map(c => {
                const expired = new Date(c.expires_at) < new Date();
                const status  = c.is_used?'used':expired?'expired':'active';
                const statusLabel = {active:'✅ فعال',used:'🔒 مستخدم',expired:'⏰ منتهي'}[status];
                const statusColor = {active:'var(--success)',used:'var(--muted)',expired:'#ff4757'}[status];
                return (
                  <div key={c.id} className="card" style={{ opacity: status!=='active'?0.6:1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1 }}>{c.code}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.user_name?`👤 ${c.user_name}`:'🌐 عام'} &nbsp;·&nbsp; ينتهي {format(new Date(c.expires_at),'dd MMM yyyy',{locale:ar})}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{c.discount_pct}%</span>
                        <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                      </div>
                    </div>
                    {status === 'active' && <button onClick={() => revokeCoupon(c.id)} style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>إلغاء الكوبون</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ INVOICES ══ */}
        {tab === 'invoices' && (
          <div className="fade-up">

            {/* بحث + فلتر تاريخ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 14 }}>
              <input className="input-field" placeholder="بحث باسم العميل أو موبايله..."
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setInvoicePage(1); }} />
              <input type="date" className="input-field" style={{ width: 150 }}
                value={invoiceDate}
                onChange={e => { setInvoiceDate(e.target.value); setInvoicePage(1); }} />
            </div>

            {/* عداد النتائج */}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              {invoiceTotal} فاتورة
              {invoiceDate && ` — ${new Date(invoiceDate).toLocaleDateString('ar-EG',{month:'long',day:'numeric'})}`}
            </div>

            {/* قائمة الفواتير */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {invoices.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 32, fontSize: 13 }}>لا توجد فواتير</div>
              )}
              {invoices.map(inv => {
                const services = typeof inv.services === 'string' ? JSON.parse(inv.services) : inv.services || [];
                return (
                  <div key={inv.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>#{inv.invoice_number}</div>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{inv.client_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.client_phone}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(inv.total).toFixed(2)} ج</div>
                        <span className={`badge badge-${inv.payment_method==='wallet'?'info':'warning'}`} style={{ fontSize: 10 }}>
                          {inv.payment_method==='wallet'?'محفظة':'كاش'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                      <span>🕐 {new Date(inv.created_at).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</span>
                      <span>📅 {new Date(inv.created_at).toLocaleDateString('ar-EG',{month:'short',day:'numeric'})}</span>
                      {services.length > 0 && <span>☕ {services.length} خدمة</span>}
                      {inv.coupon_code && <span>🎫 {inv.coupon_code}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalInvoicePages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setInvoicePage(p => Math.max(1, p-1))} disabled={invoicePage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: invoicePage===1?'var(--muted)':'var(--text)', cursor: invoicePage===1?'default':'pointer' }}>السابق</button>
                <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>{invoicePage} / {totalInvoicePages}</span>
                <button onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p+1))} disabled={invoicePage === totalInvoicePages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: invoicePage===totalInvoicePages?'var(--muted)':'var(--text)', cursor: invoicePage===totalInvoicePages?'default':'pointer' }}>التالي</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

