import React, { useState, useEffect } from 'react';
import { staffAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SPACE_ICONS = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };

// ── InvoiceModal (شامل) ───────────────────────────────────────────────
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

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{spaceIcon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{spaceName}</span>
        </div>

        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>العميل</div>
          <div style={{ fontWeight: 700 }}>{invoice.client_name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{invoice.client_phone}</div>
        </div>

        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>تفاصيل الجلسة</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>{spaceIcon} {spaceName}</span>
            <span style={{ fontWeight: 600 }}>{parseFloat(invoice.session_cost || 0).toFixed(2)} ج</span>
          </div>
          {billedHours && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
              المدة: {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'}
              <span style={{ opacity: 0.7, marginRight: 6 }}>({invoice.duration_min} د فعلية)</span>
            </div>
          )}
          {parseFloat(invoice.price_per_hr || 0) > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>سعر الساعة: {invoice.price_per_hr} ج</div>
          )}
        </div>

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

        {invoice.coupon_code && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>كوبون خصم</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
              <span>🎫 {invoice.coupon_code} (خصم {invoice.discount_pct}%)</span>
              <span>− {parseFloat(invoice.discount_amount || 0).toFixed(2)} ج</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          {parseFloat(invoice.services_cost || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              <span>الخدمات</span>
              <span>{parseFloat(invoice.services_cost).toFixed(2)} ج</span>
            </div>
          )}
          {invoice.coupon_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>
              <span>خصم {invoice.discount_pct}%</span>
              <span>− {parseFloat(invoice.discount_amount || 0).toFixed(2)} ج</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
            <span>الإجمالي</span>
            <span>{parseFloat(invoice.total) === 0 ? 'مجاناً ✅' : `${parseFloat(invoice.total).toFixed(2)} ج`}</span>
          </div>
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
                <span style={{ color: 'var(--muted)' }}>💳 من المحفظة</span>
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

        {invoice.note && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>📝 {invoice.note}</div>
        )}
      </div>
    </div>
  );
}

// ── StaffDashboard ────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [tab, setTab]    = useState('overview');

  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [myInvoices,      setMyInvoices]      = useState([]);
  const [myInvoiceTotal,  setMyInvoiceTotal]  = useState(0);
  const [myInvoicePage,   setMyInvoicePage]   = useState(1);
  const [invoiceSearch,   setInvoiceSearch]   = useState('');
  const [invoiceDate,     setInvoiceDate]     = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const today    = format(new Date(), 'yyyy-MM-dd');
  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('');

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'invoices') loadMyInvoices(); }, [tab, myInvoicePage, invoiceSearch, invoiceDate]);

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
    } catch {
      toast.error('خطأ في تحميل الفواتير');
    } finally {
      setLoadingInvoices(false);
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

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>لوحة الموظف — {user?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/scanner')}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            📡 Scanner
          </button>
          <button onClick={logout}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            خروج
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {[['overview', 'نظرة عامة'], ['invoices', '🧾 فواتيري']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', borderColor: tab === k ? 'var(--accent)' : 'var(--border)', background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#000' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div className="fade-up">

            <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
                <span style={{ fontSize: 11, background: 'rgba(0,212,170,0.12)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10, marginTop: 4, display: 'inline-block' }}>موظف</span>
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
                    ['عدد الفواتير',     stats?.today?.invoices_count || 0,                              'var(--text)'],
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
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 12 }} cursor={{ fill: 'rgba(0,212,170,0.08)' }} formatter={v => [`${v} ج`, 'الإيراد']} />
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
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>#{inv.invoice_number}</div>
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
                                    <span className="badge badge-info" style={{ fontSize: 9 }}>💳{walletP.toFixed(0)}</span>
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
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setMyInvoicePage(1); }}
              />
              <input type="date" className="input-field" style={{ width: 150 }}
                value={invoiceDate}
                onChange={e => { setInvoiceDate(e.target.value); setMyInvoicePage(1); }}
              />
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
              {myInvoiceTotal} فاتورة
              {invoiceDate && ` — ${new Date(invoiceDate).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}`}
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
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>#{inv.invoice_number}</div>
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
                        {inv.coupon_code && <span>🎫 {inv.coupon_code}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalInvoicePages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setMyInvoicePage(p => Math.max(1, p - 1))} disabled={myInvoicePage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: myInvoicePage === 1 ? 'var(--muted)' : 'var(--text)', cursor: myInvoicePage === 1 ? 'default' : 'pointer' }}>
                  السابق
                </button>
                <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>{myInvoicePage} / {totalInvoicePages}</span>
                <button onClick={() => setMyInvoicePage(p => Math.min(totalInvoicePages, p + 1))} disabled={myInvoicePage === totalInvoicePages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: myInvoicePage === totalInvoicePages ? 'var(--muted)' : 'var(--text)', cursor: myInvoicePage === totalInvoicePages ? 'default' : 'pointer' }}>
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
