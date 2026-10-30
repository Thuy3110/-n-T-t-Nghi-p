"use client";

import Link from "next/link";

export default function AssessmentsPage() {
  return (
    <div className="space-y-8 p-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">Đo lường & Đánh giá chuẩn đầu ra</h1>
        <p className="text-slate-500 mt-3">Chọn phương thức đánh giá để tiếp tục.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/assessments/direct"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-6 text-center text-lg font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
          >
            Đo lường - ĐG CĐR (TT)
          </Link>

          <Link
            href="/assessments/indirect"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-6 text-center text-lg font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-white"
          >
            Đo lường - ĐG CĐR (GT)
          </Link>
        </div>
      </div>
    </div>
  );
}
