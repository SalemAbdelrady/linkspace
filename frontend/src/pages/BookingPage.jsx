import React, { useState, useEffect, useCallback } from 'react';
import { bookingsAPI, spacesAPI, adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const SPACE_ICONS  = { cowork: '🖥️', meeting: '🤝', lessons: '📚' };
const SPACE_COLORS = { cowork: '#00D4AA', meeting: '#3b82f6', lessons: '#f59e0b' };

const STATUS_MAP = {
  pending   : { label: 'قيد الانتظار', color: '#f59e0b', bg: '#fef3c7' },
  confirmed : { label: 'مؤكد ✅',       color: '#10b981', bg: '#d1fae5' },
  cancelled : { label: 'ملغي',           color: '#ef4444', bg: '#fee2e2' },
  completed : { label: 'مكتمل',          color: '#6b7280', bg: '#f3f4f6' },
};

// ── 24-hour time slots (كل 30 دقيقة) ──────────────────────────────
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function BookingPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isStaff   = user?.role === 'staff' || user?.role === 'admin';

  // ── Tabs ────────────────────────────────────────────────────────
  const [tab, setTab] = useState(isStaff ? 'manage' : 'new');

  // ── Booking Form ────────────────────────────────────────────────
  const [spaces,        setSpaces]        = useState([]);
  const [selectedSpace, setSelectedSpace] = useState('cowork');
  const [selectedDate,  setSelectedDate]  = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookedSlots,   setBookedSlots]   = useState([]);
  const [startTime,     setStartTime]     = useState('09:00');
  const [endTime,       setEndTime]       = useState('11:00');
  const [guestCount,    setGuestCount]    = useState(1);
  const [note,          setNote]          = useState('');
  const [saving,        setSaving]        = useState(false);

  // ── My Bookings ─────────────────────────────────────────────────
  const [myBookings, setMyBookings] = useState([]);

  // ── Manage (Staff) ──────────────────────────────────────────────
  const [allBookings,  setAllBookings]  = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending'); // الافتراضي: قيد الانتظار
  const [stats,        setStats]        = useState({ pending:0, confirmed:0, today:0, total:0 });
  const [loading,      setLoading]      = useState(false);

  // ── Cancel Modal ─────────────────────────────────────────────────
  const [cancelId,     setCancelId]     = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // ── Staff: اختيار عميل ───────────────────────────────────────────
  const [clientSearch,   setClientSearch]   = useState('');
  const [clientResults,  setClientResults]  = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // ── Load ────────────────────────────────────────────────────────
  useEffect(() => { loadSpaces(); }, []);
  useEffect(() => { if (tab === 'my')     loadMyBookings();   }, [tab]);
  useEffect(() => { if (tab === 'manage') loadAllBookings();  }, [tab, filterStatus]);
  useEffect(() => { if (selectedDate && selectedSpace) loadAvailability(); }, [selectedDate, selectedSpace]);

  // ✅ تحسب الأماكن المتاحة بناءً على الوقت المختار
  async function loadSpacesForTimeSlot(date, start, end) {
    if (!date || !start || !end || end <= start) {
      // لو مافيش وقت محدد — جيب الأرقام العامة
      await loadSpaces();
      return;
    }
    try {
      const { data } = await spacesAPI.getAllWithAvailability(date);
      const allSpaces = data.spaces.filter(s => s.space_key !== 'services' && s.is_active !== false);

      // احسب التعارض للوقت المحدد من الـ booked_slots
      const updated = await Promise.all(allSpaces.map(async (sp) => {
        try {
          const { data: avail } = await bookingsAPI.availability(date, sp.space_key);
          const slots = avail.booked_slots || [];
          // عدد الحجوزات المتعارضة مع الوقت المختار
          const conflicting = slots.filter(s => 
            s.start_time?.slice(0,5) < end && 
            s.end_time?.slice(0,5)   > start
          ).length;
          return {
            ...sp,
            occupied:         conflicting,
            available_spots:  Math.max(0, sp.capacity - conflicting),
          };
        } catch {
          return sp;
        }
      }));
      setSpaces(updated);
    } catch {}
  }
async function loadSpaces() {
  try {
    const { data } = await spacesAPI.getAllWithAvailability(selectedDate);
    setSpaces(data.spaces.filter(s => s.space_key !== 'services' && s.is_active !== false));
  } catch {}
}

// أضف useEffect يحدّث عند تغيير التاريخ
useEffect(() => { 
  loadSpacesForTimeSlot(selectedDate, startTime, endTime); 
}, [selectedDate, startTime, endTime]);

  async function loadAvailability() {
    try {
      const { data } = await bookingsAPI.availability(selectedDate, selectedSpace);
      setBookedSlots(data.booked_slots || []);
    } catch {}
  }

  async function loadMyBookings() {
    setLoading(true);
    try { const { data } = await bookingsAPI.my(); setMyBookings(data.bookings || []); }
    catch { toast.error('خطأ في تحميل حجوزاتك'); }
    finally { setLoading(false); }
  }

  async function loadAllBookings() {
    setLoading(true);
    try {
      // بدون فلتر تاريخ — نجيب كل الحجوزات حسب الـ status فقط
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data } = await bookingsAPI.all(params);
      const bks = data.bookings || [];
      setAllBookings(bks);

      // إحصائيات مباشرة من النتائج
      const today = format(new Date(), 'yyyy-MM-dd');
      setStats({
        pending   : bks.filter(b => b.status === 'pending').length,
        confirmed : bks.filter(b => b.status === 'confirmed').length,
        today     : bks.filter(b => b.date?.slice(0,10) === today && ['pending','confirmed'].includes(b.status)).length,
        total     : bks.length,
      });
    } catch { toast.error('خطأ في تحميل الحجوزات'); }
    finally { setLoading(false); }
  }

  async function searchClients(q) {
    if (q.length < 2) { setClientResults([]); return; }
    try {
      const { data } = await adminAPI.users(q);
      setClientResults((data.users || []).filter(u => u.role === 'client').slice(0, 6));
    } catch {}
  }

  // ── Create Booking ───────────────────────────────────────────────
  async function createBooking() {
    if (!selectedDate || !startTime || !endTime) return toast.error('أدخل التاريخ والوقت');
    if (endTime <= startTime) return toast.error('وقت النهاية يجب أن يكون بعد البداية');
    const spaceObj = spaces.find(s => s.space_key === selectedSpace);
    setSaving(true);
    try {
      await bookingsAPI.create({
        space_key      : selectedSpace,
        space_name     : spaceObj?.name || selectedSpace,
        date           : selectedDate,
        start_time     : startTime,
        end_time       : endTime,
        guest_count    : guestCount,
        note           : note || null,
        client_user_id : isStaff && selectedClient ? selectedClient.id : undefined,
      });
      toast.success('✅ تم إرسال طلب الحجز — سيتم التأكيد قريباً');
      setNote(''); setSelectedClient(null); setClientSearch('');
      // ✅ حدّث العداد فوراً بعد الحجز
      loadSpacesForTimeSlot(selectedDate, startTime, endTime);
      setTab(isStaff ? 'manage' : 'my');
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ في الحجز'); }
    finally { setSaving(false); }
  }

  async function confirmBooking(id) {
    try {
      const { data } = await bookingsAPI.confirm(id);
      toast.success(data.message || '✅ تم تأكيد الحجز');
      loadAllBookings();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  async function cancelBooking() {
    try {
      await bookingsAPI.cancel(cancelId, cancelReason);
      toast.success('تم إلغاء الحجز');
      setCancelId(null); setCancelReason('');
      tab === 'my' ? loadMyBookings() : loadAllBookings();
    } catch (err) { toast.error(err.response?.data?.error || 'خطأ'); }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function isSlotBooked(time) {
    return bookedSlots.some(s =>
      time >= s.start_time?.slice(0,5) && time < s.end_time?.slice(0,5)
    );
  }

  function calcDuration(s, e) {
    if (!s || !e || e <= s) return '';
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    const mins = (eh*60+em)-(sh*60+sm);
    if (mins <= 0) return '';
    return mins < 60 ? `${mins} دقيقة` : `${Math.floor(mins/60)} ساعة${mins%60?` ${mins%60} د`:''}`;
  }

  function formatDateAr(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
    } catch { return dateStr; }
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', maxWidth:720, margin:'0 auto', padding:'0 0 60px', direction:'rtl' }}>

      {/* Cancel Modal */}
      {cancelId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(4px)' }}
          onClick={() => setCancelId(null)}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:24, maxWidth:400, width:'100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:14, color:'var(--text)' }}>❌ تأكيد إلغاء الحجز</div>
            <textarea className="input-field" rows={3} placeholder="سبب الإلغاء (اختياري)..."
              value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              style={{ marginBottom:14, resize:'none', width:'100%' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setCancelId(null)}
                style={{ flex:1, padding:10, borderRadius:10, border:'1px solid var(--border)',
                  background:'transparent', color:'var(--muted)', cursor:'pointer' }}>تراجع</button>
              <button onClick={cancelBooking}
                style={{ flex:1, padding:10, borderRadius:10, border:'none',
                  background:'#ef4444', color:'#fff', fontWeight:700, cursor:'pointer' }}>
                تأكيد الإلغاء
              </button>
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

      {/* Stats Bar — للموظف والأدمن فقط */}
      {isStaff && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, padding:'12px 16px',
          background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
          {[
            { label:'⏳ انتظار',  val: stats.pending,   color:'#f59e0b' },
            { label:'✅ مؤكدة',   val: stats.confirmed, color:'#10b981' },
            { label:'📅 اليوم',   val: stats.today,     color:'var(--accent)' },
            { label:'📊 الكل',    val: stats.total,     color:'var(--muted)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', padding:'8px 4px',
              background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:'12px 16px', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
        {[
          ['new',    '➕ حجز جديد'],
          ['my',     '📋 حجوزاتي'],
          ...(isStaff ? [['manage','⚙️ إدارة']] : []),
        ].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:'7px 16px', borderRadius:20, border:'1px solid', fontSize:13,
              fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
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

            {/* الموظف يختار العميل */}
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
                      style={{ background:'transparent', border:'none', color:'#ef4444', fontSize:20, cursor:'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ position:'relative' }}>
                    <input className="input-field" placeholder="ابحث عن عميل بالاسم أو الموبايل..."
                      value={clientSearch}
                      onChange={e => { setClientSearch(e.target.value); searchClients(e.target.value); }} />
                    {clientResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', right:0, left:0, zIndex:50,
                        background:'var(--surface)', border:'1px solid var(--border)',
                        borderRadius:10, marginTop:4, overflow:'hidden',
                        boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                        {clientResults.map(c => (
                          <div key={c.id}
                            onClick={() => { setSelectedClient(c); setClientSearch(c.name); setClientResults([]); }}
                            style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13 }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(0,212,170,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
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
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:10 }}>🏢 اختر المساحة</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>

            {/* عرض المساحات المتاحة  */}
            {spaces.map(sp => (
              <button key={sp.space_key} onClick={() => setSelectedSpace(sp.space_key)}
                style={{
                  padding:'12px 8px', borderRadius:12, border:'2px solid', textAlign:'center',
                  cursor: sp.available_spots === 0 ? 'not-allowed' : 'pointer',
                  opacity: sp.available_spots === 0 ? 0.5 : 1,
                  borderColor: selectedSpace===sp.space_key
                    ? SPACE_COLORS[sp.space_key]||'var(--accent)' : 'var(--border)',
                  background: selectedSpace===sp.space_key
                    ? (SPACE_COLORS[sp.space_key]||'var(--accent)')+'18' : 'transparent',
                }}
                disabled={sp.available_spots === 0}>
                <div style={{ fontSize:22, marginBottom:4 }}>{sp.icon || SPACE_ICONS[sp.space_key]||'🏢'}</div>
                <div style={{ fontSize:12, fontWeight:600 }}>{sp.name}</div>
                {/* ✅ عداد الأماكن */}
                <div style={{
                  marginTop:4, fontSize:10, fontWeight:700,
                  color: sp.available_spots === 0 ? '#ff4757'
                      : sp.available_spots <= 2  ? 'var(--warning)'
                      : 'var(--success)',
                }}>
                  {sp.available_spots === 0
                    ? '🔴 ممتلئة'
                    : `🟢 ${sp.available_spots}/${sp.capacity} متاح`}
                </div>
              </button>
            ))}
              </div>
            </div>

            {/* التاريخ */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:10 }}>📅 التاريخ</div>
              <input type="date" className="input-field"
                value={selectedDate}
                min={isStaff ? undefined : format(new Date(),'yyyy-MM-dd')}
                max={format(addDays(new Date(),30),'yyyy-MM-dd')}
                onChange={e => setSelectedDate(e.target.value)} />

              {/* أوقات محجوزة */}
              {bookedSlots.length > 0 && (
                <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8,
                  background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#ef4444', marginBottom:6 }}>⚠️ أوقات محجوزة</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {bookedSlots.map((s,i) => (
                      <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:8,
                        background:'rgba(239,68,68,0.15)', color:'#ef4444' }}>
                        {s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* الوقت */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:12 }}>⏰ الوقت (24 ساعة)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>من</div>
                  <select className="input-field" value={startTime}
                    onChange={e => { setStartTime(e.target.value); if(e.target.value >= endTime) setEndTime(''); }}
                    style={{ background:'var(--surface)', color:'var(--text)' }}>
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}
                        style={{ background:'var(--surface)', color: isSlotBooked(t)?'#ef4444':'var(--text)' }}>
                        {t}{isSlotBooked(t)?' 🔴':''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>إلى</div>
                  <select className="input-field" value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{ background:'var(--surface)', color:'var(--text)' }}>
                    <option value="">-- اختر --</option>
                    {TIME_SLOTS.filter(t => t > startTime).map(t => (
                      <option key={t} value={t}
                        style={{ background:'var(--surface)', color: isSlotBooked(t)?'#ef4444':'var(--text)' }}>
                        {t}{isSlotBooked(t)?' 🔴':''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {startTime && endTime && endTime > startTime && (
                <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(0,212,170,0.08)',
                  border:'1px solid rgba(0,212,170,0.2)', fontSize:13, color:'var(--accent)' }}>
                  ⏱️ المدة: {calcDuration(startTime, endTime)}
                </div>
              )}
            </div>

            {/* التفاصيل */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:12 }}>👥 التفاصيل</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <span style={{ fontSize:13, color:'var(--muted)' }}>عدد الأشخاص:</span>
                <button onClick={() => setGuestCount(g=>Math.max(1,g-1))}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)',
                    background:'transparent', color:'var(--text)', fontSize:18, cursor:'pointer' }}>−</button>
                <span style={{ fontSize:18, fontWeight:700, minWidth:30, textAlign:'center' }}>{guestCount}</span>
                <button onClick={() => setGuestCount(g=>Math.min(50,g+1))}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)',
                    background:'transparent', color:'var(--text)', fontSize:18, cursor:'pointer' }}>+</button>
              </div>
              <textarea className="input-field" rows={2} placeholder="ملاحظة (اختياري)..."
                value={note} onChange={e => setNote(e.target.value)} style={{ resize:'none' }} />
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
                  const st = STATUS_MAP[b.status]||STATUS_MAP.pending;
                  return (
                    <div key={b.id} className="card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                            <span style={{ fontSize:18 }}>{SPACE_ICONS[b.space_key]||'🏢'}</span>
                            <span style={{ fontWeight:700, fontSize:15 }}>{b.space_name}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>{formatDateAr(b.date)}</div>
                          <div style={{ fontSize:13, color:'var(--accent)', marginTop:2 }}>
                            ⏰ {b.start_time?.slice(0,5)} — {b.end_time?.slice(0,5)}
                            <span style={{ color:'var(--muted)', fontSize:11, marginRight:6 }}>
                              ({calcDuration(b.start_time?.slice(0,5), b.end_time?.slice(0,5))})
                            </span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                            👥 {b.guest_count} شخص
                          </div>
                          {b.confirmed_by_name && (
                            <div style={{ fontSize:11, color:'#10b981', marginTop:4 }}>
                              ✅ أكّده: {b.confirmed_by_name}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:10,
                          color:st.color, background:st.bg, whiteSpace:'nowrap' }}>
                          {st.label}
                        </span>
                      </div>
                      {b.note && (
                        <div style={{ fontSize:12, color:'var(--muted)', padding:'6px 10px',
                          background:'rgba(0,0,0,0.06)', borderRadius:8, marginBottom:8 }}>
                          📝 {b.note}
                        </div>
                      )}

                      {b.status === 'cancelled' && b.cancel_reason && (
                        <div style={{
                          fontSize: 12, color: '#ef4444', padding: '6px 10px',
                          background: 'rgba(239,68,68,0.06)', borderRadius: 8, marginBottom: 8,
                          border: '1px solid rgba(239,68,68,0.15)',
                        }}>
                          💬 سبب الإلغاء: {b.cancel_reason}
                        </div>
                      )}
                      {b.status === 'cancelled' && b.cancelled_by_name && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                          🚫 أُلغي بواسطة: <strong style={{ color: 'var(--text)' }}>{b.cancelled_by_name}</strong>
                        </div>
                      )}
                      {['pending','confirmed'].includes(b.status) && !isBefore(new Date(b.date), startOfDay(new Date())) && (
                        <button onClick={() => { setCancelId(b.id); setCancelReason(''); }}
                          style={{ width:'100%', padding:'8px', borderRadius:10,
                            border:'1px solid rgba(239,68,68,0.4)', background:'transparent',
                            color:'#ef4444', fontSize:13, cursor:'pointer' }}>
                          إلغاء الحجز
                        </button>
                      )}
                    </div>
                  );

                  {b.status === 'cancelled' && b.cancel_reason && (
                  <div style={{
                    fontSize: 12, color: '#ef4444', padding: '6px 10px',
                    background: 'rgba(239,68,68,0.06)', borderRadius: 8, marginBottom: 8,
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}>
                    💬 سبب الإلغاء: {b.cancel_reason}
                  </div>
                )}
                {b.status === 'cancelled' && b.cancelled_by_name && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                    🚫 أُلغي بواسطة: <strong style={{ color: 'var(--text)' }}>{b.cancelled_by_name}</strong>
                    {b.cancelled_at && (
                      <span style={{ marginRight: 4 }}>
                        · {new Date(b.cancelled_at).toLocaleString('ar-EG', { 
                            month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' 
                          })}
                      </span>
                    )}
                  </div>
                )}

                })}
              </div>
            )}
          </div>
        )}

        {/* ══ إدارة (Staff/Admin) ══ */}
        {tab === 'manage' && isStaff && (
          <div className="fade-up">

            {/* فلتر الحالة — بدون فلتر تاريخ عشان نشوف كل الحجوزات */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {[
                { val:'pending',   label:'⏳ انتظار',  color:'#f59e0b' },
                { val:'confirmed', label:'✅ مؤكدة',   color:'#10b981' },
                { val:'cancelled', label:'❌ ملغية',   color:'#ef4444' },
                { val:'',          label:'📊 الكل',    color:'var(--muted)' },
              ].map(f => (
                <button key={f.val} onClick={() => setFilterStatus(f.val)}
                  style={{ padding:'7px 14px', borderRadius:20, border:'1px solid', fontSize:12,
                    fontWeight:600, cursor:'pointer', flexShrink:0,
                    borderColor: filterStatus===f.val ? f.color : 'var(--border)',
                    background:  filterStatus===f.val ? f.color+'18' : 'transparent',
                    color:       filterStatus===f.val ? f.color : 'var(--muted)' }}>
                  {f.label}
                  {f.val==='pending' && stats.pending>0 && (
                    <span style={{ marginRight:4, background:'#f59e0b', color:'#000',
                      borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 5px' }}>
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>جارٍ التحميل...</div>
            ) : allBookings.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>
                  {filterStatus==='pending' ? '🎉' : '📭'}
                </div>
                <div style={{ fontSize:14, fontWeight:600 }}>
                  {filterStatus==='pending' ? 'لا توجد حجوزات في الانتظار' : 'لا توجد حجوزات'}
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {allBookings.map(b => {
                  const st = STATUS_MAP[b.status]||STATUS_MAP.pending;
                  const isToday = b.date?.slice(0,10) === format(new Date(),'yyyy-MM-dd');
                  return (
                    <div key={b.id} className="card"
                      style={{ borderRight: `3px solid ${st.color}`, paddingRight:13 }}>

                      {/* رأس الكارد */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontWeight:800, fontSize:15 }}>{b.client_name}</span>
                            <span style={{ fontSize:11, color:'var(--muted)' }}>{b.client_phone}</span>
                            {isToday && (
                              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                background:'rgba(0,212,170,0.15)', color:'var(--accent)' }}>اليوم</span>
                            )}
                          </div>
                          <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
                            {SPACE_ICONS[b.space_key]||'🏢'} {b.space_name}
                            <span style={{ margin:'0 6px' }}>·</span>
                            📅 {formatDateAr(b.date)}
                          </div>
                          <div style={{ fontSize:13, color:'var(--accent)', marginTop:2 }}>
                            ⏰ {b.start_time?.slice(0,5)} — {b.end_time?.slice(0,5)}
                            <span style={{ color:'var(--muted)', fontSize:11, marginRight:6 }}>
                              ({calcDuration(b.start_time?.slice(0,5), b.end_time?.slice(0,5))})
                            </span>
                            <span style={{ color:'var(--muted)', fontSize:11, marginRight:6 }}>
                              · 👥 {b.guest_count}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:10,
                          color:st.color, background:st.bg, whiteSpace:'nowrap', marginRight:8 }}>
                          {st.label}
                        </span>
                      </div>

                      {/* ملاحظة */}
                      {b.note && (
                        <div style={{ fontSize:12, color:'var(--muted)', padding:'5px 10px',
                          background:'rgba(0,0,0,0.06)', borderRadius:8, marginBottom:8 }}>
                          📝 {b.note}
                        </div>
                      )}

                      {/* ✅ سبب الإلغاء + من ألغى */}
                      {b.status === 'cancelled' && b.cancel_reason && (
                        <div style={{ fontSize:12, color:'#ef4444', padding:'5px 10px',
                          background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)',
                          borderRadius:8, marginBottom:8 }}>
                          💬 سبب الإلغاء: {b.cancel_reason}
                        </div>
                      )}
                      {b.status === 'cancelled' && b.cancelled_by_name && (
                        <div style={{ fontSize:11, color:'#ef4444', marginBottom:8,
                          padding:'4px 10px', background:'rgba(239,68,68,0.06)',
                          borderRadius:8, display:'inline-flex', alignItems:'center', gap:4 }}>
                          🚫 أُلغي بواسطة: <strong>{b.cancelled_by_name}</strong>
                          {b.cancelled_at && (
                            <span style={{ color:'var(--muted)', marginRight:4 }}>
                              · {new Date(b.cancelled_at).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              {' — '}
                              {new Date(b.cancelled_at).toLocaleDateString('ar-EG', {
                                month: 'short', day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* من أكّد الحجز */}
                      {b.confirmed_by_name && (
                        <div style={{ fontSize:11, color:'#10b981', marginBottom:8,
                          padding:'4px 10px', background:'rgba(16,185,129,0.08)',
                          borderRadius:8, display:'inline-flex', alignItems:'center', gap:4 }}>
                          ✅ أكّده: <strong>{b.confirmed_by_name}</strong>
                          {b.updated_at && (
                            <span style={{ color:'var(--muted)', marginRight:4 }}>
                              · {new Date(b.cancelled_at).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              {' — '}
                              {new Date(b.cancelled_at).toLocaleDateString('ar-EG', {
                                month: 'short', day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* الأزرار */}
                      <div style={{ display:'flex', gap:8 }}>
                        {b.status === 'pending' && (
                          <button onClick={() => confirmBooking(b.id)}
                            style={{ flex:1, padding:'9px', borderRadius:10,
                              background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.4)',
                              color:'#10b981', fontSize:13, cursor:'pointer', fontWeight:700 }}>
                            ✅ تأكيد الحجز
                          </button>
                        )}
                        {['pending','confirmed'].includes(b.status) && (
                          <button onClick={() => { setCancelId(b.id); setCancelReason(''); }}
                            style={{ flex:1, padding:'9px', borderRadius:10,
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
