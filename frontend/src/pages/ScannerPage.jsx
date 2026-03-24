import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sessionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const [manualCode, setManualCode] = useState('');
  const [activeClients, setActiveClients] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState('device');
  const scanModeRef = useRef('device');
  const inputRef = useRef(null);
  const html5QrRef = useRef(null);
  const lastScannedRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function changeScanMode(mode) {
    scanModeRef.current = mode;
    setScanMode(mode);
  }

  useEffect(() => {
    loadActive();
    focusInput();
    const handleClick = () => { if (scanModeRef.current === 'device') focusInput(); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [focusInput]);

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
      focusInput();
    }
    return () => stopCamera();
  }, [scanMode]);

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
          if (
            decodedText === lastScannedRef.current &&
            now - lastScannedTimeRef.current < 5000
          ) return;
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

  async function loadActive() {
    try {
      const { data } = await sessionsAPI.active();
      setActiveClients(data.sessions);
    } catch { }
  }

  async function handleScan(qrCode) {
    if (!qrCode.trim() || scanningRef.current) return;

    lastScannedRef.current = qrCode.trim();
    lastScannedTimeRef.current = Date.now();

    scanningRef.current = true;
    setScanning(true);

    try {
      const { data } = await sessionsAPI.scan(qrCode.trim());
      if (scanModeRef.current === 'camera') await stopCamera();
      setResult(data);
      setManualCode('');
      loadActive();

      if (data.action === 'checkin') {
        toast.success(`تم تسجيل دخول ${data.client.name}`);
        setTimeout(() => {
          if (scanModeRef.current === 'camera') startCamera();
        }, 2000);
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

  // ✅ حساب التكلفة المتوقعة بالحد الأقصى 4 ساعات
  const calcCost = (elapsedMin, pricePerHr) => {
    const MAX_HOURS = 4;
    const hours = Math.min(elapsedMin / 60, MAX_HOURS);
    return (hours * pricePerHr).toFixed(2);
  };

  const elapsed = (checkIn) => {
    const min = Math.floor((Date.now() - new Date(checkIn)) / 60000);
    return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} س`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
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
          {!cameraActive && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 13 }}>جارٍ تشغيل الكاميرا...</div>
          )}
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
              <div style={{ fontSize: 32, marginBottom: 8 }}>{scanning ? '⏳' : '📡'}</div>
              <div style={{ fontSize: 13, color: 'var(--accent)', opacity: 0.8 }}>{scanning ? 'جارٍ المسح...' : 'جاهز للمسح'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{scanning ? '' : 'امسح الـ QR الآن'}</div>
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
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{result.client.name}</div>
          {result.action === 'checkin' ? (
            <>
              <div className="stat-row"><span className="stat-label">الرصيد</span><span className="stat-val" style={{ color: 'var(--accent)' }}>{parseFloat(result.client.balance).toFixed(2)} ج</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">سعر الساعة</span><span className="stat-val">{result.pricePerHr} ج</span></div>
            </>
          ) : (
            <>
              <div className="stat-row"><span className="stat-label">المدة</span><span className="stat-val">{Math.floor(result.session.durationMin / 60)}س {result.session.durationMin % 60}د</span></div>
              <div className="stat-row"><span className="stat-label">التكلفة</span><span className="stat-val" style={{ color: 'var(--warning)', fontSize: 18 }}>{result.session.cost} ج</span></div>
              <div className="stat-row"><span className="stat-label">الدفع</span><span className={`badge badge-${result.session.paymentMethod === 'wallet' ? 'info' : 'warning'}`}>{result.session.paymentMethod === 'wallet' ? 'من المحفظة' : 'كاش'}</span></div>
              <div className="stat-row" style={{ border: 'none' }}><span className="stat-label">نقاط مكتسبة</span><span className="stat-val" style={{ color: 'var(--success)' }}>+{result.session.pointsEarned} نقطة</span></div>
            </>
          )}
          <button onClick={() => { setResult(null); focusInput(); }} style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 20px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>إغلاق</button>
        </div>
      )}

      {/* Active Clients */}
      <div className="section-title">النشطون الآن ({activeClients.length})</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeClients.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>لا يوجد عملاء نشطون</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>العميل</th><th>المدة</th><th>التكلفة المتوقعة</th></tr></thead>
            <tbody>
              {activeClients.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.phone}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{elapsed(s.check_in)}</td>
                  {/* ✅ حساب التكلفة بالحد الأقصى 4 ساعات */}
                  <td style={{ color: 'var(--warning)' }}>
                    {calcCost(parseFloat(s.elapsed_min), parseFloat(s.price_per_hr))} ج
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
