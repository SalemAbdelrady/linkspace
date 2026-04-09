import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SERVICES_LIST = [
  { id: 1, name: 'قهوة', price: 15 },
  { id: 2, name: 'شاي', price: 10 },
  { id: 3, name: 'مياه', price: 5 },
  { id: 4, name: 'عصير', price: 20 },
  { id: 5, name: 'طباعة (ورقة)', price: 3 },
  { id: 6, name: 'سكانر', price: 5 },
];

// ✅ UTC Fix: بيستخدم timezone الجهاز تلقائياً بدون تحديد offset
function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('ar-EG', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ✅ تحويل الدقائق الخام → ساعات كاملة محاسَب عليها (نفس منطق الـ Backend)
//    Math.ceil  → أي كسر من ساعة = ساعة كاملة
//    Math.max 1 → الحد الأدنى ساعة واحدة دايماً
//    Math.min 4 → لا يتجاوز الحد الأقصى
function getBilledHours(durationMin, maxHours = 4) {
  const rawHours = durationMin / 60;
  return Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
}

export default function InvoicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, client } = location.state || {};

  const [addedServices, setAddedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [note, setNote] = useState('');
  const [printed, setPrinted] = useState(false);

  // لو مفيش data → ارجع للسكانر
  if (!session || !client) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ color: 'var(--muted)' }}>لا توجد بيانات فاتورة</div>
        <button className="btn btn-primary" onClick={() => navigate('/scanner')}>العودة للسكانر</button>
      </div>
    );
  }

  const sessionCost   = parseFloat(session.cost || 0);
  const servicesCost  = addedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const total         = sessionCost + servicesCost;

  // ✅ الساعات الكاملة المحاسَب عليها
  const billedHours = getBilledHours(session.durationMin);

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const now     = new Date();

  // ✅ UTC Fix: toLocaleDateString/toLocaleTimeString بتستخدم timezone الجهاز تلقائياً
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

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

  function handlePrint() {
    window.print();
    setPrinted(true);
    toast.success('تمت طباعة الفاتورة');
  }

  function handleDone() {
    navigate('/scanner');
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-area { max-width: 320px; margin: 0 auto; font-family: monospace; }
        }
        @media screen {
          .print-area { max-width: 480px; margin: 0 auto; }
        }
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

          {/* رأس الفاتورة */}
          <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>🏢 Link Space</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>نظام إدارة مساحة العمل المشتركة</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>#{invoiceNumber}</span>
              <span style={{ color: 'var(--muted)' }}>{dateStr} — {timeStr}</span>
            </div>
          </div>

          {/* بيانات العميل */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>بيانات العميل</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{client.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{client.phone}</div>
          </div>

          {/* تفاصيل الجلسة */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>تفاصيل الجلسة</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span>منطقة العمل المشتركة</span>
              <span style={{ fontWeight: 600 }}>{sessionCost.toFixed(2)} ج</span>
            </div>

            {/* ✅ عرض الساعات الكاملة المحاسَب عليها + وقت الدخول والخروج صح */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
              <span>
                المدة: {billedHours} {billedHours === 1 ? 'ساعة' : 'ساعات'}
                <span style={{ fontSize: 11, marginRight: 4, opacity: 0.7 }}>
                  ({session.durationMin} د فعلية)
                </span>
              </span>
              <span>سعر الساعة: {session.pricePerHr || '—'} ج</span>
            </div>

            {/* ✅ UTC Fix: وقت الدخول والخروج بـ timezone الجهاز */}
            {session.checkIn && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.8 }}>
                <span>دخول: {formatTime(session.checkIn)}</span>
                <span>خروج: {formatTime(session.checkOut || new Date().toISOString())}</span>
              </div>
            )}
          </div>

          {/* الخدمات المضافة */}
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

          {/* شكراً */}
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            شكراً لزيارتكم 🙏
          </div>
        </div>

        {/* ===== أدوات (مش بتطبع) ===== */}
        <div className="no-print">

          {/* إضافة خدمات */}
          <div className="section-title">إضافة خدمات / مشروبات</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {SERVICES_LIST.map(s => (
              <button key={s.id} onClick={() => addService(s)}
                style={{ padding: '10px 8px', borderRadius: 10, border: '1px solid var(--border)', background: addedServices.find(x => x.id === s.id) ? 'rgba(0,212,170,0.1)' : 'transparent', borderColor: addedServices.find(x => x.id === s.id) ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>{s.price} ج</div>
                {addedServices.find(x => x.id === s.id) && (
                  <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>×{addedServices.find(x => x.id === s.id).qty}</div>
                )}
              </button>
            ))}
          </div>

          {/* طريقة الدفع */}
          <div className="section-title">طريقة الدفع</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['wallet', '💳 محفظة'], ['cash', '💵 كاش']].map(([method, label]) => (
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

          {/* أزرار */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
              🖨️ طباعة الفاتورة
            </button>
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

