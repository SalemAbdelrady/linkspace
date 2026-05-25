import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { couponsAPI, invoicesAPI, servicesAPI } from "../utils/api";
import toast from "react-hot-toast";
import api from "../utils/api";

// ─────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────
const SPACE_ICONS = { cowork: "🖥️", meeting: "🤝", lessons: "📚" };

function formatTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getBilledHours(durationMin, maxHours = 4) {
  return Math.min(Math.max(Math.ceil(durationMin / 60), 1), maxHours);
}

// ─────────────────────────────────────────────
// Draft localStorage helpers
// ─────────────────────────────────────────────
function saveDraft(sessionId, session, client) {
  try {
    localStorage.setItem(
      `draft_invoice_${sessionId}`,
      JSON.stringify({ session, client, savedAt: new Date().toISOString() }),
    );
  } catch {}
}

function removeDraft(sessionId) {
  try {
    localStorage.removeItem(`draft_invoice_${sessionId}`);
  } catch {}
}

function getLatestDraft() {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("draft_invoice_"),
    );
    if (!keys.length) return null;
    const drafts = keys
      .map((k) => {
        try {
          return JSON.parse(localStorage.getItem(k));
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    return drafts[0] || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// InvoicePage
// ─────────────────────────────────────────────
export default function InvoicePage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── استرجاع البيانات: من navigate state أولاً، ثم من localStorage ──
  const invoiceData = (() => {
    if (location.state?.session && location.state?.client) {
      return location.state;
    }
    return getLatestDraft();
  })();

  const { session, client } = invoiceData || {};

  // ── Services ──
  const [serviceSearch,  setServiceSearch]  = useState("");
  const [servicesList,   setServicesList]   = useState([]);
  const [addedServices,  setAddedServices]  = useState([]);
  const [ordersLoaded,   setOrdersLoaded]   = useState(false);

  // ── Payment ──
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note,          setNote]          = useState("");
  const [paid,          setPaid]          = useState(false);
  const [saved,         setSaved]         = useState(false);

  // ── Coupon ──
  const [couponCode,    setCouponCode]    = useState("");
  const [couponData,    setCouponData]    = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponUsed,    setCouponUsed]    = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError,   setCouponError]   = useState(false);

  // ── Invoice number (stable across re-renders) ──
  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const now     = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  // ── تحميل الخدمات المتاحة ──
  useEffect(() => {
    servicesAPI
      .getAll()
      .then(({ data }) => setServicesList(data.services || []))
      .catch(() => toast.error("خطأ في تحميل الخدمات"));
  }, []);

  // ── تحميل الطلبات المضافة خلال الجلسة ──
  useEffect(() => {
    if (!session?.id || ordersLoaded) return;
    api
      .get(`/orders/session/${session.id}`)
      .then(({ data }) => {
        if (data.orders?.length > 0) {
          const converted = [];
          data.orders.forEach((order) => {
            const existing = converted.find((s) => s.name === order.service_name);
            if (existing) {
              existing.qty += order.qty;
            } else {
              converted.push({
                id:        order.service_id || `order_${order.id}`,
                name:      order.service_name,
                price:     parseFloat(order.price),
                qty:       order.qty,
                from_order: true,
                order_id:  order.id,
                added_by:  order.added_by,
              });
            }
          });
          setAddedServices(converted);
          toast.success(`✅ تم تحميل ${data.orders.length} طلب مضاف مسبقاً`);
        }
        setOrdersLoaded(true);
      })
      .catch(() => setOrdersLoaded(true));
  }, [session?.id, ordersLoaded]);

  // ─────────────────────────────────────────
  // Guard: لو ما في بيانات أصلاً
  // ─────────────────────────────────────────
  if (!session || !client) {
    return (
      <div style={S.emptyState}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>
          لا توجد بيانات فاتورة
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/scanner")}>
          العودة للسكانر
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Calculations
  // ─────────────────────────────────────────
  const spaceKey       = session.spaceKey  || "cowork";
  const spaceName      = session.spaceName || "منطقة العمل المشتركة";
  const spaceIcon      = SPACE_ICONS[spaceKey] || "🏢";
  const maxHours       = session.maxHours  || 4;
  const isSubscription = session.isSubscriptionSession === true || session.cost === 0;
  const billedHours    = getBilledHours(session.durationMin, maxHours);

  const sessionCost    = isSubscription ? 0 : parseFloat(session.cost || 0);
  const servicesCost   = addedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const subtotal       = sessionCost + servicesCost;
  const discountPct    = couponData ? parseFloat(couponData.discount_pct) : 0;
  const discountAmount = parseFloat(((sessionCost * discountPct) / 100).toFixed(2));
  const total          = parseFloat((sessionCost - discountAmount + servicesCost).toFixed(2));

  const clientBalance  = parseFloat(client.balance || 0);
  const walletDebit    = (() => {
    if (total === 0 || paymentMethod === "cash") return 0;
    if (paymentMethod === "wallet") return Math.min(clientBalance, total);
    return 0;
  })();
  const cashRemainder  = parseFloat((total - walletDebit).toFixed(2));
  const walletCovers   = clientBalance >= total && total > 0;

  function getEffectiveMethod() {
    if (isSubscription && total === 0) return "subscription";
    if (paymentMethod === "cash") return "cash";
    if (paymentMethod === "wallet") {
      if (clientBalance <= 0)  return "cash";
      if (walletCovers)        return "wallet";
      return "partial";
    }
    return "cash";
  }

  // ─────────────────────────────────────────
  // Coupon validation
  // ─────────────────────────────────────────

  /*
   * ✅ إصلاح مسار الكوبون:
   *
   * الـ `api` instance معه baseURL = "/api"
   * يعني كل مسار بتمرره بيتضاف بعد "/api" تلقائياً.
   *
   * ❌ خطأ سابق:
   *    api.get(`/api/coupons/validate?code=...`)
   *    النتيجة: /api + /api/coupons/validate = /api/api/coupons/validate  → 404
   *
   * ✅ الصح:
   *    api.get(`/coupons/validate?code=...`)
   *    النتيجة: /api + /coupons/validate = /api/coupons/validate  → 200
   *
   * ملاحظة مهمة: تأكد إنك أضفت GET /validate في coupons.js في الـ backend
   * (الـ route الموجود فعلاً POST /validate — محتاج GET منفصل للتحقق)
   */
  const validateCoupon = async (codePassed = null) => {
    const codeToApply = (codePassed ?? couponCode).trim();
    if (!codeToApply) {
      toast.error("الرجاء إدخال رمز الكوبون");
      return;
    }

    setCouponLoading(true);
    setCouponError(false);

    try {
      // ✅ المسار الصحيح — بدون /api/ لأن baseURL بيضيفها تلقائياً
      const { data } = await api.get(`/coupons/validate?code=${codeToApply}`);

      if (!data || !data.valid) {
        setCouponError(true);
        toast.error("كوبون غير صالح أو منتهي");
        return;
      }

      setCouponData(data);
      setCouponApplied(true);
      setCouponError(false);
      toast.success(`✅ تم تطبيق الكوبون — خصم ${data.discount_pct}%`);
    } catch (err) {
      setCouponError(true);
      const msg = err.response?.data?.error || err.response?.data?.message || "خطأ في التحقق من الكوبون";
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  // تطبيق تلقائي بعد 700ms من آخر حرف
  useEffect(() => {
    const trimmed = couponCode.trim();

    // إعادة تعيين الحالة عند مسح الكود
    if (trimmed.length === 0) {
      setCouponError(false);
      setCouponApplied(false);
      return;
    }

    // لا تبدأ التحقق قبل 3 أحرف
    if (trimmed.length < 3) return;

    // لو الكوبون مطبّق مسبقاً لا تعيد الطلب
    if (couponApplied && couponData) return;

    const timer = setTimeout(() => validateCoupon(trimmed), 700);
    return () => clearTimeout(timer);
  }, [couponCode]);

  function removeCoupon() {
    setCouponData(null);
    setCouponCode("");
    setCouponApplied(false);
    setCouponError(false);
  }

  // ─────────────────────────────────────────
  // Services
  // ─────────────────────────────────────────
  function addService(service) {
    setAddedServices((prev) => {
      const existing = prev.find((s) => s.id === service.id);
      if (existing) return prev.map((s) => s.id === service.id ? { ...s, qty: s.qty + 1 } : s);
      return [...prev, { ...service, qty: 1 }];
    });
  }

  function removeService(id) {
    setAddedServices((prev) => {
      const existing = prev.find((s) => s.id === id);
      if (existing?.qty === 1) return prev.filter((s) => s.id !== id);
      return prev.map((s) => s.id === id ? { ...s, qty: s.qty - 1 } : s);
    });
  }

  // ─────────────────────────────────────────
  // Save / Payment
  // ─────────────────────────────────────────
  async function markCouponUsed() {
    if (!couponData || couponUsed) return;
    try {
      await couponsAPI.use({ code: couponData.code, user_id: client.id });
      setCouponUsed(true);
    } catch (err) {
      console.error("coupon use error:", err);
    }
  }

  async function saveInvoice() {
    if (saved) return;
    const effectiveMethod = getEffectiveMethod();
    try {
      await invoicesAPI.create({
        invoice_number:  invoiceNumber,
        session_id:      session.id || null,
        user_id:         client.id,
        client_name:     client.name,
        client_phone:    client.phone,
        client_email:    client.email,
        space_key:       spaceKey,
        space_name:      spaceName,
        session_cost:    sessionCost,
        duration_min:    session.durationMin,
        price_per_hr:    isSubscription ? 0 : session.pricePerHr,
        guest_count:     session.guestCount || 1,
        services:        addedServices.map((s) => ({ name: s.name, price: s.price, qty: s.qty })),
        services_cost:   servicesCost,
        coupon_code:     couponData?.code     || null,
        discount_pct:    discountPct,
        discount_amount: discountAmount,
        subtotal,
        total,
        payment_method:  effectiveMethod,
        wallet_paid:     walletDebit,
        cash_paid:       cashRemainder,
        note:            note || null,
      });
      setSaved(true);

      // ✅ امسح الـ draft بعد الحفظ الناجح
      if (session?.id) removeDraft(session.id);

    } catch (err) {
      console.error("saveInvoice error:", err);
      toast.error("خطأ في حفظ الفاتورة");
    }
  }

  async function handleDone() {
    try {
      await markCouponUsed();
      await saveInvoice();
      navigate("/scanner");
    } catch (err) {
      toast.error("حدث خطأ — حاول مجدداً");
    }
  }

  async function handlePrint() {
    try {
      await markCouponUsed();
      await saveInvoice();
      window.print();
    } catch (err) {
      toast.error("حدث خطأ — حاول مجدداً");
    }
  }

  const effectiveMethod = getEffectiveMethod();

  // ─────────────────────────────────────────
  // WalletStatus component
  // ─────────────────────────────────────────
  function WalletStatus() {
    if (isSubscription && servicesCost === 0) return null;
    if (total === 0) return null;

    if (paymentMethod === "cash") {
      return (
        <div style={S.walletBox("var(--border)", "rgba(255,255,255,0.03)")}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            💵 الدفع كاش — لن يُخصم من رصيد العميل
          </span>
          {clientBalance > 0 && (
            <span style={{ color: "var(--accent)", fontSize: 12, marginRight: 8 }}>
              (الرصيد: {clientBalance.toFixed(2)} ج محفوظ)
            </span>
          )}
        </div>
      );
    }

    if (clientBalance <= 0) {
      return (
        <div style={S.walletBox("rgba(255,71,87,0.3)", "rgba(255,71,87,0.08)")}>
          <span style={{ color: "#ff4757", fontSize: 12 }}>⚠️ لا يوجد رصيد — سيُحوَّل للدفع كاش</span>
        </div>
      );
    }

    if (walletCovers) {
      return (
        <div style={S.walletBox("rgba(46,213,115,0.4)", "rgba(46,213,115,0.08)")}>
          <div style={S.walletRow}>
            <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>💰 رصيد العميل</span>
            <span style={{ fontSize: 15, color: "var(--success)", fontWeight: 700 }}>{clientBalance.toFixed(2)} ج</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            ✅ يغطي الفاتورة — سيُخصم <strong style={{ color: "var(--accent)" }}>{total.toFixed(2)} ج</strong>
          </div>
        </div>
      );
    }

    return (
      <div style={S.walletBox("rgba(255,165,2,0.4)", "rgba(255,165,2,0.08)")}>
        <div style={{ ...S.walletRow, marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "var(--warning)", fontWeight: 600 }}>💰 رصيد العميل</span>
          <span style={{ fontSize: 15, color: "var(--warning)", fontWeight: 700 }}>{clientBalance.toFixed(2)} ج</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>⚠️ لا يكفي — سيُدفع جزئياً</div>
        {[
          ["من المحفظة:", `${walletDebit.toFixed(2)} ج`,   "var(--accent)"],
          ["المتبقي كاش:", `${cashRemainder.toFixed(2)} ج`, "var(--warning)"],
        ].map(([label, val, color]) => (
          <div key={label} style={S.splitRow}>
            <span style={{ color: "var(--muted)" }}>{label}</span>
            <span style={{ color, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <>
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

      <div style={S.page}>

        {/* ══ Header ══ */}
        <div className="no-print" style={S.header}>
          <div>
            <div style={S.brandName}>Link Space</div>
            <div style={S.brandSub}>إصدار فاتورة</div>
          </div>
          <button onClick={() => navigate("/scanner")} style={S.backBtn}>← رجوع</button>
        </div>

        {/* ══ Subscription Banner ══ */}
        {isSubscription && (
          <div style={S.subscriptionBanner}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>
                جلسة مشمولة بالاشتراك الشهري
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                تكلفة الجلسة صفر — مدفوع مسبقاً
              </div>
            </div>
          </div>
        )}

        {/* ══ Invoice Card (printable) ══ */}
        <div className="print-area card" style={{ marginBottom: 16 }}>

          {/* رأس الفاتورة */}
          <div style={S.invoiceHeader}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>🏢 Link Space</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              نظام إدارة مساحة العمل المشتركة
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>#{invoiceNumber}</span>
              <span style={{ color: "var(--muted)" }}>{dateStr} — {timeStr}</span>
            </div>
          </div>

          {/* بيانات العميل */}
          <div style={S.section}>
            <div style={S.sectionLabel}>بيانات العميل</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{client.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{client.phone}</div>
            {client.email && (
              <div style={{ fontSize: 11, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span>✉️</span>{client.email}
              </div>
            )}
          </div>

          {/* تفاصيل الجلسة */}
          <div style={S.section}>
            <div style={S.sectionLabel}>تفاصيل الجلسة</div>

            {/* المساحة + التكلفة */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span>{spaceIcon} {spaceName}</span>
              {isSubscription
                ? <span className="badge badge-success">✅ مشمول بالاشتراك</span>
                : <span style={{ fontWeight: 600 }}>{sessionCost.toFixed(2)} ج</span>
              }
            </div>

            {/* المدة + سعر الساعة */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              <span>
                المدة: {billedHours} {billedHours === 1 ? "ساعة" : "ساعات"}
                <span style={{ fontSize: 11, marginRight: 4, opacity: 0.7 }}>
                  ({session.durationMin} د فعلية)
                </span>
              </span>
              {!isSubscription && <span>سعر الساعة: {session.pricePerHr || "—"} ج</span>}
            </div>

            {/* عدد الأشخاص — لو أكثر من 1 */}
            {parseInt(session.guestCount) > 1 && (
              <div style={S.guestCountBox}>
                <span>👥 عدد الأشخاص</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                  {session.guestCount} أشخاص
                </span>
              </div>
            )}

            {/* وقت الدخول / الخروج */}
            {session.checkIn && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4, opacity: 0.8 }}>
                <span>دخول: {formatTime(session.checkIn)}</span>
                <span>خروج: {formatTime(session.checkOut || new Date().toISOString())}</span>
              </div>
            )}
          </div>

          {/* الخدمات المضافة */}
          {addedServices.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionLabel}>خدمات إضافية</div>
              {addedServices.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{s.name} × {s.qty}</span>
                    {s.from_order && (
                      <span style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: s.added_by === "client" ? "rgba(0,212,170,0.15)" : "rgba(255,165,2,0.15)",
                        color:      s.added_by === "client" ? "var(--accent)"         : "var(--warning)",
                      }}>
                        {s.added_by === "client" ? "👤" : "👷"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{(s.price * s.qty).toFixed(2)} ج</span>
                    <button
                      className="no-print"
                      onClick={() => removeService(s.id)}
                      style={{ background: "transparent", border: "none", color: "#ff4757", cursor: "pointer", fontSize: 16 }}
                    >−</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* كوبون الخصم (مقبول) */}
          {couponData && (
            <div style={S.section}>
              <div style={S.sectionLabel}>كوبون خصم</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--success)" }}>
                <span>🎫 {couponData.code} (خصم {couponData.discount_pct}%)</span>
                <span>− {discountAmount.toFixed(2)} ج</span>
              </div>
            </div>
          )}

          {/* ملاحظة */}
          {note && (
            <div style={{ ...S.section, fontSize: 13, color: "var(--muted)" }}>
              ملاحظة: {note}
            </div>
          )}

          {/* الإجمالي */}
          <div style={S.section}>
            {!isSubscription && (
              <div style={S.totalRow}>
                <span>تكلفة الجلسة</span>
                <span>{sessionCost.toFixed(2)} ج</span>
              </div>
            )}
            {isSubscription && (
              <div style={{ ...S.totalRow, color: "var(--success)" }}>
                <span>📋 اشتراك شهري</span>
                <span>مدفوع مسبقاً</span>
              </div>
            )}
            {servicesCost > 0 && (
              <div style={S.totalRow}>
                <span>الخدمات</span>
                <span>{servicesCost.toFixed(2)} ج</span>
              </div>
            )}
            {couponData && (
              <div style={{ ...S.totalRow, color: "var(--success)" }}>
                <span>خصم {couponData.discount_pct}%</span>
                <span>− {discountAmount.toFixed(2)} ج</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 10 }}>
              <span>الإجمالي</span>
              <span>{total === 0 ? "مجاناً ✅" : `${total.toFixed(2)} ج`}</span>
            </div>
          </div>

          {/* طريقة الدفع */}
          <div style={S.section}>
            <div style={S.sectionLabel}>طريقة الدفع</div>
            {effectiveMethod === "subscription" ? (
              <div style={{ textAlign: "center" }}>
                <span className="badge badge-success">📋 اشتراك شهري</span>
              </div>
            ) : effectiveMethod === "partial" ? (
              <>
                <div style={S.payRow}>
                  <span style={{ color: "var(--muted)" }}>💳 من المحفظة</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{walletDebit.toFixed(2)} ج</span>
                </div>
                <div style={S.payRow}>
                  <span style={{ color: "var(--muted)" }}>💵 كاش</span>
                  <span style={{ color: "var(--warning)", fontWeight: 700 }}>{cashRemainder.toFixed(2)} ج</span>
                </div>
              </>
            ) : effectiveMethod === "wallet" ? (
              <div style={S.payRow}>
                <span style={{ color: "var(--muted)" }}>💳 من المحفظة</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{total.toFixed(2)} ج</span>
              </div>
            ) : (
              <div style={S.payRow}>
                <span style={{ color: "var(--muted)" }}>💵 كاش</span>
                <span style={{ color: "var(--warning)", fontWeight: 700 }}>{total.toFixed(2)} ج</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
            شكراً لزيارتكم 🙏
          </div>
        </div>

        {/* ══ أدوات (no-print) ══ */}
        <div className="no-print">

          {/* إشعار الطلبات المحمّلة */}
          {addedServices.filter((s) => s.from_order).length > 0 && (
            <div style={S.ordersNotice}>
              <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                ☕ طلبات مضافة خلال الجلسة
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                تم تحميل {addedServices.filter((s) => s.from_order).length} طلب تلقائياً
                — يمكنك إضافة المزيد أو تعديل الكميات
              </div>
            </div>
          )}

          {/* ── إضافة خدمات ── */}
          <div className="section-title">إضافة خدمات / مشروبات</div>
          <input
            className="input-field"
            placeholder="🔍 بحث باسم أو سعر..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          {servicesList.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 16, fontSize: 13, marginBottom: 16 }}>
              جارٍ تحميل الخدمات...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {servicesList
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                    String(s.price).includes(serviceSearch),
                )
                .map((s) => {
                  const inCart = addedServices.find((x) => x.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => addService(s)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 10,
                        border: "1px solid",
                        background:   inCart ? "rgba(0,212,170,0.1)"  : "transparent",
                        borderColor:  inCart ? "var(--accent)"         : "var(--border)",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--accent)" }}>{s.price} ج</div>
                      {inCart && (
                        <div style={{ fontSize: 11, color: "var(--success)", marginTop: 2 }}>×{inCart.qty}</div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {/* ── كوبون الخصم ── */}
          <div className="section-title">كوبون خصم (اختياري)</div>

          {!couponData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input-field"
                  style={{
                    flex: 1,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    // ✅ لون الحدود يتغير حسب الحالة
                    borderColor: couponApplied
                      ? "var(--success)"
                      : couponError
                        ? "#ff4757"
                        : "var(--border)",
                  }}
                  placeholder="أدخل كود الكوبون..."
                  value={couponCode}
                  onChange={(e) => {
                    // ✅ إعادة تعيين الخطأ عند تغيير الكود
                    setCouponError(false);
                    setCouponApplied(false);
                    setCouponCode(e.target.value.toUpperCase());
                  }}
                  onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                />
                <button
                  type="button"
                  onClick={() => validateCoupon()}
                  disabled={couponLoading || !couponCode.trim()}
                  style={{
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "1px solid var(--accent)",
                    background: "transparent",
                    color: "var(--accent)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: couponLoading || !couponCode.trim() ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: couponLoading || !couponCode.trim() ? 0.6 : 1,
                  }}
                >
                  {couponLoading ? "⏳" : "تطبيق"}
                </button>
              </div>

              {/* مؤشر الفحص التلقائي */}
              {couponCode.trim().length >= 3 && !couponApplied && !couponError && !couponLoading && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>
                  ⌛ جارٍ التحقق التلقائي...
                </div>
              )}
              {couponLoading && (
                <div style={{ fontSize: 11, color: "var(--accent)", marginRight: 4 }}>
                  ⏳ جارٍ التحقق...
                </div>
              )}

              {/* خطأ */}
              {couponError && couponCode.trim().length > 0 && (
                <div style={{ fontSize: 11, color: "#ff4757", marginRight: 4 }}>
                  ❌ كود الخصم غير صحيح أو منتهي الصلاحية
                </div>
              )}
            </div>
          ) : (
            /* الكوبون مطبّق */
            <div style={S.couponSuccess}>
              <span style={{ fontSize: 20 }}>🎫</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", fontFamily: "var(--mono)" }}>
                  {couponData.code}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  خصم {couponData.discount_pct}% — توفير {discountAmount.toFixed(2)} ج
                </div>
              </div>
              {!couponUsed ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  style={{ background: "transparent", border: "none", color: "#ff4757", cursor: "pointer", fontSize: 18 }}
                >✕</button>
              ) : (
                <span className="badge badge-success">✅ مُطبَّق</span>
              )}
            </div>
          )}

          {/* ── طريقة الدفع ── */}
          {!(isSubscription && servicesCost === 0) && (
            <>
              <div className="section-title">طريقة الدفع</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {[["cash", "💵 كاش"], ["wallet", "💳 محفظة"]].map(([method, label]) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: "1px solid",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      borderColor: paymentMethod === method ? "var(--accent)" : "var(--border)",
                      background:  paymentMethod === method ? "var(--accent)" : "transparent",
                      color:       paymentMethod === method ? "#000" : "var(--muted)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <WalletStatus />
            </>
          )}

          {/* ── ملاحظة ── */}
          <div className="section-title">ملاحظة (اختياري)</div>
          <input
            className="input-field"
            style={{ marginBottom: 16 }}
            placeholder="أضف ملاحظة للفاتورة..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* ── أزرار الحفظ ── */}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
              🖨️ طباعة الفاتورة
            </button>
            <button
              onClick={handleDone}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--muted)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✅ تم
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    padding: 16,
    maxWidth: 560,
    margin: "0 auto",
    paddingBottom: 48,
  },
  emptyState: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 8,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: "1px solid var(--border)",
  },
  brandName: { fontSize: 18, fontWeight: 800, color: "var(--accent)" },
  brandSub:  { fontSize: 11, color: "var(--muted)" },
  backBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
  },
  subscriptionBanner: {
    padding: "10px 16px",
    background: "rgba(0,212,170,0.1)",
    border: "1px solid rgba(0,212,170,0.4)",
    borderRadius: 12,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  invoiceHeader: {
    textAlign: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px dashed var(--border)",
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px dashed var(--border)",
  },
  sectionLabel: {
    fontSize: 12,
    color: "var(--muted)",
    marginBottom: 6,
    fontWeight: 600,
  },
  guestCountBox: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "var(--muted)",
    padding: "6px 10px",
    background: "rgba(167,139,250,0.06)",
    border: "1px solid rgba(167,139,250,0.2)",
    borderRadius: 8,
    marginTop: 6,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "var(--muted)",
    marginBottom: 6,
  },
  payRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 4,
  },
  walletBox: (borderColor, bg) => ({
    padding: "10px 14px",
    background: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    marginBottom: 8,
  }),
  walletRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  splitRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "6px 8px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    marginBottom: 4,
  },
  ordersNotice: {
    padding: "10px 14px",
    background: "rgba(0,212,170,0.08)",
    border: "1px solid rgba(0,212,170,0.3)",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  couponSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "rgba(46,213,115,0.08)",
    border: "1px solid rgba(46,213,115,0.4)",
    borderRadius: 10,
    marginBottom: 16,
  },
};
