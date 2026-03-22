import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const defaultPlans = [
  { id: 1, name: 'باقة أساسية', price: 500, features: 'دخول غير محدود لمنطقة العمل', discount_rooms: 0 },
  { id: 2, name: 'باقة بريميوم', price: 900, features: 'دخول غير محدود + خصم 20% على الغرف', discount_rooms: 20 },
  { id: 3, name: 'باقة VIP', price: 1400, features: 'دخول غير محدود + خصم 40% على الغرف', discount_rooms: 40 },
];

export default function SubscriptionsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(defaultPlans);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', features: '', discount_rooms: 0 });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div style={{ minHeight: '100vh', maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/admin')}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>← رجوع</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>الاشتراكات الشهرية</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>إدارة باقات الاشتراك</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>خروج</button>
      </div>

      <div style={{ padding: 16 }}>
        {/* زر إضافة باقة */}
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }}
          onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ إلغاء' : '➕ إضافة باقة جديدة'}
        </button>

        {/* فورم إضافة باقة */}
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
              <button className="btn btn-primary" onClick={() => {
                if (!newPlan.name || !newPlan.price) return toast.error('أدخل الاسم والسعر');
                setPlans(prev => [...prev, { id: Date.now(), ...newPlan }]);
                setNewPlan({ name: '', price: '', features: '', discount_rooms: 0 });
                setShowAdd(false);
                toast.success('تمت إضافة الباقة');
              }}>حفظ الباقة</button>
            </div>
          </div>
        )}

        {/* قائمة الباقات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map((plan, i) => (
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
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                      setPlans(prev => prev.map(p => p.id === plan.id ? editingPlan : p));
                      setEditingPlan(null);
                      toast.success('تم التعديل');
                    }}>حفظ</button>
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
                    <button onClick={() => setEditingPlan(plan)}
                      style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏️ تعديل</button>
                    <button onClick={() => { setPlans(prev => prev.filter(p => p.id !== plan.id)); toast.success('تم الحذف'); }}
                      style={{ background: 'transparent', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


