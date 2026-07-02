import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reportsAPI } from "../utils/api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const COLORS = ["#00d4aa", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];

const TABS = [
  { key: "revenue",   label: "💰 الإيرادات"  },
  { key: "clients",   label: "👥 العملاء"    },
  { key: "spaces",    label: "🏢 المساحات"   },
  { key: "staff",     label: "👷 الموظفين"   },
  { key: "coupons",   label: "🎫 الكوبونات"  },
  { key: "referrals", label: "🎁 الدعوات"    },
];

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color = "var(--accent)" }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Export Helpers
// ─────────────────────────────────────────────
function exportExcel(rows, columns, filename, sheetName = "التقرير") {
  const data = rows.map(r => {
    const obj = {};
    columns.forEach(c => { obj[c.header] = c.accessor(r); });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map(c => ({ wch: c.width || 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0,10)}.xlsx`);
  toast.success("✅ تم تصدير Excel");
}

function exportPDF(rows, columns, title, filename) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.setTextColor(0, 212, 170);
  doc.text("Link Space — " + title, doc.internal.pageSize.width / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`تاريخ الإنشاء: ${new Date().toLocaleDateString("ar-EG")}`, doc.internal.pageSize.width / 2, 20, { align: "center" });

  autoTable(doc, {
    startY: 26,
    head: [columns.map(c => c.header)],
    body: rows.map(r => columns.map(c => c.accessor(r))),
    theme: "grid",
    styles: { fontSize: 8, halign: "center" },
    headStyles: { fillColor: [0, 212, 170], textColor: [0, 0, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.width) acc[i] = { cellWidth: c.width };
      return acc;
    }, {}),
    didDrawPage: ({ pageNumber }) => {
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`صفحة ${pageNumber} من ${total}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 6, { align: "center" });
    },
  });

  doc.save(`${filename}-${new Date().toISOString().slice(0,10)}.pdf`);
  toast.success("✅ تم تصدير PDF");
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Filters ──
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState("day");
  const [activeTab, setActiveTab] = useState("revenue");
  const [quickPeriod, setQuickPeriod] = useState(null); // ✅ تتبع الفترة المختارة
  
  // ── Data ──
  const [summary, setSummary] = useState(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────────────────
  // Load Summary
  // ─────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const { data: res } = await reportsAPI.summary({ date_from: dateFrom, date_to: dateTo });
      setSummary(res);
    } catch { toast.error("خطأ في تحميل الملخص"); }
  }, [dateFrom, dateTo]);

  // ─────────────────────────────────────────
  // Load Tab Data
  // ─────────────────────────────────────────
  const loadTabData = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const params = { date_from: dateFrom, date_to: dateTo, group_by: groupBy };
      const apiMap = {
        revenue:   reportsAPI.revenue,
        clients:   reportsAPI.clients,
        spaces:    reportsAPI.spaces,
        staff:     reportsAPI.staff,
        coupons:   reportsAPI.coupons,
        referrals: reportsAPI.referrals,
      };
      const { data: res } = await apiMap[activeTab](params);
      setData(res);
    } catch { toast.error("خطأ في تحميل البيانات"); }
    finally  { setLoading(false); }
  }, [activeTab, dateFrom, dateTo, groupBy]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadTabData(); }, [loadTabData]);

  // ─────────────────────────────────────────
  // Render Tab Content
  // ─────────────────────────────────────────
  function renderTabContent() {
    if (loading) return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
        ⏳ جارٍ تحميل البيانات...
      </div>
    );
    if (!data)   return null;

    switch (activeTab) {
      case "revenue":   return <RevenueTab    data={data} groupBy={groupBy} />;
      case "clients":   return <ClientsTab    data={data} />;
      case "spaces":    return <SpacesTab     data={data} />;
      case "staff":     return <StaffTab      data={data} />;
      case "coupons":   return <CouponsTab    data={data} />;
      case "referrals": return <ReferralsTab  data={data} />;
      default: return null;
    }
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", maxWidth: 1200, margin: "0 auto", padding: "20px 16px 60px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>📊 التقارير</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>تقارير شاملة لكل أنشطة المساحة</div>
        </div>
        <button onClick={() => navigate(-1)} style={{
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--muted)", padding: "7px 14px",
          borderRadius: 8, fontSize: 12, cursor: "pointer",
        }}>
          ← رجوع
        </button>
      </div>

      {/* ── Filters ── */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "auto auto 1fr auto", // تاريخ | تاريخ | تجميع | فترات
          gap: "12px 20px", alignItems: "end",
        }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>من تاريخ</div>
          <input
            type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setQuickPeriod(null); }}
            style={{
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 10px", color: "var(--text)",
              fontSize: 13, cursor: "pointer",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>إلى تاريخ</div>
          <input
            type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setQuickPeriod(null); }}
            style={{
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 10px", color: "var(--text)",
              fontSize: 13, cursor: "pointer",
            }}
          />
        </div>
        {activeTab === "revenue" && (
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>تجميع حسب</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["day","يومي"], ["month","شهري"]].map(([val, label]) => (
                <button key={val} onClick={() => setGroupBy(val)} style={{
                  padding: "7px 14px", borderRadius: 8, border: "1px solid",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  borderColor: groupBy === val ? "var(--accent)" : "var(--border)",
                  background:  groupBy === val ? "var(--accent)" : "transparent",
                  color:       groupBy === val ? "#000" : "var(--muted)",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* أزرار فترات سريعة */}
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>
            فترة سريعة
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "هذا الأسبوع", days: 7,  key: "week"  },
              { label: "هذا الشهر",   days: 30, key: "month" },
              { label: "3 أشهر",      days: 90, key: "3months" },
            ].map((item) => {
              const isActive = quickPeriod === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    const to   = new Date();
                    const from = new Date();
                    from.setDate(from.getDate() - item.days);
                    setDateTo(to.toISOString().slice(0, 10));
                    setDateFrom(from.toISOString().slice(0, 10));
                    setQuickPeriod(item.key); // ✅ تحديد المختار
                  }}
                  style={{
                    padding: "7px 14px", borderRadius: 8,
                    border: "1px solid",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    background:  isActive ? "var(--accent)" : "transparent",
                    color:       isActive ? "#000" : "var(--muted)",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      {summary && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12, marginBottom: 24,
        }}>
          <KPICard icon="💰" label="إجمالي الإيرادات"
            value={`${parseFloat(summary.revenue?.total_revenue || 0).toFixed(0)} ج`}
            sub={`${summary.revenue?.invoice_count || 0} فاتورة`} />
          <KPICard icon="💵" label="إجمالي الكاش"
            value={`${parseFloat(summary.revenue?.total_cash || 0).toFixed(0)} ج`}
            color="var(--warning)" />
          <KPICard icon="💳" label="إجمالي المحفظة"
            value={`${parseFloat(summary.revenue?.total_wallet || 0).toFixed(0)} ج`}
            color="#3b82f6" />
          <KPICard icon="🏃" label="عدد الجلسات"
            value={summary.sessions?.total_sessions || 0}
            sub={`متوسط ${Math.round(summary.sessions?.avg_duration || 0)} د`} />
          <KPICard icon="👥" label="عملاء مختلفون"
            value={summary.unique_clients || 0}
            color="#8b5cf6" />
          <KPICard icon="🎫" label="كوبونات مستخدمة"
            value={summary.used_coupons || 0}
            color="#f59e0b" />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        marginBottom: 20, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "9px 18px", borderRadius: 20, border: "1px solid",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap", transition: "all 0.2s",
            borderColor: activeTab === t.key ? "var(--accent)" : "var(--border)",
            background:  activeTab === t.key ? "var(--accent)" : "transparent",
            color:       activeTab === t.key ? "#000" : "var(--muted)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {renderTabContent()}
    </div>
  );
}

// ─────────────────────────────────────────────
// Revenue Tab
// ─────────────────────────────────────────────
function RevenueTab({ data, groupBy }) {
  const rows = data?.data || [];

  const cols = [
    { header: "الفترة",     accessor: r => r.period,                          width: 25 },
    { header: "الإيرادات",  accessor: r => `${parseFloat(r.revenue).toFixed(2)} ج`, width: 20 },
    { header: "كاش",        accessor: r => `${parseFloat(r.cash).toFixed(2)} ج`,    width: 20 },
    { header: "محفظة",      accessor: r => `${parseFloat(r.wallet).toFixed(2)} ج`,  width: 20 },
    { header: "عدد الفواتير", accessor: r => r.count,                          width: 15 },
  ];

  return (
    <div>
      <ExportBar
        onPDF={() => exportPDF(rows, cols, "تقرير الإيرادات", "إيرادات-LinkSpace")}
        onExcel={() => exportExcel(rows, cols, "إيرادات-LinkSpace", "الإيرادات")}
      />
      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
          📈 تطور الإيرادات ({groupBy === "day" ? "يومي" : "شهري"})
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
              formatter={(val) => [`${parseFloat(val).toFixed(2)} ج`]}
            />
            <Legend />
            <Bar dataKey="cash"   name="كاش"    fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="wallet" name="محفظة"  fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(0,212,170,0.08)", borderBottom: "1px solid var(--border)" }}>
              {cols.map(c => <th key={c.header} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontSize: 12, color: "var(--muted)" }}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {cols.map(c => <td key={c.header} style={{ padding: "10px 14px", color: "var(--text)" }}>{c.accessor(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Clients Tab
// ─────────────────────────────────────────────
function ClientsTab({ data }) {
  const rows = data?.data || [];

  const cols = [
    { header: "الاسم",        accessor: r => r.name,                                    width: 22 },
    { header: "الموبايل",     accessor: r => r.phone,                                   width: 15 },
    { header: "الجلسات",      accessor: r => r.session_count,                           width: 12 },
    { header: "إجمالي الوقت", accessor: r => `${Math.round(r.total_minutes / 60)} ساعة`, width: 18 },
    { header: "إجمالي الإنفاق", accessor: r => `${parseFloat(r.total_spent).toFixed(2)} ج`, width: 18 },
    { header: "الرصيد الحالي", accessor: r => `${parseFloat(r.balance).toFixed(2)} ج`,  width: 15 },
    { header: "النقاط",        accessor: r => r.points,                                 width: 10 },
    { header: "آخر زيارة",    accessor: r => r.last_visit ? new Date(r.last_visit).toLocaleDateString("ar-EG") : "—", width: 18 },
  ];

  return (
    <div>
      <ExportBar
        onPDF={() => exportPDF(rows, cols, "تقرير العملاء", "عملاء-LinkSpace")}
        onExcel={() => exportExcel(rows, cols, "عملاء-LinkSpace", "العملاء")}
      />
      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🏆 أكثر 10 عملاء إنفاقاً</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} width={80} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
              formatter={val => [`${parseFloat(val).toFixed(2)} ج`]} />
            <Bar dataKey="total_spent" name="إجمالي الإنفاق" fill="#00d4aa" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable cols={cols} rows={rows} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Spaces Tab
// ─────────────────────────────────────────────
function SpacesTab({ data }) {
  const rows = data?.data || [];

  const cols = [
    { header: "المساحة",       accessor: r => r.space_name,                                    width: 25 },
    { header: "عدد الجلسات",   accessor: r => r.session_count,                                  width: 15 },
    { header: "إجمالي الوقت",  accessor: r => `${Math.round(r.total_minutes / 60)} ساعة`,       width: 18 },
    { header: "متوسط الجلسة",  accessor: r => `${Math.round(r.avg_duration)} د`,                width: 18 },
    { header: "الإيرادات",     accessor: r => `${parseFloat(r.total_revenue).toFixed(2)} ج`,    width: 18 },
    { header: "عملاء مختلفون", accessor: r => r.unique_clients,                                  width: 15 },
  ];

  const pieData = rows.map(r => ({
    name: r.space_name,
    value: parseFloat(r.total_revenue),
  }));

  return (
    <div>
      <ExportBar
        onPDF={() => exportPDF(rows, cols, "تقرير المساحات", "مساحات-LinkSpace")}
        onExcel={() => exportExcel(rows, cols, "مساحات-LinkSpace", "المساحات")}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>💰 توزيع الإيرادات حسب المساحة</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={val => [`${parseFloat(val).toFixed(2)} ج`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🏃 عدد الجلسات حسب المساحة</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="space_name" tick={{ fontSize: 10, fill: "var(--muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="session_count" name="عدد الجلسات" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DataTable cols={cols} rows={rows} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Staff Tab
// ─────────────────────────────────────────────
function StaffTab({ data }) {
  const rows = data?.data || [];

  const cols = [
    { header: "الاسم",          accessor: r => r.name,                                       width: 22 },
    { header: "الموبايل",       accessor: r => r.phone,                                      width: 15 },
    { header: "الفواتير",       accessor: r => r.invoices_count,                             width: 12 },
    { header: "الإيرادات المعالَجة", accessor: r => `${parseFloat(r.total_handled).toFixed(2)} ج`, width: 22 },
    { header: "الجلسات",        accessor: r => r.sessions_handled,                           width: 12 },
    { header: "الحجوزات المؤكَّدة", accessor: r => r.bookings_confirmed,                    width: 18 },
  ];

  return (
    <div>
      <ExportBar
        onPDF={() => exportPDF(rows, cols, "تقرير الموظفين", "موظفين-LinkSpace")}
        onExcel={() => exportExcel(rows, cols, "موظفين-LinkSpace", "الموظفين")}
      />
      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🏆 أداء الموظفين — الإيرادات المعالَجة</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
              formatter={val => [`${parseFloat(val).toFixed(2)} ج`]} />
            <Bar dataKey="total_handled" name="الإيرادات المعالَجة" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable cols={cols} rows={rows} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Coupons Tab
// ─────────────────────────────────────────────
function CouponsTab({ data }) {
  const stats = data?.stats || {};
  const users = data?.top_users || [];

  const cols = [
    { header: "العميل",          accessor: r => r.name,                              width: 22 },
    { header: "الموبايل",        accessor: r => r.phone,                             width: 15 },
    { header: "كوبونات مستخدمة", accessor: r => r.coupons_used,                     width: 18 },
    { header: "متوسط الخصم",     accessor: r => `${parseFloat(r.avg_discount).toFixed(1)}%`, width: 15 },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        <KPICard icon="🎫" label="إجمالي الكوبونات"  value={stats.total_coupons || 0} />
        <KPICard icon="✅" label="مستخدمة"            value={stats.used_count || 0}   color="#22c55e" />
        <KPICard icon="⏳" label="غير مستخدمة"        value={stats.unused_count || 0} color="var(--warning)" />
      </div>
      <ExportBar
        onPDF={() => exportPDF(users, cols, "تقرير الكوبونات", "كوبونات-LinkSpace")}
        onExcel={() => exportExcel(users, cols, "كوبونات-LinkSpace", "الكوبونات")}
      />
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏆 أكثر العملاء استخداماً للكوبونات</div>
        <DataTable cols={cols} rows={users} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Referrals Tab
// ─────────────────────────────────────────────
function ReferralsTab({ data }) {
  const rows = data?.data || [];

  const cols = [
    { header: "الاسم",         accessor: r => r.name,                              width: 22 },
    { header: "الموبايل",      accessor: r => r.phone,                             width: 15 },
    { header: "كود الدعوة",    accessor: r => r.referral_code,                    width: 15 },
    { header: "عدد الدعوات",   accessor: r => r.total_referrals,                  width: 15 },
    { header: "النقاط المكسوبة", accessor: r => r.points_given,                   width: 15 },
    { header: "آخر دعوة",      accessor: r => r.last_referral ? new Date(r.last_referral).toLocaleDateString("ar-EG") : "—", width: 18 },
  ];

  return (
    <div>
      <ExportBar
        onPDF={() => exportPDF(rows, cols, "تقرير الدعوات", "دعوات-LinkSpace")}
        onExcel={() => exportExcel(rows, cols, "دعوات-LinkSpace", "الدعوات")}
      />
      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🏆 أكثر المستخدمين دعوةً</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows.slice(0,10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted)" }} width={80} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="total_referrals" name="عدد الدعوات" fill="#8b5cf6" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable cols={cols} rows={rows} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────
function ExportBar({ onPDF, onExcel }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 14 }}>
      <button onClick={onExcel} style={{
        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
        border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.08)", color: "#22c55e",
      }}>
        📊 Excel
      </button>
      <button onClick={onPDF} style={{
        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
        border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#ef4444",
      }}>
        📄 PDF
      </button>
    </div>
  );
}

function DataTable({ cols, rows }) {
  if (!rows.length) return (
    <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: 30, fontSize: 13 }}>
      لا توجد بيانات في هذه الفترة
    </div>
  );

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(0,212,170,0.08)", borderBottom: "1px solid var(--border)" }}>
              {cols.map(c => (
                <th key={c.header} style={{
                  padding: "10px 14px", textAlign: "right",
                  fontWeight: 700, fontSize: 11,
                  color: "var(--muted)", whiteSpace: "nowrap",
                }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {cols.map(c => (
                  <td key={c.header} style={{ padding: "10px 14px", color: "var(--text)", whiteSpace: "nowrap" }}>
                    {c.accessor(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
