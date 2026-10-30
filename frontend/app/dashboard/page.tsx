"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Users,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  FileText,
  ArrowRight,
  TrendingUp,
  Info,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";

export default function DashboardPage() {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({
    userCount: 0,
    assessmentCount: 0,
    programCount: 0,
    courseCount: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
    }
  }, [router]);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        const token = localStorage.getItem("accessToken");

        const response = await fetch(
          "http://localhost:3001/statistics/indirect-dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Không thể lấy dữ liệu thống kê");
        }

        const data = await response.json();

        setStats({
          userCount: data.userCount ?? 0,
          assessmentCount: data.assessmentCount ?? 0,
          programCount: data.programCount ?? 0,
          courseCount: data.courseCount ?? 0,
        });
      } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();

    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1240px] mx-auto pb-10 font-sans">
        {/* Top Header Title & Excel Action (NO giant wrapper box) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-sm shrink-0 flex items-center justify-center border border-slate-200/60">
              <Image
                src="/dau_logo.jpg"
                alt="Logo DAU"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#1ca6b8] uppercase tracking-wide leading-tight">
                TRƯỜNG ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG
              </h1>
              <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">
                Hệ thống Quản lý Đào tạo & Đo lường Chuẩn đầu ra (DAU SMART-EDU)
              </p>
            </div>
          </div>

          {/* Compact Excel Import Button in Top Right */}
          <Link
            href="/assessments/direct/import"
            style={{
              backgroundColor: "#165aa7",
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "210px",
              minHeight: "48px",
              padding: "10px 16px",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "14px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            className="shadow-sm hover:opacity-95 transition-all self-start sm:self-center"
          >
            <FileSpreadsheet
              size={18}
              style={{
                flexShrink: 0,
                display: "block",
              }}
            />

            <span
              style={{
                whiteSpace: "nowrap",
                display: "inline-block",
              }}
            >
              Nhập dữ liệu từ Excel
            </span>
          </Link>
        </div>

        {/* Beautiful Introduction Section (Compact, No overflow, Clean design) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "24px 28px",
            boxShadow: "0 4px 20px -5px rgba(0, 0, 0, 0.04)",
            borderLeft: "4px solid #1ca6b8",
          }}
        >
          <div className="flex items-center gap-2.5 mb-3 text-[#1ca6b8]">
            <Info size={18} className="shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Giới thiệu hệ thống
            </h2>
          </div>
          <div className="space-y-2 text-slate-600 text-xs md:text-sm leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#1ca6b8] font-bold shrink-0">•</span>
              <span>
                Hệ thống Quản lý đào tạo hỗ trợ công tác quản lý đào tạo, học tập và rèn luyện của sinh viên, giảng viên và các cán bộ quản lý trong nhà trường.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#1ca6b8] font-bold shrink-0">•</span>
              <span>
                Xây dựng trên nền tảng web hiện đại, cho phép truy cập linh hoạt từ máy tính, điện thoại thông minh và máy tính bảng...
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#1ca6b8] font-bold shrink-0">•</span>
              <span>
                Cung cấp các chức năng chuyên sâu: Đo lường & Đánh giá CĐR, Phân tích phổ điểm học phần, Quản lý Khảo sát ý kiến các bên liên quan, Thống kê & Báo cáo.
              </span>
            </p>
          </div>
        </div>

        {/* ADMIN DASHBOARD Stat Cards Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-extrabold text-slate-800 tracking-wide uppercase flex items-center gap-2.5">
              <TrendingUp size={19} className="text-[#1ca6b8]" />
              ADMIN DASHBOARD
            </h2>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span>Auto Update</span>
              <div
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${autoRefresh ? "bg-[#1ca6b8]" : "bg-slate-300"
                  }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center text-[8px] font-black ${autoRefresh ? "translate-x-6 text-[#1ca6b8]" : "translate-x-0 text-slate-400"
                    }`}
                >
                  {autoRefresh ? "ON" : "OFF"}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards Grid - Explicit Grid Template */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "20px",
              width: "100%",
            }}
          >
            {/* Card 1: Số người dùng */}
            <MetricCard
              title="SỐ NGƯỜI DÙNG"
              value={loadingStats ? "..." : stats.userCount.toLocaleString("vi-VN")}
              icon={Users}
              borderLeftColor="#2563eb"
              textColor="#2563eb"
              bgColor="#eff6ff"
            />

            {/* Card 2: Số đánh giá */}
            <MetricCard
              title="SỐ ĐÁNH GIÁ"
              value={
                loadingStats
                  ? "..."
                  : stats.assessmentCount.toLocaleString("vi-VN")
              }
              icon={MessageSquare}
              borderLeftColor="#059669"
              textColor="#059669"
              bgColor="#ecfdf5"
            />

            {/* Card 3: Số CTĐT */}
            <MetricCard
              title="SỐ CTĐT"
              value={loadingStats ? "..." : stats.programCount.toLocaleString("vi-VN")}
              icon={GraduationCap}
              borderLeftColor="#e11d48"
              textColor="#e11d48"
              bgColor="#fff1f2"
            />

            {/* Card 4: Số môn học */}
            <MetricCard
              title="SỐ MÔN HỌC"
              value={loadingStats ? "..." : stats.courseCount.toLocaleString("vi-VN")}
              icon={BookOpen}
              borderLeftColor="#0891b2"
              textColor="#0891b2"
              bgColor="#ecfeff"
              showProgress
            />
          </div>
        </div>

        {/* Quick Navigation Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "20px",
            width: "100%",
            paddingTop: "8px",
          }}
        >
          <FeatureCard
            title="Đánh giá trực tiếp"
            desc="Quản lý kết quả CLO/PLO theo học phần"
            icon={ClipboardCheck}
            href="/assessments/direct"
          />

          <FeatureCard
            title="Đánh giá gián tiếp"
            desc="Quản lý khảo sát ý kiến các bên liên quan"
            icon={GraduationCap}
            href="/assessments/indirect"
          />

          <FeatureCard
            title="Phân tích phổ điểm"
            desc="Theo dõi thống kê kết quả học tập"
            icon={BarChart3}
            href="/score-analysis"
          />

          <FeatureCard
            title="Hệ thống khảo sát"
            desc="Quản lý phiếu khảo sát và báo cáo"
            icon={FileText}
            href="/surveys/dashboard"
          />
        </div>

        {/* Footer info */}
        <footer className="pt-8 pb-4 text-center text-xs text-slate-500">
          <p className="font-bold text-slate-700">
            Trường Đại học Kiến trúc Đà Nẵng © NV-SMART-EDU 2024–2025
          </p>
          <p className="mt-1 text-slate-400">
            Số lượt truy cập hệ thống: <span className="font-mono font-semibold text-slate-600">12,845</span>
          </p>
        </footer>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  borderLeftColor,
  textColor,
  bgColor,
  showProgress = false,
}: {
  title: string;
  value: string;
  icon: any;
  borderLeftColor: string;
  textColor: string;
  bgColor: string;
  showProgress?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        borderLeft: `5px solid ${borderLeftColor}`,
        boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "125px",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <span style={{ color: textColor }} className="text-[11px] font-black tracking-wider uppercase">
            {title}
          </span>
          <div className="text-3xl font-black text-slate-900 mt-1">{value}</div>
        </div>
        <div
          style={{ backgroundColor: bgColor, color: textColor }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        >
          <Icon size={20} />
        </div>
      </div>

      {showProgress && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div style={{ backgroundColor: borderLeftColor }} className="h-full rounded-full w-2/3" />
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon: Icon,
  href,
}: {
  title: string;
  desc: string;
  icon: any;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "160px",
      }}
      className="hover:shadow-lg transition-all duration-300 group"
    >
      <div>
        <div
          style={{ backgroundColor: "rgba(28, 166, 184, 0.1)", color: "#1ca6b8" }}
          className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:bg-[#1ca6b8] group-hover:text-white transition-colors duration-300"
        >
          <Icon size={22} />
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-[#1ca6b8] transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#1ca6b8]">
        <span>Truy cập</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}