"use client";
import { usePathname } from "next/navigation";
import DirectTopMenu from "./DirectTopMenu";
import IndirectTopMenu from "./IndirectTopMenu";
import SurveyTopMenu from "./SurveyTopMenu";

import {
  Bell,
  Briefcase,
  HelpCircle,
  LogOut,
  Mail,
  Search,
  Settings,
  User,
} from "lucide-react";

import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isFrameworkPage = pathname.includes("/matrix/framework");
  const isDirectAssessment = pathname.startsWith("/assessments/direct") && !isFrameworkPage;
  const isIndirectAssessment = pathname.startsWith("/assessments/indirect") && !isFrameworkPage;
  const isSurveyPage = pathname.startsWith("/surveys");
  const hideSearch = (isDirectAssessment || isIndirectAssessment) && !isFrameworkPage;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="h-[72px] bg-[#f5f8fc] border-b border-[#e5e7eb] flex items-center px-8">

      <div className="flex-1">
        {isDirectAssessment ? (
          <DirectTopMenu />
        ) : isIndirectAssessment ? (
          <IndirectTopMenu />
        ) : isSurveyPage ? (
          <SurveyTopMenu />
        ) : (
          <div className="w-[360px] h-[40px] rounded-full bg-[#eef3f8] flex items-center px-4 border border-slate-200/60 shadow-2xs">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              className="bg-transparent outline-none w-full ml-2.5 text-xs text-slate-700 placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center relative">
        {isFrameworkPage ? (
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 transition-colors p-1">
              <Bell size={18} />
            </button>
            <button className="text-slate-500 hover:text-slate-700 transition-colors p-1">
              <Settings size={18} />
            </button>
            <div className="flex items-center gap-2.5 ml-2 pl-2">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.fullName || "Admin User"}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Quản trị viên
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        ) : isDirectAssessment ? (
          <div className="flex items-center gap-5">
            <button className="text-slate-600 hover:text-[#165aa7]">
              <Bell size={18} />
            </button>
            <button className="text-slate-600 hover:text-[#165aa7]">
              <HelpCircle size={18} />
            </button>
            <button className="text-slate-600 hover:text-[#165aa7]">
              <Settings size={18} />
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold ml-1 hover:opacity-90 cursor-pointer"
            >
              <User size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6 pr-6 border-r border-slate-200">
              <button className="text-slate-600 hover:text-[#165aa7]">
                <Bell size={20} />
              </button>

              <button className="text-slate-600 hover:text-[#165aa7]">
                <Mail size={20} />
              </button>
            </div>

            <div className="relative pl-6">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3"
              >
                <div className="text-right">
                  <h3 className="text-[16px] leading-5 font-extrabold text-slate-950">
                    {user?.fullName || "Quản trị viên"}
                  </h3>

                  <p className="text-[12px] uppercase tracking-wide text-[#8190b3] mt-1">
                    SUPER USER
                  </p>
                </div>

                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
              </button>
            </div>
          </>
        )}

        {open && (
          <div className="absolute right-0 top-[62px] w-[300px] rounded-[6px] bg-white shadow-2xl border border-slate-100 overflow-hidden z-50">
            <div className="bg-[#07508d] px-5 py-5">
              <p className="text-[12px] tracking-[0.22em] text-[#b8d0e8] uppercase">
                SIGNED IN AS
              </p>

              <p className="mt-2 text-[17px] font-bold text-white truncate">
                {user?.username || "nguyen.an@dau..."}
              </p>
            </div>

            <div className="py-3">
              <DropdownItem icon={User} label="Hồ sơ cá nhân" />
              <DropdownItem icon={Settings} label="Cài đặt cá nhân" />
              <DropdownItem icon={Briefcase} label="Công việc cần thực hiện" />
            </div>

            <div className="border-t border-slate-200 py-3">
              <button
                onClick={handleLogout}
                className="w-full h-12 px-5 flex items-center gap-4 text-[16px] font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={21} />
                Thoát
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function DropdownItem({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <button className="w-full h-12 px-5 flex items-center gap-4 text-[16px] text-slate-800 hover:bg-slate-50">
      <Icon size={21} className="text-[#07508d]" />
      {label}
    </button>
  );
}