import React, { useState, useEffect, useRef } from 'react';
import { sessionsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const { logout } = useAuth();
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [activeClients, setActiveClients] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { loadActive(); }, []);

  async function loadActive() {
    try {
      const { data } = await sessionsAPI.active();
      setActiveClients(data.sessions);
    } catch { /* ignore */ }
  }

  async function handleScan(qrCode) {
    if (!qrCode.trim()) return;
    setScanning(true);
    try {
      const { data } = await sessionsAPI.scan(qrCode.trim());
      setResult(data);
      setManualCode('');
      loadActive();
      if (data.action === 'checkin') toast.success(`تم تسجيل دخول ${data.client.name}`);
      else toast.success(`تم تسجيل خروج ${data.client.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في المسح');
    } finally {
      setScanning(false);
    }
  }

  const elapsed = (checkIn) => {
    const min = Math.floor((Date.now() - new Date(checkIn)) / 60000);
    return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} س`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Link Space</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>واجهة الاستقبال</div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      {/* Scanner Frame */}
      <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 20px', border: '2px solid var(--accent)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,170,0.04)' }}>
        {/* Corners */}
        {[['top:0;right:0;border-width:3px 0 0 3px;border-radius:8px 0 0 0', 'tl'],
          ['top:0;left:0;border-width:3px 3px 0 0;border-radius:0 8px 0 0', 'tr'],
          ['bottom:0;right:0;border-width:0 0 3px 3px;border-radius:0 0 0 8px', 'bl'],
          ['bottom:0;left:0;border-width:0 3px 3px 0;border-radius:0 0 8px 0', 'br']
        ].map(([s]) => (
          <div key={s} style={{ position: 'absolute', width: 20, height: 20, borderColor: 'var(--accent)', borderStyle: 'solid', ...(Object.fromEntries(s.split(';').map(p => p.split(':')))) }} />
        ))}
        <div style={{ fontSize: 13, color: 'var(--accent)', opacity: 0.6, textAlign: 'center' }}>
          {scanning ? '⏳ جارٍ المسح...' : 'جاهز للمسح'}
        </div>
        {/* Scan line */}
        <div style={{ position: 'absolute', width: '80%', height: 2, background: 'var(--accent)', opacity: 0.7, animation: 'scanLine 2s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes scanLine { 0%,100%{top:20%} 50%{top:80%} }`}</style>

      {/* Manual Entry */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>إدخال يدوي أو من كاميرا</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={inputRef} className="input-field" style={{ flex: 1 }} value={manualCode} onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)} placeholder="الصق أو اكتب كود العميل..." />
          <button className="btn btn-primary" onClick={() => handleScan(manualCode)} disabled={!manualCode || scanning}>مسح</button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`card fade-up`} style={{ textAlign: 'center', marginBottom: 14, borderColor: result.action === 'checkin' ? 'rgba(46,213,115,0.5)' : 'rgba(255,165,2,0.5)', background: result.action === 'checkin' ? 'rgba(46,213,115,0.06)' : 'rgba(255,165,2,0.06)' }}>
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
          <button onClick={() => setResult(null)} style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 20px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>إغلاق</button>
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
                  <td style={{ color: 'var(--warning)' }}>{((parseFloat(s.elapsed_min) / 60) * parseFloat(s.price_per_hr)).toFixed(2)} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
