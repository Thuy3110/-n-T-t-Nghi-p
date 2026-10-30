"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
type Plo = { id: number; code: string; name: string; rate: number; status: string };
type Analysis = { studentCount: number; matrixCount: number; averagePloRate: number; selectedMajor?: { code: string; name: string } | null; plos: Plo[]; majors: Array<{ code: string; name: string; courseCount: number; ploCount: number; cloCount: number; averagePloRate: number | null }> };

export default function ScoreAnalysisPage() {
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(API + "/statistics/analysis", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Không tải được dữ liệu phân tích.")))
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu."));
  }, []);
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold text-[#881337]">Phân tích phổ điểm</h1><p className="mt-2 text-sm text-slate-500">Theo dõi kết quả PLO/CLO và tỷ lệ đạt từ dữ liệu đánh giá đã nhập.</p></div>{error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}{data && <><div className="grid gap-4 md:grid-cols-4">{[["Sinh viên", data.studentCount], ["Ma trận", data.matrixCount], ["PLO", data.plos.length], ["Tỷ lệ PLO bình quân", data.averagePloRate + "%"]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#881337]">{value}</p></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">Kết quả PLO {data.selectedMajor ? "· " + data.selectedMajor.name : ""}</h2><div className="mt-4 space-y-4">{data.plos.map((plo) => <div key={plo.id}><div className="mb-1 flex justify-between text-sm"><span>{plo.code}</span><span className="font-semibold">{plo.rate}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={plo.rate >= 75 ? "h-2 rounded-full bg-emerald-600" : "h-2 rounded-full bg-amber-500"} style={{ width: Math.min(100, Math.max(0, plo.rate)) + "%" }} /></div><p className="mt-1 text-xs text-slate-500">{plo.status}</p></div>)}</div></section><section className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="p-5"><h2 className="font-semibold">So sánh theo ngành</h2></div><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Ngành</th><th className="px-5 py-3">Học phần</th><th className="px-5 py-3">PLO</th><th className="px-5 py-3">Tỷ lệ</th></tr></thead><tbody className="divide-y">{data.majors.map((major) => <tr key={major.code}><td className="px-5 py-3 font-medium">{major.code} - {major.name}</td><td className="px-5 py-3">{major.courseCount}</td><td className="px-5 py-3">{major.ploCount}</td><td className="px-5 py-3">{major.averagePloRate == null ? "Chưa có điểm" : major.averagePloRate + "%"}</td></tr>)}</tbody></table></section></div></>}</div></AdminLayout>;
}

