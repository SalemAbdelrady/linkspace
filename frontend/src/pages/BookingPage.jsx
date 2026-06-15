import React, { useState, useEffect } from 'react';
import { bookingsAPI, spacesAPI, adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, addDays, isToday, isBefore, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const SPACE_ICONS = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };
const SPACE_COLORS = { cowork: '#00D4AA', meeting: '#3b82f6', lessons: '#f59e0b' };

const STATUS_MAP = {
  pending   : { label: 'قيد الانتظار', color: '#f59e0b', bg: '#fef3c7' },
  confirmed : { label: 'مؤكد ✅',       color: '#10b981', bg: '#d1fae5' },
  cancelled : { label: 'ملغي',           color: '#ef4444', bg: '#fee2e2' },
  completed : { label: 'مكتمل',          color: '#6b7280', bg: '#f3f4f6' },
};

// ── Time Slots ──────────────────────────────────────────────────────
const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMins = 8 * 60 + i * 30;  // يبدأ من 8 الصبح
  const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
  const m = (totalMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}); // 8:00 → 21:30

export default function BookingPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isStaff   = user?.role === 'staff' || user?.role === 'admin';

  // ── State ───────────────────────────────────────────────────────
  const [tab,           setTab]           = useState(isStaff ? 'manage' : 'new');
  const [spaces,        setSpaces]        = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('cowork');
  const [selectedDate,  setSelectedDate]  = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [startTime,     setStartTime]     = useState('09:00');
  const [endTime,       setEndTime]       = useState('11:00');
  const [guestCount,    setGuestCount]    = useState(1);
  const [note,          setNote]          = useState('');
  const [saving,        setSaving]        = useState(false);
  const [myBookings,    setMyBookings]    = useState([]);
  const [allBookings,   setAllBookings]   = useState([]);
  const [filterDate,    setFilterDate]    = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterStatus,  setFilterStatus]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [cancelId,      setCancelId]      = useState(null);
  const [cancelReason,  setCancelReason]  = useState('');

  // ── للموظف: اختيار العميل ────────────────────────────────────────
  const [clientSearch,    setClientSearch]   = useState('');
  const [clientResults,   setClientResults]  = useState([]);
  const [selectedClient,  setSelectedClient] = useState(null);

  // ── Load ────────────────────────────────────────────────────────
  useEffect(() => {
    loadSpaces();
    if (tab === 'my')     loadMyBookings();
    if (tab === 'manage') loadAllBookings();
  }, [tab]);

  useEffect(() => {
    if (selectedDate && selectedSpace) loadAvailability();
  }, [selectedDate, selectedSpace]);

  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      setSpaces(data.spaces || []);
    } catch {}
  }

  async function loadAvailability() {
    try {
      const { data } = await bookingsAPI.availability(selectedDate, selectedSpace);
      setBookedSlots(data.booked_slots || []);
    } catch {}
  }

  async function loadMyBookings() {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.my();
      setMyBookings(data.bookings || []);
    } catch { toast.error('خطأ في تحميل حجوزاتك'); }
    finally { setLoading(false); }
  }

  async function loadAllBookings() {
    setLoading(true);
    try {
      const { data } = await bookingsAPI.all({ date: filterDate, status: filterStatus });
      setAllBookings(data.bookings || []);
    } catch { toast.error('خطأ في تحميل الحجوزات'); }
    finally { setLoading(false); }
  }

  // ── Staff: بحث عن عميل ──────────────────────────────────────────────
  async function searchClients(q) {
    if (q.length < 2) { setClientResults([]); return; }
    try {
      const { data } = await adminAPI.users(q);
      setClientResults((data.users || []).filter(u => u.role === 'client').slice(0, 6));
    } catch {}
  }

  // ── Actions ─────────────────────────────────────────────────────
  async function createBooking() {
    if (!selectedDate || !startTime || !endTime)
      return toast.error('أدخل التاريخ والوقت');
    if (endTime <= startTime)
      return toast.error('وقت النهاية يجب أن يكون بعد البداية');

    const spaceObj = spaces.find(s => s.space_key === selectedSpace);
    setSaving(true);
    try {
      await bookingsAPI.create({
        space_key   : selectedSpace,
        space_name  : spaceObj?.name || selectedSpace,
        date        : selectedDate,
        start_time  : startTime,
        end_time    : endTime,
        guest_count : guestCount,
        note        : note || null,
        // الموظف يحجز باسم عميل مختار
        client_user_id: isStaff && selectedClient ? selectedClient.id : undefined,
        client_name   : isStaff && selectedClient ? selectedClient.name : undefined,
      });
      toast.success('✅ تم إرسال طلب الحجز — سيتم التأكيد قريباً');
      setNote('');
      setTab('my');
      loadMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الحجز');
    } finally { setSaving(false); }
  }

  async function confirmBooking(id) {
    try {
      await bookingsAPI.confirm(id);
      toast.success('✅ تم تأكيد الحجز');
      loadAllBookings();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  async function cancelBooking() {
    try {
      await bookingsAPI.cancel(cancelId, cancelReason);
      toast.success('تم إلغاء الحجز');
      setCancelId(null);
      setCancelReason('');
      tab === 'my' ? loadMyBookings() : loadAllBookings();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function isSlotBooked(time) {
    return bookedSlots.some(s =>
      time >= s.start_time.slice(0,5) && time < s.end_time.slice(0,5)
    );
  }

  function isDatePast(date) {
    return isBefore(startOfDay(new Date(date)), startOfDay(new Date()));
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', maxWidth:680, margin:'0 auto', padding:'0 0 60px' }}>

      {/* Cancel Modal */}
      {cancelId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setCancelId(null)}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:20, maxWidth:400, width:'100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>❌ إلغاء الحجز</div>
            <textarea className="input-field" rows={3} placeholder="سبب الإلغاء (اختياري)..."
              value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              style={{ marginBottom:14, resize:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" style={{ flex:1, padding:10, border:'1px solid var(--border)',
                background:'transparent', color:'var(--muted)', borderRadius:10, cursor:'pointer' }}
                onClick={() => setCancelId(null)}>تراجع</button>
              <button className="btn btn-primary" style={{ flex:1, padding:10, background:'#ef4444', borderRadius:10, cursor:'pointer' }}
                onClick={cancelBooking}>تأكيد الإلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px', borderBottom:'1px solid var(--border)',
        position:'sticky', top:0, background:'var(--bg)', zIndex:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--accent)' }}>📅 الحجوزات</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>احجز مساحتك مسبقاً</div>
        </div>
        <button onClick={() => navigate(-1)}
          style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--muted)',
            padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}>
          رجوع
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
        {[
          ['new',    '➕ حجز جديد'],
          ['my',     '📋 حجوزاتي'],
          ...(isStaff ? [['manage', '⚙️ إدارة']] : []),
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:'7px 16px', borderRadius:20, border:'1px solid', fontSize:13,
              fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
              borderColor: tab===k ? 'var(--accent)' : 'var(--border)',
              background:  tab===k ? 'var(--accent)' : 'transparent',
              color:       tab===k ? '#000' : 'var(--muted)' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding:16 }}>

        {/* ══ حجز جديد ══ */}
        {tab === 'new' && (
          <div className="fade-up">

            {/* الموظف يختار العميل أولاً */}
            {isStaff && (
              <div className="card" style={{ marginBottom:16, border:'1px solid rgba(0,212,170,0.3)', background:'rgba(0,212,170,0.04)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:10 }}>
                  👤 الحجز باسم عميل (اختياري)
                </div>
                {selectedClient ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 12px', background:'rgba(0,212,170,0.08)', borderRadius:10,
                    border:'1px solid rgba(0,212,170,0.25)' }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{selectedClient.name}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{selectedClient.phone}</div>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                      style={{ background:'transparent', border:'none', color:'#ef4444', fontSize:18, cursor:'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <input className="input-field" placeholder="ابحث عن عميل بالاسم أو الموبايل..."
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); searchClients(e.target.value); }} />
                    {clientResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', right:0, left:0, zIndex:20,
                        background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, marginTop:4, overflow:'hidden' }}>
                        {clientResults.map(c => (
                          <div key={c.id}
                            onClick={() => { setSelectedClient(c); setClientSearch(c.name); setClientResults([]); }}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontWeight:600 }}>{c.name}</div>
                            <div style={{ fontSize:11, color:'var(--muted)' }}>{c.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
                      اتركه فارغاً للحجز باسمك أنت
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* اختيار المساحة */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:10 }}>
                🏢 اختر المساحة
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {(spaces.length > 0 ? spaces.filter(s=>s.space_key!=='services') : [
                  { space_key:'cowork',  name:'منطقة العمل' },
                  { space_key:'meeting', name:'الاجتماعات' },
                  { space_key:'lessons', name:'الدروس' },
                ]).map(sp => (
                  <button key={sp.space_key} onClick={() => setSelectedSpace(sp.space_key)}
                    style={{ padding:'12px 8px', borderRadius:12, border:'2px solid', textAlign:'center',
                      cursor:'pointer', transition:'all 0.15s',
                      borderColor: selectedSpace===sp.space_key ? SPACE_COLORS[sp.space_key]||'var(--accent)' : 'var(--border)',
                      background:  selectedSpace===sp.space_key ? (SPACE_COLORS[sp.space_key]||'var(--accent)')+'15' : 'transparent' }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>{SPACE_ICONS[sp.space_key]||'🏢'}</div>
                    <div style={{ fontSize:12, fontWeight:600, color: selectedSpace===sp.space_key ? SPACE_COLORS[sp.space_key]||'var(--accent)' : 'var(--text)' }}>
                      {sp.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* اختيار التاريخ */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:10 }}>
                📅 التاريخ
              </div>
              <input type="date" className="input-field"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                onChange={e => setSelectedDate(e.target.value)} />
            </div>

            {/* عرض التوفر */}
            {bookedSlots.length > 0 && (
              <div className="card" style={{ marginBottom:16, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#ef4444', marginBottom:8 }}>
                  ⚠️ أوقات محجوزة في {selectedDate}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {bookedSlots.map((s, i) => (
                    <span key={i} style={{ fontSize:11, padding:'3px 8px', borderRadius:8,
                      background:'rgba(239,68,68,0.12)', color:'#ef4444', fontWeight:600 }}>
                      {s.start_time.slice(0,5)} — {s.end_time.slice(0,5)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* اختيار الوقت */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:12 }}>
                ⏰ الوقت
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>من</div>
                  <select className="input-field" value={startTime}
                    onChange={e => { setStartTime(e.target.value); if(e.target.value >= endTime) setEndTime(''); }}>
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t} disabled={isSlotBooked(t)}
                        style={{ color: isSlotBooked(t) ? '#ef4444' : 'inherit' }}>
                        {t} {isSlotBooked(t) ? '🔴' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>إلى</div>
                  <select className="input-field" value={endTime}
                    onChange={e => setEndTime(e.target.value)}>
                    {TIME_SLOTS.filter(t => t > startTime).map(t => (
                      <option key={t} value={t} disabled={isSlotBooked(t)}
                        style={{ color: isSlotBooked(t) ? '#ef4444' : 'inherit' }}>
                        {t} {isSlotBooked(t) ? '🔴' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {startTime && endTime && endTime > startTime && (
                <div style={{ padding:'8px 12px', borderRadius:8,
                  background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.2)',
                  fontSize:13, color:'var(--accent)' }}>
                  ⏱️ المدة: {(() => {
                    const [sh, sm] = startTime.split(':').map(Number);
                    const [eh, em] = endTime.split(':').map(Number);
                    const mins = (eh*60+em) - (sh*60+sm);
                    return `${Math.floor(mins/60)} ساعة ${mins%60 ? `${mins%60} دقيقة` : ''}`;
                  })()}
                </div>
              )}
            </div>

            {/* عدد الأشخاص والملاحظة */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:12 }}>
                👥 التفاصيل
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>عدد الأشخاص</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <button onClick={() => setGuestCount(g => Math.max(1, g-1))}
                    style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border)',
                      background:'transparent', color:'var(--text)', fontSize:18, cursor:'pointer' }}>−</button>
                  <span style={{ fontSize:18, fontWeight:700, minWidth:30, textAlign:'center' }}>{guestCount}</span>
                  <button onClick={() => setGuestCount(g => Math.min(20, g+1))}
                    style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border)',
                      background:'transparent', color:'var(--text)', fontSize:18, cursor:'pointer' }}>+</button>
                </div>
              </div>
              <textarea className="input-field" rows={2} placeholder="ملاحظة (اختياري)..."
                value={note} onChange={e => setNote(e.target.value)}
                style={{ resize:'none' }} />
            </div>

            <button className="btn btn-primary" style={{ width:'100%', padding:14, fontSize:15, borderRadius:14 }}
              disabled={saving || !selectedDate || !startTime || !endTime || endTime <= startTime}
              onClick={createBooking}>
              {saving ? 'جارٍ الإرسال...' : '📅 إرسال طلب الحجز'}
            </button>
            <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:8 }}>
              سيتم تأكيد حجزك من قِبل الفريق خلال وقت قصير
            </p>
          </div>
        )}

        {/* ══ حجوزاتي ══ */}
        {tab === 'my' && (
          <div className="fade-up">
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>جارٍ التحميل...</div>
            ) : myBookings.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>لا توجد حجوزات</div>
                <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>احجز مساحتك الآن</div>
                <button className="btn btn-primary" onClick={() => setTab('new')}>➕ حجز جديد</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myBookings.map(b => {
                  const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
                  return (
                    <div key={b.id} className="card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <span style={{ fontSize:20 }}>{SPACE_ICONS[b.space_key]||'🏢'}</span>
                            <span style={{ fontWeight:700, fontSize:15 }}>{b.space_name}</span>
                          </div>
                          <div style={{ fontSize:13, color:'var(--muted)' }}>
                            📅 {new Date(b.date).toLocaleDateString('ar-EG', { weekday:'short', month:'long', day:'numeric' })}
                          </div>
                          <div style={{ fontSize:13, color:'var(--accent)', marginTop:2 }}>
                            ⏰ {b.start_time.slice(0,5)} — {b.end_time.slice(0,5)}
                          </div>
                          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                            👥 {b.guest_count} {b.guest_count===1?'شخص':'أشخاص'}
                          </div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:10,
                          color: status.color, background: status.bg }}>
                          {status.label}
                        </span>
                      </div>
                      {b.note && (
                        <div style={{ marginTop:8, fontSize:12, color:'var(--muted)', padding:'6px 10px',
                          background:'rgba(0,0,0,0.06)', borderRadius:8 }}>
                          📝 {b.note}
                        </div>
                      )}
                      {['pending', 'confirmed'].includes(b.status) && !isDatePast(b.date) && (
                        <button onClick={() => { setCancelId(b.id); setCancelReason(''); }}
                          style={{ marginTop:10, width:'100%', padding:'8px', borderRadius:10,
                            border:'1px solid rgba(239,68,68,0.4)', background:'transparent',
                            color:'#ef4444', fontSize:13, cursor:'pointer' }}>
                          إلغاء الحجز
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ إدارة (Staff/Admin) ══ */}
        {tab === 'manage' && isStaff && (
          <div className="fade-up">
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>تاريخ</div>
                  <input type="date" className="input-field" value={filterDate}
                    onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>الحالة</div>
                  <select className="input-field" value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">الكل</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width:'100%', marginTop:10 }}
                onClick={loadAllBookings}>
                🔍 بحث
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>جارٍ التحميل...</div>
            ) : allBookings.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>
                لا توجد حجوزات في هذا التاريخ
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {allBookings.map(b => {
                  const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
                  return (
                    <div key={b.id} className="card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:700 }}>{b.client_name}</div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{b.client_phone}</div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:10,
                          color: status.color, background: status.bg }}>
                          {status.label}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:12, fontSize:13, marginBottom:8 }}>
                        <span>{SPACE_ICONS[b.space_key]||'🏢'} {b.space_name}</span>
                        <span>⏰ {b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}</span>
                        <span>👥 {b.guest_count}</span>
                      </div>
                      {b.note && (
                        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>📝 {b.note}</div>
                      )}
                      <div style={{ display:'flex', gap:8 }}>
                        {b.status === 'pending' && (
                          <button onClick={() => confirmBooking(b.id)}
                            style={{ flex:1, padding:'8px', borderRadius:10,
                              background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.4)',
                              color:'var(--accent)', fontSize:13, cursor:'pointer', fontWeight:600 }}>
                            ✅ تأكيد
                          </button>
                        )}
                        {['pending','confirmed'].includes(b.status) && (
                          <button onClick={() => { setCancelId(b.id); setCancelReason(''); }}
                            style={{ flex:1, padding:'8px', borderRadius:10,
                              border:'1px solid rgba(239,68,68,0.4)', background:'transparent',
                              color:'#ef4444', fontSize:13, cursor:'pointer' }}>
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
