import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { couponsAPI, invoicesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SERVICES_LIST = [
  { id: 1, name: 'قهوة',         price: 15 },
  { id: 2, name: 'شاي',          price: 10 },
  { id: 3, name: 'مياه',         price: 5  },
  { id: 4, name: 'عصير',         price: 20 },
  { id: 5, name: 'طباعة (ورقة)', price: 3  },
  { id: 6, name: 'سكانر',        price: 5  },
];

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getBilledHours(durationMin, maxHours = 4) {
  return Math.min(Math.max(Math.ceil(durationMin / 60), 1), maxHours);
}

export default function InvoicePage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { session, client } = location.state || {};

  const [addedServices, setAddedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [note,          setNote]          = useState('');
  const [saved,         setSaved]         = useState(false); // ✅ منع الحفظ مرتين

  // ── كوبون ─────────────────────────────────────────────────────────
  const [couponCode,    setCouponCode]    = useState('');
  const [couponData,    setCouponData]    = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponUsed,    setCouponUsed]    = useState(false);

  if (!session || !client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ color: 'var(--muted)' }}>لا توجد بيانات فاتورة</div>
        <button className="btn btn-primary" onClick={() => navigate('/scanner')}>العودة للسكانر</button>
      </div>
    );
  }

  const sessionCost    = parseFloat(session.cost || 0);
  const servicesCost   = addedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const subtotal       = sessionCost + servicesCost;
  const discountPct    = couponData ? parseFloat(couponData.discount_pct) : 0;
  const discountAmount = parseFloat(((subtotal * discountPct) / 100).toFixed(2));
  const total          = parseFloat((subtotal - discountAmount).toFixed(2));
  const billedHours    = getBilledHours(session.durationMin);

  // ✅ رقم الفاتورة ثابت طول عمر الكومبوننت
  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const now     = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  // ── كوبون actions ──────────────────────────────────────────────────
  async function validateCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return toast.error('أدخل كود الكوبون');
    setCouponLoading(true);
    try {
      const { data } = await couponsAPI.validate({ code, user_id: client.id });
      if (data.valid) { setCouponData(data.coupon); toast.success(`✅ كوبون صالح — خصم ${data.coupon.discount_pct}%`); }
    } catch (err) {
      setCouponData(null);
      toast.error(err.response?.data?.error || 'كوبون غير صالح');
    } finally { setCouponLoading(false); }
  }

  function removeCoupon() { setCouponData(null); setCouponCode(''); }

  async function markCouponUsed() {
    if (!couponData || couponUsed) return;
    try {
      await couponsAPI.use({ code: couponData.code, user_id: client.id });
      setCouponUsed(true);
    } catch (err) { console.error('coupon use error:', err); }
  }

  // ✅ حفظ الفاتورة في الـ DB — بيشتغل مرة واحدة بس
  async function saveInvoice() {
    if (saved) return;
    try {
      await invoicesAPI.create({
        invoice_number:  invoiceNumber,
        session_id:      session.id       || null,
        user_id:         client.id,
        client_name:     client.name,
        client_phone:    client.phone,
        session_cost:    sessionCost,
        duration_min:    session.durationMin,
        price_per_hr:    session.pricePerHr,
        services:        addedServices.map(s => ({ name: s.name, price: s.price, qty: s.qty })),
        services_cost:   servicesCost,
        coupon_code:     couponData?.code     || null,
        discount_pct:    discountPct,
        discount_amount: discountAmount,
        subtotal,
        total,
        payment_method:  paymentMethod,
        note:            note || null,
      });
      setSaved(true);
    } catch (err) {
      console.error('invoice save error:', err);
      // مش بيوقف الـ flow — الفاتورة اتطبعت حتى لو الحفظ فشل
    }
  }

  function addService(service) {
    setAddedServices(prev => {
      const existing = prev.find(s => s.id === service.id);
      if (existing) return prev.map(s => s.id === service.id ? { ...s, qty: s.qty + 1 } : s);
      return [...prev, { ...service, qty: 1 }];
    });
  }

  function removeService(id) {
    setAddedServices(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing.qty === 1) return prev.filter(s => s.id !== id);
      return prev.map(s => s.id === id ? { ...s, qty: s.qty - 1 } : s);
    });
  }

  async function handlePrint() {
    await markCouponUsed();
    await saveInvoice(); // ✅ حفظ قبل الطباعة
    window.print();
    toast.success('تمت طباعة الفاتورة');
  }

  async function handleDone() {
    await markCouponUsed();
    await saveInvoice(); // ✅ حفظ عند الإنهاء
    navigate('/scanner');
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-area { max-width: 320px; margin: 0 auto; font-family: monospace; }
        }
        @media screen { .print-area { max-width: 480px; margin: 0 auto; } }
      `}</style>

      <div style={{ minHeight: '100vh', padding: 16, maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>إصدار فاتورة</div>
          </div>
          <button onClick={() => navigate('/scanner')}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>← رجوع</button>
        </div>

        {/* ===== الفاتورة ===== */}
        <div className="print-area card" style={{ marginBottom: 16 }}>

          {/* رأس */}
          <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>🏢 Link Space</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>نظام إدارة مساحة العمل المشتركة</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>#{invoiceNumber}</span>
              <span style={{ color: 'var(--muted)' }}>{dateStr} — {timeStr}</span>
            </div>
          </div>

          {/* العميل */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>بيانات العميل</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{client.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{client.phone}</div>
          </div>

          {/* الجلسة */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>تفاصيل الجلسة</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span>منطقة العمل المشتركة</span>
              <span style={{ fontWeight: 600 }}>{sessionCost.toFixed(2)} ج</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
              <span>
                المدة: {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'}
                <span style={{ fontSize: 11, marginRight: 4, opacity: 0.7 }}>({session.durationMin} د فعلية)</span>
              </span>
              <span>سعر الساعة: {session.pricePerHr || '—'} ج</span>
            </div>
            {session.checkIn && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.8 }}>
                <span>دخول: {formatTime(session.checkIn)}</span>
                <span>خروج: {formatTime(session.checkOut || new Date().toISOString())}</span>
              </div>
            )}
          </div>

          {/* الخدمات */}
          {addedServices.length > 0 && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>خدمات إضافية</div>
              {addedServices.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, alignItems: 'center' }}>
                  <span>{s.name} × {s.qty}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{(s.price * s.qty).toFixed(2)} ج</span>
                    <button className="no-print" onClick={() => removeService(s.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 16 }}>−</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* الكوبون */}
          {couponData && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>كوبون خصم</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--success)' }}>
                <span>🎫 {couponData.code} (خصم {couponData.discount_pct}%)</span>
                <span>− {discountAmount.toFixed(2)} ج</span>
              </div>
            </div>
          )}

          {/* ملاحظة */}
          {note && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)', fontSize: 13, color: 'var(--muted)' }}>
              ملاحظة: {note}
            </div>
          )}

          {/* الإجمالي */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              <span>تكلفة الجلسة</span><span>{sessionCost.toFixed(2)} ج</span>
            </div>
            {servicesCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                <span>الخدمات</span><span>{servicesCost.toFixed(2)} ج</span>
              </div>
            )}
            {couponData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>
                <span>خصم {couponData.discount_pct}%</span><span>− {discountAmount.toFixed(2)} ج</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
              <span>الإجمالي</span><span>{total.toFixed(2)} ج</span>
            </div>
          </div>

          {/* طريقة الدفع */}
          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>طريقة الدفع: </span>
            <span className={`badge badge-${paymentMethod === 'wallet' ? 'info' : 'warning'}`}>
              {paymentMethod === 'wallet' ? '💳 محفظة' : '💵 كاش'}
            </span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>شكراً لزيارتكم 🙏</div>
        </div>

        {/* ===== أدوات ===== */}
        <div className="no-print">

          {/* خدمات */}
          <div className="section-title">إضافة خدمات / مشروبات</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {SERVICES_LIST.map(s => (
              <button key={s.id} onClick={() => addService(s)}
                style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid', background: addedServices.find(x => x.id === s.id) ? 'rgba(0,212,170,0.1)' : 'transparent', borderColor: addedServices.find(x => x.id === s.id) ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>{s.price} ج</div>
                {addedServices.find(x => x.id === s.id) && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>×{addedServices.find(x => x.id === s.id).qty}</div>}
              </button>
            ))}
          </div>

          {/* كوبون */}
          <div className="section-title">كوبون خصم (اختياري)</div>
          {!couponData ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" style={{ flex: 1, textTransform: 'uppercase', letterSpacing: 1 }}
                placeholder="أدخل كود الكوبون..."
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && validateCoupon()} />
              <button onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()}
                style={{ padding: '0 16px', borderRadius: 10, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {couponLoading ? '...' : 'تطبيق'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(46,213,115,0.08)', border: '1px solid rgba(46,213,115,0.4)', borderRadius: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🎫</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)', fontFamily: 'var(--mono)' }}>{couponData.code}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>خصم {couponData.discount_pct}% — توفير {discountAmount.toFixed(2)} ج</div>
              </div>
              {!couponUsed
                ? <button onClick={removeCoupon} style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 18 }}>✕</button>
                : <span className="badge badge-success">✅ مُطبَّق</span>
              }
            </div>
          )}

          {/* طريقة الدفع */}
          <div className="section-title">طريقة الدفع</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['wallet','💳 محفظة'], ['cash','💵 كاش']].map(([method, label]) => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderColor: paymentMethod === method ? 'var(--accent)' : 'var(--border)', background: paymentMethod === method ? 'var(--accent)' : 'transparent', color: paymentMethod === method ? '#000' : 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ملاحظة */}
          <div className="section-title">ملاحظة (اختياري)</div>
          <input className="input-field" style={{ marginBottom: 16 }} placeholder="أضف ملاحظة للفاتورة..."
            value={note} onChange={e => setNote(e.target.value)} />

          {/* ملخص الخصم */}
          {couponData && (
            <div style={{ padding: '10px 14px', background: 'rgba(0,212,170,0.06)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', marginBottom: 4 }}>
                <span>قبل الخصم</span><span>{subtotal.toFixed(2)} ج</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginBottom: 4 }}>
                <span>خصم {couponData.discount_pct}%</span><span>− {discountAmount.toFixed(2)} ج</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                <span>الإجمالي بعد الخصم</span><span>{total.toFixed(2)} ج</span>
              </div>
            </div>
          )}

          {/* أزرار */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>🖨️ طباعة الفاتورة</button>
            <button onClick={handleDone}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ✅ تم
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

