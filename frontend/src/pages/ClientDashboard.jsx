import React, { useEffect, useState, useRef } from "react";
import {
  sessionsAPI,
  couponsAPI,
  spacesAPI,
  invoicesAPI,
  servicesAPI,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

// ── ProgressBar ───────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 10,
        height: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
          borderRadius: 10,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

const SPACE_ICONS = { cowork: "🖥️", meeting: "🤝", lessons: "📚" };

// ── LiveTimer ─────────────────────────────────────────────────────────
function LiveTimer({ checkIn, pricePerHr, maxHours = 4, spaceName, spaceKey }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(checkIn);
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  const billedHours = Math.min(
    Math.max(Math.ceil(elapsed / 3600), 1),
    maxHours,
  );
  const cost = (billedHours * pricePerHr).toFixed(2);
  const isMaxed = billedHours >= maxHours;
  return (
    <div
      style={{
        background: "rgba(46,213,115,0.07)",
        border: "1px solid rgba(46,213,115,0.3)",
        borderRadius: "var(--radius)",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span className="pulse-dot" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>جلسة نشطة</span>
        {spaceKey && (
          <span style={{ fontSize: 11, color: "var(--accent)" }}>
            {SPACE_ICONS[spaceKey] || "🏢"} {spaceName}
          </span>
        )}
        {isMaxed && (
          <span
            style={{
              fontSize: 11,
              background: "rgba(0,212,170,0.15)",
              color: "var(--accent)",
              padding: "2px 8px",
              borderRadius: 10,
            }}
          >
            وصلت للحد الأقصى
          </span>
        )}
      </div>
      <div className="stat-row">
        <span className="stat-label">المدة</span>
        <span className="stat-val" style={{ fontFamily: "var(--mono)" }}>
          {fmt}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-label">الساعات المحاسَب عليها</span>
        <span className="stat-val" style={{ color: "var(--muted)" }}>
          {billedHours} {billedHours === 1 ? "ساعة" : "ساعات"}
        </span>
      </div>
      <div className="stat-row">
        <span className="stat-label">سعر الساعة</span>
        <span className="stat-val" style={{ color: "var(--muted)" }}>
          {pricePerHr} ج/س
        </span>
      </div>
      <div className="stat-row" style={{ border: "none" }}>
        <span className="stat-label">التكلفة الحالية</span>
        <span
          className="stat-val"
          style={{ color: isMaxed ? "var(--success)" : "var(--warning)" }}
        >
          {cost} ج {isMaxed && "✅"}
        </span>
      </div>
    </div>
  );
}

// ── مودال طلب العميل ─────────────────────────────────────────────────
function ClientOrderModal({ sessionId, onClose, onOrderAdded }) {
  const [services, setServices] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [confirmItem, setConfirmItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([servicesAPI.getAll(), api.get(`/orders/session/${sessionId}`)])
      .then(([svcRes, ordRes]) => {
        setServices(svcRes.data.services || []);
        setMyOrders(ordRes.data.orders || []);
      })
      .catch(() => {
        toast.error("خطأ في تحميل البيانات");
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function confirmAdd(service) {
    setSaving(true);
    try {
      const { data } = await api.post("/orders/client-add", {
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        qty: 1,
      });
      setMyOrders((prev) => [...prev, data.order]);
      setConfirmItem(null);
      toast.success(`✅ تم إضافة ${service.name} على فاتورتك`);
      onOrderAdded && onOrderAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الإضافة");
    } finally {
      setSaving(false);
    }
  }

  const clientOrders = myOrders.filter((o) => o.added_by === "client");
  const staffOrders = myOrders.filter((o) => o.added_by === "staff");
  const myTotal = clientOrders.reduce(
    (sum, o) => sum + parseFloat(o.price) * o.qty,
    0,
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => !confirmItem && onClose()}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "20px 20px 16px 16px",
          padding: 20,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {confirmItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 16,
                padding: 24,
                maxWidth: 320,
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>☕</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                تأكيد الطلب
              </div>
              <div
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 4 }}
              >
                سيتم إضافة
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: 4,
                }}
              >
                {confirmItem.name}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--warning)",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {confirmItem.price} ج
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,165,2,0.08)",
                  border: "1px solid rgba(255,165,2,0.3)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 20,
                }}
              >
                ⚠️ بعد الإضافة لا يمكنك حذف الطلب — تواصل مع أحد العاملين لأي
                تعديل
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmItem(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => confirmAdd(confirmItem)}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  {saving ? "جارٍ الإضافة..." : "✅ تأكيد الإضافة"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>☕ أضف طلبك</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              سيظهر في فاتورتك النهائية
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {staffOrders.length > 0 && (
          <div
            style={{
              marginBottom: 12,
              padding: "10px 14px",
              background: "rgba(255,165,2,0.06)",
              border: "1px solid rgba(255,165,2,0.2)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--warning)",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              👷 مضاف من الطاقم
            </div>
            {staffOrders.map((o) => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "var(--text)" }}>
                  {o.service_name} × {o.qty}
                </span>
                <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                  {(parseFloat(o.price) * o.qty).toFixed(2)} ج
                </span>
              </div>
            ))}
          </div>
        )}

        {clientOrders.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "rgba(0,212,170,0.06)",
              border: "1px solid rgba(0,212,170,0.2)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              👤 طلباتي
            </div>
            {clientOrders.map((o) => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "var(--text)" }}>
                  {o.service_name} × {o.qty}
                </span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {(parseFloat(o.price) * o.qty).toFixed(2)} ج
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px dashed var(--border)",
                paddingTop: 8,
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--accent)",
              }}
            >
              <span>مجموع طلباتي</span>
              <span>{myTotal.toFixed(2)} ج</span>
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 10,
            fontWeight: 600,
          }}
        >
          اختر ما تريد
        </div>
        {loading ? (
          <div
            style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}
          >
            جارٍ التحميل...
          </div>
        ) : services.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}
          >
            لا توجد خدمات متاحة
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setConfirmItem(s)}
                style={{
                  padding: "14px 8px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "rgba(0,212,170,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--accent)",
                    fontWeight: 700,
                  }}
                >
                  {s.price} ج
                </div>
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            fontSize: 11,
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          💡 الطلبات ستُضاف تلقائياً لفاتورتك عند تسجيل الخروج
        </div>
      </div>
    </div>
  );
}

// ── InvoiceDetailModal ────────────────────────────────────────────────
function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;
  const services =
    typeof invoice.services === "string"
      ? JSON.parse(invoice.services)
      : invoice.services || [];
  const spaceIcon = SPACE_ICONS[invoice.space_key] || "🏢";
  const spaceName = invoice.space_name || "منطقة العمل المشتركة";
  const billedHours = invoice.duration_min
    ? Math.min(Math.max(Math.ceil(invoice.duration_min / 60), 1), 12)
    : null;
  const walletPaid = parseFloat(invoice.wallet_paid || 0);
  const cashPaid = parseFloat(invoice.cash_paid || 0);
  const method = invoice.payment_method;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: 20,
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}
            >
              #{invoice.invoice_number}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {new Date(invoice.created_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" — "}
              {new Date(invoice.created_at).toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>{spaceIcon}</span>
          <span
            style={{ fontWeight: 700, fontSize: 15, color: "var(--accent)" }}
          >
            {spaceName}
          </span>
        </div>
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px dashed var(--border)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
            تفاصيل الجلسة
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            <span>
              {spaceIcon} {spaceName}
            </span>
            <span style={{ fontWeight: 600 }}>
              {parseFloat(invoice.session_cost).toFixed(2)} ج
            </span>
          </div>
          {billedHours && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              المدة: {billedHours} {billedHours === 1 ? "ساعة" : "ساعات"} (
              {invoice.duration_min} د فعلية)
            </div>
          )}
          {invoice.price_per_hr > 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              سعر الساعة: {invoice.price_per_hr} ج
            </div>
          )}
        </div>
        {services.length > 0 && (
          <div
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px dashed var(--border)",
            }}
          >
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}
            >
              خدمات إضافية
            </div>
            {services.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span>
                  {s.name} × {s.qty}
                </span>
                <span>{(s.price * s.qty).toFixed(2)} ج</span>
              </div>
            ))}
          </div>
        )}
        {invoice.coupon_code && (
          <div
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px dashed var(--border)",
            }}
          >
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
            >
              كوبون خصم
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--success)",
              }}
            >
              <span>
                🎫 {invoice.coupon_code} (خصم {invoice.discount_pct}%)
              </span>
              <span>− {parseFloat(invoice.discount_amount).toFixed(2)} ج</span>
            </div>
          </div>
        )}
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px dashed var(--border)",
          }}
        >
          {parseFloat(invoice.services_cost) > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              <span>الخدمات</span>
              <span>{parseFloat(invoice.services_cost).toFixed(2)} ج</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--accent)",
              marginTop: 8,
            }}
          >
            <span>الإجمالي</span>
            <span>
              {parseFloat(invoice.total) === 0
                ? "مجاناً ✅"
                : `${parseFloat(invoice.total).toFixed(2)} ج`}
            </span>
          </div>
        </div>
        <div
          style={{
            background: "rgba(0,0,0,0.15)",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            طريقة الدفع
          </div>
          {method === "subscription" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>📋 اشتراك شهري</span>
              <span style={{ fontWeight: 700, color: "var(--success)" }}>
                مجاناً
              </span>
            </div>
          ) : walletPaid > 0 && cashPaid > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--muted)" }}>💳 من المحفظة</span>
                <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                  {walletPaid.toFixed(2)} ج
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--muted)" }}>💵 كاش</span>
                <span style={{ fontWeight: 700, color: "var(--warning)" }}>
                  {cashPaid.toFixed(2)} ج
                </span>
              </div>
            </div>
          ) : walletPaid > 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>💳 محفظة كاملة</span>
              <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                {walletPaid.toFixed(2)} ج
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>💵 كاش</span>
              <span style={{ fontWeight: 700, color: "var(--warning)" }}>
                {parseFloat(invoice.total).toFixed(2)} ج
              </span>
            </div>
          )}
        </div>
        {invoice.note && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
            📝 {invoice.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClientDashboard ───────────────────────────────────────────────────
export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const nudgeShown = useRef(false);

  const [sessions, setSessions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [spaces, setSpaces] = useState([]);

  const [invoices, setInvoices] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loadingRecentInvoices, setLoadingRecentInvoices] = useState(true);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [allOrdersCount, setAllOrdersCount] = useState(0);

  useEffect(() => {
    loadData();
    loadSpaces();
    loadRecentInvoices();
  }, []);
  useEffect(() => {
    if (tab === "invoices") loadInvoices();
  }, [tab, invoicePage]);

  useEffect(() => {
    if (!activeSession) return;
    api
      .get(`/orders/session/${activeSession.id}`)
      .then(({ data }) => setAllOrdersCount(data.orders?.length || 0))
      .catch(() => {});
  }, [activeSession]);

  // ── Profile completion nudge ─────────────────────────────────────────
  // ✅ الحل — استخدم useRef عشان تتأكد إن user اتحمل فعلاً
  useEffect(() => {
    // لو user لسه null أو الـ nudge اتعرض قبل كده، اخرج
    if (!user || nudgeShown.current) return;

    const missingPhoto = !user.avatar_url;
    const missingEmail = !user.email;

    if (!missingPhoto && !missingEmail) return;

    nudgeShown.current = true;

    let line1 = "";
    let line2 = "";

    if (missingPhoto && missingEmail) {
      line1 = "👤 ملفك الشخصي غير مكتمل";
      line2 = "أضف صورة وبريدك الإلكتروني من الإعدادات لتجربة أفضل";
    } else if (missingPhoto) {
      line1 = "📸 أضف صورة لحسابك";
      line2 = "اجعل ملفك الشخصي أكثر احترافية من خلال الإعدادات";
    } else {
      line1 = "📧 لا يوجد بريد إلكتروني";
      line2 = "أضف إيميلك لاستقبال فواتيرك وإشعاراتك";
    }

    const timer = setTimeout(() => {
      toast(
        (t) => (
          <div
            onClick={() => toast.dismiss(t.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {missingPhoto ? "📸" : "📧"}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                {line1}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.4,
                }}
              >
                {line2}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                  navigate("/settings");
                }}
                style={{
                  marginTop: 8,
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--accent)",
                  background: "rgba(0,212,170,0.12)",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚙️ الإعدادات
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ),
        {
          duration: 8000,  // يختفي لوحده بعد 8 ثواني
          position: "top-center",
          style: {
            background: "#1a1a2e",
            border: "1px solid rgba(0,212,170,0.3)",
            borderRadius: 14,
            padding: "14px 16px",
            maxWidth: 340,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            color: "#fff",
          },
          icon: null,
        },
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [user]); // لازم يفضل [user] عشان ينتظر تحميله
  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      setSpaces(data.spaces || []);
    } catch {}
  }

  async function loadData() {
    try {
      const [histRes, couponRes] = await Promise.all([
        sessionsAPI.history(),
        couponsAPI.myCoupons(),
      ]);
      const allSessions = histRes.data.sessions;
      const active = allSessions.find((s) => s.status === "active");
      setActiveSession(active || null);
      setSessions(allSessions.filter((s) => s.status !== "active"));
      setCoupons(couponRes.data.coupons);
    } catch {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadRecentInvoices() {
    try {
      const { data } = await invoicesAPI.getClientInvoices({ page: 1 });
      setRecentInvoices(data.invoices || []);
    } catch {
    } finally {
      setLoadingRecentInvoices(false);
    }
  }

  async function loadInvoices() {
    setLoadingInvoices(true);
    try {
      const { data } = await invoicesAPI.getClientInvoices({
        page: invoicePage,
      });
      setInvoices(data.invoices);
      setInvoiceTotal(data.total);
    } catch {
      toast.error("خطأ في تحميل الفواتير");
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function redeemPoints() {
    try {
      await couponsAPI.redeem();
      toast.success("تم إنشاء الكوبون بنجاح! 🎫");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الاستبدال");
    }
  }

  function refreshOrdersCount() {
    if (!activeSession) return;
    api
      .get(`/orders/session/${activeSession.id}`)
      .then(({ data }) => setAllOrdersCount(data.orders?.length || 0))
      .catch(() => {});
  }

  const activeSpaceKey = activeSession?.space_key || "cowork";
  const activeSpaceName = activeSession?.space_name || "منطقة العمل المشتركة";
  const activePricePerHr = parseFloat(activeSession?.price_per_hr || 30);
  const activeMaxHours = parseInt(activeSession?.max_hours || 4);

  // ✅ الأحرف الأولى للاسم — fallback لو ما في صورة
  const initials = (user?.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const totalInvoicePages = Math.ceil(invoiceTotal / 10);

  function InvoiceCard({ inv, onClick }) {
    const services =
      typeof inv.services === "string"
        ? JSON.parse(inv.services)
        : inv.services || [];
    const icon = SPACE_ICONS[inv.space_key] || "🏢";
    const name = inv.space_name || "منطقة العمل المشتركة";
    const walletPaid = parseFloat(inv.wallet_paid || 0);
    const cashPaid = parseFloat(inv.cash_paid || 0);
    const method = inv.payment_method;
    return (
      <div
        className="card"
        style={{ cursor: "pointer", marginBottom: 10 }}
        onClick={onClick}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                #{inv.invoice_number}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {new Date(inv.created_at).toLocaleDateString("ar-EG", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                {new Date(inv.created_at).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {icon} {name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {method === "subscription" ? (
                <span className="badge badge-success" style={{ fontSize: 10 }}>
                  📋 اشتراك شهري
                </span>
              ) : walletPaid > 0 && cashPaid > 0 ? (
                <>
                  <span className="badge badge-info" style={{ fontSize: 10 }}>
                    💳 {walletPaid.toFixed(2)} ج محفظة
                  </span>
                  <span
                    className="badge badge-warning"
                    style={{ fontSize: 10 }}
                  >
                    💵 {cashPaid.toFixed(2)} ج كاش
                  </span>
                </>
              ) : walletPaid > 0 ? (
                <span className="badge badge-info" style={{ fontSize: 10 }}>
                  💳 {walletPaid.toFixed(2)} ج محفظة
                </span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: 10 }}>
                  💵 {parseFloat(inv.total).toFixed(2)} ج كاش
                </span>
              )}
              {services.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    padding: "2px 6px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 6,
                  }}
                >
                  ☕ {services.length} خدمة
                </span>
              )}
              {inv.coupon_code && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--success)",
                    padding: "2px 6px",
                    background: "rgba(46,213,115,0.08)",
                    borderRadius: 6,
                  }}
                >
                  🎫 {inv.coupon_code}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "left", marginRight: 8 }}>
            <div
              style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}
            >
              {parseFloat(inv.total) === 0 ? (
                <span style={{ fontSize: 14, color: "var(--success)" }}>
                  مجاناً
                </span>
              ) : (
                `${parseFloat(inv.total).toFixed(2)} ج`
              )}
            </div>
            {inv.duration_min > 0 && (
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}
              >
                ⏱ {inv.duration_min} د
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingBottom: 40 }}>
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {showOrderModal && activeSession && (
        <ClientOrderModal
          sessionId={activeSession.id}
          onClose={() => setShowOrderModal(false)}
          onOrderAdded={refreshOrdersCount}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingTop: 8,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
          Link Space
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ⚙️
          </button>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            خروج
          </button>
        </div>
      </div>

      {/* ✅ Profile — مع صورة أو أحرف أولى */}
      <div
        className="card fade-up"
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user?.name}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--accent)",
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#fff",
              }}
            >
              {initials}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {user?.phone}
          </div>
          {user?.email && (
            <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}>
              ✉️ {user.email}
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {[
          ["overview", "🏠 نظرة عامة"],
          ["invoices", "🧾 فواتيري"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              border: "1px solid",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.2s",
              borderColor: tab === k ? "var(--accent)" : "var(--border)",
              background: tab === k ? "var(--accent)" : "transparent",
              color: tab === k ? "#000" : "var(--muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (
        <div className="fade-up">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div className="card">
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
              >
                الرصيد
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {parseFloat(user?.balance || 0).toFixed(2)} ج
              </div>
            </div>
            <div className="card">
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
              >
                النقاط
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "var(--warning)",
                }}
              >
                {user?.points || 0}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                نقاط نحو الكوبون
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--accent)",
                  fontWeight: 600,
                }}
              >
                {user?.points || 0} / 100
              </span>
            </div>
            <ProgressBar value={user?.points || 0} max={100} />
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              {user?.points >= 100
                ? "🎉 لديك نقاط كافية! استبدلها الآن"
                : `${100 - (user?.points || 0)} نقطة متبقية للحصول على خصم 20%`}
            </div>
          </div>

          <div className="section-title">كود الدخول</div>
          <div
            className="card"
            style={{ textAlign: "center", marginBottom: 12 }}
          >
            {user?.qr_code ? (
              <>
                <div
                  style={{
                    display: "inline-block",
                    padding: 12,
                    background: "#fff",
                    borderRadius: 12,
                    border: "3px solid var(--accent)",
                  }}
                >
                  <QRCodeSVG
                    value={user.qr_code}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    marginTop: 10,
                    fontFamily: "var(--mono)",
                    letterSpacing: 2,
                  }}
                >
                  {user.qr_code}
                </div>
              </>
            ) : (
              <div
                style={{
                  width: 160,
                  height: 160,
                  margin: "0 auto",
                  background: "rgba(0,212,170,0.1)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                }}
              >
                جارٍ التحميل...
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              اعرض هذا الكود عند الدخول والخروج
            </div>
          </div>

          {activeSession && (
            <>
              <div className="section-title">الجلسة الحالية</div>
              <div style={{ marginBottom: 12 }}>
                <LiveTimer
                  checkIn={activeSession.check_in}
                  pricePerHr={activePricePerHr}
                  maxHours={activeMaxHours}
                  spaceName={activeSpaceName}
                  spaceKey={activeSpaceKey}
                />
                <button
                  onClick={() => setShowOrderModal(true)}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "12px",
                    borderRadius: 12,
                    border: "1px solid var(--accent)",
                    background: "rgba(0,212,170,0.08)",
                    color: "var(--accent)",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(0,212,170,0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(0,212,170,0.08)")
                  }
                >
                  ☕ أضف مشروب أو خدمة
                  {allOrdersCount > 0 && (
                    <span
                      style={{
                        background: "var(--accent)",
                        color: "#000",
                        borderRadius: 10,
                        padding: "1px 8px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {allOrdersCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div className="section-title" style={{ margin: 0 }}>
              آخر الفواتير
            </div>
            <button
              onClick={() => setTab("invoices")}
              style={{
                fontSize: 11,
                color: "var(--accent)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              عرض الكل
            </button>
          </div>

          {loadingRecentInvoices ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: 20,
                fontSize: 13,
              }}
            >
              جارٍ التحميل...
            </div>
          ) : recentInvoices.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: 20,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              لا توجد فواتير بعد
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              {recentInvoices.slice(0, 5).map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  inv={inv}
                  onClick={() => setSelectedInvoice(inv)}
                />
              ))}
            </div>
          )}

          <div className="section-title">الكوبونات</div>
          {coupons.length === 0 && (
            <div
              className="card"
              style={{
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              لا توجد كوبونات حتى الآن
            </div>
          )}
          {coupons.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: c.is_used
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(0,212,170,0.06)",
                border: `1px dashed ${c.is_used ? "var(--border)" : "var(--accent)"}`,
                borderRadius: "var(--radius)",
                padding: 14,
                marginBottom: 10,
                opacity: c.is_used ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 22 }}>🎫</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 14,
                    color: "var(--accent)",
                    fontWeight: 500,
                  }}
                >
                  {c.code}
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}
                >
                  خصم {c.discount_pct}% — ينتهي{" "}
                  {format(new Date(c.expires_at), "dd MMM yyyy", {
                    locale: ar,
                  })}
                </div>
              </div>
              <span
                className={`badge ${c.is_used ? "badge-danger" : "badge-success"}`}
              >
                {c.is_used ? "مستخدم" : "فعّال"}
              </span>
            </div>
          ))}
          {(user?.points || 0) >= 100 && (
            <button onClick={redeemPoints} className="btn btn-outline btn-full">
              استبدال 100 نقطة بكوبون خصم 20%
            </button>
          )}
        </div>
      )}

      {/* ══ INVOICES ══ */}
      {tab === "invoices" && (
        <div className="fade-up">
          <div
            style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}
          >
            {invoiceTotal} فاتورة
          </div>
          {loadingInvoices ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: 40,
              }}
            >
              جارٍ التحميل...
            </div>
          ) : invoices.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: "center",
                color: "var(--muted)",
                padding: 40,
                fontSize: 13,
              }}
            >
              لا توجد فواتير بعد
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {invoices.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  inv={inv}
                  onClick={() => setSelectedInvoice(inv)}
                />
              ))}
            </div>
          )}
          {totalInvoicePages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <button
                onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                disabled={invoicePage === 1}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: invoicePage === 1 ? "var(--muted)" : "var(--text)",
                  cursor: invoicePage === 1 ? "default" : "pointer",
                }}
              >
                السابق
              </button>
              <span
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  color: "var(--muted)",
                }}
              >
                {invoicePage} / {totalInvoicePages}
              </span>
              <button
                onClick={() =>
                  setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))
                }
                disabled={invoicePage === totalInvoicePages}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color:
                    invoicePage === totalInvoicePages
                      ? "var(--muted)"
                      : "var(--text)",
                  cursor:
                    invoicePage === totalInvoicePages ? "default" : "pointer",
                }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
