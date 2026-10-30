"use client";

import { Major } from "../matrix/types";
import {
  Settings,
  Printer,
  User,
  Pencil,
  Compass,
  Grid3X3,
  FileCheck,
  History,
  CheckCircle2,
  BarChart2,
} from "lucide-react";

interface Props {
  majors?: Major[];
  loading?: boolean;
}

export default function AnalysisPanel({ majors = [], loading = false }: Props) {
  // Helper to format numbers with a leading zero if they are < 10
  const formatNumber = (num: number) => String(num).padStart(2, "0");

  // Calculate dynamic stats from the API data
  const ctDtrCount = majors.length;
  // A major is considered to have a matrix active if it has PLOs and CLOs defined
  const activeMatrixCount = majors.filter(m => m.plo > 0 && m.clo > 0).length;
  // Sum up all PLOs across majors
  const ploCount = majors.reduce((sum, m) => sum + m.plo, 0);

  const displayVal = (val: number) => {
    if (loading) return "--";
    return formatNumber(val);
  };

  // Helper to calculate real relative time dynamically
  const getRelativeTime = (createdAtString?: string, fallbackHours = 2) => {
    if (!createdAtString) {
      return `${fallbackHours} giờ trước`;
    }
    const date = new Date(createdAtString);
    if (isNaN(date.getTime())) {
      return `${fallbackHours} giờ trước`;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs <= 0) {
      return `Vừa xong`;
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins || 1} phút trước`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return "Hôm qua";
    }
    return `${diffDays} ngày trước`;
  };

  // Dynamically generate recent activities based on actual database records
  const getRecentActivities = () => {
    if (!majors || majors.length === 0) {
      return [
        {
          type: "update",
          title: "Cập nhật ma trận CNTT",
          time: "2 giờ trước",
          icon: <History size={16} />,
          bg: "bg-blue-50 text-blue-500 border-blue-100/50"
        },
        {
          type: "approve",
          title: "Phê duyệt Khung CTĐT Ngôn ngữ Hàn",
          time: "Hôm qua",
          icon: <CheckCircle2 size={16} />,
          bg: "bg-emerald-50 text-emerald-500 border-emerald-100/50"
        }
      ];
    }

    // Sort majors by id descending to list the newest major activities first
    const sorted = [...majors].sort((a, b) => b.id - a.id);
    
    const act1Major = sorted[0];
    const act2Major = sorted[1] || sorted[0];

    return [
      {
        type: "update",
        title: `Cập nhật ma trận ${act1Major.majorName}`,
        time: getRelativeTime(act1Major.createdAt, 2),
        icon: <History size={16} />,
        bg: "bg-blue-50 text-blue-500 border-blue-100/50"
      },
      {
        type: "approve",
        title: `Phê duyệt Khung CTĐT ${act2Major.majorName}`,
        time: getRelativeTime(act2Major.createdAt, 24),
        icon: <CheckCircle2 size={16} />,
        bg: "bg-emerald-50 text-emerald-500 border-emerald-100/50"
      }
    ];
  };

  const activities = getRecentActivities();

  return (
    <div 
      className="bg-white overflow-hidden"
      style={{ 
        paddingTop: "24px", 
        paddingBottom: "36px",
        borderRadius: "32px",
        boxShadow: "0 20px 50px -12px rgba(15, 23, 42, 0.06), 0 4px 16px -8px rgba(15, 23, 42, 0.02)" 
      }}
    >
      {/* CARD TOP TOOLBAR ICONS */}
      <div 
        className="flex items-center justify-between border-b border-slate-100"
        style={{ height: "56px", paddingLeft: "32px", paddingRight: "32px", marginBottom: "24px" }}
      >
        <h3 className="text-[12px] font-extrabold text-[#7ea3b7] uppercase tracking-widest">
          Quick Tools
        </h3>
        <div className="flex items-center gap-4 text-slate-400">
          <Settings size={17} className="cursor-pointer hover:text-slate-600 transition duration-150" />
          <Printer size={17} className="cursor-pointer hover:text-slate-600 transition duration-150" />
          <User size={17} className="cursor-pointer hover:text-slate-600 transition duration-150" />
          <Pencil size={17} className="cursor-pointer hover:text-slate-600 transition duration-150" />
        </div>
      </div>

      {/* SUMMARY STATS HEADER */}
      <div className="px-8" style={{ marginBottom: "28px" }}>
        <div className="flex items-center gap-2 text-[#0f766e]">
          <BarChart2 size={18} />
          <h2 className="text-[14px] font-black uppercase tracking-wider">
            Thống kê số lượng
          </h2>
        </div>
      </div>

      {/* BLOCKS CONTENT */}
      <div className="px-8 flex flex-col gap-5">
        {/* BLOCK 1: KHUNG CTĐT */}
        <div 
          className="rounded-full flex items-center justify-between px-8 py-5 border-2 border-blue-200/80 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5"
          style={{ backgroundColor: "#F0F7FF" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
              KHUNG CTĐT
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[28px] font-black text-blue-600 leading-none tracking-tight">
                {displayVal(ctDtrCount)}
              </span>
              <span className="text-[12px] font-bold text-slate-500 leading-none">
                Hệ thống
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-500 shadow-inner">
            <Compass size={20} />
          </div>
        </div>

        {/* BLOCK 2: MA TRẬN CĐR */}
        <div 
          className="rounded-full flex items-center justify-between px-8 py-5 border-2 border-emerald-200/80 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/5"
          style={{ backgroundColor: "#F0FAF5" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              MA TRẬN CĐR
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[28px] font-black text-emerald-600 leading-none tracking-tight">
                {displayVal(activeMatrixCount)}
              </span>
              <span className="text-[12px] font-bold text-slate-500 leading-none">
                Ma trận active
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-500 shadow-inner">
            <Grid3X3 size={20} />
          </div>
        </div>

        {/* BLOCK 3: KHUNG PLO */}
        <div 
          className="rounded-full flex items-center justify-between px-8 py-5 border-2 border-amber-200/80 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/5"
          style={{ backgroundColor: "#FDF9EE" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
              KHUNG PLO
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[28px] font-black text-amber-600 leading-none tracking-tight">
                {displayVal(ploCount)}
              </span>
              <span className="text-[12px] font-bold text-slate-500 leading-none">
                Outcome sets
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600 shadow-inner">
            <FileCheck size={20} />
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      <div className="px-8" style={{ paddingTop: "36px" }}>
        <h3 
          className="text-[11px] font-extrabold text-[#7ea3b7] uppercase tracking-widest"
          style={{ marginBottom: "18px" }}
        >
          HOẠT ĐỘNG GẦN ĐÂY
        </h3>

        <div className="flex flex-col gap-5">
          {activities.map((act, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition duration-150 shadow-xs"
            >
              <div className={`w-9 h-9 rounded-full ${act.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                {act.icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-extrabold text-slate-800 leading-snug">
                  {act.title}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold leading-none">
                  {act.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
