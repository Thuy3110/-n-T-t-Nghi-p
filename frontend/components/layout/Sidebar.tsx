"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Folder,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isSurveyPage = pathname.startsWith("/survey") || pathname.startsWith("/surveys");
  const [openSurvey, setOpenSurvey] = useState(isSurveyPage);
  const [user, setUser] = useState<{ fullName?: string; role?: string }>({});

  const role = user.role?.trim().toUpperCase() || "USER";
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "SUPER USER"].includes(role);
  const isLecturer = role === "LECTURER";

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    try {
      const parsed = JSON.parse(rawUser) as { fullName?: string; role?: string };
      setUser(parsed);
    } catch {
      setUser({});
    }
  }, []);

  return (
    <aside
      style={{ backgroundColor: "#1495a6" }}
      className="fixed left-0 top-0 h-screen w-[270px] text-white flex flex-col z-50 shadow-2xl font-sans"
    >
      <div className="px-5 pt-6 pb-4 flex-1 overflow-y-auto flex flex-col">
        {/* Top Header Logo */}
        <div className="flex items-center gap-3 pb-4 mb-3 border-b border-white/15">
          <div className="w-12 h-12 rounded-full bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
            <Image
              src="/dau_logo.jpg"
              alt="Logo DAU"
              width={40}
              height={40}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <div className="flex flex-col text-white leading-tight">
            <span className="text-[12px] font-black tracking-wider uppercase">
              ĐH KIẾN TRÚC
            </span>
            <span className="text-[12px] font-black tracking-wider uppercase">
              ĐÀ NẴNG
            </span>
            <span className="text-[10px] font-extrabold text-amber-200 tracking-widest mt-0.5">
              NV-SMART-EDU
            </span>
          </div>
        </div>

        {/* User Badge Info */}
        <div className="mb-4 rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white font-bold text-xs">
            {isLecturer ? <GraduationCapIcon size={18} /> : <User size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white leading-tight">
              {user.fullName || "Tài khoản hệ thống"}
            </p>
            <span className="inline-block mt-1 rounded bg-amber-300/25 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
              {isLecturer ? "GIẢNG VIÊN" : isAdmin ? "QUẢN TRỊ VIÊN" : role}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col flex-1 gap-1">
          {/* ================= GIAO DIỆN GIẢNG VIÊN ================= */}
          {isLecturer ? (
            <div className="flex flex-col gap-1.5">
              <div className="px-3 pt-1 pb-1 text-[11px] font-bold tracking-wider uppercase text-white/50">
                CHỨC NĂNG GIẢNG VIÊN
              </div>

              <Link
                href="/lecturer"
                className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname.startsWith("/lecturer")
                    ? "bg-white/25 text-white shadow-sm border border-white/25 backdrop-blur-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ClipboardCheck size={19} className="shrink-0 text-white" />
                <span>Đánh giá học phần của tôi</span>
              </Link>
            </div>
          ) : (
            /* ================= GIAO DIỆN QUẢN TRỊ / BDCLGD ================= */
            <>
              {/* Main Dashboard Link */}
              <Link
                href="/dashboard"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/dashboard"
                    ? "bg-white/25 text-white shadow-sm border border-white/25"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Folder size={18} className="shrink-0 opacity-80" />
                <span>Bảng điều khiển</span>
              </Link>

              <hr className="my-2.5 border-t border-white/15 border-dashed" />

              <div className="px-3 pt-1 pb-1 text-[11px] font-bold tracking-wider uppercase text-white/50">
                BDCLGD
              </div>

              <Link
                href="/programs"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/programs"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Folder size={18} className="shrink-0 opacity-75" />
                <span>Quản lý CTĐT</span>
              </Link>

              <Link
                href="/assessments/indirect"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname.startsWith("/assessments/indirect")
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Folder size={18} className="shrink-0 opacity-75" />
                <span>Đo lường - ĐG CĐR (GT)</span>
              </Link>

              <Link
                href="/assessments/direct"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname.startsWith("/assessments/direct")
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Folder size={18} className="shrink-0 opacity-75" />
                <span>Đo lường - ĐG CĐR (TT)</span>
              </Link>

              <Link
                href="/score-analysis"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/score-analysis"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Folder size={18} className="shrink-0 opacity-75" />
                <span>Phân tích phổ điểm</span>
              </Link>

              {/* QL Khảo sát */}
              <div>
                <button
                  type="button"
                  onClick={() => setOpenSurvey(!openSurvey)}
                  className="flex h-10 w-full items-center justify-between rounded-xl px-3.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
                >
                  <div className="flex items-center gap-3">
                    <Folder size={18} className="shrink-0 opacity-75" />
                    <span>QL Hệ thống khảo sát</span>
                  </div>
                  <span className="text-xs opacity-75">{openSurvey ? "▾" : "▸"}</span>
                </button>

                {openSurvey && (
                  <div className="mt-2 mb-2 flex flex-col gap-1 rounded-xl bg-white p-3 text-slate-800 shadow-xl">
                    <div className="border-b border-slate-100 pb-1.5 text-[11px] font-black uppercase tracking-wider text-[#556ee6]">
                      QL Hệ thống khảo sát
                    </div>
                    <Link
                      href="/surveys/dashboard"
                      className={`block rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        pathname === "/surveys/dashboard"
                          ? "bg-slate-100 text-[#556ee6] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/surveys/forms"
                      className={`block rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        pathname === "/surveys/forms"
                          ? "bg-slate-100 text-[#556ee6] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Quản lý Phiếu KS
                    </Link>
                    <Link
                      href="/surveys/settings"
                      className={`block rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        pathname === "/surveys/settings"
                          ? "bg-slate-100 text-[#556ee6] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Cài đặt KS
                    </Link>
                    <Link
                      href="/surveys/reports"
                      className={`block rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        pathname === "/surveys/reports"
                          ? "bg-slate-100 text-[#556ee6] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Thống kê - Báo cáo
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= SECTION ADMIN (Chỉ hiện khi là Admin) ================= */}
          {isAdmin && (
            <>
              <hr className="my-2.5 border-t border-white/15 border-dashed" />
              <div className="px-3 pt-1 pb-1 text-[11px] font-bold tracking-wider uppercase text-white/50">
                ADMIN
              </div>

              <Link
                href="/admin/settings"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/admin/settings"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Settings size={18} className="shrink-0 opacity-75" />
                <span>Cài đặt hệ thống</span>
              </Link>

              <Link
                href="/admin/assignments"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/admin/assignments"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ClipboardCheck size={18} className="shrink-0 opacity-75" />
                <span>Phân công giảng dạy</span>
              </Link>

              <Link
                href="/users"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/users"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCheck size={18} className="shrink-0 opacity-75" />
                <span>Quản lý tài khoản</span>
              </Link>

              <Link
                href="/admin/reset-password"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/admin/reset-password"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCheck size={18} className="shrink-0 opacity-75" />
                <span>Cấp lại Mật khẩu</span>
              </Link>
            </>
          )}

          {/* Spacer đẩy phần footer xuống dưới nếu còn chỗ */}
          <div className="flex-1 min-h-[16px]" />

          {/* ================= SECTION TÀI KHOẢN (Đổi mật khẩu & Thoát) ================= */}
          <div className="pt-2 border-t border-white/15 flex flex-col gap-1 pb-2">
            <Link
              href="/change-password"
              className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                pathname === "/change-password"
                  ? "bg-white/25 text-white font-bold"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Lock size={18} className="shrink-0 opacity-75" />
              <span>Đổi mật khẩu đăng nhập</span>
            </Link>

            {!isLecturer && (
              <Link
                href="/register"
                className={`flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                  pathname === "/register"
                    ? "bg-white/25 text-white font-bold"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCheck size={18} className="shrink-0 opacity-75" />
                <span>Tạo mới tài khoản</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-white/90 hover:bg-red-500/25 transition text-left"
            >
              <LogOut size={18} className="shrink-0 opacity-90" />
              <span>Thoát</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}

function GraduationCapIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
