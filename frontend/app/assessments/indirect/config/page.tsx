"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Search,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AnalysisConfig, Major } from "../matrix/types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

type ConfiguredMajor = Major & AnalysisConfig;

function getCohortLabel(years?: number[]) {
  const year = years?.[0];
  return year ? `K${year - 2000}-${year}` : "Chưa phân khóa";
}

function formatUpdatedAt(value?: string) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function IndirectConfigPage() {
  const [majors, setMajors] = useState<ConfiguredMajor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadConfigs = async () => {
      try {
        const response = await fetch(`${API_BASE}/majors`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Không thể tải danh sách ngành (${response.status}).`);
        }

        const majorList = (await response.json()) as Major[];
        const configured = await Promise.all(
          majorList.map(async (major) => {
            const configResponse = await fetch(
              `${API_BASE}/majors/${major.id}`,
              { signal: controller.signal }
            );
            if (!configResponse.ok) {
              throw new Error(
                `Không thể tải thông số ngành ${major.majorCode} (${configResponse.status}).`
              );
            }

            const config =
              (await configResponse.json()) as Partial<AnalysisConfig>;
            return {
              ...major,
              majorCode: config.majorCode || major.majorCode,
              ploThreshold: config.ploThreshold ?? 75,
              cloThreshold: config.cloThreshold ?? 3,
              enableContribution: config.enableContribution ?? true,
              enableSelfAssessment: config.enableSelfAssessment ?? true,
              updatedAt: config.updatedAt,
            };
          })
        );

        if (!controller.signal.aborted) {
          setMajors(configured);
          setError("");
        }
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error("Error loading indirect assessment configs:", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải thông số đánh giá."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadConfigs();
    return () => controller.abort();
  }, []);

  const filteredMajors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return majors;
    return majors.filter(
      (major) =>
        major.majorName.toLocaleLowerCase("vi").includes(normalizedQuery) ||
        major.majorCode.toLocaleLowerCase("vi").includes(normalizedQuery)
    );
  }, [majors, query]);

  const selfAssessmentCount = majors.filter(
    (major) => major.enableSelfAssessment
  ).length;
  const contributionCount = majors.filter(
    (major) => major.enableContribution
  ).length;
  const averagePloThreshold =
    majors.length > 0
      ? Math.round(
          majors.reduce((sum, major) => sum + major.ploThreshold, 0) /
            majors.length
        )
      : 0;

  return (
    <div className="mx-auto max-w-[1440px]">
          <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>ĐÁNH GIÁ GIÁN TIẾP</span>
                <span>/</span>
                <span className="text-[#1763aa]">THÔNG SỐ ĐÁNH GIÁ</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Tổng quan thông số đánh giá
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
                Theo dõi cấu hình ngưỡng chuẩn đầu ra và trạng thái đánh giá của
                từng ngành. Chọn một ngành để xem hoặc cập nhật thiết lập.
              </p>
            </div>
            <Link
              href="/assessments/indirect/matrix"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-[#1763aa]"
            >
              <ClipboardList size={16} />
              Quản lý ma trận
            </Link>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section
            aria-label="Tình hình cấu hình"
            className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              icon={<Settings2 size={19} />}
              label="NGÀNH ĐÀO TẠO"
              value={loading ? "—" : String(majors.length)}
              description="Có cấu hình đánh giá"
              color="blue"
            />
            <SummaryCard
              icon={<ShieldCheck size={19} />}
              label="NGƯỠNG PLO TRUNG BÌNH"
              value={loading ? "—" : `${averagePloThreshold}%`}
              description="Mức trung bình giữa các ngành"
              color="indigo"
            />
            <SummaryCard
              icon={<ClipboardList size={19} />}
              label="ĐÓNG GÓP CLO/PLO"
              value={
                loading ? "—" : `${contributionCount}/${majors.length}`
              }
              description="Ngành đang bật mức đóng góp"
              color="emerald"
            />
            <SummaryCard
              icon={<Users size={19} />}
              label="TỰ ĐÁNH GIÁ"
              value={
                loading ? "—" : `${selfAssessmentCount}/${majors.length}`
              }
              description="Ngành cho phép sinh viên tự đánh giá"
              color="teal"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Cấu hình theo ngành
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Xem nhanh các ngưỡng và trạng thái; thiết lập chi tiết nằm
                  trong từng ngành.
                </p>
              </div>
              <label className="relative block w-full sm:w-[280px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo mã hoặc tên ngành"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Ngành / Mã ngành</th>
                    <th className="px-4 py-3.5">Khóa học</th>
                    <th className="px-4 py-3.5">Ngưỡng PLO</th>
                    <th className="px-4 py-3.5">Ngưỡng CLO</th>
                    <th className="px-4 py-3.5">Mức đóng góp</th>
                    <th className="px-4 py-3.5">Tự đánh giá</th>
                    <th className="px-6 py-3.5 text-right">Cập nhật</th>
                    <th className="px-5 py-3.5" aria-label="Thao tác" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading &&
                    Array.from({ length: 4 }, (_, index) => (
                      <tr key={index}>
                        <td colSpan={8} className="px-6 py-5">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))}
                  {!loading &&
                    filteredMajors.map((major) => (
                      <tr
                        key={major.id}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">
                            {major.majorName}
                          </div>
                          <div className="mt-0.5 text-xs font-medium text-slate-400">
                            {major.majorCode}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getCohortLabel(major.years)}
                        </td>
                        <td className="px-4 py-4">
                          <ThresholdValue value={major.ploThreshold} suffix="%" />
                        </td>
                        <td className="px-4 py-4">
                          <ThresholdValue value={major.cloThreshold} suffix="mức" />
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill enabled={major.enableContribution}>
                            {major.enableContribution ? "Bật · I/R/M" : "Tắt"}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-4">
                          <StatusPill enabled={major.enableSelfAssessment}>
                            {major.enableSelfAssessment ? "Đang cho phép" : "Đang tắt"}
                          </StatusPill>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-500">
                          {formatUpdatedAt(major.updatedAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/assessments/indirect/config/setup?majorId=${major.id}`}
                            aria-label={`Thiết lập thông số ${major.majorName}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-[#1763aa] transition hover:border-blue-200 hover:bg-blue-100"
                          >
                            Thiết lập
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  {!loading && filteredMajors.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-14 text-center text-sm text-slate-500"
                      >
                        {majors.length === 0
                          ? "Chưa có ngành đào tạo."
                          : "Không tìm thấy ngành phù hợp."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
              {loading
                ? "Đang tải cấu hình..."
                : `Hiển thị ${filteredMajors.length} / ${majors.length} ngành`}
            </footer>
          </section>
        
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color: "blue" | "indigo" | "emerald" | "teal";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    teal: "bg-teal-50 text-teal-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}
        >
          {icon}
        </span>
      </div>
    </article>
  );
}

function ThresholdValue({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) {
  return (
    <span className="font-semibold text-slate-700">
      {value}
      <span className="ml-1 text-xs font-normal text-slate-400">{suffix}</span>
    </span>
  );
}

function StatusPill({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        enabled
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          enabled ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {children}
    </span>
  );
}
