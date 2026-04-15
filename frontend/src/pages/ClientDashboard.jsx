import React, { useEffect, useState } from 'react';
import { sessionsAPI, couponsAPI, spacesAPI, invoicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── ProgressBar ───────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 10, transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ── LiveTimer ─────────────────────────────────────────────────────────
function LiveTimer({ checkIn, pricePerHr, maxHours = 4 }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(checkIn);
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn]);

  const h   = Math.floor(elapsed / 3600);
  const m   = Math.floor((elapsed % 3600) / 60);
  const s   = elapsed % 60;
  const fmt = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');

  const rawHours    = elapsed / 3600;
  const billedHours = Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
  const cost        = (billedHours * pricePerHr).toFixed(2);
  const isMaxed     = billedHours >= maxHours;

  return (
    <div style={{ background: 'rgba(46,213,115,0.07)', border: '1px solid rgba(46,213,115,0.3)', borderRadius: 'var(--radius)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span className="pulse-dot" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>جلسة نشطة</span>
        {isMaxed && (
          <span style={{ fontSize: 11, background: 'rgba(0,212,170,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10 }}>
            وصلت للحد الأقصى
          </span>
        )}
      </div>
      <div className="stat-row">
        <span className="stat-label">المدة</span>
        <span className="stat-val" style={{ fontFamily: 'var(--mono)' }}>{fmt}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">الساعات المحاسَب عليها</span>
        <span className="stat-val" style={{ color: 'var(--muted)' }}>
          {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'}
        </span>
      </div>
      <div className="stat-row" style={{ border: 'none' }}>
        <span className="stat-label">التكلفة الحالية</span>
        <span className="stat-val" style={{ color: isMaxed ? 'var(--success)' : 'var(--warning)' }}>
          {cost} ج {isMaxed && '✅'}
        </span>
      </div>
    </div>
  );
}

// ── InvoiceDetailModal ────────────────────────────────────────────────
const SPACE_ICONS = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };

function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;
  const services    = typeof invoice.services === 'string' ? JSON.parse(invoice.services) : invoice.services || [];
  const spaceIcon   = SPACE_ICONS[invoice.space_key] || '🏢';
  const spaceName   = invoice.space_name || 'منطقة العمل المشتركة';
  const billedHours = invoice.duration_min
    ? Math.min(Math.max(Math.ceil(invoice.duration_min / 60), 1), 12)
    : null;

  function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
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

        {/* Space Info */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{spaceIcon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>{spaceName}</span>
        </div>

        {/* Session Details */}
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>تفاصيل الجلسة</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>{spaceIcon} {spaceName}</span>
            <span style={{ fontWeight: 600 }}>{parseFloat(invoice.session_cost).toFixed(2)} ج</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            {billedHours && (
              <span>
                المدة: {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'}
              </span>
            )}
            <span>سعر الساعة: {invoice.price_per_hr} ج</span>
          </div>
        </div>

        {/* Services */}
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

        {/* Coupon */}
        {invoice.coupon_code && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>كوبون خصم</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}>
              <span>🎫 {invoice.coupon_code}</span>
              <span>− {parseFloat(invoice.discount_amount).toFixed(2)} ج</span>
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
            <span>الإجمالي</span>
            <span>{parseFloat(invoice.total).toFixed(2)} ج</span>
          </div>
        </div>

        {/* Payment Method */}
        <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>طريقة الدفع</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>
              {invoice.payment_method === 'wallet' ? '💳 محفظة' : '💵 كاش'}
            </span>
            <span style={{ fontWeight: 700 }}>{parseFloat(invoice.total).toFixed(2)} ج</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ClientDashboard ───────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');

  const [sessions, setSessions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [coworkSpace, setCoworkSpace] = useState({ first_hour: 30, max_hours: 4 });

  const [invoices, setInvoices] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => { loadData(); loadCoworkPrice(); }, []);
  useEffect(() => { if (tab === 'invoices') loadInvoices(); }, [tab, invoicePage]);

  async function loadCoworkPrice() {
    try {
      const { data } = await spacesAPI.getAll();
      const cowork = data.spaces.find(s => s.space_key === 'cowork');
      if (cowork) setCoworkSpace(cowork);
    } catch { }
  }

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

  async function loadInvoices() {
    setLoadingInvoices(true);
    try {
      const { data } = await invoicesAPI.getClientInvoices({ page: invoicePage });
      setInvoices(data.invoices);
      setInvoiceTotal(data.total);
    } catch {
      toast.error('خطأ في تحميل الفواتير');
    } finally {
      setLoadingInvoices(false);
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
  const totalInvoicePages = Math.ceil(invoiceTotal / 10);

  return (
    <div className="page-wrap" style={{ paddingBottom: 40 }}>
      {selectedInvoice && <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      <div className="card fade-up" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{user?.phone}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          ['overview', '🏠 نظرة عامة'],
          ['invoices', '🧾 فواتيري'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', borderColor: tab === k ? 'var(--accent)' : 'var(--border)', background: tab === k ? 'var(--accent)' : 'transparent', color: tab === k ? '#000' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="fade-up">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>الرصيد</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(user?.balance || 0).toFixed(2)} ج</div>
            </div>
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>النقاط</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--warning)' }}>{user?.points || 0}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>نقاط نحو الكوبون</span>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{user?.points || 0} / 100</span>
            </div>
            <ProgressBar value={user?.points || 0} max={100} />
          </div>

          <div className="section-title">كود الدخول</div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
            {user?.qr_code && (
              <div style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 12 }}>
                <QRCodeSVG value={user.qr_code} size={160} />
              </div>
            )}
          </div>

          {activeSession && (
            <div style={{ marginBottom: 12 }}>
              <LiveTimer
                checkIn={activeSession.check_in}
                pricePerHr={parseFloat(coworkSpace.first_hour)}
              />
            </div>
          )}

          <div className="section-title">سجل الزيارات</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>التاريخ</th><th>المدة</th><th>التكلفة</th></tr>
              </thead>
              <tbody>
                {sessions.slice(0, 5).map(s => (
                  <tr key={s.id}>
                    <td>{format(new Date(s.check_in), 'dd MMM', { locale: ar })}</td>
                    <td>{s.duration_min} د</td>
                    <td>{parseFloat(s.cost).toFixed(2)} ج</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="fade-up">
          {invoices.map(inv => (
            <div key={inv.id} className="card" style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>#{inv.invoice_number}</span>
                <span style={{ color: 'var(--accent)' }}>{parseFloat(inv.total).toFixed(2)} ج</span>
              </div>
            </div>
          ))}
          {totalInvoicePages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
              <button disabled={invoicePage === 1} onClick={() => setInvoicePage(p => p - 1)}>السابق</button>
              <span>{invoicePage} / {totalInvoicePages}</span>
              <button disabled={invoicePage === totalInvoicePages} onClick={() => setInvoicePage(p => p + 1)}>التالي</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

