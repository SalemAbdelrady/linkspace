import React, { useState, useEffect } from 'react';
import { staffAPI, spacesAPI, servicesAPI, adminAPI, quickSaleAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SPACE_ICONS = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };

// ── InvoiceModal ──────────────────────────────────────────────────────
function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;
  const services    = typeof invoice.services === 'string' ? JSON.parse(invoice.services || '[]') : invoice.services || [];
  const spaceIcon   = SPACE_ICONS[invoice.space_key] || '🏢';
  const spaceName   = invoice.space_name || 'منطقة العمل المشتركة';
  const billedHours = invoice.duration_min ? Math.min(Math.max(Math.ceil(invoice.duration_min / 60), 1), 12) : null;
  const walletPaid  = parseFloat(invoice.wallet_paid || 0);
  const cashPaid    = parseFloat(invoice.cash_paid   || 0);
  const method      = invoice.payment_method;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

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

        {/* badge بيع سريع */}
        {invoice.invoice_type === 'quick_sale' && (
          <div style={{ marginBottom: 10, display: 'inline-block', padding: '3px 10px', borderRadius: 20,
            background: 'rgba(255,165,2,0.12)', border: '1px solid rgba(255,165,2,0.3)',
            fontSize: 11, color: 'var(--warning)', fontWeight: 700 }}>
            ⚡ بيع سريع
          </div>
        )}

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{spaceIcon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{spaceName}</span>
        </div>

        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>العميل</div>
          <div style={{ fontWeight: 700 }}>{invoice.client_name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.client_phone}</div>
          {invoice.client_email && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>✉️ {invoice.client_email}</div>
          )}
        </div>

        {invoice.invoice_type !== 'quick_sale' && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>تفاصيل الجلسة</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{spaceIcon} {spaceName}</span>
              <span style={{ fontWeight: 600 }}>{parseFloat(invoice.session_cost || 0).toFixed(2)} ج</span>
            </div>
            {billedHours && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                المدة: {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'} ({invoice.duration_min} د)
              </div>
            )}
          </div>
        )}

        {services.length > 0 && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>خدمات</div>
            {services.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{s.name} × {s.qty}</span>
                <span>{(s.price * s.qty).toFixed(2)} ج</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>
          <span>الإجمالي</span>
          <span>{parseFloat(invoice.total).toFixed(2)} ج</span>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>طريقة الدفع</div>
          {method === 'subscription' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>📋 اشتراك شهري</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>مجاناً</span>
            </div>
          ) : walletPaid > 0 && cashPaid > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>💳 محفظة</span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{walletPaid.toFixed(2)} ج</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>💵 كاش</span>
                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{cashPaid.toFixed(2)} ج</span>
              </div>
            </div>
          ) : walletPaid > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>💳 محفظة كاملة</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>{walletPaid.toFixed(2)} ج</span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>💵 كاش</span>
              <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{parseFloat(invoice.total).toFixed(2)} ج</span>
            </div>
          )}
        </div>
        {invoice.note && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>📝 {invoice.note}</div>}
      </div>
    </div>
  );
}

// ── مودال البيع السريع ⚡ ─────────────────────────────────────────────
function QuickSaleModal({ services: allServices, onClose, onDone }) {
  const [clientName,  setClientName]  = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [searchUser,  setSearchUser]  = useState('');
  const [foundUser,   setFoundUser]   = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [cart,        setCart]        = useState([]);
  const [payMethod,   setPayMethod]   = useState('cash');
  const [note,        setNote]        = useState('');
  const [saving,      setSaving]      = useState(false);

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  async function searchClients(q) {
    if (q.length < 2) { setUserResults([]); return; }
    try {
      const { data } = await adminAPI.users(q);
      setUserResults(data.users.slice(0, 5));
    } catch {}
  }

  function selectUser(u) {
    setFoundUser(u);
    setClientName(u.name);
    setClientPhone(u.phone);
    setSearchUser(u.name);
    setUserResults([]);
  }

  function clearUser() {
    setFoundUser(null);
    setClientName('');
    setClientPhone('');
    setSearchUser('');
    setPayMethod('cash');
  }

  function addToCart(svc) {
    setCart(prev => {
      const ex = prev.find(x => x.name === svc.name);
      if (ex) return prev.map(x => x.name === svc.name ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { name: svc.name, price: parseFloat(svc.price), qty: 1 }];
    });
  }

  function changeQty(name, delta) {
    setCart(prev => prev
      .map(x => x.name === name ? { ...x, qty: Math.max(0, x.qty + delta) } : x)
      .filter(x => x.qty > 0)
    );
  }

  async function confirm() {
    if (!clientName.trim()) return toast.error('أدخل اسم العميل');
    if (!cart.length)       return toast.error('أضف خدمة واحدة على الأقل');
    setSaving(true);
    try {
      const { data } = await quickSaleAPI.create({
        client_name   : clientName.trim(),
        client_phone  : clientPhone.trim(),
        user_id       : foundUser?.id || null,
        services      : cart,
        payment_method: payMethod,
        note          : note || null,
      });
      toast.success(`✅ تم إصدار الفاتورة ${data.invoice.invoice_number}`);
      onDone && onDone(data.invoice);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 16px 16px',
        padding: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* رأس */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>⚡ بيع سريع</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>فاتورة بدون جلسة — زوار أو خدمات منفردة</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* العميل */}
        <div style={{ marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>👤 بيانات العميل</div>
          {foundUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{foundUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{foundUser.phone}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
                  💰 رصيد: {parseFloat(foundUser.balance).toFixed(2)} ج
                </div>
              </div>
              <button onClick={clearUser} style={{ background: 'transparent', border: 'none', color: '#ff4757', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>بحث عن عميل مسجل (اختياري)</div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input className="input-field" placeholder="اسم أو موبايل..."
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); searchClients(e.target.value); }} />
                {userResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 20,
                    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                    {userResults.map(u => (
                      <div key={u.id} onClick={() => selectUser(u)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.phone} · {parseFloat(u.balance).toFixed(2)} ج</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>أو أدخل بيانات الزائر يدوياً</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="input-field" placeholder="الاسم *" value={clientName}
                  onChange={e => setClientName(e.target.value)} />
                <input className="input-field" placeholder="الموبايل" value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* الخدمات */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>☕ اختر الخدمات</div>
          {/* ✅ شريط البحث */}
          <input
            className="input-field"
            placeholder="🔍 بحث باسم الخدمة أو السعر..."
            value={svcSearch}
            onChange={(e) => setSvcSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {allServices.map(svc => (
              <button key={svc.id} onClick={() => addToCart(svc)}
                style={{ padding: '12px 8px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(0,212,170,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#fff' }}>{svc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{svc.price} ج</div>
              </button>
            ))}
          </div>

          {/* السلة */}
          {cart.length > 0 && (
            <div style={{ padding: 12, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>🛒 السلة</div>
              {cart.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => changeQty(item.name, -1)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.name, 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>+</button>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, minWidth: 52, textAlign: 'left' }}>
                      {(item.price * item.qty).toFixed(2)} ج
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4,
                display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                <span>الإجمالي</span>
                <span>{total.toFixed(2)} ج</span>
              </div>
            </div>
          )}
        </div>

        {/* طريقة الدفع */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>💳 طريقة الدفع</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[
              ['cash',   '💵 كاش',   true],
              ['wallet', '💳 محفظة', !!foundUser],
            ].map(([val, label, enabled]) => (
              <button key={val} onClick={() => enabled && setPayMethod(val)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1px solid',
                  fontSize: 13, fontWeight: 600, cursor: enabled ? 'pointer' : 'not-allowed',
                  borderColor: payMethod === val ? 'var(--accent)' : 'var(--border)',
                  background:  payMethod === val ? 'rgba(0,212,170,0.12)' : 'transparent',
                  color:       payMethod === val ? 'var(--accent)' : enabled ? 'var(--muted)' : 'var(--border)',
                  opacity: enabled ? 1 : 0.4,
                }}>
                {label}
                {val === 'wallet' && !foundUser && <div style={{ fontSize: 9 }}>حدد عميلاً أولاً</div>}
              </button>
            ))}
          </div>
          {payMethod === 'wallet' && foundUser && (
            <div style={{ fontSize: 12, color: parseFloat(foundUser.balance) >= total ? 'var(--success)' : '#ff4757',
              padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: 8 }}>
              {parseFloat(foundUser.balance) >= total
                ? `✅ الرصيد كافٍ — ${parseFloat(foundUser.balance).toFixed(2)} ج`
                : `❌ الرصيد غير كافٍ — ${parseFloat(foundUser.balance).toFixed(2)} ج`}
            </div>
          )}
        </div>

        <input className="input-field" placeholder="ملاحظة (اختياري)..." value={note}
          onChange={e => setNote(e.target.value)} style={{ marginBottom: 16 }} />

        <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }}
          disabled={saving || !clientName || !cart.length ||
            (payMethod === 'wallet' && (!foundUser || parseFloat(foundUser.balance) < total))}
          onClick={confirm}>
          {saving ? 'جارٍ الحفظ...' : `⚡ إصدار الفاتورة — ${total.toFixed(2)} ج`}
        </button>
      </div>
    </div>
  );
}

// ── StaffDashboard ────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [tab, setTab]    = useState('overview');
  const [showQuickSale,  setShowQuickSale]  = useState(false);

  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [myInvoices,      setMyInvoices]      = useState([]);
  const [myInvoiceTotal,  setMyInvoiceTotal]  = useState(0);
  const [myInvoicePage,   setMyInvoicePage]   = useState(1);
  const [invoiceSearch,   setInvoiceSearch]   = useState('');
  const [invoiceDate,     setInvoiceDate]     = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [canViewAll,      setCanViewAll]      = useState(false);

  const [canEditPrices,   setCanEditPrices]   = useState(false);
  const [spaces,          setSpaces]          = useState({
    cowork:  { name: 'منطقة العمل المشتركة', first_hour: 30, extra_hour: 30, max_hours: 4 },
    meeting: { name: 'غرفة الاجتماعات',      first_hour: 150, extra_hour: 100, max_hours: 12 },
    lessons: { name: 'غرفة الدروس',           first_hour: 200, extra_hour: 100, max_hours: 12 },
  });
  const [services,        setServices]        = useState([]);
  const [newService,      setNewService]      = useState({ name: '', price: '' });
  const [editingService,  setEditingService]  = useState(null);
  const [loadingSpaces,   setLoadingSpaces]   = useState(false);
  const [priceTab,        setPriceTab]        = useState('cowork');

  const today    = format(new Date(), 'yyyy-MM-dd');
  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('');

  useEffect(() => { loadStats(); checkPermissions(); loadServicesData(); }, []);
  useEffect(() => { if (tab === 'invoices') loadMyInvoices(); }, [tab, myInvoicePage, invoiceSearch, invoiceDate]);
  useEffect(() => { if (tab === 'prices') { loadSpaces(); loadServicesData(); } }, [tab]);

  async function loadStats() {
    setLoading(true);
    try {
      const { data } = await staffAPI.myStats(today);
      setStats(data);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function checkPermissions() {
    try {
      const { data } = await staffAPI.getAll();
      const me = data.staff?.find(s => s.id === user?.id);
      if (me) setCanEditPrices(me.can_edit_prices === true);
    } catch {}
  }

  // ✅ نحمل الخدمات من البداية عشان Quick Sale تشتغل
  async function loadServicesData() {
    try {
      const { data } = await servicesAPI.getAll();
      setServices(data.services);
    } catch {}
  }

  async function loadMyInvoices() {
    setLoadingInvoices(true);
    try {
      const { data } = await staffAPI.myInvoices({
        page:   myInvoicePage,
        search: invoiceSearch,
        date:   invoiceDate,
      });
      setMyInvoices(data.invoices);
      setMyInvoiceTotal(data.total);
      setCanViewAll(data.can_view_all || false);
    } catch {
      toast.error('خطأ في تحميل الفواتير');
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      const mapped = {};
      data.spaces.forEach(s => { mapped[s.space_key] = s; });
      setSpaces(prev => ({
        cowork:  { ...prev.cowork,  ...mapped.cowork  },
        meeting: { ...prev.meeting, ...mapped.meeting },
        lessons: { ...prev.lessons, ...mapped.lessons },
      }));
    } catch {}
  }

  async function saveSpace(key) {
    setLoadingSpaces(true);
    try {
      await spacesAPI.update(key, spaces[key]);
      toast.success('تم حفظ التغييرات ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'ليس لديك صلاحية لتعديل الأسعار');
    } finally {
      setLoadingSpaces(false);
    }
  }

  async function addService() {
    if (!newService.name || !newService.price) return toast.error('أدخل الاسم والسعر');
    try {
      const { data } = await servicesAPI.create({ name: newService.name, price: parseFloat(newService.price) });
      setServices(prev => [...prev, data.service]);
      setNewService({ name: '', price: '' });
      toast.success('تمت الإضافة ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الإضافة');
    }
  }

  async function saveService() {
    try {
      await servicesAPI.update(editingService.id, { name: editingService.name, price: parseFloat(editingService.price) });
      setServices(prev => prev.map(x => x.id === editingService.id ? editingService : x));
      setEditingService(null);
      toast.success('تم التعديل ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التعديل');
    }
  }

  async function deleteService(id) {
    try {
      await servicesAPI.delete(id);
      setServices(prev => prev.filter(x => x.id !== id));
      toast.success('تم الحذف');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الحذف');
    }
  }

  const chartData = stats?.recent?.slice(0, 7).map(inv => ({
    name:  format(new Date(inv.created_at), 'EEE', { locale: ar }),
    total: parseFloat(inv.total),
  })).reverse() || [];

  const totalInvoicePages = Math.ceil(myInvoiceTotal / 20);

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>

      {selectedInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* ✅ مودال البيع السريع */}
      {showQuickSale && (
        <QuickSaleModal
          services={services}
          onClose={() => setShowQuickSale(false)}
          onDone={() => { if (tab === 'invoices') loadMyInvoices(); loadStats(); }}
        />
      )}

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>لوحة الموظف — {user?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* ✅ زر البيع السريع */}
          <button onClick={() => setShowQuickSale(true)}
            style={{ background: 'var(--accent)', border: 'none', color: '#000',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ⚡ بيع سريع
          </button>
          <button onClick={() => navigate('/scanner')}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            📡 Scanner
          </button>
          <button onClick={logout}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            خروج
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[
          ['overview', 'نظرة عامة'],
          ['invoices', '🧾 فواتيري'],
          ...(canEditPrices ? [['prices', '💰 الأسعار']] : []),
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
              borderColor: tab === k ? 'var(--accent)' : 'var(--border)',
              background:  tab === k ? 'var(--accent)' : 'transparent',
              color:       tab === k ? '#000' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div className="fade-up">
            <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
                <span style={{ fontSize: 11, background: 'rgba(0,212,170,0.12)', color: 'var(--accent)',
                  padding: '2px 8px', borderRadius: 10, marginTop: 4, display: 'inline-block' }}>موظف</span>
              </div>
            </div>

            <div className="section-title">إحصائياتي اليوم</div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 32, fontSize: 13 }}>جارٍ التحميل...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 10 }}>
                  {[
                    ['إجمالي الإيرادات', `${parseFloat(stats?.today?.total_revenue || 0).toFixed(0)} ج`, 'var(--accent)'],
                    ['عدد الفواتير',     stats?.today?.invoices_count || 0,                               'var(--text)'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="card" style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    ['💵 كاش اليوم',   `${parseFloat(stats?.today?.cash_revenue   || 0).toFixed(0)} ج`, 'var(--warning)'],
                    ['💳 محفظة اليوم', `${parseFloat(stats?.today?.wallet_revenue || 0).toFixed(0)} ج`, '#3b82f6'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="card" style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="section-title">إجماليات الشهر الحالي</div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="stat-row">
                    <span className="stat-label">إجمالي الإيرادات</span>
                    <span className="stat-val" style={{ color: 'var(--accent)' }}>
                      {parseFloat(stats?.monthly?.total_revenue || 0).toFixed(2)} ج
                    </span>
                  </div>
                  <div className="stat-row" style={{ border: 'none' }}>
                    <span className="stat-label">عدد الفواتير</span>
                    <span className="stat-val">{stats?.monthly?.invoices_count || 0}</span>
                  </div>
                </div>

                {stats?.recent?.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div className="section-title" style={{ margin: 0 }}>آخر الفواتير</div>
                      <button onClick={() => setTab('invoices')}
                        style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        عرض الكل
                      </button>
                    </div>

                    {chartData.length > 1 && (
                      <div className="card" style={{ marginBottom: 12 }}>
                        <ResponsiveContainer width="100%" height={120}>
                          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                              cursor={{ fill: 'rgba(0,212,170,0.08)' }} formatter={v => [`${v} ج`, 'الإيراد']} />
                            <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.85} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stats.recent.map(inv => {
                        const svcs    = typeof inv.services === 'string' ? JSON.parse(inv.services || '[]') : inv.services || [];
                        const walletP = parseFloat(inv.wallet_paid || 0);
                        const cashP   = parseFloat(inv.cash_paid   || 0);
                        return (
                          <div key={inv.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                                  #{inv.invoice_number}
                                  {inv.invoice_type === 'quick_sale' && (
                                    <span style={{ marginRight: 6, fontSize: 10, background: 'rgba(255,165,2,0.15)', color: 'var(--warning)', padding: '1px 6px', borderRadius: 8 }}>⚡ سريع</span>
                                  )}
                                </div>
                                <div style={{ fontWeight: 600, marginTop: 2 }}>{inv.client_name}</div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{SPACE_ICONS[inv.space_key] || '🏢'} {inv.space_name}</div>
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(inv.total).toFixed(2)} ج</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                  {new Date(inv.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {walletP > 0 && cashP > 0 ? (
                                  <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                    <span className="badge badge-info"    style={{ fontSize: 9 }}>💳{walletP.toFixed(0)}</span>
                                    <span className="badge badge-warning" style={{ fontSize: 9 }}>💵{cashP.toFixed(0)}</span>
                                  </div>
                                ) : (
                                  <span className={`badge badge-${inv.payment_method === 'wallet' ? 'info' : 'warning'}`} style={{ fontSize: 9, marginTop: 3, display: 'block' }}>
                                    {inv.payment_method === 'wallet' ? '💳 محفظة' : '💵 كاش'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {svcs.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>☕ {svcs.length} خدمة</div>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32, fontSize: 13 }}>
                    لا توجد فواتير اليوم بعد
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ INVOICES ══ */}
        {tab === 'invoices' && (
          <div className="fade-up">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 14 }}>
              <input className="input-field" placeholder="بحث باسم العميل أو موبايله..."
                value={invoiceSearch} onChange={e => { setInvoiceSearch(e.target.value); setMyInvoicePage(1); }} />
              <input type="date" className="input-field" style={{ width: 150 }}
                value={invoiceDate} onChange={e => { setInvoiceDate(e.target.value); setMyInvoicePage(1); }} />
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              {myInvoiceTotal} فاتورة
              {invoiceDate && ` — ${new Date(invoiceDate).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}`}
              {canViewAll && (
                <span style={{ marginRight: 8, fontSize: 11, background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', padding: '1px 8px', borderRadius: 10 }}>
                  👁️ كل الفواتير
                </span>
              )}
            </div>

            {loadingInvoices ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>جارٍ التحميل...</div>
            ) : myInvoices.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>لا توجد فواتير</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {myInvoices.map(inv => {
                  const svcs    = typeof inv.services === 'string' ? JSON.parse(inv.services || '[]') : inv.services || [];
                  const walletP = parseFloat(inv.wallet_paid || 0);
                  const cashP   = parseFloat(inv.cash_paid   || 0);
                  return (
                    <div key={inv.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                            #{inv.invoice_number}
                            {inv.invoice_type === 'quick_sale' && (
                              <span style={{ marginRight: 6, fontSize: 10, background: 'rgba(255,165,2,0.15)', color: 'var(--warning)', padding: '1px 6px', borderRadius: 8 }}>⚡ سريع</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, marginTop: 2 }}>{inv.client_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.client_phone}</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(inv.total).toFixed(2)} ج</div>
                          {walletP > 0 && cashP > 0 ? (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <span className="badge badge-info"    style={{ fontSize: 10 }}>💳 {walletP.toFixed(0)} ج</span>
                              <span className="badge badge-warning" style={{ fontSize: 10 }}>💵 {cashP.toFixed(0)} ج</span>
                            </div>
                          ) : (
                            <span className={`badge badge-${inv.payment_method === 'wallet' ? 'info' : 'warning'}`} style={{ fontSize: 10, marginTop: 4, display: 'block' }}>
                              {inv.payment_method === 'wallet' ? '💳 محفظة' : '💵 كاش'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                        <span>🕐 {new Date(inv.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>📅 {new Date(inv.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
                        {SPACE_ICONS[inv.space_key] && <span>{SPACE_ICONS[inv.space_key]} {inv.space_name}</span>}
                        {svcs.length > 0 && <span>☕ {svcs.length} خدمة</span>}
                        {canViewAll && inv.created_by_name && <span style={{ color: 'var(--accent)' }}>👤 {inv.created_by_name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalInvoicePages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setMyInvoicePage(p => Math.max(1, p - 1))} disabled={myInvoicePage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent',
                    color: myInvoicePage === 1 ? 'var(--muted)' : 'var(--text)', cursor: myInvoicePage === 1 ? 'default' : 'pointer' }}>
                  السابق
                </button>
                <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>{myInvoicePage} / {totalInvoicePages}</span>
                <button onClick={() => setMyInvoicePage(p => Math.min(totalInvoicePages, p + 1))} disabled={myInvoicePage === totalInvoicePages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent',
                    color: myInvoicePage === totalInvoicePages ? 'var(--muted)' : 'var(--text)', cursor: myInvoicePage === totalInvoicePages ? 'default' : 'pointer' }}>
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ PRICES ══ */}
        {tab === 'prices' && canEditPrices && (
          <div className="fade-up">
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
              {[['cowork','🖥️ منطقة العمل'],['meeting','🤝 الاجتماعات'],['lessons','📚 الدروس'],['services','☕ الخدمات']].map(([k, label]) => (
                <button key={k} onClick={() => setPriceTab(k)}
                  style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600,
                    whiteSpace: 'nowrap', cursor: 'pointer',
                    borderColor: priceTab === k ? 'var(--accent)' : 'var(--border)',
                    background:  priceTab === k ? 'var(--accent)' : 'transparent',
                    color:       priceTab === k ? '#000' : 'var(--muted)' }}>
                  {label}
                </button>
              ))}
            </div>

            {['cowork','meeting','lessons'].includes(priceTab) && (
              <div className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>اسم المساحة</div>
                <input className="input-field" style={{ marginBottom: 14 }} value={spaces[priceTab]?.name || ''}
                  onChange={e => setSpaces(p => ({ ...p, [priceTab]: { ...p[priceTab], name: e.target.value } }))} />
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>سعر أول ساعة (ج)</div>
                <input className="input-field" type="number" style={{ marginBottom: 14 }} value={spaces[priceTab]?.first_hour || 0}
                  onChange={e => setSpaces(p => ({ ...p, [priceTab]: { ...p[priceTab], first_hour: parseFloat(e.target.value) || 0 } }))} />
                {priceTab !== 'cowork' && (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>كل ساعة إضافية (ج)</div>
                    <input className="input-field" type="number" style={{ marginBottom: 14 }} value={spaces[priceTab]?.extra_hour || 0}
                      onChange={e => setSpaces(p => ({ ...p, [priceTab]: { ...p[priceTab], extra_hour: parseFloat(e.target.value) || 0 } }))} />
                  </>
                )}
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSpaces} onClick={() => saveSpace(priceTab)}>
                  {loadingSpaces ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}

            {priceTab === 'services' && (
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>➕ إضافة خدمة</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                    <input className="input-field" placeholder="اسم الخدمة..." value={newService.name}
                      onChange={e => setNewService(p => ({ ...p, name: e.target.value }))} />
                    <input className="input-field" type="number" placeholder="السعر" style={{ width: 90 }} value={newService.price}
                      onChange={e => setNewService(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={addService}>إضافة</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.map(s => (
                    <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {editingService?.id === s.id ? (
                        <>
                          <input className="input-field" style={{ flex: 1 }} value={editingService.name}
                            onChange={e => setEditingService(p => ({ ...p, name: e.target.value }))} />
                          <input className="input-field" type="number" style={{ width: 80 }} value={editingService.price}
                            onChange={e => setEditingService(p => ({ ...p, price: e.target.value }))} />
                          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={saveService}>حفظ</button>
                        </>
                      ) : (
                        <>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent)' }}>{s.price} ج</div>
                          </div>
                          <button onClick={() => setEditingService(s)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => deleteService(s.id)} style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
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
