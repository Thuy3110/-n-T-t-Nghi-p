"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
type FormReport = { id: number; code: string; year: string; title: string; enabled: boolean; questionCount: number; responseCount: number; lastSubmittedAt?: string | null };
type Report = { totalForms: number; activeForms: number; totalResponses: number; totalQuestions: number; forms: FormReport[] };

export default function SurveysReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(API + "/reports/surveys", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Không tải được báo cáo khảo sát.")))
      .then(setReport)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được báo cáo."));
  }, []);

  return <AdminLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold text-[#881337]">Thống kê - Báo cáo khảo sát</h1><p className="mt-2 text-sm text-slate-500">Tổng hợp phiếu, câu hỏi và phản hồi thực tế từ cơ sở dữ liệu.</p></div>{error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}{report && <><div className="grid gap-4 md:grid-cols-4">{[["Phiếu khảo sát", report.totalForms], ["Đang bật", report.activeForms], ["Phản hồi", report.totalResponses], ["Câu hỏi", report.totalQuestions]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#881337]">{value}</p></div>)}</div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Phiếu</th><th className="px-5 py-3">Năm</th><th className="px-5 py-3">Câu hỏi</th><th className="px-5 py-3">Phản hồi</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody className="divide-y">{report.forms.map((form) => <tr key={form.id}><td className="px-5 py-3 font-medium">{form.code}</td><td className="px-5 py-3">{form.title}</td><td className="px-5 py-3">{form.year}</td><td className="px-5 py-3">{form.questionCount}</td><td className="px-5 py-3 font-semibold">{form.responseCount}</td><td className="px-5 py-3">{form.enabled ? <span className="text-emerald-700">Đang bật</span> : <span className="text-slate-500">Đã tắt</span>}</td></tr>)}</tbody></table></div></>}</div></AdminLayout>;
}

