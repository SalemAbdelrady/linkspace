import React, { useState, useEffect, useRef, useCallback } from "react";
import { sessionsAPI, spacesAPI, servicesAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import api from "../utils/api";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SPACE_ICONS = { cowork: "🖥️", meeting: "🤝", lessons: "📚" };

const DEFAULT_SPACES = [
  { space_key: "cowork",  name: "منطقة العمل المشتركة", first_hour: 30,  max_hours: 4  },
  { space_key: "meeting", name: "غرفة الاجتماعات",       first_hour: 150, max_hours: 12 },
  { space_key: "lessons", name: "غرفة الدروس",            first_hour: 200, max_hours: 12 },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function calcCost(checkIn, pricePerHr, maxHours = 4) {
  const rawHours    = (Date.now() - new Date(checkIn)) / 3_600_000;
  const billedHours = Math.min(Math.max(Math.ceil(rawHours), 1), maxHours);
  return (billedHours * pricePerHr).toFixed(2);
}

function elapsed(checkIn) {
  const total = Math.floor((Date.now() - new Date(checkIn)) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function getBilledHours(durationMin, maxHours = 4) {
  return Math.min(Math.max(Math.ceil(durationMin / 60), 1), maxHours);
}

function DetailItem({ label, value, accent }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={{ ...styles.detailValue, color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AddOrderModal
// ─────────────────────────────────────────────
function AddOrderModal({ session, onClose, onAdded }) {
  const [services,      setServices]      = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    servicesAPI
      .getAll()
      .then(({ data }) => setServices(data.services || []))
      .catch(() => toast.error("خطأ في تحميل الخدمات"));

    api
      .get(`/orders/session/${session.id}`)
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {});
  }, [session.id]);

  async function addOrder(service) {
    setSaving(true);
    try {
      const { data } = await api.post("/orders/add", {
        session_id:   session.id,
        service_id:   service.id,
        service_name: service.name,
        price:        service.price,
        qty:          1,
      });
      setOrders((prev) => [...prev, data.order]);
      toast.success(`✅ تم إضافة ${service.name}`);
      onAdded?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الإضافة");
    } finally {
      setSaving(false);
    }
  }

  async function removeOrder(orderId) {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("تم الحذف");
    } catch {
      toast.error("خطأ في الحذف");
    }
  }

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      String(s.price).includes(serviceSearch),
  );

  const ordersTotal = orders.reduce(
    (sum, o) => sum + parseFloat(o.price) * o.qty,
    0,
  );

  return (
    <div
      style={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        style={styles.modalSheet}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>☕ إضافة طلب</div>
            <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>
              {session.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{session.phone}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* ── Current Orders ── */}
        {orders.length > 0 && (
          <div style={styles.ordersBox}>
            <div style={styles.sectionLabel}>الطلبات الحالية</div>
            {orders.map((o) => (
              <div key={o.id} style={styles.orderRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{o.service_name} × {o.qty}</span>
                  <span style={{
                    ...styles.addedByBadge,
                    color: o.added_by === "client" ? "var(--accent)" : "var(--muted)",
                  }}>
                    {o.added_by === "client" ? "👤 عميل" : "👷 طاقم"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {(parseFloat(o.price) * o.qty).toFixed(2)} ج
                  </span>
                  <button onClick={() => removeOrder(o.id)} style={styles.removeBtn}>✕</button>
                </div>
              </div>
            ))}
            <div style={styles.ordersTotalRow}>
              <span>المجموع</span>
              <span>{ordersTotal.toFixed(2)} ج</span>
            </div>
          </div>
        )}

        {/* ── Services Search ── */}
        <div style={styles.sectionLabel}>اختر خدمة أو مشروب</div>
        <input
          className="input-field"
          placeholder="🔍 بحث باسم أو سعر..."
          value={serviceSearch}
          onChange={(e) => setServiceSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        {/* ── Services Grid ── */}
        <div style={styles.servicesGrid}>
          {filteredServices.map((s) => (
            <button
              key={s.id}
              onClick={() => addOrder(s)}
              disabled={saving}
              style={{ ...styles.serviceCard, opacity: saving ? 0.6 : 1 }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
                {s.price} ج
              </div>
            </button>
          ))}
        </div>

        <button onClick={onClose} style={styles.doneBtn}>✅ تم</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ActiveClientCard
// ─────────────────────────────────────────────
function GuestCountEditor({ session, onUpdated }) {
  const [count, setCount] = useState(parseInt(session.guest_count) || 1);
  const [saving,  setSaving]  = useState(false);

  async function save(newCount) {
    if (newCount === session.guest_count) return;
    setSaving(true);
    try {
      await sessionsAPI.updateGuestCount(session.id, newCount);
      toast.success(`✅ تم تحديث عدد الأشخاص إلى ${newCount}`);
      onUpdated(newCount);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التحديث');
      setCount(session.guest_count);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: "wrap",  }}>
      {[1,2,3,4,5,6,7,8].map(n => (
        <button
          key={n}
          onClick={(e) => { e.stopPropagation(); setCount(n); save(n); }}
          disabled={saving}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            fontSize: 11,
            padding: 0,
            flexShrink: 0,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            borderColor: count === n ? 'var(--accent)' : 'var(--border)',
            background:  count === n ? 'rgba(0,212,170,0.15)' : 'transparent',
            color:       count === n ? 'var(--accent)' : 'var(--muted)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
function ActiveClientCard({ session, ordersInfo, onAddOrder, tick }) {
  // 💡 إضافة حالة محلية لكل كارت ليفتح ويغلق بشكل مستقل
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      style={{
        ...styles.clientCard,
        cursor: "pointer",
        borderColor: isExpanded ? "var(--accent)" : "var(--border)",
      }}
      onClick={() => setIsExpanded(!isExpanded)} // 💡 عند الضغط على الكارت يفتح ويغلق
    >
      {/* ── Top Row ── */}
      <div style={styles.clientCardTop}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar initials */}
          <div style={styles.avatar}>
            {(session.name || "U").split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{session.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              {session.phone}
            </div>
          </div>
        </div>

        {/* Space + Timer */}
        <div style={{ textAlign: "left" }}>
          <div style={styles.spaceBadge}>
            {SPACE_ICONS[session.space_key] || "🏢"} {session.space_name || "منطقة العمل"}
          </div>
          <div style={styles.timerText}>{elapsed(session.check_in)}</div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={styles.clientCardBottom}>
        <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap" }}>
          <span>
            جلسة:{" "}
            <strong style={{ color: "var(--warning)" }}>
              {calcCost(session.check_in, parseFloat(session.price_per_hr), session.max_hours || 4)} ج
            </strong>
          </span>
          {ordersInfo.count > 0 && (
            <span>
              طلبات:{" "}
              <strong style={{ color: "var(--accent)" }}>
                {ordersInfo.total?.toFixed(2)} ج
              </strong>
              <span style={styles.orderCountBadge}>{ordersInfo.count}</span>
            </span>
          )}
          {parseInt(session.guest_count) > 1 && (
            <span style={{
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(167,139,250,0.12)",
              border: "1px solid rgba(167,139,250,0.3)",
              color: "#a78bfa",
            }}>
              👥 {session.guest_count} أشخاص
            </span>
          )}
        </div>

        <button
          onClick={(e) => { 
            e.stopPropagation(); // 💡 منع الكارت من الإغلاق عند الضغط على الزر
            onAddOrder(session); 
          }}
          style={styles.addOrderBtn}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,170,0.22)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,212,170,0.1)")}
        >
          ☕ إضافة طلب
        </button>
      </div>

      {/* ── Section المطورة عند التوسيع ── */}
      {isExpanded && (
        <div style={styles.expandedSection} onClick={(e) => e.stopPropagation()}>
          {/* فاصل */}
          <div style={styles.expandDivider} />

          {/* بيانات الجلسة */}
          <div style={styles.expandGrid}>
            <DetailItem label="وقت الدخول" value={new Date(session.check_in).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} />
            <DetailItem label="سعر الساعة" value={`${session.price_per_hr} ج`} />
            <DetailItem label="الحد الأقصى" value={`${session.max_hours || 4} ساعات`} />
            <DetailItem label="نوع الجلسة" value={session.is_subscription_session ? "اشتراك شهري ✅" : "عادي"} />

            {/* 
            {session.guest_count > 1 && (
              <DetailItem label="عدد الأشخاص" value={`${session.guest_count} أشخاص 👥`} accent />
            )}
              */}

          {/* ── تعديل عدد الأشخاص — يأخذ العرض الكامل ── */}
          <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
            <div style={styles.detailLabel}>👥 عدد الأشخاص</div>
            <GuestCountEditor
              session={session}
              onUpdated={(newCount) => { session.guest_count = newCount; }}
            />
          </div>

            <DetailItem label="الرصيد الحالي" value={`${parseFloat(session.balance || 0).toFixed(2)} ج`} />
          </div>

          {/* الطلبات بالداخل */}
          {ordersInfo.count > 0 && (
            <div style={styles.ordersPreview}>
              <div style={styles.ordersPreviewTitle}>☕ الطلبات الحالية ({ordersInfo.count})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ordersInfo.orders?.map((o) => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "between", fontSize: 12, color: "var(--text)" }}>
                    <span>• {o.service_name} × {o.qty}</span>
                    <span style={{ marginRight: "auto", color: "var(--accent)" }}>{(parseFloat(o.price) * o.qty).toFixed(2)} ج</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* زر إضافة طلب داخل الكارت */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onAddOrder(session); 
            }}
            style={styles.addOrderBtnExpanded}
          >
            ☕ إضافة طلب على الجلسة
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ScannerPage
// ─────────────────────────────────────────────
export default function ScannerPage() {
  const { logout }   = useAuth();
  const navigate     = useNavigate();

  // ── Scan state ──
  const [result,        setResult]        = useState(null);
  const [scanning,      setScanning]      = useState(false);
  const [manualCode,    setManualCode]    = useState("");
  const [scanMode,      setScanMode]      = useState("device");
  const [cameraActive,  setCameraActive]  = useState(false);

  // ── Space / guest ──
  const [spaces,         setSpaces]        = useState([]);
  const [selectedSpace,  setSelectedSpace] = useState("cowork");
  const [guestCount,     setGuestCount]    = useState(1);

  // ── Active clients ──
  const [activeClients,  setActiveClients]  = useState([]);
  const [activeSearch,   setActiveSearch]   = useState("");       // ✅ NEW
  const [sessionOrders,  setSessionOrders]  = useState({});
  const [orderModal,     setOrderModal]     = useState(null);

  // ── Timer tick ──
  const [tick, setTick] = useState(0);

  // ── Refs ──
  const scanModeRef        = useRef("device");
  const inputRef           = useRef(null);
  const html5QrRef         = useRef(null);
  const scanningRef        = useRef(false);
  const lastScannedRef     = useRef("");
  const lastScannedTimeRef = useRef(0);

  // ── Detailed card upon pressing ──
  const [expandedSession, setExpandedSession] = useState(null);

  // ─────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────
  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function changeScanMode(mode) {
    scanModeRef.current = mode;
    setScanMode(mode);
  }

  // ─────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────
  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      setSpaces(data.spaces || []);
    } catch {}
  }

  async function loadActive() {
    try {
      const { data } = await sessionsAPI.active();
      setActiveClients(data.sessions);
      loadOrdersCounts(data.sessions);
    } catch {}
  }

  async function loadOrdersCounts(sessions) {
    const counts = {};
    await Promise.all(
      sessions.map(async (s) => {
        try {
          const { data } = await api.get(`/orders/session/${s.id}`);
          counts[s.id] = { count: data.orders.length, total: data.total, orders: data.orders, };
        } catch {
          counts[s.id] = { count: 0, total: 0 };
        }
      }),
    );
    setSessionOrders(counts);
  }

  // ─────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────
  useEffect(() => {
    loadActive();
    loadSpaces();
    
    // نقل التركيز مرة واحدة فقط عند تحميل الصفحة لأول مرة
    if (scanModeRef.current === "device") {
      focusInput();
    }
  }, [focusInput]);

  useEffect(() => {
    if (scanMode === "camera") startCamera();
    else { stopCamera(); focusInput(); }
    return () => stopCamera();
  }, [scanMode]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ─────────────────────────────────────────
  // Camera
  // ─────────────────────────────────────────
  async function startCamera() {
    try {
      const qr = new Html5Qrcode("camera-reader");
      html5QrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
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
        () => {},
      );
      setCameraActive(true);
    } catch {
      toast.error("تعذر تشغيل الكاميرا — تحقق من الإذن");
      changeScanMode("device");
    }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      html5QrRef.current = null;
    }
    setCameraActive(false);
  }

  // ─────────────────────────────────────────
  // Scan handler
  // ─────────────────────────────────────────
  async function handleScan(qrCode) {
    if (!qrCode.trim() || scanningRef.current) return;
    lastScannedRef.current     = qrCode.trim();
    lastScannedTimeRef.current = Date.now();
    scanningRef.current        = true;
    setScanning(true);

    try {
      const { data } = await sessionsAPI.scan(qrCode.trim(), selectedSpace, guestCount);
      if (scanModeRef.current === "camera") await stopCamera();
      setResult(data);
      setManualCode("");
            loadActive();
      // في handleScan، عند data.action === "checkout"
      if (data.action === "checkout") {
        // ✅ احفظ بيانات الجلسة في localStorage كـ "draft invoice"
        const draftKey = `draft_invoice_${data.session.id}`;
        localStorage.setItem(draftKey, JSON.stringify({
          session: data.session,
          client:  data.client,
          savedAt: new Date().toISOString(),
        }));

        toast.success(`تم تسجيل خروج ${data.client.name}`);
        navigate("/invoice", {
          state: { session: data.session, client: data.client },
        });
      }
      
      if (data.action === "checkin") {
        setGuestCount(1);
        toast.success(`تم تسجيل دخول ${data.client.name} — ${data.spaceName}`);
        setTimeout(() => {
          if (scanModeRef.current === "camera") startCamera();
        }, 2000);
      } else {
        toast.success(`تم تسجيل خروج ${data.client.name}`);
        navigate("/invoice", {
          state: { session: data.session, client: data.client },
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في المسح");
      if (scanModeRef.current === "camera") startCamera();
    } finally {
      scanningRef.current = false;
      setScanning(false);
      if (scanModeRef.current === "device") focusInput();
    }
  }

  // ─────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────
  const displayedSpaces = spaces.length > 0 ? spaces : DEFAULT_SPACES;
  const currentSpace    = displayedSpaces.find((s) => s.space_key === selectedSpace);

  const filteredClients = activeClients.filter((s) => {
    const q = activeSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  });

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div style={styles.page}>

      {/* ── Order Modal ── */}
      {orderModal && (
        <AddOrderModal
          session={orderModal}
          onClose={() => { setOrderModal(null); loadActive(); }}
          onAdded={() => loadOrdersCounts(activeClients)}
        />
      )}

      {/* ══════════════════════════════════════
          Header
      ══════════════════════════════════════ */}
      <div style={styles.header}>
        <div>
          <div style={styles.brandName}>Link Space</div>
          <div style={styles.brandSub}>واجهة الاستقبال</div>
        </div>

        {/* ✅ زرار الخروج على اليسار، رجوع على اليمين بعيداً */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* ══════════ هذا زر الخروج حذفته ══════════
          <button onClick={logout} style={styles.btnGhost}>خروج</button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          */}
          <button onClick={() => navigate("/admin")} style={styles.btnAccent}>
            ← رجوع
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          Space Selector
      ══════════════════════════════════════ */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>📍 نوع المساحة</div>
        <div style={styles.spaceGrid}>
          {displayedSpaces.map((s) => (
            <button
              key={s.space_key}
              onClick={() => setSelectedSpace(s.space_key)}
              style={{
                ...styles.spaceBtn,
                borderColor:   selectedSpace === s.space_key ? "var(--accent)" : "var(--border)",
                background:    selectedSpace === s.space_key ? "rgba(0,212,170,0.12)" : "transparent",
                color:         selectedSpace === s.space_key ? "var(--accent)" : "var(--muted)",
                boxShadow:     selectedSpace === s.space_key ? "0 0 0 1px rgba(0,212,170,0.3)" : "none",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 5 }}>
                {SPACE_ICONS[s.space_key] || "🏢"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4, fontWeight: 700 }}>
                {s.first_hour} ج/س
              </div>
            </button>
          ))}
        </div>

        {currentSpace && (
          <div style={styles.spaceInfo}>
            <span>{SPACE_ICONS[selectedSpace]} {currentSpace.name}</span>
            <span>
              أول ساعة:{" "}
              <strong style={{ color: "var(--accent)" }}>{currentSpace.first_hour} ج</strong>
              &nbsp;·&nbsp;الحد الأقصى:{" "}
              <strong style={{ color: "var(--accent)" }}>{currentSpace.max_hours} ساعة</strong>
            </span>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════
          Guest Count
      ══════════════════════════════════════ */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>👥 عدد الأشخاص</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setGuestCount(n)}
              style={{
                ...styles.guestBtn,
                borderColor: guestCount === n ? "var(--accent)" : "var(--border)",
                background:  guestCount === n ? "rgba(0,212,170,0.14)" : "transparent",
                color:       guestCount === n ? "var(--accent)" : "var(--muted)",
                fontWeight:  guestCount === n ? 800 : 500,
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {guestCount > 1 && (
          <div style={styles.guestNote}>
            💡 التكلفة ستُحسب على {guestCount} أشخاص — النقاط كلها لصاحب الحساب
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════
          Scan Mode Toggle
      ══════════════════════════════════════ */}
      <section style={styles.section}>
        <div style={{ display: "flex", gap: 8 }}>
          {[["device", "📡 ماسح ضوئي"], ["camera", "📷 كاميرا"]].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => changeScanMode(mode)}
              style={{
                ...styles.modeBtn,
                borderColor: scanMode === mode ? "var(--accent)" : "var(--border)",
                background:  scanMode === mode ? "var(--accent)" : "transparent",
                color:       scanMode === mode ? "#000" : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          Camera View
      ══════════════════════════════════════ */}
      {scanMode === "camera" && (
        <section style={styles.section}>
          <div
            id="camera-reader"
            style={{ width: "100%", borderRadius: 16, overflow: "hidden", border: "2px solid var(--accent)" }}
          />
          {!cameraActive && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 13 }}>
              جارٍ تشغيل الكاميرا...
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════
          Device Scanner Visual
      ══════════════════════════════════════ */}
      {scanMode === "device" && (
        <section style={{ ...styles.section, display: "flex", justifyContent: "center" }}>
          <div style={styles.scannerFrame}>
            {/* Corner brackets */}
            {[
              { top: 0, right: 0, borderWidth: "3px 0 0 3px", borderRadius: "8px 0 0 0" },
              { top: 0, left:  0, borderWidth: "3px 3px 0 0", borderRadius: "0 8px 0 0" },
              { bottom: 0, right: 0, borderWidth: "0 0 3px 3px", borderRadius: "0 0 0 8px" },
              { bottom: 0, left:  0, borderWidth: "0 3px 3px 0", borderRadius: "0 0 8px 0" },
            ].map((corner, i) => (
              <div
                key={i}
                style={{
                  position:    "absolute",
                  width:       22,
                  height:      22,
                  borderColor: "var(--accent)",
                  borderStyle: "solid",
                  ...corner,
                }}
              />
            ))}

            {/* Center icon */}
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>
                {scanning ? "⏳" : SPACE_ICONS[selectedSpace] || "📡"}
              </div>
              <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.85 }}>
                {scanning ? "جارٍ المسح..." : "جاهز للمسح"}
              </div>
              {!scanning && currentSpace && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                  {currentSpace.name}
                </div>
              )}
            </div>

            {/* Scan line animation */}
            <div style={styles.scanLine} />
          </div>
          <style>{`
            @keyframes scanLine { 0%,100%{top:15%} 50%{top:80%} }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          `}</style>
        </section>
      )}

      {/* ══════════════════════════════════════
          Manual Input
      ══════════════════════════════════════ */}
      <section style={{ ...styles.section }}>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={styles.scanStatus}>
            <span style={{
              ...styles.statusDot,
              background: scanning ? "var(--warning)" : "var(--success)",
              animation: scanning ? "pulse 1s infinite" : "none",
            }} />
            {scanning ? "جارٍ المسح..." : "في انتظار المسح"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              className="input-field"
              style={{ flex: 1 }}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(manualCode)}
              placeholder="امسح الـ QR أو اكتب الكود يدوياً..."
              autoComplete="off"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleScan(manualCode)}
              disabled={!manualCode || scanning}
            >
              مسح
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Scan Result
      ══════════════════════════════════════ */}
      {result && (
        <section style={styles.section}>
          <div
            className="card fade-up"
            style={{
              textAlign:   "center",
              borderColor: result.action === "checkin" ? "rgba(46,213,115,0.5)" : "rgba(255,165,2,0.5)",
              background:  result.action === "checkin" ? "rgba(46,213,115,0.06)" : "rgba(255,165,2,0.06)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {result.action === "checkin" ? "✅" : "🏁"}
            </div>
            <div style={{
              fontWeight: 700,
              fontSize:   16,
              color:      result.action === "checkin" ? "var(--success)" : "var(--warning)",
              marginBottom: 4,
            }}>
              {result.action === "checkin" ? "تم تسجيل الدخول" : "انتهاء الجلسة"}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{result.client.name}</div>

            {(result.spaceName || result.session?.spaceName) && (
              <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>
                {SPACE_ICONS[result.spaceKey || result.session?.spaceKey] || "🏢"}{" "}
                {result.spaceName || result.session?.spaceName}
              </div>
            )}

            {result.action === "checkin" ? (
              <>
                <div className="stat-row">
                  <span className="stat-label">الرصيد</span>
                  <span className="stat-val" style={{ color: "var(--accent)" }}>
                    {parseFloat(result.client.balance).toFixed(2)} ج
                  </span>
                </div>
                <div className="stat-row" style={{ border: "none" }}>
                  <span className="stat-label">سعر الساعة</span>
                  <span className="stat-val">{result.pricePerHr} ج</span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-row">
                  <span className="stat-label">المدة</span>
                  <span className="stat-val">
                    {getBilledHours(result.session.durationMin, result.session.maxHours)} ساعة
                    <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 6 }}>
                      ({result.session.durationMin} د فعلية)
                    </span>
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">التكلفة</span>
                  <span className="stat-val" style={{ color: "var(--warning)", fontSize: 18 }}>
                    {result.session.cost} ج
                  </span>
                </div>
                <div className="stat-row" style={{ border: "none" }}>
                  <span className="stat-label">نقاط مكتسبة</span>
                  <span className="stat-val" style={{ color: "var(--success)" }}>
                    +{result.session.pointsEarned} نقطة
                  </span>
                </div>
              </>
            )}

            <button
              onClick={() => { setResult(null); focusInput(); }}
              style={styles.closeResultBtn}
            >
              إغلاق
            </button>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          Active Clients
      ══════════════════════════════════════ */}
      <section style={styles.section}>
        {/* ── Header + Search ── */}
        <div style={styles.activeSectionHeader}>
          <div style={styles.sectionTitle} >
            🟢 النشطون الآن
            <span style={styles.activeBadge}>{activeClients.length}</span>
          </div>
          <button
            onClick={loadActive}
            title="تحديث"
            style={styles.refreshBtn}
          >
            🔄
          </button>
        </div>

        {/* ✅ Search bar for active clients */}
        <input
          className="input-field"
          placeholder="🔍 بحث بالاسم أو رقم الموبايل..."
          value={activeSearch}
          onChange={(e) => setActiveSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {/* ── Client Cards ── */}
        {activeClients.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 24 }}>
            لا يوجد عملاء نشطون حالياً
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: 24 }}>
            لا توجد نتائج لـ &quot;{activeSearch}&quot;
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredClients.map((s) => (
              <ActiveClientCard
                key={s.id}
                session={s}
                ordersInfo={sessionOrders[s.id] || { count: 0, total: 0 }}
                onAddOrder={setOrderModal}
                tick={tick}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────
// Styles object — centralised for clean JSX
// ─────────────────────────────────────────────
const styles = {
  // ── Page ──
  page: {
    minHeight:  "100vh",
    maxWidth:   680,
    margin:     "0 auto",
    padding:    "16px 16px 48px",
  },

  // ── Header ──
  header: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   20,
    paddingBottom:  14,
    borderBottom:   "1px solid var(--border)",
  },
  brandName: { fontSize: 20, fontWeight: 900, color: "var(--accent)", letterSpacing: -0.5 },
  brandSub:  { fontSize: 12, color: "var(--muted)", marginTop: 2 },

  btnAccent: {
    background:   "var(--accent)",
    border:       "none",
    color:        "#000",
    padding:      "7px 14px",
    borderRadius: 8,
    fontSize:     12,
    fontWeight:   700,
    cursor:       "pointer",
  },
  btnGhost: {
    background:   "transparent",
    border:       "1px solid var(--border)",
    color:        "var(--muted)",
    padding:      "7px 12px",
    borderRadius: 8,
    fontSize:     12,
    cursor:       "pointer",
  },

  // ── Sections ──
  section:      { marginBottom: 18 },
  sectionTitle: {
    fontSize:    12,
    color:       "var(--muted)",
    fontWeight:  700,
    marginBottom: 10,
    display:     "flex",
    alignItems:  "center",
    gap:         6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Space selector ──
  spaceGrid: { display: "flex", gap: 8 },
  spaceBtn: {
    flex:         1,
    padding:      "12px 8px",
    borderRadius: 12,
    border:       "1px solid",
    fontSize:     12,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "all 0.2s",
    textAlign:    "center",
  },
  spaceInfo: {
    display:        "flex",
    justifyContent: "space-between",
    marginTop:       8,
    padding:        "8px 12px",
    background:     "rgba(0,212,170,0.06)",
    borderRadius:    8,
    fontSize:        11,
    color:          "var(--muted)",
  },

  // ── Guest count ──
  guestBtn: {
    width:        44,
    height:       44,
    borderRadius: 12,
    border:       "1px solid",
    fontSize:     15,
    cursor:       "pointer",
    transition:   "all 0.15s",
  },
  guestNote: {
    marginTop:    8,
    padding:      "7px 12px",
    background:   "rgba(0,212,170,0.06)",
    borderRadius: 8,
    fontSize:     12,
    color:        "var(--muted)",
  },

  // ── Scan mode ──
  modeBtn: {
    flex:         1,
    padding:      "10px",
    borderRadius: 12,
    border:       "1px solid",
    fontSize:     13,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "all 0.2s",
  },

  // ── Scanner frame ──
  scannerFrame: {
    position:   "relative",
    width:       240,
    height:      240,
    border:      "2px solid var(--accent)",
    borderRadius: 20,
    display:     "flex",
    alignItems:  "center",
    justifyContent: "center",
    background:  "rgba(0,212,170,0.04)",
    overflow:    "hidden",
  },
  scanLine: {
    position:   "absolute",
    width:      "80%",
    height:      2,
    background: "var(--accent)",
    opacity:     0.7,
    animation:  "scanLine 2s ease-in-out infinite",
  },

  // ── Scan status ──
  scanStatus: {
    fontSize:    13,
    color:       "var(--muted)",
    marginBottom: 8,
    display:     "flex",
    alignItems:  "center",
    gap:          6,
  },
  statusDot: {
    width:        8,
    height:       8,
    borderRadius: "50%",
    display:     "inline-block",
    flexShrink:   0,
  },

  // ── Result close btn ──
  closeResultBtn: {
    marginTop:    12,
    background:   "transparent",
    border:       "1px solid var(--border)",
    color:        "var(--muted)",
    padding:      "7px 20px",
    borderRadius: 8,
    fontSize:     12,
    cursor:       "pointer",
  },

  // ── Active clients section header ──
  activeSectionHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   10,
  },
  activeBadge: {
    background:   "var(--accent)",
    color:        "#000",
    borderRadius: 20,
    padding:      "1px 8px",
    fontSize:     11,
    fontWeight:   800,
  },
  refreshBtn: {
    background:   "transparent",
    border:       "1px solid var(--border)",
    borderRadius: 8,
    padding:      "4px 10px",
    fontSize:     14,
    cursor:       "pointer",
    color:        "var(--muted)",
  },

  // ── Client card ──
  clientCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: 14,
    padding:      "12px 14px",
    transition:   "border-color 0.2s",
  },
  clientCardTop: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   10,
  },
  clientCardBottom: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    gap:             8,
    flexWrap:       "wrap",
  },
  avatar: {
    width:          38,
    height:         38,
    borderRadius:   "50%",
    background:     "linear-gradient(135deg, var(--accent), var(--accent2, #06b6d4))",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     700,
    fontSize:       13,
    color:          "#fff",
    flexShrink:     0,
  },
  spaceBadge: {
    fontSize:  11,
    color:     "var(--muted)",
    textAlign: "left",
  },
  timerText: {
    fontSize:    14,
    fontFamily:  "var(--mono, monospace)",
    color:       "var(--accent)",
    fontWeight:  700,
    marginTop:   2,
    textAlign:   "left",
  },
  orderCountBadge: {
    fontSize:     10,
    background:   "var(--accent)",
    color:        "#000",
    borderRadius: 10,
    padding:      "1px 6px",
    marginRight:  4,
    fontWeight:   700,
  },
  addOrderBtn: {
    padding:      "7px 14px",
    borderRadius: 20,
    border:       "1px solid var(--accent)",
    background:   "rgba(0,212,170,0.1)",
    color:        "var(--accent)",
    fontSize:     12,
    fontWeight:   700,
    cursor:       "pointer",
    display:      "flex",
    alignItems:   "center",
    gap:           4,
    transition:   "background 0.2s",
    whiteSpace:   "nowrap",
  },

  // ── Modal ──
  modalOverlay: {
    position:       "fixed",
    inset:           0,
    background:     "rgba(0,0,0,0.82)",
    zIndex:          200,
    display:        "flex",
    alignItems:     "flex-end",
    justifyContent: "center",
    padding:         16,
    backdropFilter: "blur(2px)",
  },
  modalSheet: {
    background:   "var(--surface)",
    borderRadius: "20px 20px 16px 16px",
    padding:       20,
    width:        "100%",
    maxWidth:      480,
    maxHeight:    "85vh",
    overflowY:    "auto",
  },
  modalHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:    16,
  },
  closeBtn: {
    background: "transparent",
    border:     "none",
    color:      "var(--muted)",
    fontSize:    22,
    cursor:     "pointer",
  },

  // ── Orders box ──
  ordersBox: {
    marginBottom: 16,
    padding:      "10px 14px",
    background:   "rgba(0,212,170,0.06)",
    border:       "1px solid rgba(0,212,170,0.2)",
    borderRadius:  12,
  },
  sectionLabel: {
    fontSize:    12,
    color:       "var(--muted)",
    marginBottom: 8,
    fontWeight:   600,
  },
  orderRow: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    fontSize:        13,
    marginBottom:    6,
  },
  addedByBadge: {
    fontSize:     10,
    padding:      "1px 6px",
    background:   "rgba(255,255,255,0.05)",
    borderRadius:  4,
  },
  removeBtn: {
    background: "transparent",
    border:     "none",
    color:      "#ff4757",
    cursor:     "pointer",
    fontSize:    16,
    padding:     0,
  },
  ordersTotalRow: {
    borderTop:      "1px dashed var(--border)",
    paddingTop:      8,
    marginTop:       8,
    display:        "flex",
    justifyContent: "space-between",
    fontWeight:      700,
    fontSize:        14,
    color:          "var(--accent)",
  },

  // ── Services grid ──
  servicesGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:                  8,
  },
  serviceCard: {
    padding:      "12px 8px",
    borderRadius:  12,
    border:       "1px solid var(--border)",
    background:   "transparent",
    cursor:       "pointer",
    textAlign:    "center",
    transition:   "border-color 0.15s",
  },
  doneBtn: {
    width:        "100%",
    marginTop:     16,
    padding:      "12px",
    borderRadius:  10,
    border:       "1px solid var(--border)",
    background:   "transparent",
    color:        "var(--muted)",
    fontSize:      14,
    fontWeight:    600,
    cursor:       "pointer",
  },
  // ── Detailed card upon pressing ──
  expandedSection: {
    marginTop: 12,
  },
  expandDivider: {
    height: 1,
    background: "var(--border)",
    marginBottom: 12,
  },
  expandGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 12,
    overflow: "hidden",  
  },
  detailItem: {
    padding: "8px 10px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid var(--border)",
  },
  detailLabel: {
    fontSize: 10,
    color: "var(--muted)",
    marginBottom: 3,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  ordersPreview: {
    padding: "10px 12px",
    background: "rgba(0,212,170,0.06)",
    border: "1px solid rgba(0,212,170,0.2)",
    borderRadius: 10,
    marginBottom: 10,
  },
  ordersPreviewTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: "var(--accent)",
  },
  addOrderBtnExpanded: {
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px solid var(--accent)",
    background: "rgba(0,212,170,0.08)",
    color: "var(--accent)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

};
