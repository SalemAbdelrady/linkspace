import React, { useState, useEffect } from 'react';
import { staffAPI, spacesAPI, servicesAPI, adminAPI, quickSaleAPI, bookingsAPI, sessionsAPI } from '../utils/api';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
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

  // ── Print ──────────────────────────────────────────────────────────
  
  function handlePrint() {
    window.print();
  }

  // ── Save PDF ───────────────────────────────────────────────────────
  async function handleSavePDF() {
    async function loadScript(src) {
      if (document.querySelector(`script[src="${src}"]`)) return;
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');

    const element = document.getElementById('inv-modal-print');
    if (!element) return;

    // ── إخفاء الأزرار ──
    const noPrintEls = element.querySelectorAll('.inv-no-print');
    noPrintEls.forEach(el => el.style.display = 'none');

    // ── حفظ الستايل الأصلي ──
    const originalStyle = {
      maxHeight:    element.style.maxHeight,
      overflowY:    element.style.overflowY,
      background:   element.style.background,
      color:        element.style.color,
      borderRadius: element.style.borderRadius,
      width:        element.style.width,
    };

    // ── تطبيق ستايل الطباعة ──
    element.style.maxHeight    = 'none';
    element.style.overflowY    = 'visible';
    element.style.background   = '#ffffff';
    element.style.color        = '#000000';
    element.style.borderRadius = '0';
    element.style.width        = '380px';

    // ── تغيير ألوان النصوص للأسود ──
    const allEls = element.querySelectorAll('*');
    const originalColors = [];
    allEls.forEach(el => {
      originalColors.push({
        el,
        color:      el.style.color,
        background: el.style.background,
        borderColor: el.style.borderColor,
      });
      const computed = window.getComputedStyle(el);
      // النصوص الملونة → أسود، الـ muted → رمادي داكن
      if (computed.color.includes('212, 170') || // accent أخضر
          computed.color.includes('255, 165') || // warning برتقالي  
          computed.color.includes('59, 130'))  { // أزرق
        el.style.color = '#1a6b5a'; // أخضر داكن مناسب للطباعة
      }
    });

    try {
      await new Promise(r => setTimeout(r, 100)); // انتظر الـ rerender

      // ✅ scale أقل (1.5 بدل 2.5) — يقلل حجم الـ canvas بشكل كبير
      // كفاية جداً لإيصال صغير، الفرق في الجودة غير ملاحظ تقريباً
      const canvas = await window.html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 420,
      });

      const { jsPDF } = window.jspdf;

      const imgWidth  = 80; // mm — عرض إيصال
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        unit: 'mm',
        format: [imgWidth, imgHeight + 10], // +10 هامش سفلي
        orientation: 'portrait',
        compress: true, // ✅ تفعيل ضغط jsPDF الداخلي
      });

      // ✅ JPEG بجودة 0.85 بدل PNG — الفرق في حجم الملف ضخم جداً
      // (PNG غير مضغوط للصور بتدرجات، JPEG مضغوط بطبيعته)
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      pdf.addImage(imgData, 'JPEG', 0, 5, imgWidth, imgHeight);
      pdf.save(`فاتورة-${invoice.invoice_number}.pdf`);

    } finally {
      // ── إرجاع كل حاجة لأصلها ──
      Object.assign(element.style, originalStyle);
      noPrintEls.forEach(el => el.style.display = '');
      originalColors.forEach(({ el, color, background, borderColor }) => {
        el.style.color       = color;
        el.style.background  = background;
        el.style.borderColor = borderColor;
      });
    }
  }
  
  return (
      <>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #inv-modal-print, #inv-modal-print * { visibility: visible !important; }
        #inv-modal-print {
          position: fixed !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
          padding: 20px !important;
          font-family: Arial, sans-serif !important;
          direction: rtl !important;
        }
        .inv-no-print { display: none !important; }
        @page { 
          size: A5 portrait; 
          margin: 5mm; 
        }
        #inv-modal-print {
          max-height: none !important;
          overflow: visible !important;
        }
    `}</style>

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div id="inv-modal-print" style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
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
            <div className="inv-no-print" style={{ display:'flex', gap:6, marginBottom:12, marginTop:4 }}>
            <button onClick={handlePrint}
              style={{ flex:1, padding:'6px 10px', borderRadius:8,
                border:'1px solid var(--border)', background:'transparent',
                color:'var(--text)', fontSize:11, fontWeight:600, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              🖨️ طباعة
            </button>
            <button onClick={handleSavePDF}
              style={{ flex:1, padding:'6px 10px', borderRadius:8,
                border:'1px solid rgba(0,212,170,0.4)',
                background:'rgba(0,212,170,0.08)',
                color:'var(--accent)', fontSize:11, fontWeight:600, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              📄 PDF
            </button>
          </div>

          <button className="inv-no-print" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
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
    </>
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
  const [svcSearch,   setSvcSearch]   = useState('');


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
            {allServices
              .filter(s =>
                s.name.toLowerCase().includes(svcSearch.toLowerCase()) ||
                String(s.price).includes(svcSearch)
              )
              .map(svc => (
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

  const [canEditPrices,    setCanEditPrices]    = useState(false);

  // ── Logout Modal + Badges ──────────────────────────────────────────────
  const [showLogout,      setShowLogout]      = useState(false);
  const [pendingCount,    setPendingCount]    = useState(0);
  const [activeCount,     setActiveCount]     = useState(0);

  // ── الكوبونات ────────────────────────────────────────────────────────
  const [myCoupons,       setMyCoupons]       = useState([]);
  const [couponForm,      setCouponForm]       = useState({ code: '', discount: 20, days: 30, max_uses: 1 });
  const [couponLoading,   setCouponLoading]   = useState(false);
  const [couponSearch,    setCouponSearch]    = useState('');
  const [couponMsg,       setCouponMsg]       = useState(null);

  // ── التقارير ─────────────────────────────────────────────────────────
  const [reportType,      setReportType]      = useState('daily');
  const [reportDate,      setReportDate]      = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportMonth,     setReportMonth]     = useState(format(new Date(), 'yyyy-MM'));
  const [reportData,      setReportData]      = useState(null);
  const [reportLoading,   setReportLoading]   = useState(false);

  // ── عمليات العملاء ──────────────────────────────────────────────────
  const [clientSearch,    setClientSearch]    = useState('');
  const [clientResults,   setClientResults]   = useState([]);
  const [selectedClient,  setSelectedClient]  = useState(null);
  const [walletAmount,    setWalletAmount]     = useState('');
  const [pointsAmount,    setPointsAmount]     = useState('');
  const [clientOpLoading, setClientOpLoading] = useState(false);
  const [canChargeWallet,  setCanChargeWallet]  = useState(false);
  const [canAddPoints,     setCanAddPoints]     = useState(false);
  const [canCreateCoupons, setCanCreateCoupons] = useState(false);
  const [canViewReports,   setCanViewReports]   = useState(false);
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
  useEffect(() => { if (tab === 'prices')  { loadSpaces(); loadServicesData(); } }, [tab]);
  useEffect(() => { if (tab === 'coupons') { loadMyCoupons(); }  }, [tab]);

  // تحميل عداد الحجوزات المعلقة + الجلسات النشطة كل 30 ثانية
  useEffect(() => {
    loadBadges();
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { if (tab === 'reports') { loadReport(); }     }, [tab]);

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

  async function loadBadges() {
    try {
      const [bookRes, sessRes] = await Promise.all([
        bookingsAPI.all({ status: 'pending' }),
        sessionsAPI.active(),
      ]);
      setPendingCount(bookRes.data.bookings?.length || 0);
      setActiveCount(sessRes.data.sessions?.length || 0);
    } catch {}
  }

  async function checkPermissions() {
    try {
      const { data } = await staffAPI.myPermissions();
      const p = data.permissions || {};
      setCanEditPrices   (p.can_edit_prices    === true);
      setCanChargeWallet (p.can_charge_wallet  === true);
      setCanAddPoints    (p.can_add_points     === true);
      setCanCreateCoupons(p.can_create_coupons === true);
      setCanViewReports  (p.can_view_reports   === true);
    } catch {}
  }

  // ── دوال الكوبونات ───────────────────────────────────────────────────
  async function loadMyCoupons() {
    try {
      const { data } = await adminAPI.allCoupons();
      setMyCoupons(data.coupons || []);
    } catch {}
  }

  async function createCoupon() {
    if (!couponForm.discount || !couponForm.days) return toast.error('أدخل نسبة الخصم والمدة');
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const { data } = await adminAPI.createCoupon({
        code      : couponForm.code.trim().toUpperCase() || undefined,
        discount  : parseInt(couponForm.discount),
        days      : parseInt(couponForm.days),
        max_uses  : parseInt(couponForm.max_uses) || 1,
      });
      setCouponMsg({ type: 'success', text: `✅ الكوبون: ${data.coupon.code} — خصم ${data.coupon.discount_pct}%` });
      setCouponForm({ code: '', discount: 20, days: 30, max_uses: 1 });
      loadMyCoupons();
    } catch (err) {
      setCouponMsg({ type: 'error', text: err.response?.data?.error || 'خطأ في الإنشاء' });
    } finally {
      setCouponLoading(false);
    }
  }

  async function revokeCoupon(id) {
    try {
      await adminAPI.revokeCoupon(id);
      toast.success('تم إلغاء الكوبون');
      loadMyCoupons();
    } catch { toast.error('خطأ في الإلغاء'); }
  }

  // ── دوال التقارير ──────────────────────────────────────────────────
  async function loadReport() {
    setReportLoading(true);
    setReportData(null);
    try {
      if (reportType === 'daily') {
        const { data } = await adminAPI.dailyReport(reportDate);
        setReportData(data);
      } else {
        const [y, m] = reportMonth.split('-');
        const { data } = await adminAPI.monthlyReport(y, m);
        setReportData(data);
      }
    } catch { toast.error('خطأ في تحميل التقرير'); }
    finally { setReportLoading(false); }
  }

  // ── دوال عمليات العملاء ───────────────────────────────────────────────
  async function searchClients(q) {
    if (q.length < 2) { setClientResults([]); return; }
    try {
      const { data } = await staffAPI.searchClients(q);
      setClientResults(data.clients || []);
    } catch {}
  }

  async function chargeClientWallet() {
    if (!selectedClient || !walletAmount) return toast.error('أدخل المبلغ');
    const amt = parseFloat(walletAmount);
    if (isNaN(amt) || amt <= 0) return toast.error('مبلغ غير صحيح');
    setClientOpLoading(true);
    try {
      await adminAPI.chargeWallet(selectedClient.id, amt);
      setSelectedClient(prev => ({ ...prev, balance: (parseFloat(prev.balance) + amt).toFixed(2) }));
      setWalletAmount('');
      toast.success(`✅ تم شحن ${amt} ج لـ ${selectedClient.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الشحن');
    } finally { setClientOpLoading(false); }
  }

  async function addClientPoints() {
    if (!selectedClient || !pointsAmount) return toast.error('أدخل عدد النقاط');
    const pts = parseInt(pointsAmount);
    if (isNaN(pts) || pts <= 0) return toast.error('نقاط غير صحيحة');
    setClientOpLoading(true);
    try {
      await adminAPI.addPoints(selectedClient.id, pts);
      setSelectedClient(prev => ({ ...prev, points: (parseInt(prev.points || 0) + pts) }));
      setPointsAmount('');
      toast.success(`✅ تمت إضافة ${pts} نقطة لـ ${selectedClient.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في إضافة النقاط');
    } finally { setClientOpLoading(false); }
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

      {showLogout && (
        <LogoutConfirmModal
          onConfirm={() => { setShowLogout(false); logout(); }}
          onCancel={() => setShowLogout(false)}
        />
      )}

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
          <button onClick={() => navigate('/bookings')}
            style={{ position:'relative', background: 'transparent', border: '1px solid var(--accent)',
              color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            📅 الحجوزات
            {pendingCount > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, minWidth:18, height:18,
                borderRadius:9, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px',
                border:'2px solid var(--bg)' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/scanner')}
            style={{ position:'relative', background: 'transparent', border: '1px solid var(--accent)',
              color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            📡 Scanner
            {activeCount > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, minWidth:18, height:18,
                borderRadius:9, background:'#10b981', color:'#fff', fontSize:10, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px',
                border:'2px solid var(--bg)' }}>
                {activeCount > 99 ? '99+' : activeCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowLogout(true)}
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
          ...(canEditPrices                       ? [['prices',  '💰 الأسعار']]   : []),
          ...((canChargeWallet || canAddPoints)  ? [['clients', '👥 العملاء']]    : []),
          ...(canCreateCoupons                   ? [['coupons', '🎟️ الكوبونات']] : []),
          ...(canViewReports                     ? [['reports', '📊 التقارير']]  : []),
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

        {/* ══ CLIENTS OPS ══ */}
        {tab === 'clients' && (canChargeWallet || canAddPoints) && (
          <div className="fade-up">

            {/* بحث عن عميل */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input className="input-field"
                placeholder="🔍 ابحث عن عميل بالاسم أو الموبايل..."
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); searchClients(e.target.value); }} />
              {clientResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 30,
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                  {clientResults.map(c => (
                    <div key={c.id}
                      onClick={() => { setSelectedClient(c); setClientSearch(c.name); setClientResults([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.phone} · رصيد: {parseFloat(c.balance||0).toFixed(2)} ج · نقاط: {c.points||0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* بطاقة العميل المختار */}
            {selectedClient ? (
              <div>
                <div className="card" style={{ marginBottom: 16, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedClient.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{selectedClient.phone}</div>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <div style={{ textAlign: 'center', padding: '10px 0', background: 'rgba(0,0,0,0.1)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>💳 الرصيد</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{parseFloat(selectedClient.balance||0).toFixed(2)} ج</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px 0', background: 'rgba(0,0,0,0.1)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>⭐ النقاط</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{selectedClient.points||0}</div>
                    </div>
                  </div>
                </div>

                {/* شحن المحفظة */}
                {canChargeWallet && (
                  <div className="card" style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 10 }}>💳 شحن المحفظة</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <input className="input-field" type="number" placeholder="المبلغ بالجنيه..."
                        value={walletAmount} onChange={e => setWalletAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && chargeClientWallet()} />
                      <button className="btn btn-primary" style={{ padding: '0 20px' }}
                        disabled={clientOpLoading || !walletAmount}
                        onClick={chargeClientWallet}>
                        {clientOpLoading ? '...' : 'شحن'}
                      </button>
                    </div>
                  </div>
                )}

                {/* إضافة نقاط */}
                {canAddPoints && (
                  <div className="card">
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', marginBottom: 10 }}>⭐ إضافة نقاط</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <input className="input-field" type="number" placeholder="عدد النقاط..."
                        value={pointsAmount} onChange={e => setPointsAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addClientPoints()} />
                      <button className="btn btn-primary" style={{ padding: '0 20px', background: 'var(--warning)', color: '#000' }}
                        disabled={clientOpLoading || !pointsAmount}
                        onClick={addClientPoints}>
                        {clientOpLoading ? '...' : 'إضافة'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>ابحث عن عميل</div>
                <div style={{ fontSize: 13 }}>اكتب الاسم أو رقم الموبايل للبحث</div>
              </div>
            )}
          </div>
        )}

        {/* ══ COUPONS ══ */}
        {tab === 'coupons' && canCreateCoupons && (
          <div className="fade-up">

            {/* فورم إنشاء كوبون */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 14 }}>🎟️ إنشاء كوبون جديد</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>كود الكوبون (اختياري)</div>
                  <input className="input-field" placeholder="مثال: SUMMER20"
                    value={couponForm.code}
                    onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>نسبة الخصم %</div>
                  <input className="input-field" type="number" min="1" max="100" placeholder="20"
                    value={couponForm.discount}
                    onChange={e => setCouponForm(p => ({ ...p, discount: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>الصلاحية (أيام)</div>
                  <input className="input-field" type="number" min="1" placeholder="30"
                    value={couponForm.days}
                    onChange={e => setCouponForm(p => ({ ...p, days: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>عدد مرات الاستخدام</div>
                  <input className="input-field" type="number" min="1" placeholder="1"
                    value={couponForm.max_uses}
                    onChange={e => setCouponForm(p => ({ ...p, max_uses: e.target.value }))} />
                </div>
              </div>
              {couponMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13,
                  background: couponMsg.type === 'success' ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
                  color: couponMsg.type === 'success' ? 'var(--accent)' : '#ff4757',
                  border: `1px solid ${couponMsg.type === 'success' ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
                  {couponMsg.text}
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%' }}
                disabled={couponLoading} onClick={createCoupon}>
                {couponLoading ? 'جارٍ الإنشاء...' : '✨ إنشاء الكوبون'}
              </button>
            </div>

            {/* قائمة الكوبونات */}
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>
              الكوبونات الموجودة ({myCoupons.length})
            </div>
            <input className="input-field" placeholder="🔍 بحث بالكود..." style={{ marginBottom: 12 }}
              value={couponSearch} onChange={e => setCouponSearch(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myCoupons
                .filter(c => c.code.includes(couponSearch.toUpperCase()))
                .map(c => {
                  const expired     = new Date(c.expires_at) < new Date();
                  const used        = c.is_used || c.uses_count >= c.max_uses;
                  const statusColor = c.is_revoked ? '#ff4757' : expired ? 'var(--muted)' : used ? 'var(--warning)' : 'var(--accent)';
                  const statusText  = c.is_revoked ? 'ملغي' : expired ? 'منتهي' : used ? 'مستخدم' : 'فعّال';
                  return (
                    <div key={c.id} className="card" style={{ opacity: (c.is_revoked || expired) ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: 2 }}>
                            {c.code}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                            خصم {c.discount_pct}% · {c.uses_count || 0}/{c.max_uses} استخدام
                            · ينتهي {new Date(c.expires_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                          </div>
                          {c.client_name && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>👤 {c.client_name}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, padding: '2px 8px',
                            background: statusColor + '18', borderRadius: 8, border: '1px solid ' + statusColor + '40' }}>
                            {statusText}
                          </span>
                          {!c.is_revoked && !expired && !used && (
                            <button onClick={() => revokeCoupon(c.id)}
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6,
                                border: '1px solid rgba(255,71,87,0.4)', background: 'transparent',
                                color: '#ff4757', cursor: 'pointer' }}>
                              إلغاء
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {myCoupons.length === 0 && (
                <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                  لا توجد كوبونات بعد
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ REPORTS ══ */}
        {tab === 'reports' && canViewReports && (
          <div className="fade-up">

            {/* اختيار نوع التقرير والتاريخ */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[['daily','📅 يومي'],['monthly','📆 شهري']].map(([k,label]) => (
                  <button key={k} onClick={() => { setReportType(k); setReportData(null); }}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      borderColor: reportType === k ? 'var(--accent)' : 'var(--border)',
                      background:  reportType === k ? 'var(--accent)' : 'transparent',
                      color:       reportType === k ? '#000' : 'var(--muted)' }}>
                    {label}
                  </button>
                ))}
              </div>
              {reportType === 'daily' ? (
                <input type="date" className="input-field" value={reportDate}
                  onChange={e => setReportDate(e.target.value)} />
              ) : (
                <input type="month" className="input-field" value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)} />
              )}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}
                onClick={loadReport} disabled={reportLoading}>
                {reportLoading ? 'جارٍ التحميل...' : '🔍 عرض التقرير'}
              </button>
            </div>

            {/* نتائج التقرير */}
            {reportLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>جارٍ التحميل...</div>
            )}

            {reportData && reportType === 'daily' && (
              <div className="fade-up">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    ['🚶 الزيارات',  reportData.summary?.visits || 0,                                        'var(--text)'],
                    ['💰 الإيرادات', `${parseFloat(reportData.summary?.total_revenue || 0).toFixed(0)} ج`,  'var(--accent)'],
                    ['⏱️ متوسط المدة',`${Math.round(reportData.summary?.avg_duration || 0)} د`,              '#3b82f6'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="card" style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ marginBottom: 16, padding: '10px 12px',
                  background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <span style={{ fontSize: 13 }}>🟢 العملاء الحاليون: </span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{reportData.active_now}</span>
                </div>

                {reportData.by_hour?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📈 توزيع الزيارات بالساعة</div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={reportData.by_hour.map(h => ({ name: `${h.hour}:00`, visits: parseInt(h.visits) }))}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                          formatter={v => [v, 'زيارة']} />
                        <Bar dataKey="visits" fill="var(--accent)" radius={[4,4,0,0]} opacity={0.85}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {reportData && reportType === 'monthly' && (
              <div className="fade-up">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    ['🚶 الزيارات',   reportData.totals?.total_visits || 0,                                         'var(--text)'],
                    ['💰 الإيرادات',  `${parseFloat(reportData.totals?.total_revenue || 0).toFixed(0)} ج`,          'var(--accent)'],
                    ['⏱️ متوسط المدة', `${Math.round(reportData.totals?.avg_duration || 0)} د`,                      '#3b82f6'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="card" style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {reportData.daily?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📈 الإيرادات اليومية</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={reportData.daily.map(d => ({
                          name: new Date(d.day).toLocaleDateString('ar-EG', { day: 'numeric' }),
                          revenue: parseFloat(d.revenue), visits: parseInt(d.visits) }))}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                          formatter={(v, n) => [n === 'revenue' ? `${v} ج` : v, n === 'revenue' ? 'الإيراد' : 'زيارات']} />
                        <Bar dataKey="revenue" fill="var(--accent)" radius={[4,4,0,0]} opacity={0.85}/>
                        <Bar dataKey="visits"  fill="#3b82f6"       radius={[4,4,0,0]} opacity={0.6}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
