"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  FileText,
  LoaderCircle,
  Plus,
  Settings,
  UsersRound,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import surveysService, { SurveyDashboard } from "@/services/surveys.service";
import { surveyTemplates } from "./survey-templates";

function getErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (!error.response) return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
  return "Không thể tải dữ liệu Dashboard khảo sát.";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function SurveysDashboardPage() {
  const [dashboard, setDashboard] = useState<SurveyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSetting, setSavingSetting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    surveysService
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleCdrConversion() {
    if (!dashboard) return;
    const nextValue = !dashboard.cdrConversion;
    setSavingSetting(true);
    setError("");
    setNotice("");
    try {
      await surveysService.updateDashboardSettings(nextValue);
      setDashboard({ ...dashboard, cdrConversion: nextValue });
      setNotice("Đã lưu cài đặt chuyển đổi sang khảo sát CĐR.");
    } catch (settingError: unknown) {
      setError(getErrorMessage(settingError));
    } finally {
      setSavingSetting(false);
    }
  }

  const statistics = dashboard
    ? [
        {
          label: "Số phiếu khảo sát",
          value: dashboard.totalForms,
          description: "Phiếu đã lưu trong hệ thống",
          icon: FileText,
          tone: "blue",
        },
        {
          label: "Phiếu đang triển khai",
          value: dashboard.activeForms,
          description: "Phiếu đang được bật",
          icon: ClipboardList,
          tone: "green",
        },
        {
          label: "Số mẫu đã khảo sát",
          value: dashboard.responseCount,
          description: "Lượt phản hồi đã ghi nhận",
          icon: UsersRound,
          tone: "orange",
        },
      ]
    : [];
  const activePercentage =
    dashboard && dashboard.totalForms > 0
      ? Math.round((dashboard.activeForms / dashboard.totalForms) * 100)
      : 0;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1440px] space-y-7">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm font-medium text-[#07866d]">
              Trung tâm quản lý khảo sát
            </p>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-800 sm:text-[28px]">
              Quản lý khảo sát ý kiến các bên liên quan
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Chào mừng quay trở lại, theo dõi tình hình khảo sát tại đây.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/surveys/reports"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-[#07508d] transition hover:bg-blue-50"
            >
              <BarChart3 size={16} />
              Báo cáo
            </Link>
            <Link
              href="/surveys/dashboard/forms/new"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1769b0] px-5 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#07508d]"
            >
              <Plus size={17} />
              Chiến dịch mới
            </Link>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <Check size={16} />
            {notice}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[minmax(250px,0.95fr)_minmax(0,2fr)]">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-emerald-50" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Settings size={19} />
                </span>
                <h2 className="font-bold uppercase text-slate-800">
                  Quản lý hệ thống
                </h2>
              </div>
              <div className="rounded-2xl bg-[#f3f9ff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Chuyển đổi sang KS CĐR
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dashboard?.cdrConversion ?? false}
                    aria-label="Chuyển đổi sang khảo sát CĐR"
                    disabled={loading || savingSetting || !dashboard}
                    onClick={() => void toggleCdrConversion()}
                    className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
                      dashboard?.cdrConversion
                        ? "bg-emerald-600"
                        : "bg-slate-200"
                    }`}
                  >
                    {savingSetting && (
                      <LoaderCircle
                        size={13}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-500"
                      />
                    )}
                    <span
                      className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        dashboard?.cdrConversion
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {dashboard?.cdrConversion
                    ? "Chế độ khảo sát chuẩn đầu ra đang được bật."
                    : "Bật chế độ khảo sát chuẩn đầu ra cho hệ thống."}
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                {dashboard
                  ? `${dashboard.questionCount} câu hỏi đã được soạn`
                  : "Đang tải cấu hình hệ thống..."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {statistics.slice(0, 2).map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-xl ${
                        item.tone === "blue"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    {item.label === "Số phiếu khảo sát" ? (
                      <span
                        title="Tỷ lệ phiếu đang triển khai trên tổng số phiếu"
                        className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800"
                      >
                        {loading ? "—" : `${activePercentage}%`}
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-800">
                      {loading ? "—" : item.value.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-sm text-slate-400">{item.description}</span>
                  </div>
                </article>
              );
            })}
            {statistics[2] && (
              <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:col-span-2">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700">
                    <UsersRound size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {statistics[2].label}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-800">
                        {loading
                          ? "—"
                          : statistics[2].value.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-sm text-slate-400">
                        {statistics[2].description}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Bắt đầu từ mẫu khảo sát
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn nội dung phù hợp, tùy chỉnh câu hỏi rồi xem trước và lưu
              thành phiếu riêng.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {surveyTemplates.map((template) => {
              const Icon =
                template.icon === "program" ? ClipboardList : UsersRound;
              return (
                <Link
                  key={template.id}
                  href={`/surveys/dashboard/forms/new?template=${template.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                        template.icon === "program"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-[#07508d]"
                      }`}
                    >
                      <Icon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#07866d]">
                        {template.audience}
                      </span>
                      <h3 className="mt-1 text-base font-bold leading-6 text-slate-800 group-hover:text-[#07508d] sm:text-lg">
                        {template.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {template.summary}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#07508d]"
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">
                      {template.questionCount} câu hỏi mẫu
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800">
                      Có thể chỉnh sửa trước khi lưu
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-[#f0f7ff] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-emerald-700" />
              <div>
                <h2 className="font-bold text-slate-800">Biểu mẫu gần đây</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Phiếu khảo sát được cập nhật gần đây
                </p>
              </div>
            </div>
            <Link
              href="/surveys/forms"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#07508d] hover:underline"
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-white/80"
                />
              ))}
            </div>
          ) : dashboard?.recentForms.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {dashboard.recentForms.map((survey) => (
                <Link
                  key={survey.id}
                  href={`/surveys/dashboard/forms/${survey.id}`}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                        survey.enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {survey.enabled ? "Đang mở" : "Đã đóng"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(survey.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {survey.code}
                  </p>
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-800 group-hover:text-[#07508d]">
                    {survey.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>{survey.questionCount} câu hỏi</span>
                    <span>{survey.responseCount} phản hồi</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 px-5 py-10 text-center">
              <FileText size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Chưa có biểu mẫu khảo sát
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tạo phiếu khảo sát để dữ liệu xuất hiện tại Dashboard.
              </p>
              <Link
                href="/surveys/forms"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#07508d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#064374]"
              >
                <Plus size={14} />
                Tạo phiếu khảo sát
              </Link>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
