"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Users,
  BookOpen,
  Star,
  BarChart2,
  Settings,
  Printer,
  Grid,
  Play,
  Layout,
  History,
  FileText,
  ChevronRight,
  Info,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  Download
} from "lucide-react";
import Link from "next/link";

export default function IndirectAssessmentPage() {
  const [loading, setLoading] = useState(true);
  const [systemActive, setSystemActive] = useState(true);
  const [stats, setStats] = useState({
    systemActive: true,
    studentCount: 0,
    courseCount: 0,
    majorCount: 0,
    assessmentCount: 0,
    difficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3001/statistics/indirect-dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          setSystemActive(data.systemActive);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="px-8 py-8 bg-[#F8FAFC] min-h-screen font-sans w-full">
      {/* Title & Top Bar Actions */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[20px] font-bold text-slate-800 tracking-tight leading-none">
            LOES - Hệ thống đánh giá kết quả học tập
          </h1>
          <p className="text-[12px] text-slate-400 font-medium">
            Phân tích chuyên sâu và Đánh giá Chuẩn đầu ra (CLO/PLO)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/assessments/indirect/matrix"
            className="h-[38px] px-4 rounded-xl border border-[#165aa7]/30 bg-white flex items-center gap-2 text-[12px] font-bold text-[#165aa7] hover:bg-blue-50/50 transition shadow-sm cursor-pointer"
          >
            <Grid size={14} className="text-[#165aa7]/70" />
            Thiết lập ma trận
          </Link>
          <Link
            href="/assessments/indirect/results"
            className="h-[38px] px-4 rounded-xl border border-[#165aa7]/30 bg-white flex items-center gap-2 text-[12px] font-bold text-[#165aa7] hover:bg-blue-50/50 transition shadow-sm cursor-pointer"
          >
            <Users size={14} />
            Kết quả theo ngành
          </Link>
          <Link
            href="/assessments/indirect/analysis"
            className="h-[38px] px-4 rounded-xl bg-[#165aa7] text-white flex items-center gap-2 text-[12px] font-bold hover:bg-[#124983] transition shadow-sm shadow-[#165aa7]/10 cursor-pointer"
          >
            <BarChart2 size={14} />
            Phân tích & Báo cáo
          </Link>
          <button className="w-[38px] h-[38px] rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition shadow-sm cursor-pointer">
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* Top 5 Stats Blocks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "18px",
          marginBottom: "32px",
          width: "100%"
        }}
      >
        {/* CARD 1: QUẢN LÝ HỆ THỐNG */}
        <div
          onClick={() => setSystemActive(!systemActive)}
          className="rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md select-none flex flex-col justify-between"
          style={{
            height: "115px",
            padding: "16px 20px",
            backgroundColor: systemActive ? "#F0FDF4" : "#FEF2F2",
            borderColor: systemActive ? "#D1FAE5" : "#FEE2E2"
          }}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
              QUẢN LÝ HỆ THỐNG
            </span>
            <span
              className="inline-flex items-center justify-center rounded uppercase tracking-wider shrink-0 transition-colors duration-200 text-white font-medium"
              style={{
                fontSize: "7.5px",
                padding: "2px 5px",
                lineHeight: "1",
                backgroundColor: systemActive ? "#10B981" : "#EF4444"
              }}
            >
              {systemActive ? "ACTIVE" : "OFF"}
            </span>
          </div>
          <div
            className="text-[15px] font-bold leading-none transition-colors duration-200"
            style={{
              color: systemActive ? "#047857" : "#B91C1C"
            }}
          >
            {systemActive ? "Đang hoạt động" : "Ngưng hoạt động"}
          </div>
        </div>

        {/* CARD 2: SL SINH VIÊN */}
        <div
          className="rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
          style={{
            height: "115px",
            padding: "16px 20px",
            backgroundColor: "#F0F9FF",
            borderColor: "#E0F2FE"
          }}
        >
          <div className="flex items-center justify-between text-[#0284C7]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0284C7]">
              SL SINH VIÊN
            </span>
            <Users size={14} className="text-[#0284C7]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[24px] font-bold text-[#0369A1] leading-none">
              {loading ? "--" : stats.studentCount}
            </div>
            <div className="text-[11px] font-semibold text-[#0284C7]/70 leading-none">
              Đã đăng ký hệ thống
            </div>
          </div>
        </div>

        {/* CARD 3: SL HỌC PHẦN */}
        <div
          className="rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
          style={{
            height: "115px",
            padding: "16px 20px",
            backgroundColor: "#FAF5FF",
            borderColor: "#F3E8FF"
          }}
        >
          <div className="flex items-center justify-between text-[#9333EA]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9333EA]">
              SL HỌC PHẦN
            </span>
            <BookOpen size={14} className="text-[#9333EA]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[24px] font-bold text-[#7E22CE] leading-none">
              {loading ? "--" : (stats.courseCount < 10 ? "0" + stats.courseCount : stats.courseCount)}
            </div>
            <div className="text-[11px] font-semibold text-[#9333EA]/70 leading-none">
              Học phần đang đánh giá
            </div>
          </div>
        </div>

        {/* CARD 4: NHÓM MH / ĐIỂM */}
        <div
          className="rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
          style={{
            height: "115px",
            padding: "16px 20px",
            backgroundColor: "#FFFBEB",
            borderColor: "#FEF3C7"
          }}
        >
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D97706]">
              NHÓM MH / ĐIỂM
            </span>
            <Star size={14} className="text-[#D97706]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[24px] font-bold text-[#B45309] leading-none">
              {loading ? "--" : `${stats.majorCount} / ${stats.assessmentCount}`}
            </div>
            <div className="text-[11px] font-semibold text-[#D97706]/70 leading-none">
              Tổng cộng bản ghi
            </div>
          </div>
        </div>

        {/* CARD 5: THỐNG KÊ ĐỘ KHÓ */}
        <div
          className="rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between"
          style={{
            height: "115px",
            padding: "16px 20px",
            backgroundColor: "#F0FDFA",
            borderColor: "#CCFBF1"
          }}
        >
          <div className="flex items-center justify-between text-[#0D9488]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D9488]">
              THỐNG KÊ ĐỘ KHÓ
            </span>
            <BarChart2 size={14} className="text-[#0D9488]" />
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Vertical flat bars */}
            <div className="flex items-end justify-between px-1 h-[20px]">
              <div 
                className="w-[18px] bg-[#0D9488]/20 rounded-sm mx-auto transition-all duration-300"
                style={{ 
                  height: `${loading ? 4 : Math.max(4, (stats.difficulty.easy / (stats.difficulty.easy + stats.difficulty.medium + stats.difficulty.hard || 1)) * 20)}px` 
                }}
              ></div>
              <div 
                className="w-[18px] bg-[#0D9488]/20 rounded-sm mx-auto transition-all duration-300"
                style={{ 
                  height: `${loading ? 4 : Math.max(4, (stats.difficulty.medium / (stats.difficulty.easy + stats.difficulty.medium + stats.difficulty.hard || 1)) * 20)}px` 
                }}
              ></div>
              <div 
                className="w-[18px] bg-[#0D9488]/20 rounded-sm mx-auto transition-all duration-300"
                style={{ 
                  height: `${loading ? 4 : Math.max(4, (stats.difficulty.hard / (stats.difficulty.easy + stats.difficulty.medium + stats.difficulty.hard || 1)) * 20)}px` 
                }}
              ></div>
            </div>
            {/* Labels */}
            <div className="flex justify-between text-[9px] font-bold text-[#0F766E] uppercase tracking-wide leading-none">
              <span className="w-1/3 text-left">Dễ: {loading ? 0 : stats.difficulty.easy}</span>
              <span className="w-1/3 text-center">TB: {loading ? 0 : stats.difficulty.medium}</span>
              <span className="w-1/3 text-right">Khó: {loading ? 0 : stats.difficulty.hard}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Two Columns) */}
      <div className="flex items-start gap-8 w-full mb-8">

        {/* Left Column (Main Logic & Scales) */}
        <div className="flex-1 flex flex-col gap-6 min-w-[600px]">

          {/* LOGIC ĐÁNH GIÁ CARD */}
          <div
            className="bg-white rounded-[24px] shadow-sm"
            style={{
              padding: "32px",
              boxShadow: "0 12px 40px -10px rgba(15, 23, 42, 0.04)"
            }}
          >
            <div className="flex items-center gap-3 text-[#165aa7]" style={{ marginBottom: "12px" }}>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#165aa7] border border-blue-100 shrink-0">
                <Layout size={16} />
              </div>
              <h2 className="text-[15px] font-bold text-slate-800">
                Logic Đánh giá Gián tiếp (GT)
              </h2>
            </div>

            <p className="text-[12px] text-slate-500 leading-relaxed font-medium" style={{ marginBottom: "24px" }}>
              Hệ thống LOES sử dụng phương pháp đánh giá gián tiếp dựa trên các khảo sát và tự đánh giá của người học đối với các Chuẩn đầu ra (CĐR). Kết quả được tính toán thông qua thông số quan trọng của từng tiêu chí và mức độ hài lòng phản hồi.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full">
              {/* Bước 1 */}
              <div
                className="flex-1 flex flex-col gap-2 animate-fadeIn"
                style={{
                  backgroundColor: "#EBF5FF",
                  padding: "24px",
                  borderRadius: "16px"
                }}
              >
                <span className="text-[10px] font-extrabold text-[#165aa7] uppercase tracking-wider">
                  Bước 1
                </span>
                <span className="text-[14px] font-extrabold text-slate-800 leading-tight">
                  TBC CLO &gt;= 3
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Trung bình cộng Chuẩn đầu ra học phần phải đạt ngưỡng cơ bản.
                </span>
              </div>

              {/* Bước 2 */}
              <div
                className="flex-1 flex flex-col gap-2 animate-fadeIn"
                style={{
                  backgroundColor: "#EBF5FF",
                  padding: "24px",
                  borderRadius: "16px"
                }}
              >
                <span className="text-[10px] font-extrabold text-[#165aa7] uppercase tracking-wider">
                  Bước 2
                </span>
                <span className="text-[14px] font-extrabold text-slate-800 leading-tight">
                  TBC PLO &gt;= 3
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Các thành phần của Chuẩn đầu ra chương trình đạt mức trung bình.
                </span>
              </div>

              {/* Bước 3 */}
              <div
                className="flex-1 flex flex-col gap-2 animate-fadeIn"
                style={{
                  backgroundColor: "#FFF5EB",
                  padding: "24px",
                  borderRadius: "16px"
                }}
              >
                <span className="text-[10px] font-extrabold text-[#D97706] uppercase tracking-wider">
                  Bước 3
                </span>
                <span className="text-[14px] font-extrabold text-slate-800 leading-tight">
                  PLO &gt;= 75%
                </span>
                <span className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Ngưỡng đạt chính thức cho kết quả đào tạo chương trình.
                </span>
              </div>
            </div>
          </div>

          {/* THANG ĐO CARD */}
          <div
            className="bg-white rounded-[24px] shadow-sm"
            style={{
              padding: "32px",
              boxShadow: "0 12px 40px -10px rgba(15, 23, 42, 0.04)"
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: "28px" }}>
              <h2 className="text-[15px] font-bold text-slate-800">
                Thang đo 5 mức độ đánh giá
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Tiêu chuẩn quốc tế AUN-QA
              </span>
            </div>

             <div className="flex flex-col gap-4">
              {/* Percentage marks */}
              <div 
                className="text-[10px] text-slate-400 font-bold px-2"
                style={{
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>

              {/* Color segmented bar */}
              <div 
                className="h-[32px] rounded-full overflow-hidden border border-slate-100 shadow-inner"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))"
                }}
              >
                <div className="flex items-center justify-center text-[10.5px] font-extrabold" style={{ backgroundColor: "#EFF6FF", color: "#1E40AF" }}>Mức 1</div>
                <div className="flex items-center justify-center text-[10.5px] font-extrabold" style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}>Mức 2</div>
                <div className="flex items-center justify-center text-[10.5px] font-extrabold" style={{ backgroundColor: "#93C5FD", color: "#1E40AF" }}>Mức 3</div>
                <div className="flex items-center justify-center text-[10.5px] font-extrabold" style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>Mức 4</div>
                <div className="flex items-center justify-center text-[10.5px] font-extrabold" style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF" }}>Mức 5</div>
              </div>

              {/* Segment description metrics */}
              <div 
                className="text-center mt-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "10px"
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">&lt; 20%</span>
                  <span className="text-[11.5px] font-extrabold" style={{ color: "#60A5FA" }}>Rất yếu</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">20% - 40%</span>
                  <span className="text-[11.5px] font-extrabold" style={{ color: "#3B82F6" }}>Yếu</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">40% - 60%</span>
                  <span className="text-[11.5px] font-extrabold" style={{ color: "#2563EB" }}>Trung bình</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">60% - 80%</span>
                  <span className="text-[11.5px] font-extrabold" style={{ color: "#1D4ED8" }}>Khá</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">&gt; 80%</span>
                  <span className="text-[11.5px] font-extrabold" style={{ color: "#1E3A8A" }}>Xuất sắc</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar Warnings & Links) */}
        <div className="w-[340px] shrink-0 flex flex-col gap-6">

          {/* LƯU Ý PHÂN TÍCH */}
          <div
            className="bg-white rounded-2xl shadow-sm flex flex-col gap-4"
            style={{
              padding: "24px",
              boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.04)"
            }}
          >
            <h3 className="text-[10px] font-extrabold text-[#9a3412] uppercase tracking-widest px-1">
              LƯU Ý PHÂN TÍCH
            </h3>

            <div className="flex flex-col gap-5 mt-2">
              {/* Alert 1 */}
              <div className="flex items-start gap-3 w-full">
                <Info size={14} className="text-[#9a3412] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-[11px] font-semibold leading-relaxed text-slate-500/95 break-words">
                    Dữ liệu hiện tại chưa được cập nhật <br /> cho kỳ học mới. Vui lòng kiểm tra <br /> lại Ma trận liên kết.
                  </p>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="flex items-start gap-3 w-full">
                <RefreshCw size={14} className="text-[#165aa7] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-[11px] font-semibold leading-relaxed text-slate-500/95 break-words">
                    Hệ thống đồng bộ dữ liệu tự động <br /> mỗi 24 giờ từ cơ sở dữ liệu đào tạo <br /> tập trung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LIÊN KẾT NHANH */}
          <div
            className="bg-white rounded-2xl shadow-sm flex flex-col gap-4"
            style={{
              padding: "24px",
              boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.04)"
            }}
          >
            <h3 className="text-[10px] font-extrabold text-[#165aa7] uppercase tracking-widest px-1">
              LIÊN KẾT NHANH
            </h3>

            <div className="flex flex-col divide-y divide-slate-100/70">
              <button className="flex items-center justify-between py-3.5 hover:text-[#165aa7] transition duration-150 cursor-pointer w-full text-left">
                <div className="flex items-center gap-3">
                  <History size={15} className="text-slate-400" />
                  <span className="text-[11.5px] font-bold text-slate-700">Lịch sử đánh giá</span>
                </div>
                <ChevronRight size={12} className="text-slate-400" />
              </button>

              <button className="flex items-center justify-between py-3.5 hover:text-[#165aa7] transition duration-150 cursor-pointer w-full text-left">
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-slate-400" />
                  <span className="text-[11.5px] font-bold text-slate-700">Mẫu báo cáo</span>
                </div>
                <ChevronRight size={12} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Pending Survey Data state */}
      <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400/80 shadow-inner">
          <TrendingUp size={22} />
        </div>
        <p className="text-[13.5px] text-slate-400 font-bold tracking-wide uppercase">
          Chờ dữ liệu khảo sát mới để thực hiện phân tích tổng thể
        </p>
      </div>

    </div>
  );
}