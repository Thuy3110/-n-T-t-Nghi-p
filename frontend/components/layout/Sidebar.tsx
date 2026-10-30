"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  Folder,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubMenuItem {
  title: string;
  href: string;
}

interface MenuItem {
  title: string;
  icon: any;
  href: string;
  submenu?: SubMenuItem[];
}

interface MenuGroup {
  group: string | null;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    group: null,
    items: [
      {
        title: "Bảng điều khiển",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
    ],
  },
  {
    group: "BDCLGD",
    items: [
      {
        title: "Đo lường - ĐG CĐR (GT)",
        icon: ClipboardCheck,
        href: "/assessments/indirect",
      },
      {
        title: "Đo lường - ĐG CĐR (TT)",
        icon: ClipboardCheck,
        href: "/assessments/direct",
      },
      {
        title: "QL Hệ thống khảo sát",
        icon: FileText,
        href: "/survey",
        submenu: [
          { title: "Dashboard", href: "/surveys/dashboard" },
          { title: "Quản lý Phiếu KS", href: "/surveys/forms" },
          { title: "Cài đặt KS", href: "/surveys/settings" },
          { title: "Thống kê - Báo cáo", href: "/surveys/reports" },
        ],
      },
      {
        title: "Phân tích phổ điểm",
        icon: BarChart3,
        href: "/score-analysis",
      },
    ],
  },
  {
    group: "ADMIN",
    items: [
      {
        title: "Cài đặt hệ thống",
        icon: Settings,
        href: "/admin/settings",
      },
      {
        title: "Cấp lại Mật khẩu",
        icon: UserCheck,
        href: "/admin/reset-password",
      },
      {
        title: "Quản lý tài khoản",
        icon: UserCheck,
        href: "/users",
      },
      {
        title: "Đổi mật khẩu đăng nhập",
        icon: Lock,
        href: "/change-password",
      },
      {
        title: "Thoát",
        icon: LogOut,
        href: "/logout",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isSurveyPage = pathname.startsWith("/survey") || pathname.startsWith("/surveys");
  const [openSurvey, setOpenSurvey] = useState(isSurveyPage);
  const [role, setRole] = useState("USER");
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "SUPER USER"].includes(role);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    try {
      const parsed = JSON.parse(rawUser) as { role?: string };
      setRole(parsed.role?.trim().toUpperCase() || "USER");
    } catch {
      setRole("USER");
    }
  }, []);

  return (
    <aside style={{ backgroundColor: "#1ca6b8", color: "#ffffff" }} className="fixed left-0 top-0 h-screen w-[270px] text-white flex flex-col z-50 shadow-xl font-sans">
      <div className="px-5 pt-6 pb-4 flex-1 overflow-y-auto">
        {/* Top Header Logo */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/20">
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
          <div className="flex flex-col text-white leading-snug">
            <span className="text-[12px] font-black tracking-wide uppercase">
              ĐH KIẾN TRÚC
            </span>
            <span className="text-[12px] font-black tracking-wide uppercase">
              ĐÀ NẴNG
            </span>
            <span className="text-[10px] font-extrabold text-amber-200 tracking-wider">
              SMART-EDU
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ display: "flex", flexDirection: "column" }}>
          {/* Main Dashboard Link */}
          <div>
            <Link
              href="/dashboard"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/dashboard"
                  ? "bg-white/20 text-white font-semibold shadow-sm"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Folder size={18} className="shrink-0 text-white/90" />
              <span>Bảng điều khiển</span>
            </Link>
          </div>

          {/* Dấu kẻ gạch ngang 1 */}
          <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.2)", marginTop: "14px", marginBottom: "14px" }} />

          {/* Section 1: BDCLGD */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ paddingLeft: "12px", paddingBottom: "2px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.45)" }}>
              BDCLGD
            </div>

            {/* Đo lường - đánh giá CĐR (GT) */}
            <Link
              href="/assessments/indirect"
              style={{
                height: "40px",
                paddingLeft: "14px",
                paddingRight: "14px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "13.5px",
              }}
              className={`transition ${pathname.startsWith("/assessments/indirect")
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Folder size={18} className="shrink-0 opacity-75" />
              <span>Đo lường - ĐG CĐR (GT)</span>
            </Link>

            {/* Đo lường - đánh giá CĐR (TT) */}
            <Link
              href="/assessments/direct"
              style={{
                height: "40px",
                paddingLeft: "14px",
                paddingRight: "14px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "13.5px",
              }}
              className={`transition ${pathname.startsWith("/assessments/direct")
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Folder size={18} className="shrink-0 opacity-75" />
              <span>Đo lường - ĐG CĐR (TT)</span>
            </Link>

            {/* Phân tích phổ điểm */}
            <Link
              href="/score-analysis"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/score-analysis"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Folder size={18} className="shrink-0 opacity-75" />
              <span>Phân tích phổ điểm</span>
            </Link>

            {/* QL Hệ thống khảo sát Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setOpenSurvey(!openSurvey)}
                style={{ width: "100%", height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13.5px" }}
                className="text-white/85 hover:text-white hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <Folder size={18} className="shrink-0 opacity-75" />
                  <span>QL Hệ thống khảo sát</span>
                </div>
                <span className="text-xs opacity-75">{openSurvey ? "▾" : "▸"}</span>
              </button>

              {/* Submenu White Card Box with explicit Inline Styles */}
              {openSurvey && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "16px",
                    marginTop: "10px",
                    marginBottom: "10px",
                    color: "#1e293b",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      color: "#556ee6",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "8px",
                      textTransform: "uppercase",
                    }}
                  >
                    QL HỆ THỐNG KHẢO SÁT
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                    <Link
                      href="/surveys/dashboard"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "block",
                        textDecoration: "none",
                      }}
                      className={`hover:bg-slate-100 hover:text-[#556ee6] transition ${pathname === "/surveys/dashboard"
                          ? "text-[#556ee6] font-bold bg-slate-100"
                          : "text-slate-700"
                        }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/surveys/forms"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "block",
                        textDecoration: "none",
                      }}
                      className={`hover:bg-slate-100 hover:text-[#556ee6] transition ${pathname === "/surveys/forms"
                          ? "text-[#556ee6] font-bold bg-slate-100"
                          : "text-slate-700"
                        }`}
                    >
                      Quản lý Phiếu KS
                    </Link>
                    <Link
                      href="/surveys/settings"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "block",
                        textDecoration: "none",
                      }}
                      className={`hover:bg-slate-100 hover:text-[#556ee6] transition ${pathname === "/surveys/settings"
                          ? "text-[#556ee6] font-bold bg-slate-100"
                          : "text-slate-700"
                        }`}
                    >
                      Cài đặt KS
                    </Link>
                    <Link
                      href="/surveys/reports"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "block",
                        textDecoration: "none",
                      }}
                      className={`hover:bg-slate-100 hover:text-[#556ee6] transition ${pathname === "/surveys/reports"
                          ? "text-[#556ee6] font-bold bg-slate-100"
                          : "text-slate-700"
                        }`}
                    >
                      Thống kê - Báo cáo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dấu kẻ gạch ngang 2 */}
          <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.2)", marginTop: "14px", marginBottom: "14px" }} />

          {/* Section 2: ADMIN (Chỉ có 2 danh mục) */}
          <div style={{ display: isAdmin ? "flex" : "none", flexDirection: "column", gap: "8px" }}>
            <div style={{ paddingLeft: "12px", paddingBottom: "2px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.45)" }}>
              ADMIN
            </div>

            <Link
              href="/admin/settings"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/admin/settings"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Settings size={18} className="shrink-0 opacity-75" />
              <span>Cài đặt hệ thống</span>
            </Link>

            <Link
              href="/users"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/users"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <UserCheck size={18} className="shrink-0 opacity-75" />
              <span>Quản lý tài khoản</span>
            </Link>

            <Link
              href="/admin/reset-password"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/admin/reset-password"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <UserCheck size={18} className="shrink-0 opacity-75" />
              <span>Cấp lại Mật khẩu</span>
            </Link>
          </div>

          {/* Dấu kẻ gạch ngang 3 */}
          <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.2)", marginTop: "14px", marginBottom: "14px" }} />

          {/* Section 3: 3 Danh mục cuối */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "24px" }}>
            <Link
              href="/change-password"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/change-password"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <Lock size={18} className="shrink-0 opacity-75" />
              <span>Đổi mật khẩu đăng nhập</span>
            </Link>

            <Link
              href="/register"
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className={`transition ${pathname === "/register"
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
            >
              <UserCheck size={18} className="shrink-0 opacity-75" />
              <span>Tạo mới tài khoản</span>
            </Link>

            {isAdmin && (
              <Link
                href="/users"
                style={{ display: "none", height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
                className={`transition ${pathname === "/users"
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
              >
                <UserCheck size={18} className="shrink-0 opacity-75" />
              <span>{"Qu\u1ea3n l\u00fd t\u00e0i kho\u1ea3n"}</span>
              </Link>
            )}

            <Link
              href="/logout"
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              style={{ height: "40px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", fontSize: "13.5px" }}
              className="font-semibold text-white/90 hover:bg-red-600/30 transition"
            >
              <LogOut size={18} className="shrink-0 opacity-90" />
              <span>Thoát</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  );
}
