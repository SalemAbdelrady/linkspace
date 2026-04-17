import React, { useState, useEffect } from 'react';
import { subscriptionsAPI, adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── مودال تسجيل اشتراك عميل ──────────────────────────────────────────
function SubscribeModal({ plans, onClose, onSuccess }) {
  const [step,          setStep]          = useState(1); // 1=بحث العميل, 2=اختيار باقة, 3=تأكيد
  const [searchQ,       setSearchQ]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [payMethod,     setPayMethod]     = useState('cash');
  const [note,          setNote]          = useState('');
  const [loading,       setLoading]       = useState(false);

  async function searchUsers(q) {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await adminAPI.users(q);
      setSearchResults(data.users.slice(0, 5));
    } catch { }
  }

  async function confirmSubscription() {
    if (!selectedUser || !selectedPlan) return;
    setLoading(true);
    try {
      const { data } = await subscriptionsAPI.subscribe({
        user_id: selectedUser.id,
        plan_id: selectedPlan.id,
        payment_method: payMethod,
        note: note || null,
      });
      toast.success(`✅ تم تسجيل اشتراك ${selectedUser.name} في ${selectedPlan.name}`);
      onSuccess(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 24, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {step === 1 ? '🔍 اختيار العميل' : step === 2 ? '📋 اختيار الباقة' : '✅ تأكيد الاشتراك'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Step 1: بحث العميل */}
        {step === 1 && (
          <div>
            <input className="input-field" style={{ marginBottom: 10 }}
              placeholder="ابحث باسم العميل أو موبايله..."
              value={searchQ} onChange={e => searchUsers(e.target.value)} autoFocus />
            {searchResults.map(u => (
              <div key={u.id} onClick={() => { setSelectedUser(u); setStep(2); setSearchResults([]); }}
                style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.phone} — رصيد: {parseFloat(u.balance).toFixed(2)} ج</div>
              </div>
            ))}
            {searchQ.length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 16 }}>لا توجد نتائج</div>
            )}
          </div>
        )}

        {/* Step 2: اختيار الباقة */}
        {step === 2 && (
          <div>
            <div style={{ padding: '10px 14px', background: 'rgba(0,212,170,0.08)', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20 }}>👤</div>
              <div>
                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedUser.phone}</div>
              </div>
              <button onClick={() => setStep(1)} style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>تغيير</button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>اختر الباقة المناسبة:</div>
            {plans.map(plan => (
              <div key={plan.id} onClick={() => { setSelectedPlan(plan); setStep(3); }}
                style={{ padding: '14px', border: `1px solid ${selectedPlan?.id === plan.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s', background: selectedPlan?.id === plan.id ? 'rgba(0,212,170,0.06)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = selectedPlan?.id === plan.id ? 'var(--accent)' : 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{plan.features}</div>
                    {plan.discount_rooms > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>🎁 خصم {plan.discount_rooms}% على الغرف</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{plan.price}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>ج / 30 يوم</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: تأكيد */}
        {step === 3 && selectedUser && selectedPlan && (
          <div>
            {/* ملخص */}
            <div style={{ padding: 14, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>العميل</span>
                <span style={{ fontWeight: 700 }}>{selectedUser.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>الباقة</span>
                <span style={{ fontWeight: 700 }}>{selectedPlan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>المدة</span>
                <span style={{ fontWeight: 700 }}>30 يوم</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--accent)', paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                <span>الإجمالي</span>
                <span>{selectedPlan.price} ج</span>
              </div>
            </div>

            {/* طريقة الدفع */}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>طريقة الدفع</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['cash','💵 كاش'], ['wallet','💳 محفظة']].map(([m, label]) => (
                <button key={m} onClick={() => setPayMethod(m)}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderColor: payMethod===m?'var(--accent)':'var(--border)', background: payMethod===m?'var(--accent)':'transparent', color: payMethod===m?'#000':'var(--muted)' }}>
                  {label}
                </button>
              ))}
            </div>

            {payMethod === 'wallet' && (
              <div style={{ padding: '8px 12px', background: parseFloat(selectedUser.balance) >= selectedPlan.price ? 'rgba(46,213,115,0.08)' : 'rgba(255,71,87,0.08)', border: `1px solid ${parseFloat(selectedUser.balance) >= selectedPlan.price ? 'rgba(46,213,115,0.4)' : 'rgba(255,71,87,0.3)'}`, borderRadius: 8, fontSize: 12, marginBottom: 14, color: parseFloat(selectedUser.balance) >= selectedPlan.price ? 'var(--success)' : '#ff4757' }}>
                {parseFloat(selectedUser.balance) >= selectedPlan.price
                  ? `✅ رصيد كافٍ — ${parseFloat(selectedUser.balance).toFixed(2)} ج`
                  : `⚠️ رصيد غير كافٍ — الرصيد الحالي: ${parseFloat(selectedUser.balance).toFixed(2)} ج`}
              </div>
            )}

            {/* ملاحظة */}
            <input className="input-field" style={{ marginBottom: 16 }}
              placeholder="ملاحظة (اختياري)..."
              value={note} onChange={e => setNote(e.target.value)} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>← رجوع</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmSubscription}
                disabled={loading || (payMethod === 'wallet' && parseFloat(selectedUser.balance) < selectedPlan.price)}>
                {loading ? 'جارٍ التسجيل...' : '✅ تأكيد الاشتراك'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SubscriptionsPage ─────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab] = useState('plans'); // plans | active

  const [plans,       setPlans]       = useState([]);
  const [activeSubs,  setActiveSubs]  = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan,     setNewPlan]     = useState({ name: '', price: '', features: '', discount_rooms: 0 });
  const [showAdd,     setShowAdd]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadPlans(); }, []);
  useEffect(() => { if (tab === 'active') loadActiveSubs(); }, [tab]);

  async function loadPlans() {
    try {
      const { data } = await subscriptionsAPI.getPlans();
      setPlans(data.plans);
    } catch { toast.error('خطأ في تحميل الباقات'); }
    finally { setLoading(false); }
  }

  async function loadActiveSubs() {
    try {
      const { data } = await subscriptionsAPI.getAll();
      setActiveSubs(data.subscriptions);
    } catch { toast.error('خطأ في تحميل الاشتراكات'); }
  }

  async function addPlan() {
    if (!newPlan.name || !newPlan.price) return toast.error('أدخل الاسم والسعر');
    try {
      const { data } = await subscriptionsAPI.createPlan({
        name: newPlan.name, price: parseFloat(newPlan.price),
        features: newPlan.features, discount_rooms: parseInt(newPlan.discount_rooms) || 0,
      });
      setPlans(prev => [...prev, data.plan]);
      setNewPlan({ name: '', price: '', features: '', discount_rooms: 0 });
      setShowAdd(false);
      toast.success('تمت إضافة الباقة ✅');
    } catch { toast.error('خطأ في الإضافة'); }
  }

  async function savePlan() {
    try {
      await subscriptionsAPI.updatePlan(editingPlan.id, {
        name: editingPlan.name, price: parseFloat(editingPlan.price),
        features: editingPlan.features, discount_rooms: parseInt(editingPlan.discount_rooms) || 0,
      });
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p));
      setEditingPlan(null);
      toast.success('تم التعديل ✅');
    } catch { toast.error('خطأ في التعديل'); }
  }

  async function deletePlan(id) {
    try {
      await subscriptionsAPI.deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('تم الحذف');
    } catch { toast.error('خطأ في الحذف'); }
  }

  async function cancelSub(id) {
    try {
      await subscriptionsAPI.cancel(id);
      toast.success('تم إلغاء الاشتراك');
      loadActiveSubs();
    } catch { toast.error('خطأ في الإلغاء'); }
  }

  function daysLeft(endDate) {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      {showModal && (
        <SubscribeModal
          plans={plans}
          onClose={() => setShowModal(false)}
          onSuccess={() => { loadActiveSubs(); if (tab !== 'active') setTab('active'); }}
        />
      )}

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/admin')}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>← رجوع</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>الاشتراكات الشهرية</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>إدارة باقات واشتراكات العملاء</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        {[['plans','📋 الباقات'], ['active','👥 المشتركون']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 18px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderColor: tab===k?'var(--accent)':'var(--border)', background: tab===k?'var(--accent)':'transparent', color: tab===k?'#000':'var(--muted)' }}>
            {label}
          </button>
        ))}
        {/* ✅ زر تسجيل اشتراك جديد */}
        <button className="btn btn-primary" style={{ marginRight: 'auto', padding: '7px 16px', fontSize: 13 }}
          onClick={() => setShowModal(true)}>
          ➕ اشتراك جديد
        </button>
      </div>

      <div style={{ padding: 16 }}>

        {/* ══ PLANS ══ */}
        {tab === 'plans' && (
          <div>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }}
              onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? '✕ إلغاء' : '➕ إضافة باقة جديدة'}
            </button>

            {showAdd && (
              <div className="card fade-up" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>باقة جديدة</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="input-field" placeholder="اسم الباقة" value={newPlan.name}
                    onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" placeholder="السعر الشهري (ج)" type="number" value={newPlan.price}
                    onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} />
                  <input className="input-field" placeholder="وصف المميزات" value={newPlan.features}
                    onChange={e => setNewPlan(p => ({ ...p, features: e.target.value }))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>خصم على الغرف:</span>
                    <input className="input-field" placeholder="0" type="number" style={{ width: 80 }} value={newPlan.discount_rooms}
                      onChange={e => setNewPlan(p => ({ ...p, discount_rooms: e.target.value }))} />
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
                  </div>
                  <button className="btn btn-primary" onClick={addPlan}>حفظ الباقة</button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>جارٍ التحميل...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plans.map(plan => (
                  <div key={plan.id} className="card fade-up">
                    {editingPlan?.id === plan.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input className="input-field" value={editingPlan.name}
                          onChange={e => setEditingPlan(p => ({ ...p, name: e.target.value }))} />
                        <input className="input-field" type="number" value={editingPlan.price}
                          onChange={e => setEditingPlan(p => ({ ...p, price: e.target.value }))} />
                        <input className="input-field" value={editingPlan.features}
                          onChange={e => setEditingPlan(p => ({ ...p, features: e.target.value }))} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--muted)' }}>خصم على الغرف:</span>
                          <input className="input-field" type="number" style={{ width: 80 }} value={editingPlan.discount_rooms}
                            onChange={e => setEditingPlan(p => ({ ...p, discount_rooms: e.target.value }))} />
                          <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={savePlan}>حفظ</button>
                          <button onClick={() => setEditingPlan(null)}
                            style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>إلغاء</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{plan.features}</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{plan.price}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>ج/شهر</div>
                          </div>
                        </div>
                        {plan.discount_rooms > 0 && (
                          <div style={{ padding: '6px 10px', background: 'rgba(0,212,170,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--accent)', marginBottom: 10 }}>
                            🎁 خصم {plan.discount_rooms}% على حجز الغرف
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setSelectedPlanForSub(plan); setShowModal(true); }}
                            className="btn btn-primary" style={{ flex: 1, padding: '7px', fontSize: 12 }}
                            onClick={() => setShowModal(true)}>
                            👤 اشترك عميل
                          </button>
                          <button onClick={() => setEditingPlan(plan)}
                            style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️ تعديل</button>
                          <button onClick={() => deletePlan(plan.id)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ACTIVE SUBS ══ */}
        {tab === 'active' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{activeSubs.length} مشترك نشط</div>
            {activeSubs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>لا توجد اشتراكات نشطة</div>
            )}
            {activeSubs.map(sub => {
              const days     = daysLeft(sub.end_date);
              const isExpired = days === 0;
              const isWarning = days <= 5 && days > 0;
              return (
                <div key={sub.id} className="card" style={{ marginBottom: 10, opacity: isExpired ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{sub.client_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub.client_phone}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{sub.plan_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub.plan_price} ج/شهر</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                    <span>📅 بدأ: {format(new Date(sub.start_date), 'dd MMM yyyy', { locale: ar })}</span>
                    <span>⏳ ينتهي: {format(new Date(sub.end_date), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: isExpired ? 'rgba(255,71,87,0.1)' : isWarning ? 'rgba(255,165,2,0.1)' : 'rgba(46,213,115,0.1)',
                      color: isExpired ? '#ff4757' : isWarning ? 'var(--warning)' : 'var(--success)',
                    }}>
                      {isExpired ? '⛔ منتهي' : isWarning ? `⚠️ ${days} يوم متبقي` : `✅ ${days} يوم متبقي`}
                    </span>
                    {!isExpired && (
                      <button onClick={() => cancelSub(sub.id)}
                        style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                        إلغاء الاشتراك
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

