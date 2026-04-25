import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sessionsAPI, spacesAPI, servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../utils/api';

const SPACE_ICONS = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };

// ── مودال إضافة طلب على جلسة نشطة ───────────────────────────────────
function AddOrderModal({ session, onClose, onAdded }) {
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [orders,    setOrders]    = useState([]); // الطلبات الحالية

  useEffect(() => {
    // جيب الخدمات المتاحة
    servicesAPI.getAll()
      .then(({ data }) => setServices(data.services || []))
      .catch(() => toast.error('خطأ في تحميل الخدمات'));

    // جيب الطلبات الحالية للجلسة
    api.get(`/orders/session/${session.id}`)
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {});
  }, [session.id]);

  async function addOrder(service) {
    setSaving(true);
    try {
      const { data } = await api.post('/orders/add', {
        session_id:   session.id,
        service_id:   service.id,
        service_name: service.name,
        price:        service.price,
        qty:          1,
      });
      setOrders(prev => [...prev, data.order]);
      toast.success(`✅ تم إضافة ${service.name}`);
      onAdded && onAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الإضافة');
    } finally {
      setSaving(false);
    }
  }

  async function removeOrder(orderId) {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('تم الحذف');
    } catch {
      toast.error('خطأ في الحذف');
    }
  }

  const ordersTotal = orders.reduce((sum, o) => sum + parseFloat(o.price) * o.qty, 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 16px 16px', padding: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>☕ إضافة طلب</div>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>{session.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{session.phone}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* الطلبات الحالية */}
        {orders.length > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>الطلبات الحالية</div>
            {orders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{o.service_name} × {o.qty}</span>
                  <span style={{ fontSize: 10, color: o.added_by === 'client' ? 'var(--accent)' : 'var(--muted)', padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                    {o.added_by === 'client' ? '👤 عميل' : '👷 طاقم'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{(parseFloat(o.price) * o.qty).toFixed(2)} ج</span>
                  <button onClick={() => removeOrder(o.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
              <span>المجموع</span>
              <span>{ordersTotal.toFixed(2)} ج</span>
            </div>
          </div>
        )}

        {/* الخدمات المتاحة */}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600 }}>اختر خدمة أو مشروب</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {services.map(s => (
            <button key={s.id} onClick={() => addOrder(s)} disabled={saving}
              style={{ padding: '12px 8px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', cursor: saving ? 'not-allowed' : 'pointer', textAlign: 'center', transition: 'all 0.15s', opacity: saving ? 0.6 : 1 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{s.price} ج</div>
            </button>
          ))}
        </div>

        <button onClick={onClose}
          style={{ width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ✅ تم
        </button>
      </div>
    </div>
  );
}

// ── ScannerPage ───────────────────────────────────────────────────────
export default function ScannerPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [result,        setResult]        = useState(null);
  const [scanning,      setScanning]      = useState(false);
  const scanningRef     = useRef(false);
  const [manualCode,    setManualCode]    = useState('');
  const [activeClients, setActiveClients] = useState([]);
  const [cameraActive,  setCameraActive]  = useState(false);
  const [scanMode,      setScanMode]      = useState('device');
  const [tick,          setTick]          = useState(0);
  const [spaces,        setSpaces]        = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('cowork');

  // ✅ مودال إضافة الطلبات
  const [orderModal,    setOrderModal]    = useState(null); // session object

  // ✅ عداد الطلبات لكل جلسة
  const [sessionOrders, setSessionOrders] = useState({}); // { session_id: count }

  const scanModeRef        = useRef('device');
  const inputRef           = useRef(null);
  const html5QrRef         = useRef(null);
  const lastScannedRef     = useRef('');
  const lastScannedTimeRef = useRef(0);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function changeScanMode(mode) { scanModeRef.current = mode; setScanMode(mode); }

  useEffect(() => {
    loadActive();
    loadSpaces();
    focusInput();
    const handleClick = () => { if (scanModeRef.current === 'device') focusInput(); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [focusInput]);

  useEffect(() => {
    if (scanMode === 'camera') { startCamera(); }
    else { stopCamera(); focusInput(); }
    return () => stopCamera();
  }, [scanMode]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      setSpaces(data.spaces || []);
    } catch { }
  }

  async function loadActive() {
    try {
      const { data } = await sessionsAPI.active();
      setActiveClients(data.sessions);
      // جيب عدد الطلبات لكل جلسة
      loadOrdersCounts(data.sessions);
    } catch { }
  }

  // ✅ جيب عدد الطلبات لكل جلسة نشطة
  async function loadOrdersCounts(sessions) {
    const counts = {};
    await Promise.all(sessions.map(async (s) => {
      try {
        const { data } = await api.get(`/orders/session/${s.id}`);
        counts[s.id] = { count: data.orders.length, total: data.total };
      } catch {
        counts[s.id] = { count: 0, total: 0 };
      }
    }));
    setSessionOrders(counts);
  }

  async function startCamera() {
    try {
      const qr = new Html5Qrcode('camera-reader');
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (scanningRef.current) return;
          const now = Date.now();
          if (decodedText === lastScannedRef.current && now - lastScannedTimeRef.current < 5000) return;
          await handleScan(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err) {
      toast.error('تعذر تشغيل الكاميرا — تحقق من الإذن');
      changeScanMode('device');
    }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setCameraActive(false);
  }

  async function handleScan(qrCode) {
    if (!qrCode.trim() || scanningRef.current) return;
    lastScannedRef.current     = qrCode.trim();
    lastScannedTimeRef.current = Date.now();
    scanningRef.current        = true;
    setScanning(true);
    try {
      const { data } = await sessionsAPI.scan(qrCode.trim(), selectedSpace);
      if (scanModeRef.current === 'camera') await stopCamera();
      setResult(data);
      setManualCode('');
      loadActive();
      if (data.action === 'checkin') {
        toast.success(`تم تسجيل دخول ${data.client.name} — ${data.spaceName}`);
        setTimeout(() => { if (scanModeRef.current === 'camera') startCamera(); }, 2000);
      } else {
        toast.success(`تم تسجيل خروج ${data.client.name}`);
        navigate('/invoice', { state: { session: data.session, client: data.client } });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في المسح');
      if (scanModeRef.current === 'camera') startCamera();
    } finally {
      scanningRef.current = false;
      setScanning(false);
      if (scanModeRef.current === 'device') focusInput();
    }
  }

  function calcCost(checkIn, pricePerHr, maxHours = 4) {
    const elapsedMs   = Date.now() - new Date(checkIn);
    const rawHours    = elapsedMs / 3600000;
    const billedHours = Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
    return (billedHours * pricePerHr).toFixed(2);
  }

  function elapsed(checkIn) {
    const totalSec = Math.floor((Date.now() - new Date(checkIn)) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':') + ' س';
  }

  function getBilledHours(durationMin, maxHours = 4) {
    return Math.min(Math.max(Math.ceil(durationMin / 60), 1), maxHours);
  }

  const currentSpace = spaces.find(s => s.space_key === selectedSpace);

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>

      {/* ✅ مودال إضافة الطلبات */}
      {orderModal && (
        <AddOrderModal
          session={orderModal}
          onClose={() => { setOrderModal(null); loadActive(); }}
          onAdded={() => loadOrdersCounts(activeClients)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>واجهة الاستقبال</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin')}
            style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>← رجوع</button>
          <button onClick={logout}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
        </div>
      </div>

      {/* اختيار المساحة */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>نوع المساحة</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(spaces.length === 0 ? [
            { space_key: 'cowork',  name: 'منطقة العمل المشتركة', first_hour: 30  },
            { space_key: 'meeting', name: 'غرفة الاجتماعات',      first_hour: 150 },
            { space_key: 'lessons', name: 'غرفة الدروس',           first_hour: 200 },
          ] : spaces).map(s => (
            <button key={s.space_key} onClick={() => setSelectedSpace(s.space_key)}
              style={{ flex: 1, padding: '10px 8px', borderRadius: 12, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', borderColor: selectedSpace === s.space_key ? 'var(--accent)' : 'var(--border)', background: selectedSpace === s.space_key ? 'rgba(0,212,170,0.12)' : 'transparent', color: selectedSpace === s.space_key ? 'var(--accent)' : 'var(--muted)' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{SPACE_ICONS[s.space_key] || '🏢'}</div>
              <div style={{ fontSize: 11 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{s.first_hour} ج/س</div>
            </button>
          ))}
        </div>
        {currentSpace && (
          <div style={{ marginTop: 8, padding: '6px 12px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{SPACE_ICONS[selectedSpace]} {currentSpace.name}</span>
            <span>أول ساعة: <strong style={{ color: 'var(--accent)' }}>{currentSpace.first_hour} ج</strong> · الحد الأقصى: <strong style={{ color: 'var(--accent)' }}>{currentSpace.max_hours} ساعة</strong></span>
          </div>
        )}
      </div>

      {/* Toggle Mode */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['device', '📡 ماسح ضوئي'], ['camera', '📷 كاميرا']].map(([mode, label]) => (
          <button key={mode} onClick={() => changeScanMode(mode)}
            style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderColor: scanMode === mode ? 'var(--accent)' : 'var(--border)', background: scanMode === mode ? 'var(--accent)' : 'transparent', color: scanMode === mode ? '#000' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Camera Mode */}
      {scanMode === 'camera' && (
        <div style={{ marginBottom: 16 }}>
          <div id="camera-reader" style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--accent)' }} />
          {!cameraActive && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 13 }}>جارٍ تشغيل الكاميرا...</div>}
        </div>
      )}

      {/* Device Scanner Mode */}
      {scanMode === 'device' && (
        <>
          <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 20px', border: '2px solid var(--accent)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,170,0.04)' }}>
            {[['top:0;right:0;border-width:3px 0 0 3px;border-radius:8px 0 0 0'],
              ['top:0;left:0;border-width:3px 3px 0 0;border-radius:0 8px 0 0'],
              ['bottom:0;right:0;border-width:0 0 3px 3px;border-radius:0 0 0 8px'],
              ['bottom:0;left:0;border-width:0 3px 3px 0;border-radius:0 0 8px 0']
            ].map(([s], i) => (
              <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderColor: 'var(--accent)', borderStyle: 'solid', ...(Object.fromEntries(s.split(';').map(p => p.split(':')))) }} />
            ))}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{scanning ? '⏳' : (SPACE_ICONS[selectedSpace] || '📡')}</div>
              <div style={{ fontSize: 13, color: 'var(--accent)', opacity: 0.8 }}>{scanning ? 'جارٍ المسح...' : 'جاهز للمسح'}</div>
              {!scanning && currentSpace && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{currentSpace.name}</div>}
            </div>
            <div style={{ position: 'absolute', width: '80%', height: 2, background: 'var(--accent)', opacity: 0.7, animation: 'scanLine 2s ease-in-out infinite' }} />
          </div>
          <style>{`@keyframes scanLine { 0%,100%{top:20%} 50%{top:80%} }`}</style>
        </>
      )}

      {/* Input */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: scanning ? 'var(--warning)' : 'var(--success)', display: 'inline-block' }} />
          {scanning ? 'جارٍ المسح...' : 'في انتظار المسح'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={inputRef} className="input-field" style={{ flex: 1 }} value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
            placeholder="امسح الـ QR أو اكتب الكود يدوياً..."
            autoComplete="off" />
          <button className="btn btn-primary" onClick={() => handleScan(manualCode)} disabled={!manualCode || scanning}>مسح</button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card fade-up" style={{ textAlign: 'center', marginBottom: 14, borderColor: result.action === 'checkin' ? 'rgba(46,213,115,0.5)' : 'rgba(255,165,2,0.5)', background: result.action === 'checkin' ? 'rgba(46,213,115,0.06)' : 'rgba(255,165,2,0.06)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{result.action === 'checkin' ? '✅' : '🏁'}</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: result.action === 'checkin' ? 'var(--success)' : 'var(--warning)', marginBottom: 4 }}>
            {result.action === 'checkin' ? 'تم تسجيل الدخول' : 'انتهاء الجلسة'}
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{result.client.name}</div>
          {result.spaceName && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{SPACE_ICONS[result.spaceKey] || '🏢'} {result.spaceName}</div>}
          {result.session?.spaceName && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{SPACE_ICONS[result.session.spaceKey] || '🏢'} {result.session.spaceName}</div>}
          {result.action === 'checkin' ? (
            <>
              <div className="stat-row"><span className="stat-label">الرصيد</span><span className="stat-val" style={{ color: 'var(--accent)' }}>{parseFloat(result.client.balance).toFixed(2)} ج</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">سعر الساعة</span><span className="stat-val">{result.pricePerHr} ج</span></div>
            </>
          ) : (
            <>
              <div className="stat-row"><span className="stat-label">المدة</span><span className="stat-val">{getBilledHours(result.session.durationMin, result.session.maxHours)} ساعة <span style={{ fontSize: 11, color: 'var(--muted)', marginRight: 6 }}>({result.session.durationMin} د فعلية)</span></span></div>
              <div className="stat-row"><span className="stat-label">التكلفة</span><span className="stat-val" style={{ color: 'var(--warning)', fontSize: 18 }}>{result.session.cost} ج</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">نقاط مكتسبة</span><span className="stat-val" style={{ color: 'var(--success)' }}>+{result.session.pointsEarned} نقطة</span></div>
            </>
          )}
          <button onClick={() => { setResult(null); focusInput(); }} style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 20px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>إغلاق</button>
        </div>
      )}

      {/* ✅ Active Clients — مع زرار إضافة طلب */}
      <div className="section-title">النشطون الآن ({activeClients.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeClients.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 20 }}>لا يوجد عملاء نشطون</div>
        ) : (
          activeClients.map(s => {
            const ordersInfo = sessionOrders[s.id] || { count: 0, total: 0 };
            return (
              <div key={s.id} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.phone}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{SPACE_ICONS[s.space_key] || '🏢'} {s.space_name || 'منطقة العمل'}</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', marginTop: 2 }}>{elapsed(s.check_in)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>جلسة: <strong style={{ color: 'var(--warning)' }}>{calcCost(s.check_in, parseFloat(s.price_per_hr), s.max_hours || 4)} ج</strong></span>
                    {ordersInfo.count > 0 && (
                      <span style={{ color: 'var(--muted)' }}>
                        طلبات: <strong style={{ color: 'var(--accent)' }}>{ordersInfo.total.toFixed(2)} ج</strong>
                        <span style={{ fontSize: 10, background: 'var(--accent)', color: '#000', borderRadius: 10, padding: '1px 6px', marginRight: 4, fontWeight: 700 }}>{ordersInfo.count}</span>
                      </span>
                    )}
                  </div>

                  {/* ✅ زرار إضافة طلب */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setOrderModal(s); }}
                    style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--accent)', background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,170,0.1)'}>
                    ☕ إضافة طلب
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

