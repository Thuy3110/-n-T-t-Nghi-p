"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getProgramExport,
  getPrograms,
  ProgramExport,
} from "@/services/programs.service";

type EvaluationStatus = ProgramExport["evaluation"]["status"];

function statusStyle(status: EvaluationStatus) {
  if (status === "Đạt") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "Chưa đạt") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export default function ProgramEvaluationPage() {
  const [results, setResults] = useState<ProgramExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvaluations = useCallback(async () => {
      const programs = await getPrograms();
      return Promise.all(
        programs.map((program) => getProgramExport(program.id))
      );
  }, []);

  const refreshResults = () => {
    setLoading(true);
    setError("");
    void fetchEvaluations()
      .then(setResults)
      .catch((cause: unknown) => {
        console.error("Lỗi tải kết quả đánh giá chương trình đào tạo:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải kết quả đánh giá chương trình đào tạo."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    void fetchEvaluations()
      .then((evaluations) => {
        if (active) setResults(evaluations);
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải kết quả đánh giá chương trình đào tạo:", cause);
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải kết quả đánh giá chương trình đào tạo."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchEvaluations]);

  const achievedCount = results.filter(
    (result) => result.evaluation.status === "Đạt"
  ).length;
  const notAchievedCount = results.filter(
    (result) => result.evaluation.status === "Chưa đạt"
  ).length;
  const noDataCount = results.filter(
    (result) => result.evaluation.status === "Chưa có dữ liệu"
  ).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/programs"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              <ArrowLeft size={16} />
              Quản lý CTĐT
            </Link>
            <p className="text-sm font-medium text-blue-700">
              Quản lý dữ liệu đào tạo
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Đánh giá chương trình đào tạo
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Kết quả được tổng hợp từ tỷ lệ đạt PLO của các ngành và cùng
              nguồn dữ liệu với file Excel xuất từ trang Quản lý CTĐT.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshResults}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới kết quả
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tổng số CTĐT", value: results.length, tone: "text-slate-900" },
              { label: "Đạt", value: achievedCount, tone: "text-emerald-700" },
              { label: "Chưa đạt", value: notAchievedCount, tone: "text-red-700" },
              { label: "Chưa có dữ liệu", value: noDataCount, tone: "text-amber-700" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className={`mt-2 text-2xl font-bold ${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ClipboardCheck size={20} className="text-blue-700" />
              Kết quả theo chương trình
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              CTĐT được đánh giá đạt khi tất cả ngành có dữ liệu và tỷ lệ PLO
              bình quân của mỗi ngành đạt ngưỡng yêu cầu.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Đang tải kết quả đánh giá...
            </div>
          ) : !error && results.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Chưa có chương trình đào tạo để đánh giá.
            </div>
          ) : (
            !error &&
            results.map(({ program, evaluation, majors }) => (
              <article
                key={program.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {program.code}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {program.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusStyle(evaluation.status)}`}
                  >
                    {evaluation.status === "Đạt" && <CheckCircle2 size={16} />}
                    {evaluation.status}
                  </span>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Ngưỡng đạt PLO
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {evaluation.threshold}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Số ngành trong chương trình
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {majors.length}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Ngành</th>
                        <th className="px-4 py-3">Tỷ lệ PLO bình quân</th>
                        <th className="px-4 py-3">Ngưỡng đạt</th>
                        <th className="px-4 py-3">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {majors.map((major) => (
                        <tr key={major.id}>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800">
                              {major.code}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {major.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {major.evaluation.averagePloRate === null
                              ? "Chưa có dữ liệu"
                              : `${major.evaluation.averagePloRate}%`}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {major.evaluation.threshold}%
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(major.evaluation.status)}`}
                            >
                              {major.evaluation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {majors.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-5 text-center text-slate-500"
                          >
                            Chương trình chưa có ngành để đánh giá.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
