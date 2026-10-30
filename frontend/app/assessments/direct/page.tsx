"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  GraduationCap,
  ClipboardList,
  LayoutGrid,
  Info,
  BookOpen,
  FileSpreadsheet,
  Plus,
  X,
  CheckCircle,
  Sliders,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  ploCount: number;
  programCount: number;
  matrixCount: number;
  minAvgScore: number;
  maxScore: number;
  minPloRate: number;
}

const DEFAULT: DashboardStats = {
  ploCount: 0,
  programCount: 0,
  matrixCount: 0,
  minAvgScore: 5.0,
  maxScore: 10,
  minPloRate: 75,
};

export default function DirectAssessmentPage() {
  const [data, setData] = useState<DashboardStats>(DEFAULT);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [avgScore, setAvgScore] = useState("5.0");
  const [ploRate, setPloRate] = useState("75");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/direct-dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData({
          ploCount: d.ploCount ?? 0,
          programCount: d.programCount ?? 0,
          matrixCount: d.matrixCount ?? 0,
          minAvgScore: d.criteria?.minAverageScore ?? 5.0,
          maxScore: d.criteria?.maxScore ?? 10,
          minPloRate: d.criteria?.minPloPassRate ?? 75,
        });
        setAvgScore(String(d.criteria?.minAverageScore ?? 5.0));
        setPloRate(String(d.criteria?.minPloPassRate ?? 75));
      })
      .catch(() => {/* giữ DEFAULT nếu lỗi */ });
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setData((prev) => ({
      ...prev,
      minAvgScore: parseFloat(avgScore) || 5.0,
      minPloRate: parseInt(ploRate) || 75,
    }));
    setSaved(true);
    setTimeout(() => { setSaved(false); setIsConfigOpen(false); }, 1200);
  }

  /* ── helpers ── */
  const statCards = [
    {
      label: "CẤU HÌNH",
      value: "Quản lý hệ thống",
      icon: <Settings size={20} />,
      iconBg: "#e0eafc",
      iconColor: "#2563eb",
      onClick: () => setIsConfigOpen(true),
    },
    {
      label: "CHUẨN ĐẦU RA",
      value: `SL CĐR: ${data.ploCount}`,
      icon: <GraduationCap size={20} />,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      href: "/assessments/direct/matrix",
    },
    {
      label: "KHUNG CTĐT",
      value: `SL KHUNG: ${data.programCount}`,
      icon: <ClipboardList size={20} />,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      href: "/assessments/direct/matrix",
    },
    {
      label: "MA TRẬN",
      value: `SL MA TRẬN: ${data.matrixCount}`,
      icon: <LayoutGrid size={20} />,
      iconBg: "#ffedd5",
      iconColor: "#ea580c",
      href: "/assessments/direct/matrix",
    },
  ];

  return (
    <div style={{
      width: "100%",
      maxWidth: 1080,
      margin: "0 auto",
      padding: "0 24px 64px",
      boxSizing: "border-box",
    }}>

      {/* ── Tiêu đề ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Đo lường - Đánh giá CĐR (TT)
          </h1>
          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", marginTop: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", flexShrink: 0 }} />
            Hệ thống đánh giá trực tiếp chuẩn đầu ra chương trình đào tạo
          </p>
        </div>

        <Link href="/assessments/direct/import" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", borderRadius: 12,
          backgroundColor: "#fff", border: "1px solid #e2e8f0",
          color: "#165aa7", fontWeight: 600, fontSize: 13,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          <FileSpreadsheet size={15} />
          Nhập điểm từ Excel
        </Link>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {statCards.map((card) => {
          const inner = (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                backgroundColor: card.iconBg, color: card.iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginTop: 4, lineHeight: 1.2 }}>
                  {card.value}
                </p>
              </div>
            </div>
          );

          const cardStyle: React.CSSProperties = {
            backgroundColor: "#fff",
            border: "1px solid #f1f5f9",
            borderRadius: 16,
            padding: "20px 18px",
            minHeight: 96,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            cursor: "pointer",
            textAlign: "left",
            textDecoration: "none",
            display: "block",
          };

          if (card.onClick) {
            return (
              <button key={card.label} onClick={card.onClick} style={{ ...cardStyle, width: "100%" }}>
                {inner}
              </button>
            );
          }
          return (
            <Link key={card.label} href={card.href!} style={cardStyle}>
              {inner}
            </Link>
          );
        })}
      </div>

      {/* ── Hướng dẫn & Logic ── */}
      <div style={{
        backgroundColor: "#fff", borderRadius: 22, padding: "28px 30px",
        border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Watermark */}
        <div style={{ position: "absolute", top: 16, right: 24, color: "#f1f5f9", pointerEvents: "none" }}>
          <BookOpen size={120} strokeWidth={1} />
        </div>

        {/* Tiêu đề */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#165aa7", fontWeight: 700, fontSize: 15, marginBottom: 28, position: "relative" }}>
          <Info size={18} color="#2563eb" />
          Hướng dẫn &amp; Logic Đánh giá Trực tiếp
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, position: "relative" }}>

          {/* Điều kiện đạt chuẩn */}
          <div>
            <div style={{ borderLeft: "4px solid #4ade80", paddingLeft: 12, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, margin: 0 }}>
                Điều kiện Đạt chuẩn (Business Logic)
              </h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: "20px", border: "1px solid #bfdbfe" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>TIÊU CHÍ 1</p>
                <p style={{ color: "#16a34a", fontWeight: 800, fontSize: 17, marginTop: 8, lineHeight: 1.3 }}>
                  Điểm trung bình &gt;= {data.minAvgScore.toFixed(1)}/{data.maxScore}
                </p>
              </div>
              <div style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: "20px", border: "1px solid #bfdbfe" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>TIÊU CHÍ 2</p>
                <p style={{ color: "#16a34a", fontWeight: 800, fontSize: 17, marginTop: 8, lineHeight: 1.3 }}>
                  Mức độ đạt PLO &gt;= {data.minPloRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Quy trình tính toán */}
          <div>
            <div style={{ borderLeft: "4px solid #165aa7", paddingLeft: 12, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 600, color: "#0f172a", fontSize: 14, margin: 0 }}>
                Quy trình tính toán (Calculation Flow)
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  n: 1, title: "Step 1: Đánh giá chi tiết PLOi",
                  desc: "Hệ thống phân tích từng chỉ số PLOi thành phần. Một PLOi được coi là đạt khi tỷ lệ sinh viên đạt ngưỡng tối thiểu chiếm trên 75% tổng số.",
                },
                {
                  n: 2, title: "Step 2: Tổng hợp kết quả PLO",
                  desc: "Dựa trên kết quả từ Step 1, hệ thống tổng hợp mức độ đạt toàn diện của PLO. Kết quả cuối cùng được xuất dưới dạng biểu đồ mạng nhện và bảng chi tiết.",
                },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", backgroundColor: "#165aa7",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 2,
                  }}>
                    {n}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, color: "#1e293b", fontSize: 13, margin: 0 }}>{title}</h4>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsActionOpen(true)}
        style={{
          position: "fixed", bottom: 32, right: 32, width: 56, height: 56,
          borderRadius: "50%", backgroundColor: "#0d5d9c", color: "#fff",
          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", cursor: "pointer", zIndex: 30,
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ── Modal Cấu hình ── */}
      {isConfigOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#e0eafc", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings size={17} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Cấu hình hệ thống</span>
              </div>
              <button onClick={() => setIsConfigOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              {saved && (
                <div style={{ padding: "10px 14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={15} />
                  Cập nhật thành công!
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
                  Ngưỡng điểm trung bình (thang 10)
                </label>
                <input type="number" step="0.1" min="0" max="10" value={avgScore} onChange={(e) => setAvgScore(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "0 14px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#1e293b", fontWeight: 600, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
                  Tỷ lệ đạt PLO tối thiểu (%)
                </label>
                <input type="number" min="1" max="100" value={ploRate} onChange={(e) => setPloRate(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "0 14px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#1e293b", fontWeight: 600, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                <button type="button" onClick={() => setIsConfigOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Đóng
                </button>
                <button type="submit"
                  style={{ padding: "10px 22px", borderRadius: 12, border: "none", backgroundColor: "#165aa7", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders size={14} />
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Thao tác nhanh ── */}
      {isActionOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>Thao tác nhanh</span>
              <button onClick={() => setIsActionOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/assessments/direct/import", icon: <FileSpreadsheet size={15} color="#165aa7" />, label: "Nhập điểm từ Excel" },
                { href: "/assessments/direct/matrix", icon: <LayoutGrid size={15} color="#16a34a" />, label: "Quản lý Ma trận CĐR" },
                { href: "/assessments/direct/analysis", icon: <Info size={15} color="#7c3aed" />, label: "Phân tích dữ liệu kết quả" },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href} onClick={() => setIsActionOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 16, backgroundColor: "#f8fafc",
                    textDecoration: "none", color: "#334155", fontWeight: 600, fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {icon}
                    {label}
                  </div>
                  <ArrowRight size={14} color="#94a3b8" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}