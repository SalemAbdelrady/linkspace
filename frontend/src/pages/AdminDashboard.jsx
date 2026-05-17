import React, { useState, useEffect } from "react";
import {
  adminAPI,
  sessionsAPI,
  spacesAPI,
  servicesAPI,
  couponsAPI,
  invoicesAPI,
  staffAPI,
  quickSaleAPI,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

// ── NumberInput ───────────────────────────────────────────────────────
function NumberInput({ value, onChange, min = 1, step = 1, suffix = "" }) {
  const num = parseFloat(value) || 0;
  function handleChange(e) {
    onChange(e.target.value);
  }
  function handleBlur() {
    onChange(Math.max(min, parseFloat(value) || min));
  }
  function increment() {
    onChange(parseFloat((num + step).toFixed(2)));
  }
  function decrement() {
    onChange(parseFloat(Math.max(min, num - step).toFixed(2)));
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={decrement}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: 20,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        −
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <input
          type="number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          step={step}
          style={{
            width: 80,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--accent)",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            outline: "none",
            padding: "2px 0",
            fontFamily: "var(--mono)",
          }}
        />
        {suffix && (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{suffix}</span>
        )}
      </div>
      <button
        onClick={increment}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: 20,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  );
}

// ── مودال بيانات العميل + QR ──────────────────────────────────────────
function UserModal({
  u,
  isInSession,
  amounts,
  getAmount,
  setAmount,
  chargeWallet,
  addPoints,
  toggleBan,
  onClose,
}) {
  if (!u) return null;
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
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* ✅ صورة العميل في المودال */}
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.name}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--accent)",
                  flexShrink: 0,
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
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {(u.name || "U")
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{u.name}</div>
              <div
                style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}
              >
                {u.phone}
                {u.created_at && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    📅 عضو منذ{" "}
                    <strong style={{ color: "var(--accent)" }}>
                      {memberSince(u.created_at)}
                    </strong>
                    <span style={{ opacity: 0.6, marginRight: 4 }}>
                      ·{" "}
                      {new Date(u.created_at).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
              {u.email ? (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginBottom: 4,
                    }}
                  >
                    البريد الإلكتروني
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      {u.email}
                    </span>
                    <a
                      href={`mailto:${u.email}`}
                      className="badge badge-info"
                      style={{ textDecoration: "none" }}
                    >
                      إرسال ✉️
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--danger)",
                    marginBottom: 12,
                  }}
                >
                  ⚠️ لا يوجد بريد إلكتروني مسجل لهذا العميل
                </div>
              )}
              {u.subscription_name && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "rgba(167,139,250,0.12)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    color: "#a78bfa",
                  }}
                >
                  📋 مشترك — {u.subscription_name}
                  {u.subscription_end && (
                    <span
                      style={{ opacity: 0.7, fontWeight: 400, fontSize: 10 }}
                    >
                      &nbsp;· ينتهي{" "}
                      {new Date(u.subscription_end).toLocaleDateString(
                        "ar-EG",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  )}
                </div>
              )}
              {/* بادج النشاط  */}
              <span
                className={`badge badge-${isInSession ? "success" : "danger"}`}
                style={{ marginTop: 6, display: "inline-block" }}
              >
                {isInSession ? "🟢 نشط الآن" : "⚫ غير نشط"}
              </span>
            </div>
          </div>{" "}
          {/* ✅ إغلاق div الصورة + البيانات */}
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 24,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* الرصيد والنقاط */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "rgba(0,212,170,0.08)",
              borderRadius: 12,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
            >
              الرصيد
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}
            >
              {parseFloat(u.balance).toFixed(2)} ج
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,165,2,0.08)",
              borderRadius: 12,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}
            >
              النقاط
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 700, color: "var(--warning)" }}
            >
              {u.points}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div
          style={{
            marginBottom: 20,
            paddingBottom: 20,
            borderBottom: "1px dashed var(--border)",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}
          >
            كود الدخول
          </div>
          {u.qr_image ? (
            <div
              style={{
                display: "inline-block",
                padding: 12,
                background: "#fff",
                borderRadius: 16,
                border: "3px solid var(--accent)",
                marginBottom: 10,
              }}
            >
              <img
                src={u.qr_image}
                alt="QR Code"
                style={{ width: 160, height: 160, display: "block" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                margin: "0 auto 10px",
                background: "rgba(0,212,170,0.06)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              لا يوجد QR
            </div>
          )}
          {u.qr_code && (
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: 3,
              }}
            >
              {u.qr_code}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            اعرض هذا الكود عند الدخول والخروج
          </div>
        </div>

        {/* شحن رصيد + إضافة نقاط */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}
            >
              شحن رصيد (ج)
            </div>
            <NumberInput
              value={getAmount(u.id, "wallet")}
              onChange={(val) => setAmount(u.id, "wallet", val)}
              min={1}
              step={1}
              suffix="ج"
            />
            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "8px", marginTop: 8 }}
              onClick={() => chargeWallet(u)}
            >
              شحن
            </button>
          </div>
          <div>
            <div
              style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}
            >
              إضافة نقاط
            </div>
            <NumberInput
              value={getAmount(u.id, "points")}
              onChange={(val) => setAmount(u.id, "points", val)}
              min={1}
              step={1}
              suffix="نقطة"
            />
            <button
              className="btn btn-outline"
              style={{ width: "100%", padding: "8px", marginTop: 8 }}
              onClick={() => addPoints(u)}
            >
              إضافة
            </button>
          </div>
        </div>

        {/* ✅ زر الحظر / رفع الحظر */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px dashed var(--border)",
          }}
        >
          <button
            onClick={() => toggleBan(u)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              border: `1px solid ${u.is_active ? "rgba(255,71,87,0.4)" : "rgba(0,212,170,0.4)"}`,
              background: u.is_active
                ? "rgba(255,71,87,0.06)"
                : "rgba(0,212,170,0.06)",
              color: u.is_active ? "#ff4757" : "var(--success)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {u.is_active ? "🚫 حظر هذا العميل" : "✅ رفع الحظر عن العميل"}
          </button>
          {!u.is_active && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "rgba(255,71,87,0.06)",
                border: "1px solid rgba(255,71,87,0.2)",
                borderRadius: 8,
                fontSize: 11,
                color: "#ff4757",
                textAlign: "center",
              }}
            >
              ⚠️ هذا العميل محظور حالياً — لن يتمكن من الدخول
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── مودال تفاصيل الفاتورة ─────────────────────────────────────────────
const SPACE_ICONS = { cowork: "🖥️", meeting: "🤝", lessons: "📚" };

function InvoiceModal({ invoice, onClose }) {
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

  function formatTime(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
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
        {/* رأس */}
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

        {/* العميل */}
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px dashed var(--border)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
            العميل
          </div>
          <div style={{ fontWeight: 700 }}>{invoice.client_name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {invoice.client_phone}
          </div>
          {invoice.client_email && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {invoice.client_email}
            </div>
          )}
        </div>

        {/* نوع المساحة */}
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

        {/* تفاصيل الجلسة */}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 4,
            }}
          >
            {billedHours && (
              <span>
                المدة: {billedHours} {billedHours === 1 ? "ساعة" : "ساعات"}
                <span style={{ opacity: 0.7, marginRight: 4 }}>
                  ({invoice.duration_min} د فعلية)
                </span>
              </span>
            )}
            <span>سعر الساعة: {invoice.price_per_hr} ج</span>
          </div>
          {invoice.guest_count > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginTop: 6,
                padding: "6px 10px",
                background: "rgba(0,212,170,0.06)",
                border: "1px solid rgba(0,212,170,0.15)",
                borderRadius: 8,
              }}
            >
              <span style={{ color: "var(--muted)" }}>👥 جلسة جماعية</span>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                {invoice.guest_count} أشخاص ×{" "}
                {parseFloat(invoice.session_cost / invoice.guest_count).toFixed(
                  0,
                )}{" "}
                ج = {parseFloat(invoice.session_cost).toFixed(2)} ج
              </span>
            </div>
          )}
          {(invoice.check_in || invoice.check_out) && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--muted)",
                marginTop: 4,
                opacity: 0.8,
              }}
            >
              {invoice.check_in && (
                <span>دخول: {formatTime(invoice.check_in)}</span>
              )}
              {invoice.check_out && (
                <span>خروج: {formatTime(invoice.check_out)}</span>
              )}
            </div>
          )}
        </div>

        {/* الخدمات */}
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

        {/* كوبون */}
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

        {/* الإجمالي */}
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            <span>تكلفة الجلسة</span>
            <span>{parseFloat(invoice.session_cost).toFixed(2)} ج</span>
          </div>
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
          {invoice.coupon_code && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--success)",
                marginBottom: 6,
              }}
            >
              <span>خصم {invoice.discount_pct}%</span>
              <span>− {parseFloat(invoice.discount_amount).toFixed(2)} ج</span>
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
            <span>{parseFloat(invoice.total).toFixed(2)} ج</span>
          </div>
        </div>

        {/* طريقة الدفع */}
        <div
          style={{
            background: "rgba(0,0,0,0.15)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            طريقة الدفع
          </div>
          {parseFloat(invoice.wallet_paid || 0) > 0 &&
          parseFloat(invoice.cash_paid || 0) > 0 ? (
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
                  {parseFloat(invoice.wallet_paid).toFixed(2)} ج
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
                  {parseFloat(invoice.cash_paid).toFixed(2)} ج
                </span>
              </div>
            </div>
          ) : parseFloat(invoice.wallet_paid || 0) > 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--muted)" }}>💳 محفظة كاملة</span>
              <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                {parseFloat(invoice.wallet_paid).toFixed(2)} ج
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
          <div
            style={{ fontSize: 12, color: "var(--muted)", padding: "6px 0" }}
          >
            📝 {invoice.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ── مودال البيع السريع ⚡ ─────────────────────────────────────────────
function QuickSaleModal({ services: allServices, adminAPI, onClose, onDone }) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [cart, setCart] = useState([]); // [{name,price,qty}]
  const [payMethod, setPayMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [svcSearch, setSvcSearch] = useState("");

  const [step, setStep] = useState(1); // 1=العميل 2=الخدمات 3=الدفع

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  async function searchClients(q) {
    if (q.length < 2) {
      setUserResults([]);
      return;
    }
    try {
      const { data } = await adminAPI.users(q);
      setUserResults(data.users.slice(0, 5));
    } catch {}
  }

  function selectUser(u) {
    setFoundUser(u);
    setClientName(u.name);
    setClientPhone(u.phone);
    setSearchUser(u.name);
    setUserResults([]);
  }

  function clearUser() {
    setFoundUser(null);
    setClientName("");
    setClientPhone("");
    setSearchUser("");
  }

  function addToCart(svc) {
    setCart((prev) => {
      const ex = prev.find((x) => x.name === svc.name);
      if (ex)
        return prev.map((x) =>
          x.name === svc.name ? { ...x, qty: x.qty + 1 } : x,
        );
      return [
        ...prev,
        { name: svc.name, price: parseFloat(svc.price), qty: 1 },
      ];
    });
  }

  function changeQty(name, delta) {
    setCart((prev) =>
      prev
        .map((x) =>
          x.name === name ? { ...x, qty: Math.max(0, x.qty + delta) } : x,
        )
        .filter((x) => x.qty > 0),
    );
  }

  async function confirm() {
    if (!clientName.trim()) return toast.error("أدخل اسم العميل");
    if (!cart.length) return toast.error("أضف خدمة واحدة على الأقل");
    setSaving(true);
    try {
      const { data } = await quickSaleAPI.create({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        user_id: foundUser?.id || null,
        services: cart,
        payment_method: payMethod,
        note: note || null,
      });
      toast.success(`✅ تم إصدار الفاتورة ${data.invoice.invoice_number}`);
      onDone && onDone(data.invoice);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "20px 20px 16px 16px",
          padding: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>⚡ بيع سريع</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              فاتورة بدون جلسة — زوار أو خدمات منفردة
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

        {/* ── الخطوة 1: العميل ── */}
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            👤 بيانات العميل
          </div>

          {foundUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "rgba(0,212,170,0.08)",
                border: "1px solid rgba(0,212,170,0.3)",
                borderRadius: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{foundUser.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {foundUser.phone}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--accent)", marginTop: 2 }}
                >
                  💰 رصيد: {parseFloat(foundUser.balance).toFixed(2)} ج
                </div>
              </div>
              <button
                onClick={clearUser}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff4757",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              {/* بحث عن عميل مسجل */}
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}
              >
                بحث عن عميل مسجل (اختياري)
              </div>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                  className="input-field"
                  placeholder="اسم أو موبايل..."
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    searchClients(e.target.value);
                  }}
                />
                {userResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      left: 0,
                      zIndex: 20,
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      marginTop: 4,
                      overflow: "hidden",
                    }}
                  >
                    {userResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => selectUser(u)}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border)",
                          fontSize: 13,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0,212,170,0.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {u.phone} · {parseFloat(u.balance).toFixed(2)} ج
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* أو إدخال يدوي */}
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}
              >
                أو أدخل بيانات الزائر يدوياً
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <input
                  className="input-field"
                  placeholder="الاسم *"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="الموبايل"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* ── الخطوة 2: الخدمات ── */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            ☕ اختر الخدمات
          </div>
          <input
            className="input-field"
            placeholder="🔍 بحث باسم أو سعر..."
            value={svcSearch}
            onChange={(e) => setSvcSearch(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {allServices
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(svcSearch.toLowerCase()) ||
                  String(s.price).includes(svcSearch),
              )
              .map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => addToCart(svc)}
                  style={{
                    padding: "12px 8px",
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
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 4,
                    }}
                  >
                    {svc.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    {svc.price} ج
                  </div>
                </button>
              ))}
          </div>

          {/* السلة */}
          {cart.length > 0 && (
            <div
              style={{
                padding: 12,
                background: "rgba(0,212,170,0.06)",
                border: "1px solid rgba(0,212,170,0.2)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                🛒 السلة
              </div>
              {cart.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{item.name}</span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <button
                      onClick={() => changeQty(item.name, -1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => changeQty(item.name, 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "transparent",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      +
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--accent)",
                        fontWeight: 700,
                        minWidth: 50,
                        textAlign: "left",
                      }}
                    >
                      {(item.price * item.qty).toFixed(2)} ج
                    </span>
                  </div>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px dashed var(--border)",
                  paddingTop: 8,
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--accent)",
                }}
              >
                <span>الإجمالي</span>
                <span>{total.toFixed(2)} ج</span>
              </div>
            </div>
          )}
        </div>

        {/* ── الخطوة 3: الدفع ── */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              marginBottom: 10,
            }}
          >
            💳 طريقة الدفع
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              ["cash", "💵 كاش", true],
              ["wallet", "💳 محفظة", !!foundUser],
            ].map(([val, label, enabled]) => (
              <button
                key={val}
                onClick={() => enabled && setPayMethod(val)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: enabled ? "pointer" : "not-allowed",
                  borderColor:
                    payMethod === val ? "var(--accent)" : "var(--border)",
                  background:
                    payMethod === val ? "rgba(0,212,170,0.12)" : "transparent",
                  color:
                    payMethod === val
                      ? "var(--accent)"
                      : enabled
                        ? "var(--muted)"
                        : "var(--border)",
                  opacity: enabled ? 1 : 0.4,
                }}
              >
                {label}
                {val === "wallet" && !foundUser && (
                  <div style={{ fontSize: 9 }}>حدد عميلاً أولاً</div>
                )}
              </button>
            ))}
          </div>
          {payMethod === "wallet" && foundUser && (
            <div
              style={{
                fontSize: 12,
                color:
                  parseFloat(foundUser.balance) >= total
                    ? "var(--success)"
                    : "#ff4757",
                padding: "6px 10px",
                background: "rgba(0,0,0,0.1)",
                borderRadius: 8,
              }}
            >
              {parseFloat(foundUser.balance) >= total
                ? `✅ الرصيد كافٍ — ${parseFloat(foundUser.balance).toFixed(2)} ج`
                : `❌ الرصيد غير كافٍ — ${parseFloat(foundUser.balance).toFixed(2)} ج`}
            </div>
          )}
        </div>

        {/* ملاحظة */}
        <input
          className="input-field"
          placeholder="ملاحظة (اختياري)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {/* زر الحفظ */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: 12, fontSize: 15 }}
          disabled={
            saving ||
            !clientName ||
            !cart.length ||
            (payMethod === "wallet" &&
              (!foundUser || parseFloat(foundUser.balance) < total))
          }
          onClick={confirm}
        >
          {saving
            ? "جارٍ الحفظ..."
            : `⚡ إصدار الفاتورة — ${total.toFixed(2)} ج`}
        </button>
      </div>
    </div>
  );
}

// ── AdminDashboard ────────────────────────────────────────────────────
// لعرض العضوية مثل (عضو منذ سنة و٣ أشهر)
function memberSince(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days} يوم`;
  if (days < 365) return `${Math.floor(days / 30)} شهر`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years} سنة و${months} شهر` : `${years} سنة`;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [showQuickSale, setShowQuickSale] = useState(false);

  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeSessionIds, setActiveSessionIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [amounts, setAmounts] = useState({});
  // state للفلترة بالتاريخ
  const [userDateFrom, setUserDateFrom] = useState("");
  const [userDateTo, setUserDateTo] = useState("");

  const [priceTab, setPriceTab] = useState("cowork");
  const [spaces, setSpaces] = useState({
    cowork: {
      name: "منطقة العمل المشتركة",
      first_hour: 30,
      extra_hour: 30,
      max_hours: 4,
    },
    meeting: {
      name: "غرفة الاجتماعات",
      first_hour: 150,
      extra_hour: 100,
      max_hours: 12,
    },
    lessons: {
      name: "غرفة الدروس",
      first_hour: 200,
      extra_hour: 100,
      max_hours: 12,
    },
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: "", price: "" });
  const [editingService, setEditingService] = useState(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const [allCoupons, setAllCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFilter, setCouponFilter] = useState("all");
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: 20,
    days: 30,
    targetType: "global",
    targetUser: "",
  });
  const [couponUsers, setCouponUsers] = useState([]);
  const [selectedCouponUser, setSelectedCouponUser] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState("");
  const [invoiceDateTo, setInvoiceDateTo] = useState("");
  // state  لعرض احصائيات صفحة النظرة العامة
  const [overviewStats, setOverviewStats] = useState(null);

  // ✅ إضافة state الموظفين
  const [invoiceStaffId, setInvoiceStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  // state لخانة البحث عن الخدمات المتاحة
  const [serviceSearch, setServiceSearch] = useState("");
  // state لتصدير العملاء الى ملف اكسيل
  const [usersStats, setUsersStats] = useState(null);

  // ══ state إدارة الموظفين ══
  const [staffMgmt, setStaffMgmt] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    password: "",
    role: "staff",
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [editingStaffPerms, setEditingStaffPerms] = useState(null); // { id, perms }
  const [editingStaff, setEditingStaff] = useState(null); // { id, name, phone, password }

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();

  useEffect(() => {
    loadOverview();
    loadSpaces();
    loadServices();
    loadStaff();
  }, []);
  useEffect(() => {
    if (tab === "users") {
      loadUsers();
      loadActiveSessions();
    }
  }, [tab, search, userDateFrom, userDateTo]);
  useEffect(() => {
    if (tab === "coupons") {
      loadAllCoupons();
    }
  }, [tab]);
  useEffect(() => {
    if (tab === "staff") {
      loadStaffMgmt();
    }
  }, [tab]);
  useEffect(() => {
    if (tab === "invoices") {
      loadInvoices();
    }
  }, [
    tab,
    invoicePage,
    invoiceSearch,
    invoiceDateFrom,
    invoiceDateTo,
    invoiceStaffId,
  ]);

  async function loadOverview() {
    try {
      const [d, m, stats] = await Promise.all([
        adminAPI.dailyReport(today),
        adminAPI.monthlyReport(now.getFullYear(), now.getMonth() + 1),
        adminAPI.overviewStats().catch(() => ({ data: null })),
      ]);
      setDaily(d.data);
      setMonthly(m.data);
      setOverviewStats(stats?.data || null);
    } catch {
      toast.error("خطأ في تحميل البيانات");
    }
  }

  async function loadSpaces() {
    try {
      const { data } = await spacesAPI.getAll();
      const mapped = {};
      data.spaces.forEach((s) => {
        mapped[s.space_key] = s;
      });
      setSpaces((prev) => ({
        cowork: { ...prev.cowork, ...mapped.cowork },
        meeting: { ...prev.meeting, ...mapped.meeting },
        lessons: { ...prev.lessons, ...mapped.lessons },
      }));
    } catch {}
  }

  async function loadServices() {
    try {
      const { data } = await servicesAPI.getAll();
      setServices(data.services);
    } catch {}
  }

  async function loadUsers() {
    try {
      const { data } = await adminAPI.users(search, 1, {
        date_from: userDateFrom || undefined,
        date_to: userDateTo || undefined,
      });
      setUsers(data.users);
      setUsersStats(data.stats);
    } catch {
      toast.error("خطأ في تحميل العملاء");
    }
  }

  // دالة تصدير العملاء لملف اكسيل
  async function exportUsersToExcel() {
    toast.loading("جارٍ تجهيز الملف...", { id: "export-users" });
    try {
      const { data } = await adminAPI.exportUsers(search);
      const allUsers = data.users;
      if (!allUsers?.length) return toast.error("لا يوجد عملاء للتصدير");

      const headers = [
        "الاسم",
        "الموبايل",
        "البريد الإلكتروني",
        "الرصيد",
        "النقاط",
        "الحالة",
        "الاشتراك",
        "تاريخ التسجيل",
        "مدة العضوية",
      ];
      const rows = allUsers.map((u) => [
        u.name,
        u.phone,
        u.email || "",
        parseFloat(u.balance).toFixed(2),
        u.points,
        u.is_active ? "نشط" : "معطل",
        u.subscription_name || "لا يوجد",
        new Date(u.created_at).toLocaleDateString("ar-EG"),
        memberSince(u.created_at),
      ]);

      const totalBalance = allUsers.reduce(
        (s, u) => s + parseFloat(u.balance),
        0,
      );
      rows.push([
        "الإجمالي",
        "",
        "",
        totalBalance.toFixed(2),
        "",
        "",
        "",
        "",
        "",
      ]);

      const BOM = "\uFEFF";
      const csv = BOM + [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `عملاء_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("✅ تم تصدير الملف");
    } catch {
      toast.error("خطأ في التصدير");
    } finally {
      toast.dismiss("export-users");
    }
  }

  async function loadActiveSessions() {
    try {
      const { data } = await sessionsAPI.active();
      setActiveSessionIds(new Set(data.sessions.map((s) => s.user_id)));
    } catch {}
  }

  async function loadAllCoupons() {
    try {
      const { data } = await couponsAPI.adminAll();
      setAllCoupons(data.coupons);
    } catch {}
  }

  // ✅ دالة loadStaff المُصلحة
  async function loadStaff() {
    try {
      const { data } = await adminAPI.staff();
      setStaffList(data.staff || []);
    } catch {
      setStaffList([]);
    }
  }

  // ══ دوال إدارة الموظفين ══
  async function loadStaffMgmt() {
    try {
      const { data } = await adminAPI.staff();
      setStaffMgmt(data.staff || []);
    } catch {
      toast.error("خطأ في تحميل الموظفين");
    }
  }

  async function createStaff() {
    if (!newStaff.name || !newStaff.phone || !newStaff.password)
      return toast.error("أدخل الاسم والموبايل وكلمة السر");
    setStaffLoading(true);
    try {
      await staffAPI.create(newStaff);
      toast.success("✅ تم إضافة الموظف");
      setNewStaff({ name: "", phone: "", password: "", role: "staff" });
      loadStaffMgmt();
      loadStaff(); // تحديث قائمة فلتر الفواتير
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الإضافة");
    } finally {
      setStaffLoading(false);
    }
  }

  async function toggleStaffActive(s) {
    try {
      await staffAPI.toggle(s.id);
      toast.success(s.is_active ? "تم تعطيل الحساب" : "تم تفعيل الحساب");
      loadStaffMgmt();
      loadStaff();
    } catch {
      toast.error("خطأ في تغيير الحالة");
    }
  }

  async function saveStaffPerms() {
    try {
      await staffAPI.updatePermissions(
        editingStaffPerms.id,
        editingStaffPerms.perms,
      );
      toast.success("✅ تم حفظ الصلاحيات");
      setEditingStaffPerms(null);
      loadStaffMgmt();
    } catch {
      toast.error("خطأ في حفظ الصلاحيات");
    }
  }

  async function deleteStaff(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
    try {
      await staffAPI.delete(id);
      toast.success("تم الحذف");
      loadStaffMgmt();
      loadStaff();
    } catch {
      toast.error("خطأ في الحذف");
    }
  }

  async function saveEditStaff() {
    if (!editingStaff.name || !editingStaff.phone)
      return toast.error("الاسم والموبايل مطلوبان");
    try {
      const payload = { name: editingStaff.name, phone: editingStaff.phone };
      if (editingStaff.password && editingStaff.password.trim() !== "")
        payload.password = editingStaff.password;
      await staffAPI.update(editingStaff.id, payload);
      toast.success("✅ تم تحديث البيانات");
      setEditingStaff(null);
      loadStaffMgmt();
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في التعديل");
    }
  }

  // ── دالة حفظ ترتيب الخدمات ──
  async function reorderServices(newOrder) {
    setServices(newOrder); // تحديث فوري في الـ UI
    try {
      await servicesAPI.reorder(
        newOrder.map((s, i) => ({ id: s.id, sort_order: i })),
      );
    } catch {
      toast.error("خطأ في حفظ الترتيب");
      loadServices(); // رجع للترتيب القديم لو فشل
    }
  }

  // أضف هذا مع باقي الـ states:
  const [invoiceSummary, setInvoiceSummary] = useState({
    total_amount: 0,
    total_cash: 0,
    total_wallet: 0,
    quick_sale_count: 0,
    session_count: 0,
  });

  async function loadInvoices() {
    try {
      const { data } = await invoicesAPI.getAll({
        page: invoicePage,
        search: invoiceSearch,
        date_from: invoiceDateFrom || undefined,
        date_to: invoiceDateTo || undefined,
        staff_id: invoiceStaffId || undefined,
      });

      setInvoices(data.invoices);
      setInvoiceTotal(data.total);
      setInvoiceSummary({
        total_amount: data.total_amount || 0,
        total_cash: data.total_cash || 0,
        total_wallet: data.total_wallet || 0,
        quick_sale_count: data.quick_sale_count || 0, // ← جديد
        session_count: data.session_count || 0, // ← جديد
      });
    } catch {
      toast.error("خطأ في تحميل الفواتير");
    }
  }

  // التعديل 6 — دالة تصدير Excel (أضفها مع باقي الدوال)

  async function exportToExcel(data, date, staffId, staffList) {
    // ✅ جيب كل الفواتير مش بس الصفحة الحالية
    let allInvoices = data;
    try {
      const { data: res } = await invoicesAPI.exportAll({
        search: invoiceSearch || undefined,
        date: invoiceDate || undefined,
        staff_id: invoiceStaffId || undefined,
      });
      allInvoices = res.invoices;
    } catch {
      toast.error("تعذر جلب كل الفواتير، سيتم تصدير الصفحة الحالية فقط");
    }

    if (!allInvoices || allInvoices.length === 0)
      return toast.error("لا توجد فواتير للتصدير");

    const staffName = staffId
      ? staffList.find((s) => String(s.id) === staffId)?.name || ""
      : "الكل";

    const headers = [
      "رقم الفاتورة",
      "نوع الفاتورة",
      "العميل",
      "الموبايل",
      "الإجمالي",
      "كاش",
      "محفظة",
      "الموظف",
      "التاريخ",
      "الوقت",
    ];

    const rows = allInvoices.map((inv) => [
      inv.invoice_number,
      inv.invoice_type === "quick_sale" ? "⚡ بيع سريع" : "🖥️ جلسة",
      inv.client_name,
      inv.client_phone,
      parseFloat(inv.total).toFixed(2),
      parseFloat(inv.cash_paid || 0).toFixed(2),
      parseFloat(inv.wallet_paid || 0).toFixed(2),
      inv.created_by_name || "",
      new Date(inv.created_at).toLocaleDateString("ar-EG"),
      new Date(inv.created_at).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    ]);

    // سطر الإجماليات في الآخر
    const totalAmount = allInvoices.reduce(
      (s, i) => s + parseFloat(i.total),
      0,
    );
    const totalCash = allInvoices.reduce(
      (s, i) => s + parseFloat(i.cash_paid || 0),
      0,
    );
    const totalWallet = allInvoices.reduce(
      (s, i) => s + parseFloat(i.wallet_paid || 0),
      0,
    );
    rows.push([
      "",
      "",
      "الإجمالي",
      "",
      totalAmount.toFixed(2),
      totalCash.toFixed(2),
      totalWallet.toFixed(2),
      "",
      "",
      "",
    ]);

    const BOM = "\uFEFF";
    const csv = BOM + [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `فواتير_${date || "كل_التواريخ"}_${staffName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("✅ تم تصدير الملف");
  }
  async function saveSpace(key) {
    setLoadingSpaces(true);
    try {
      await spacesAPI.update(key, spaces[key]);
      toast.success("تم حفظ التغييرات ✅");
    } catch {
      toast.error("خطأ في الحفظ");
    } finally {
      setLoadingSpaces(false);
    }
  }

  async function addService() {
    if (!newService.name || !newService.price)
      return toast.error("أدخل الاسم والسعر");
    try {
      const { data } = await servicesAPI.create({
        name: newService.name,
        price: parseFloat(newService.price),
      });
      setServices((prev) => [...prev, data.service]);
      setNewService({ name: "", price: "" });
      toast.success("تمت الإضافة ✅");
    } catch {
      toast.error("خطأ في الإضافة");
    }
  }

  async function saveService() {
    try {
      await servicesAPI.update(editingService.id, {
        name: editingService.name,
        price: parseFloat(editingService.price),
      });
      setServices((prev) =>
        prev.map((x) => (x.id === editingService.id ? editingService : x)),
      );
      setEditingService(null);
      toast.success("تم التعديل ✅");
    } catch {
      toast.error("خطأ في التعديل");
    }
  }

  async function deleteService(id) {
    try {
      await servicesAPI.delete(id);
      setServices((prev) => prev.filter((x) => x.id !== id));
      toast.success("تم الحذف");
    } catch {
      toast.error("خطأ في الحذف");
    }
  }

  function getAmount(userId, type) {
    return amounts[userId]?.[type] ?? "";
  }
  function setAmount(userId, type, value) {
    setAmounts((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [type]: value },
    }));
  }

  async function chargeWallet(u) {
    const amount = getAmount(u.id, "wallet");
    if (!amount || parseFloat(amount) <= 0)
      return toast.error("أدخل مبلغ صحيح");
    try {
      await adminAPI.chargeWallet(u.id, parseFloat(amount));
      toast.success(`تم شحن ${amount} ج للعميل ${u.name}`);
      setAmount(u.id, "wallet", "");
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? { ...x, balance: parseFloat(x.balance) + parseFloat(amount) }
            : x,
        ),
      );
      setSelectedUser((prev) =>
        prev
          ? { ...prev, balance: parseFloat(prev.balance) + parseFloat(amount) }
          : prev,
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ");
    }
  }

  async function addPoints(u) {
    const points = getAmount(u.id, "points");
    if (!points || parseInt(points) <= 0) return toast.error("أدخل نقاط صحيحة");
    try {
      await adminAPI.addPoints(u.id, parseInt(points));
      toast.success(`تم إضافة ${points} نقطة`);
      setAmount(u.id, "points", "");
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, points: x.points + parseInt(points) } : x,
        ),
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, points: prev.points + parseInt(points) } : prev,
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ");
    }
  }

  // ✅ دالة الحظر / رفع الحظر
  async function toggleBan(u) {
    const isBanning = u.is_active;
    const confirmMsg = isBanning
      ? `هل تريد حظر ${u.name}؟ لن يتمكن من الدخول.`
      : `هل تريد رفع الحظر عن ${u.name}؟`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await adminAPI.toggleUser(u.id);
      const newStatus = !isBanning;
      toast.success(
        isBanning ? `🚫 تم حظر ${u.name}` : `✅ تم رفع الحظر عن ${u.name}`,
      );
      // تحديث القائمة والمودال بدون إغلاقه
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: newStatus } : x)),
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, is_active: newStatus } : prev,
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في تغيير الحالة");
    }
  }

  async function searchCouponUsers(q) {
    if (!q || q.length < 2) {
      setCouponUsers([]);
      return;
    }
    try {
      const { data } = await adminAPI.users(q);
      setCouponUsers(data.users.slice(0, 5));
    } catch {}
  }

  async function createCoupon() {
    if (newCoupon.targetType === "user" && !selectedCouponUser)
      return toast.error("اختر عميلاً أولاً");
    setCouponLoading(true);
    try {
      const { data } = await couponsAPI.adminCreate({
        code: newCoupon.code.trim().toUpperCase() || null,
        discount: parseInt(newCoupon.discount),
        days: parseInt(newCoupon.days),
        user_id: newCoupon.targetType === "user" ? selectedCouponUser.id : null,
      });
      toast.success(`✅ تم إنشاء الكوبون: ${data.coupon.code}`);
      setNewCoupon({
        code: "",
        discount: 20,
        days: 30,
        targetType: "global",
        targetUser: "",
      });
      setSelectedCouponUser(null);
      setCouponUsers([]);
      loadAllCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || "خطأ في الإنشاء");
    } finally {
      setCouponLoading(false);
    }
  }

  async function revokeCoupon(id) {
    try {
      await couponsAPI.adminRevoke(id);
      toast.success("تم إلغاء الكوبون");
      loadAllCoupons();
    } catch {
      toast.error("خطأ في الإلغاء");
    }
  }

  const chartData =
    monthly?.daily?.slice(-7).map((d) => ({
      name: format(new Date(d.day), "EEE", { locale: ar }),
      revenue: parseFloat(d.revenue),
      visits: parseInt(d.visits),
    })) || [];

  const filteredCoupons = allCoupons.filter((c) => {
    if (couponFilter === "active")
      return !c.is_used && new Date(c.expires_at) > new Date();
    if (couponFilter === "used") return c.is_used;
    return true;
  });

  const totalInvoicePages = Math.ceil(invoiceTotal / 20);

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: 680,
        margin: "0 auto",
        padding: "0 0 40px",
      }}
    >
      {/* ── المودالات ── */}
      {selectedUser && (
        <UserModal
          u={selectedUser}
          isInSession={activeSessionIds.has(selectedUser.id)}
          amounts={amounts}
          getAmount={getAmount}
          setAmount={setAmount}
          chargeWallet={chargeWallet}
          addPoints={addPoints}
          toggleBan={toggleBan}
          onClose={() => setSelectedUser(null)}
        />
      )}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* ── مودال البيع السريع ── */}
      {showQuickSale && (
        <QuickSaleModal
          services={services}
          adminAPI={adminAPI}
          onClose={() => setShowQuickSale(false)}
          onDone={() => {
            if (tab === "invoices") loadInvoices();
          }}
        />
      )}

      {/* ── مودال تعديل بيانات الموظف ── */}
      {editingStaff && (
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
          onClick={() => setEditingStaff(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: 24,
              maxWidth: 380,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 17 }}>
                ✏️ تعديل بيانات الموظف
              </div>
              <button
                onClick={() => setEditingStaff(null)}
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

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  الاسم
                </div>
                <input
                  className="input-field"
                  value={editingStaff.name}
                  onChange={(e) =>
                    setEditingStaff((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="اسم الموظف"
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  الموبايل
                </div>
                <input
                  className="input-field"
                  value={editingStaff.phone}
                  onChange={(e) =>
                    setEditingStaff((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  كلمة السر الجديدة{" "}
                  <span style={{ opacity: 0.5 }}>
                    (اتركها فارغة إذا لا تريد تغييرها)
                  </span>
                </div>
                <input
                  className="input-field"
                  type="password"
                  value={editingStaff.password}
                  onChange={(e) =>
                    setEditingStaff((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: "10px" }}
                onClick={saveEditStaff}
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setEditingStaff(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}
          >
            Link Space
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            لوحة التحكم — {user?.name}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowQuickSale(true)}
            style={{
              background: "var(--accent)",
              border: "none",
              color: "#000",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚡ بيع سريع
          </button>
          <button
            onClick={() => navigate("/scanner")}
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            📡 Scanner
          </button>
          <button
            onClick={() => navigate("/subscriptions")}
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            📋 الاشتراكات
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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
        }}
      >
        {[
          ["overview", "نظرة عامة"],
          ["users", "العملاء"],
          ["staff", "👥 الموظفين"],
          ["prices", "الأسعار"],
          ["coupons", "🎫 الكوبونات"],
          ["invoices", "🧾 الفواتير"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "7px 16px",
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

      <div style={{ padding: 16 }}>
        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div className="fade-up">
            {/* ══ إحصائيات اليوم ══ */}
            <div className="section-title">📅 إحصائيات اليوم</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                [
                  "💰",
                  "الإيرادات",
                  `${parseFloat(overviewStats?.invoices?.today_revenue || 0).toFixed(0)} ج`,
                  "var(--accent)",
                ],

                [
                  "🧾",
                  "الفواتير",
                  overviewStats?.invoices?.today_invoices || 0,
                  "var(--warning)",
                ],

                [
                  "🟢",
                  "نشط الآن",
                  overviewStats?.clients?.active_now || daily?.active_now || 0,
                  "var(--success)",
                ],
              ].map(([icon, label, val, color]) => (
                <div
                  key={label}
                  className="card"
                  style={{ padding: "14px 12px", textAlign: "center" }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* ══ إيرادات آخر 7 أيام ══ */}
            <div className="section-title">📈 إيرادات آخر 7 أيام</div>
            <div className="card" style={{ marginBottom: 16 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 4, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: "var(--muted)",
                        fontFamily: "var(--font)",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontFamily: "var(--font)",
                        fontSize: 12,
                      }}
                      cursor={{ fill: "rgba(0,212,170,0.08)" }}
                      formatter={(v) => [`${v} ج`, "الإيراد"]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--accent)"
                      radius={[6, 6, 0, 0]}
                      opacity={0.9}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  لا توجد بيانات بعد
                </div>
              )}
            </div>

            {/* ══ إحصائيات الشهر ══ */}
            <div className="section-title">📊 إحصائيات الشهر الحالي</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div className="card">
                {[
                  [
                    "الإيرادات",
                    `${parseFloat(overviewStats?.invoices?.month_revenue || monthly?.totals?.total_revenue || 0).toFixed(0)} ج`,
                    "var(--accent)",
                  ],
                  [
                    "الزيارات",
                    monthly?.totals?.total_visits || 0,
                    "var(--text)",
                  ],
                  [
                    "متوسط المدة",
                    `${Math.round(monthly?.totals?.avg_duration || 0)} د`,
                    "var(--muted)",
                  ],
                ].map(([label, val, color], i, arr) => (
                  <div
                    key={label}
                    className="stat-row"
                    style={{
                      border: i === arr.length - 1 ? "none" : undefined,
                    }}
                  >
                    <span className="stat-label" style={{ fontSize: 12 }}>
                      {label}
                    </span>
                    <span className="stat-val" style={{ color, fontSize: 14 }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
              <div className="card">
                {[
                  [
                    "⚡ بيع سريع هذا الشهر",
                    overviewStats?.invoices?.month_quick_sale_count || 0,
                    "var(--warning)",
                  ],
                  [
                    "🖥️ جلسات هذا الشهر",
                    overviewStats?.invoices?.month_session_count || 0,
                    "var(--success)",
                  ],
                  [
                    "🆕 عملاء جدد",
                    overviewStats?.clients?.new_this_month || 0,
                    "#3b82f6",
                  ],
                ].map(([label, val, color], i, arr) => (
                  <div
                    key={label}
                    className="stat-row"
                    style={{
                      border: i === arr.length - 1 ? "none" : undefined,
                    }}
                  >
                    <span className="stat-label" style={{ fontSize: 12 }}>
                      {label}
                    </span>
                    <span className="stat-val" style={{ color, fontSize: 14 }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* ══ الإحصائيات الإجمالية ══ */}
            <div className="section-title">🏆 إحصائيات إجمالية</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                [
                  "👥",
                  "إجمالي العملاء",
                  overviewStats?.clients?.total_clients || 0,
                  "var(--text)",
                ],
                [
                  "💼",
                  "فريق العمل",
                  overviewStats?.staff?.total_staff || 0,
                  "#a78bfa",
                ],
                [
                  "💰",
                  "إجمالي الأرصدة",
                  `${parseFloat(overviewStats?.clients?.total_balance || 0).toFixed(0)} ج`,
                  "var(--warning)",
                ],
                [
                  "📋",
                  "مشتركون نشطون",
                  overviewStats?.clients?.active_subscribers || 0,
                  "#06b6d4",
                ],
                [
                  "🧾",
                  "إجمالي الفواتير",
                  overviewStats?.invoices?.total_invoices || 0,
                  "var(--accent)",
                ],
                [
                  "🚫",
                  "محظورون",
                  overviewStats?.clients?.banned_count || 0,
                  "#ff4757",
                ],
              ].map(([icon, label, val, color]) => (
                <div
                  key={label}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(0,212,170,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>
                      {val}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* ══ Top Ambassadors ══ */}
            {overviewStats?.ambassadors?.length > 0 && (
              <>
                <div className="section-title">
                  🏅 أكثر العملاء إحضاراً للأصدقاء
                </div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {overviewStats.ambassadors.map((a, i) => (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background:
                              i === 0
                                ? "rgba(255,165,2,0.15)"
                                : i === 1
                                  ? "rgba(180,180,180,0.15)"
                                  : "rgba(205,127,50,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                          }}
                        >
                          {i === 0 ? (
                            "🥇"
                          ) : i === 1 ? (
                            "🥈"
                          ) : i === 2 ? (
                            "🥉"
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                fontWeight: 700,
                              }}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                        {a.avatar_url ? (
                          <img
                            src={a.avatar_url}
                            alt={a.name}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1.5px solid var(--accent)",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--accent), var(--accent2))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {(a.name || "U")
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {a.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {a.phone}
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 800,
                              color: "var(--accent)",
                            }}
                          >
                            {a.guests_count}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--muted)" }}>
                            صديق
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 12px",
                      background: "rgba(0,212,170,0.04)",
                      border: "1px dashed rgba(0,212,170,0.2)",
                      borderRadius: 10,
                      fontSize: 11,
                      color: "var(--muted)",
                      textAlign: "center",
                    }}
                  >
                    💡 قدّم عروضاً خاصة لأكثر العملاء تأثيراً لزيادة الزيارات
                  </div>
                </div>
              </>
            )}

            {/* ══ Heatmap ══ */}
            {daily?.by_hour?.length > 0 && (
              <>
                <div className="section-title">⏱️ توزيع الزيارات بالساعة</div>
                <div className="card">
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      direction: "ltr",
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const found = daily.by_hour.find(
                        (r) => parseInt(r.hour) === h,
                      );
                      const count = found ? parseInt(found.visits) : 0;
                      const maxCount = Math.max(
                        ...daily.by_hour.map((r) => parseInt(r.visits)),
                        1,
                      );
                      const opacity = count
                        ? 0.2 + (count / maxCount) * 0.8
                        : 0.05;
                      return (
                        <div
                          key={h}
                          title={`${h}:00 — ${count} زيارة`}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            background: `rgba(0,212,170,${opacity})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 9,
                            color: count ? "var(--accent)" : "var(--muted)",
                          }}
                        >
                          {h}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      marginTop: 8,
                    }}
                  >
                    اللون الأغمق = أكثر زحمة
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {/* ══ USERS ══ */}
        {tab === "users" && (
          <div className="fade-up">
            {/* ── Stats Bar ── */}
            {usersStats && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)", // ← من 4 إلى 5
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  [
                    "إجمالي العملاء",
                    usersStats.total_clients,
                    "var(--text)",
                    "👥",
                  ],
                  [
                    "نشطون الآن",
                    usersStats.active_clients,
                    "var(--success)",
                    "🟢",
                  ],
                  [
                    "جدد هذا الشهر",
                    usersStats.new_this_month,
                    "var(--accent)",
                    "✨",
                  ],
                  [
                    "المشتركون",
                    usersStats.active_subscribers || 0,
                    "#a78bfa",
                    "📋",
                  ],
                  [
                    "إجمالي الأرصدة",
                    `${parseFloat(usersStats.total_balance).toFixed(0)} ج`,
                    "var(--warning)",
                    "💰",
                  ],
                ].map(([label, val, color, icon]) => (
                  <div
                    key={label}
                    className="card"
                    style={{ padding: "10px 6px", textAlign: "center" }}
                  >
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
                    <div
                      style={{
                        fontSize: 10, // هذا هو حجم الخط لعنواين الإحصائية
                        color: "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── زر التصدير ── */}
            <button
              onClick={exportUsersToExcel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 10,
                border: "1px solid rgba(34,197,94,0.4)",
                background: "rgba(34,197,94,0.08)",
                color: "#22c55e",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              📥 تصدير Excel
            </button>
            <div className="input-wrap">
              <input
                className="input-field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الموبايل..."
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  📅 تسجيل من:
                </span>
                <input
                  type="date"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={userDateFrom}
                  onChange={(e) => setUserDateFrom(e.target.value)}
                />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  إلى:
                </span>
                <input
                  type="date"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={userDateTo}
                  onChange={(e) => setUserDateTo(e.target.value)}
                />
                {(userDateFrom || userDateTo) && (
                  <button
                    onClick={() => {
                      setUserDateFrom("");
                      setUserDateTo("");
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,71,87,0.3)",
                      color: "#ff4757",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ✕ مسح
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {users.map((u) => {
                const isInSession = activeSessionIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="card"
                    style={{
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                      // ✅ border أحمر خفيف لو العميل محظور
                      borderColor: !u.is_active
                        ? "rgba(255,71,87,0.4)"
                        : undefined,
                      background: !u.is_active
                        ? "rgba(255,71,87,0.03)"
                        : undefined,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* ✅ صورة العميل في القائمة */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1.5px solid var(--accent)",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--accent), var(--accent2))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {(u.name || "U")
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                              marginTop: 2,
                            }}
                          >
                            {u.phone}
                          </div>
                          {u.email && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--accent)",
                                marginTop: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span style={{ fontSize: 10 }}>✉️</span> {u.email}
                            </div>
                          )}
                          {/*في كارت العميل  باقة الاشتراك عرض */}
                          {u.subscription_name && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 4,
                                padding: "2px 8px",
                                borderRadius: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                background: "rgba(167,139,250,0.12)",
                                border: "1px solid rgba(167,139,250,0.3)",
                                color: "#a78bfa",
                              }}
                            >
                              📋 {u.subscription_name}
                              {u.subscription_end && (
                                <span style={{ opacity: 0.7, fontWeight: 400 }}>
                                  · حتى{" "}
                                  {new Date(
                                    u.subscription_end,
                                  ).toLocaleDateString("ar-EG", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>{" "}
                      {/* إغلاق div الصورة + البيانات */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {/* ✅ بادج الحظر يظهر بوضوح لو محظور */}
                        {!u.is_active && (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 10,
                              fontWeight: 700,
                              background: "rgba(255,71,87,0.15)",
                              color: "#ff4757",
                              border: "1px solid rgba(255,71,87,0.3)",
                            }}
                          >
                            🚫 محظور
                          </span>
                        )}
                        <span
                          className={`badge badge-${isInSession ? "success" : "danger"}`}
                        >
                          {isInSession ? "نشط" : "غير نشط"}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          ← تفاصيل
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 10,
                        fontSize: 13,
                      }}
                    >
                      <span>
                        💰{" "}
                        <strong style={{ color: "var(--accent)" }}>
                          {parseFloat(u.balance).toFixed(2)} ج
                        </strong>
                      </span>
                      <span>
                        ⭐{" "}
                        <strong style={{ color: "var(--warning)" }}>
                          {u.points} نقطة
                        </strong>
                      </span>
                      {u.qr_code && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            color: "var(--muted)",
                            fontSize: 11,
                          }}
                        >
                          #{u.qr_code}
                        </span>
                      )}
                      {u.created_at && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          📅 عضو منذ {memberSince(u.created_at)}
                          <span style={{ opacity: 0.6, marginRight: 4 }}>
                            ·{" "}
                            {new Date(u.created_at).toLocaleDateString(
                              "ar-EG",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    padding: 20,
                    fontSize: 13,
                  }}
                >
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STAFF ══ */}
        {tab === "staff" && (
          <div className="fade-up">
            {/* ── إضافة موظف جديد ── */}
            <div className="section-title">إضافة موظف جديد</div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      الاسم
                    </div>
                    <input
                      className="input-field"
                      placeholder="اسم الموظف"
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      الموبايل
                    </div>
                    <input
                      className="input-field"
                      placeholder="01xxxxxxxxx"
                      value={newStaff.phone}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      كلمة السر
                    </div>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="كلمة سر قوية"
                      value={newStaff.password}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, password: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      الدور
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        ["staff", "موظف"],
                        ["admin", "أدمن"],
                      ].map(([role, label]) => (
                        <button
                          key={role}
                          onClick={() => setNewStaff((p) => ({ ...p, role }))}
                          style={{
                            flex: 1,
                            padding: "9px 0",
                            borderRadius: 10,
                            border: "1px solid",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            borderColor:
                              newStaff.role === role
                                ? "var(--accent)"
                                : "var(--border)",
                            background:
                              newStaff.role === role
                                ? "rgba(0,212,170,0.12)"
                                : "transparent",
                            color:
                              newStaff.role === role
                                ? "var(--accent)"
                                : "var(--muted)",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={staffLoading}
                  onClick={createStaff}
                >
                  {staffLoading ? "جارٍ الإضافة..." : "➕ إضافة الموظف"}
                </button>
              </div>
            </div>

            {/* ── قائمة الموظفين ── */}
            <div className="section-title">الموظفون الحاليون</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {staffMgmt.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    padding: 24,
                    fontSize: 13,
                  }}
                >
                  لا يوجد موظفون بعد
                </div>
              )}
              {staffMgmt.map((s) => {
                const isEditingPerms = editingStaffPerms?.id === s.id;
                const PERMS = [
                  ["can_charge_wallet", "💳 شحن المحفظة"],
                  ["can_add_points", "⭐ إضافة نقاط"],
                  ["can_edit_prices", "🏷️ تعديل الأسعار"],
                  ["can_create_coupons", "🎫 إنشاء كوبونات"],
                  ["can_view_reports", "📊 عرض التقارير"],
                ];
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{ opacity: s.is_active ? 1 : 0.55 }}
                  >
                    {/* رأس الكارد */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {s.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {s.phone}
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            background:
                              s.role === "admin"
                                ? "rgba(139,92,246,0.15)"
                                : "rgba(0,212,170,0.1)",
                            color:
                              s.role === "admin" ? "#a78bfa" : "var(--accent)",
                            border: `1px solid ${s.role === "admin" ? "rgba(139,92,246,0.3)" : "rgba(0,212,170,0.3)"}`,
                          }}
                        >
                          {s.role === "admin" ? "👑 أدمن" : "👤 موظف"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() =>
                            setEditingStaff({
                              id: s.id,
                              name: s.name,
                              phone: s.phone,
                              password: "",
                            })
                          }
                          style={{
                            padding: "5px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(0,212,170,0.3)",
                            background: "transparent",
                            color: "var(--accent)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => toggleStaffActive(s)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 8,
                            border: `1px solid ${s.is_active ? "rgba(255,71,87,0.3)" : "rgba(0,212,170,0.3)"}`,
                            background: "transparent",
                            color: s.is_active ? "#ff4757" : "var(--success)",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {s.is_active ? "🔒 تعطيل" : "✅ تفعيل"}
                        </button>
                        {!isEditingPerms && s.role !== "admin" && (
                          <button
                            onClick={() =>
                              setEditingStaffPerms({
                                id: s.id,
                                perms: {
                                  can_charge_wallet:
                                    s.can_charge_wallet ?? false,
                                  can_add_points: s.can_add_points ?? false,
                                  can_edit_prices: s.can_edit_prices ?? false,
                                  can_create_coupons:
                                    s.can_create_coupons ?? false,
                                  can_view_reports: s.can_view_reports ?? false,
                                },
                              })
                            }
                            style={{
                              padding: "5px 10px",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              color: "var(--muted)",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            🛡️ الصلاحيات
                          </button>
                        )}
                        <button
                          onClick={() => deleteStaff(s.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,71,87,0.3)",
                            background: "transparent",
                            color: "#ff4757",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* تعديل الصلاحيات */}
                    {isEditingPerms && (
                      <div
                        style={{
                          borderTop: "1px dashed var(--border)",
                          paddingTop: 12,
                          marginTop: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                            marginBottom: 10,
                            fontWeight: 600,
                          }}
                        >
                          🛡️ صلاحيات {s.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {PERMS.map(([key, label]) => (
                            <label
                              key={key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                cursor: "pointer",
                                padding: "6px 10px",
                                borderRadius: 8,
                                background: editingStaffPerms.perms[key]
                                  ? "rgba(0,212,170,0.08)"
                                  : "rgba(255,255,255,0.03)",
                                border: `1px solid ${editingStaffPerms.perms[key] ? "rgba(0,212,170,0.25)" : "var(--border)"}`,
                              }}
                            >
                              <span style={{ fontSize: 13 }}>{label}</span>
                              <div
                                onClick={() =>
                                  setEditingStaffPerms((prev) => ({
                                    ...prev,
                                    perms: {
                                      ...prev.perms,
                                      [key]: !prev.perms[key],
                                    },
                                  }))
                                }
                                style={{
                                  width: 36,
                                  height: 20,
                                  borderRadius: 10,
                                  background: editingStaffPerms.perms[key]
                                    ? "var(--accent)"
                                    : "var(--border)",
                                  position: "relative",
                                  cursor: "pointer",
                                  transition: "background 0.2s",
                                  flexShrink: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: "#fff",
                                    position: "absolute",
                                    top: 3,
                                    left: editingStaffPerms.perms[key] ? 19 : 3,
                                    transition: "left 0.2s",
                                  }}
                                />
                              </div>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1, padding: "8px" }}
                            onClick={saveStaffPerms}
                          >
                            حفظ الصلاحيات
                          </button>
                          <button
                            onClick={() => setEditingStaffPerms(null)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "transparent",
                              color: "var(--muted)",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {/* عرض الصلاحيات بدون تعديل */}
                    {!isEditingPerms && s.role !== "admin" && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                          marginTop: 6,
                        }}
                      >
                        {[
                          ["can_charge_wallet", "💳"],
                          ["can_add_points", "⭐"],
                          ["can_edit_prices", "🏷️"],
                          ["can_create_coupons", "🎫"],
                          ["can_view_reports", "📊"],
                        ].map(([key, icon]) =>
                          s[key] ? (
                            <span
                              key={key}
                              title={key.replace("can_", "").replace(/_/g, " ")}
                              style={{
                                padding: "2px 8px",
                                borderRadius: 20,
                                fontSize: 12,
                                background: "rgba(0,212,170,0.1)",
                                border: "1px solid rgba(0,212,170,0.2)",
                              }}
                            >
                              {icon}
                            </span>
                          ) : null,
                        )}
                        {!s.can_charge_wallet &&
                          !s.can_add_points &&
                          !s.can_edit_prices &&
                          !s.can_create_coupons &&
                          !s.can_view_reports && (
                            <span
                              style={{ fontSize: 11, color: "var(--muted)" }}
                            >
                              لا توجد صلاحيات إضافية
                            </span>
                          )}
                      </div>
                    )}
                    {s.role === "admin" && (
                      <div
                        style={{ fontSize: 11, color: "#a78bfa", marginTop: 4 }}
                      >
                        👑 صلاحيات كاملة (أدمن)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ PRICES ══ */}
        {tab === "prices" && (
          <div className="fade-up">
            <div
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 16,
                overflowX: "auto",
              }}
            >
              {[
                ["cowork", "🖥️ منطقة العمل"],
                ["meeting", "🤝 الاجتماعات"],
                ["lessons", "📚 الدروس"],
                ["services", "☕ الخدمات"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setPriceTab(k)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    border: "1px solid",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    borderColor:
                      priceTab === k ? "var(--accent)" : "var(--border)",
                    background:
                      priceTab === k ? "var(--accent)" : "transparent",
                    color: priceTab === k ? "#000" : "var(--muted)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {priceTab === "cowork" && (
              <div className="card">
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  اسم المساحة
                </div>
                <input
                  className="input-field"
                  style={{ marginBottom: 14 }}
                  value={spaces.cowork.name}
                  onChange={(e) =>
                    setSpaces((prev) => ({
                      ...prev,
                      cowork: { ...prev.cowork, name: e.target.value },
                    }))
                  }
                />
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  سعر الساعة (ج)
                </div>
                <NumberInput
                  value={spaces.cowork.first_hour}
                  onChange={(val) =>
                    setSpaces((prev) => ({
                      ...prev,
                      cowork: {
                        ...prev.cowork,
                        first_hour: parseFloat(val) || 1,
                      },
                    }))
                  }
                  min={1}
                  step={1}
                  suffix="ج/ساعة"
                />
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(0,212,170,0.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--muted)",
                    margin: "14px 0 12px",
                  }}
                >
                  ساعة ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.cowork.first_hour} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; 90 دقيقة ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.cowork.first_hour * 2} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; الحد الأقصى ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.cowork.first_hour * spaces.cowork.max_hours} ج
                  </strong>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={loadingSpaces}
                  onClick={() => saveSpace("cowork")}
                >
                  {loadingSpaces ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            )}
            {priceTab === "meeting" && (
              <div className="card">
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  اسم الغرفة
                </div>
                <input
                  className="input-field"
                  style={{ marginBottom: 14 }}
                  value={spaces.meeting.name}
                  onChange={(e) =>
                    setSpaces((prev) => ({
                      ...prev,
                      meeting: { ...prev.meeting, name: e.target.value },
                    }))
                  }
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 14,
                  }}
                >
                  {[
                    ["first_hour", "سعر أول ساعة"],
                    ["extra_hour", "كل ساعة إضافية"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--muted)",
                          marginBottom: 8,
                        }}
                      >
                        {label} (ج)
                      </div>
                      <NumberInput
                        value={spaces.meeting[key]}
                        onChange={(val) =>
                          setSpaces((prev) => ({
                            ...prev,
                            meeting: {
                              ...prev.meeting,
                              [key]: parseFloat(val) || 1,
                            },
                          }))
                        }
                        min={1}
                        step={1}
                        suffix="ج"
                      />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(0,212,170,0.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 12,
                  }}
                >
                  ساعة ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.meeting.first_hour} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; ساعتين ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.meeting.first_hour + spaces.meeting.extra_hour} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; 3 ساعات ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.meeting.first_hour + spaces.meeting.extra_hour * 2}{" "}
                    ج
                  </strong>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={loadingSpaces}
                  onClick={() => saveSpace("meeting")}
                >
                  {loadingSpaces ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            )}
            {priceTab === "lessons" && (
              <div className="card">
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  اسم الغرفة
                </div>
                <input
                  className="input-field"
                  style={{ marginBottom: 14 }}
                  value={spaces.lessons.name}
                  onChange={(e) =>
                    setSpaces((prev) => ({
                      ...prev,
                      lessons: { ...prev.lessons, name: e.target.value },
                    }))
                  }
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 14,
                  }}
                >
                  {[
                    ["first_hour", "سعر أول ساعة"],
                    ["extra_hour", "كل ساعة إضافية"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--muted)",
                          marginBottom: 8,
                        }}
                      >
                        {label} (ج)
                      </div>
                      <NumberInput
                        value={spaces.lessons[key]}
                        onChange={(val) =>
                          setSpaces((prev) => ({
                            ...prev,
                            lessons: {
                              ...prev.lessons,
                              [key]: parseFloat(val) || 1,
                            },
                          }))
                        }
                        min={1}
                        step={1}
                        suffix="ج"
                      />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(0,212,170,0.06)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--muted)",
                    marginBottom: 12,
                  }}
                >
                  ساعة ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.lessons.first_hour} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; ساعتين ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.lessons.first_hour + spaces.lessons.extra_hour} ج
                  </strong>{" "}
                  &nbsp;|&nbsp; 3 ساعات ={" "}
                  <strong style={{ color: "var(--accent)" }}>
                    {spaces.lessons.first_hour + spaces.lessons.extra_hour * 2}{" "}
                    ج
                  </strong>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={loadingSpaces}
                  onClick={() => saveSpace("lessons")}
                >
                  {loadingSpaces ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            )}

            {priceTab === "services" && (
              <div>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}
                  >
                    ➕ إضافة خدمة أو مشروب
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <input
                      className="input-field"
                      placeholder="اسم الخدمة أو المشروب..."
                      value={newService.name}
                      onChange={(e) =>
                        setNewService((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="input-field"
                      placeholder="السعر"
                      type="number"
                      style={{ width: 90 }}
                      value={newService.price}
                      onChange={(e) =>
                        setNewService((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={addService}
                  >
                    إضافة
                  </button>
                </div>

                <input
                  className="input-field"
                  placeholder="🔍 بحث باسم الخدمة أو السعر..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  style={{ marginBottom: 10 }}
                />

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {services.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--muted)",
                        padding: 20,
                        fontSize: 13,
                      }}
                    >
                      لا توجد خدمات بعد — أضف أول خدمة!
                    </div>
                  )}
                  {services
                    .map((s, index) => ({ ...s, _index: index }))
                    .filter(
                      (s) =>
                        s.name
                          .toLowerCase()
                          .includes(serviceSearch.toLowerCase()) ||
                        String(s.price).includes(serviceSearch),
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className="card"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          cursor: "grab",
                        }}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("dragIndex", s._index)
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = parseInt(
                            e.dataTransfer.getData("dragIndex"),
                          );
                          const to = s._index;
                          if (from === to) return;
                          const updated = [...services];
                          const [moved] = updated.splice(from, 1);
                          updated.splice(to, 0, moved);
                          reorderServices(updated);
                        }}
                      >
                        {editingService?.id === s.id ? (
                          <>
                            <input
                              className="input-field"
                              style={{ flex: 1 }}
                              value={editingService.name}
                              onChange={(e) =>
                                setEditingService((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                            <input
                              className="input-field"
                              type="number"
                              style={{ width: 80 }}
                              value={editingService.price}
                              onChange={(e) =>
                                setEditingService((prev) => ({
                                  ...prev,
                                  price: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="btn btn-primary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={saveService}
                            >
                              حفظ
                            </button>
                          </>
                        ) : (
                          <>
                            {/* مقبض السحب */}
                            <div
                              title="اسحب لتغيير الترتيب"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                                padding: "4px 6px",
                                cursor: "grab",
                                flexShrink: 0,
                                opacity: 0.4,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.opacity = 1)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.opacity = 0.4)
                              }
                            >
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  style={{ display: "flex", gap: 3 }}
                                >
                                  {[0, 1].map((j) => (
                                    <div
                                      key={j}
                                      style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "var(--muted)",
                                      }}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>

                            {/* رقم الترتيب */}
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: "rgba(0,212,170,0.1)",
                                border: "1px solid rgba(0,212,170,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--accent)",
                                flexShrink: 0,
                              }}
                            >
                              {s._index + 1}
                            </div>

                            {/* الاسم والسعر */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>
                                {s.name}
                              </div>
                              <div
                                style={{ fontSize: 12, color: "var(--accent)" }}
                              >
                                {s.price} ج
                              </div>
                            </div>

                            {/* أزرار أعلى/أسفل */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              <button
                                onClick={() => {
                                  if (s._index === 0) return;
                                  const updated = [...services];
                                  [updated[s._index - 1], updated[s._index]] = [
                                    updated[s._index],
                                    updated[s._index - 1],
                                  ];
                                  reorderServices(updated);
                                }}
                                disabled={s._index === 0}
                                style={{
                                  width: 26,
                                  height: 22,
                                  borderRadius: 6,
                                  border: "1px solid var(--border)",
                                  background: "transparent",
                                  color:
                                    s._index === 0
                                      ? "var(--border)"
                                      : "var(--muted)",
                                  cursor:
                                    s._index === 0 ? "default" : "pointer",
                                  fontSize: 11,
                                }}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => {
                                  if (s._index === services.length - 1) return;
                                  const updated = [...services];
                                  [updated[s._index + 1], updated[s._index]] = [
                                    updated[s._index],
                                    updated[s._index + 1],
                                  ];
                                  reorderServices(updated);
                                }}
                                disabled={s._index === services.length - 1}
                                style={{
                                  width: 26,
                                  height: 22,
                                  borderRadius: 6,
                                  border: "1px solid var(--border)",
                                  background: "transparent",
                                  color:
                                    s._index === services.length - 1
                                      ? "var(--border)"
                                      : "var(--muted)",
                                  cursor:
                                    s._index === services.length - 1
                                      ? "default"
                                      : "pointer",
                                  fontSize: 11,
                                }}
                              >
                                ▼
                              </button>
                            </div>

                            {/* تعديل وحذف */}
                            <button
                              onClick={() => setEditingService(s)}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border)",
                                color: "var(--muted)",
                                padding: "5px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteService(s.id)}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(255,71,87,0.3)",
                                color: "#ff4757",
                                padding: "5px 10px",
                                borderRadius: 8,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ COUPONS ══ */}
        {tab === "coupons" && (
          <div className="fade-up">
            <div className="section-title">إنشاء كوبون جديد</div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}
              >
                كود الكوبون{" "}
                <span style={{ opacity: 0.6 }}>
                  (اتركه فارغاً للتوليد التلقائي)
                </span>
              </div>
              <input
                className="input-field"
                style={{
                  marginBottom: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
                placeholder="مثال: RAMADAN30"
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 8,
                    }}
                  >
                    نسبة الخصم %
                  </div>
                  <NumberInput
                    value={newCoupon.discount}
                    onChange={(val) =>
                      setNewCoupon((prev) => ({ ...prev, discount: val }))
                    }
                    min={1}
                    step={1}
                    suffix="%"
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 8,
                    }}
                  >
                    الصلاحية (أيام)
                  </div>
                  <NumberInput
                    value={newCoupon.days}
                    onChange={(val) =>
                      setNewCoupon((prev) => ({ ...prev, days: val }))
                    }
                    min={1}
                    step={1}
                    suffix="يوم"
                  />
                </div>
              </div>
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}
              >
                نوع الكوبون
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  ["global", "🌐 عام (لأي عميل)"],
                  ["user", "👤 لعميل معين"],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => {
                      setNewCoupon((prev) => ({
                        ...prev,
                        targetType: type,
                        targetUser: "",
                      }));
                      setSelectedCouponUser(null);
                      setCouponUsers([]);
                    }}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 10,
                      border: "1px solid",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      borderColor:
                        newCoupon.targetType === type
                          ? "var(--accent)"
                          : "var(--border)",
                      background:
                        newCoupon.targetType === type
                          ? "rgba(0,212,170,0.1)"
                          : "transparent",
                      color:
                        newCoupon.targetType === type
                          ? "var(--accent)"
                          : "var(--muted)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {newCoupon.targetType === "user" && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 6,
                    }}
                  >
                    ابحث عن العميل
                  </div>
                  {selectedCouponUser ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: "rgba(0,212,170,0.08)",
                        border: "1px solid rgba(0,212,170,0.3)",
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {selectedCouponUser.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {selectedCouponUser.phone}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCouponUser(null);
                          setNewCoupon((prev) => ({
                            ...prev,
                            targetUser: "",
                          }));
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff4757",
                          cursor: "pointer",
                          fontSize: 18,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <input
                        className="input-field"
                        placeholder="اسم العميل أو رقم موبايله..."
                        value={newCoupon.targetUser}
                        onChange={(e) => {
                          setNewCoupon((prev) => ({
                            ...prev,
                            targetUser: e.target.value,
                          }));
                          searchCouponUsers(e.target.value);
                        }}
                      />
                      {couponUsers.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            left: 0,
                            zIndex: 20,
                            background: "var(--surface2)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            marginTop: 4,
                            overflow: "hidden",
                          }}
                        >
                          {couponUsers.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedCouponUser(u);
                                setNewCoupon((prev) => ({
                                  ...prev,
                                  targetUser: u.name,
                                }));
                                setCouponUsers([]);
                              }}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border)",
                                fontSize: 13,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(0,212,170,0.08)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div
                                style={{ fontSize: 11, color: "var(--muted)" }}
                              >
                                {u.phone}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(0,212,170,0.06)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--muted)",
                  marginBottom: 14,
                }}
              >
                خصم{" "}
                <strong style={{ color: "var(--accent)" }}>
                  {newCoupon.discount}%
                </strong>{" "}
                &nbsp;·&nbsp; صالح{" "}
                <strong style={{ color: "var(--accent)" }}>
                  {newCoupon.days} يوم
                </strong>{" "}
                &nbsp;·&nbsp;{" "}
                {newCoupon.targetType === "global"
                  ? "لأي عميل"
                  : selectedCouponUser
                    ? `لـ ${selectedCouponUser.name}`
                    : "حدد عميلاً"}
                {newCoupon.code && (
                  <>
                    {" "}
                    &nbsp;·&nbsp; كود:{" "}
                    <strong
                      style={{
                        color: "var(--accent)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {newCoupon.code}
                    </strong>
                  </>
                )}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={
                  couponLoading ||
                  (newCoupon.targetType === "user" && !selectedCouponUser)
                }
                onClick={createCoupon}
              >
                {couponLoading ? "جارٍ الإنشاء..." : "🎫 إنشاء الكوبون"}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div className="section-title" style={{ margin: 0 }}>
                كل الكوبونات
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["all", "الكل"],
                  ["active", "فعال"],
                  ["used", "مستخدم"],
                ].map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setCouponFilter(f)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      border: "1px solid",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      borderColor:
                        couponFilter === f ? "var(--accent)" : "var(--border)",
                      background:
                        couponFilter === f ? "var(--accent)" : "transparent",
                      color: couponFilter === f ? "#000" : "var(--muted)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredCoupons.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    padding: 24,
                    fontSize: 13,
                  }}
                >
                  لا توجد كوبونات
                </div>
              )}
              {filteredCoupons.map((c) => {
                const expired = new Date(c.expires_at) < new Date();
                const status = c.is_used
                  ? "used"
                  : expired
                    ? "expired"
                    : "active";
                const statusLabel = {
                  active: "✅ فعال",
                  used: "🔒 مستخدم",
                  expired: "⏰ منتهي",
                }[status];
                const statusColor = {
                  active: "var(--success)",
                  used: "var(--muted)",
                  expired: "#ff4757",
                }[status];
                return (
                  <div
                    key={c.id}
                    className="card"
                    style={{ opacity: status !== "active" ? 0.6 : 1 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--accent)",
                            letterSpacing: 1,
                          }}
                        >
                          {c.code}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {c.user_name ? `👤 ${c.user_name}` : "🌐 عام"}{" "}
                          &nbsp;·&nbsp; ينتهي{" "}
                          {format(new Date(c.expires_at), "dd MMM yyyy", {
                            locale: ar,
                          })}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "var(--warning)",
                          }}
                        >
                          {c.discount_pct}%
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    {status === "active" && (
                      <button
                        onClick={() => revokeCoupon(c.id)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,71,87,0.3)",
                          color: "#ff4757",
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        إلغاء الكوبون
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ INVOICES ══ */}
        {tab === "invoices" && (
          <div className="fade-up">
            {/* ── صف البحث والتواريخ ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {/* البحث */}
              <input
                className="input-field"
                placeholder="بحث باسم العميل أو موبايله أو رقم الفاتورة..."
                value={invoiceSearch}
                onChange={(e) => {
                  setInvoiceSearch(e.target.value);
                  setInvoicePage(1);
                }}
              />

              {/* من / إلى */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  📅 من:
                </span>
                <input
                  type="date"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={invoiceDateFrom}
                  onChange={(e) => {
                    setInvoiceDateFrom(e.target.value);
                    setInvoicePage(1);
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  إلى:
                </span>
                <input
                  type="date"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={invoiceDateTo}
                  onChange={(e) => {
                    setInvoiceDateTo(e.target.value);
                    setInvoicePage(1);
                  }}
                />
                {(invoiceDateFrom || invoiceDateTo) && (
                  <button
                    onClick={() => {
                      setInvoiceDateFrom("");
                      setInvoiceDateTo("");
                      setInvoicePage(1);
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,71,87,0.3)",
                      color: "#ff4757",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✕ مسح
                  </button>
                )}
              </div>
            </div>
            {/* فلتر الموظف — ✅ يُخفى تلقائياً لو staffList فاضية */}
            {staffList.length > 0 && (
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  👤 الموظف:
                </span>
                <button
                  onClick={() => {
                    setInvoiceStaffId("");
                    setInvoicePage(1);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: "1px solid",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    borderColor:
                      invoiceStaffId === "" ? "var(--accent)" : "var(--border)",
                    background:
                      invoiceStaffId === "" ? "var(--accent)" : "transparent",
                    color: invoiceStaffId === "" ? "#000" : "var(--muted)",
                  }}
                >
                  الكل
                </button>
                {staffList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setInvoiceStaffId(String(s.id));
                      setInvoicePage(1);
                    }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: "1px solid",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      borderColor:
                        invoiceStaffId === String(s.id)
                          ? "var(--accent)"
                          : "var(--border)",
                      background:
                        invoiceStaffId === String(s.id)
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        invoiceStaffId === String(s.id)
                          ? "#000"
                          : "var(--muted)",
                      opacity: s.is_active ? 1 : 0.5,
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                marginBottom: 10,
              }}
            >
              {/* ── Summary Bar ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  [
                    "الإجمالي",
                    `${parseFloat(invoiceSummary.total_amount).toFixed(2)} ج`,
                    "var(--accent)",
                  ],
                  [
                    "كاش",
                    `${parseFloat(invoiceSummary.total_cash).toFixed(2)} ج`,
                    "var(--warning)",
                  ],
                  [
                    "محفظة",
                    `${parseFloat(invoiceSummary.total_wallet).toFixed(2)} ج`,
                    "#3b82f6",
                  ],
                  [
                    "⚡ بيع سريع",
                    invoiceSummary.quick_sale_count,
                    "var(--warning)",
                  ],
                  [
                    "🖥️ الزيارات",
                    invoiceSummary.session_count,
                    "var(--success)",
                  ],
                ].map(([label, val, color]) => (
                  <div
                    key={label}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
              {/* ── زر تصدير Excel ── */}
              <button
                onClick={() => {
                  toast.loading("جارٍ تجهيز الملف...", { id: "export" });
                  exportToExcel(
                    invoices,
                    invoiceDate,
                    invoiceStaffId,
                    staffList,
                  ).finally(() => toast.dismiss("export"));
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(34,197,94,0.4)",
                  background: "rgba(34,197,94,0.08)",
                  color: "#22c55e",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 12,
                }}
              >
                📥 تصدير Excel
              </button>
              {invoiceTotal} فاتورة{" "}
              {(invoiceDateFrom || invoiceDateTo) && (
                <span>
                  {invoiceDateFrom &&
                    `من ${new Date(invoiceDateFrom).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}`}
                  {invoiceDateTo &&
                    ` إلى ${new Date(invoiceDateTo).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}`}
                </span>
              )}
              {invoiceStaffId &&
                staffList.find((s) => String(s.id) === invoiceStaffId) && (
                  <span style={{ marginRight: 6, color: "var(--accent)" }}>
                    · 👤{" "}
                    {
                      staffList.find((s) => String(s.id) === invoiceStaffId)
                        ?.name
                    }
                  </span>
                )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {invoices.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    padding: 32,
                    fontSize: 13,
                  }}
                >
                  لا توجد فواتير
                </div>
              )}
              {invoices.map((inv) => {
                const services =
                  typeof inv.services === "string"
                    ? JSON.parse(inv.services)
                    : inv.services || [];
                return (
                  <div
                    key={inv.id}
                    className="card"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 13,
                            color: "var(--accent)",
                            fontWeight: 700,
                          }}
                        >
                          #{inv.invoice_number}
                        </div>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>
                          {inv.client_name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {inv.client_phone}
                        </div>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--accent)",
                          }}
                        >
                          {parseFloat(inv.total).toFixed(2)} ج
                        </div>
                        {parseFloat(inv.wallet_paid || 0) > 0 &&
                        parseFloat(inv.cash_paid || 0) > 0 ? (
                          <>
                            <span
                              className="badge badge-info"
                              style={{ fontSize: 10 }}
                            >
                              💳 {parseFloat(inv.wallet_paid).toFixed(0)} ج
                            </span>
                            <span
                              className="badge badge-warning"
                              style={{ fontSize: 10, marginRight: 3 }}
                            >
                              💵 {parseFloat(inv.cash_paid).toFixed(0)} ج
                            </span>
                          </>
                        ) : (
                          <span
                            className={`badge badge-${
                              inv.payment_method === "wallet"
                                ? "info"
                                : "warning"
                            }`}
                            style={{ fontSize: 10 }}
                          >
                            {inv.payment_method === "wallet"
                              ? "💳 محفظة"
                              : "💵 كاش"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 8,
                        fontSize: 11,
                        color: "var(--muted)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        🕐{" "}
                        {new Date(inv.created_at).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        📅{" "}
                        {new Date(inv.created_at).toLocaleDateString("ar-EG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {services.length > 0 && (
                        <span>☕ {services.length} خدمة</span>
                      )}
                      {inv.coupon_code && <span>🎫 {inv.coupon_code}</span>}
                      {inv.created_by_name && (
                        <span style={{ color: "var(--accent)" }}>
                          👤 {inv.created_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalInvoicePages > 1 && (
              <div
                style={{ display: "flex", justifyContent: "center", gap: 8 }}
              >
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
    </div>
  );
}
