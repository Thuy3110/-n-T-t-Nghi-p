"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";

import surveysService, {
  SurveyForm,
  SurveyFormInput,
  SurveyLevel,
} from "@/services/surveys.service";

/* =========================================================
   TYPES & CONSTANTS
========================================================= */

type SurveyConfig = SurveyFormInput;

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const EMPTY_CONFIG: SurveyConfig = {
  year: "",
  code: "",
  title: "",
  description: "",
  isCdr: false,
  link: "",
  level: "LV1",
  enabled: true,
  legacyLink: "",
  menu: "main",
  classes: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function SurveysManagementPage() {
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [config, setConfig] = useState<SurveyConfig>(EMPTY_CONFIG);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  /* -------------------------
     LOAD DATA FROM BACKEND
  ------------------------- */

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await surveysService.findAll();

      if (!Array.isArray(result)) {
        throw new Error("Dữ liệu khảo sát trả về không đúng định dạng.");
      }

      setSurveys(result);

      // Giữ khảo sát đang chọn nếu nó vẫn còn tồn tại.
      setSelectedId((currentId) => {
        if (currentId !== null && result.some((item) => item.id === currentId)) {
          return currentId;
        }

        return result.length > 0 ? result[0].id : null;
      });
    } catch (err) {
      console.error("Không thể tải danh sách khảo sát:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách khảo sát từ máy chủ.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  /* -------------------------
     SELECT SURVEY
  ------------------------- */

  const selectedSurvey = useMemo(
    () => surveys.find((item) => item.id === selectedId) ?? null,
    [surveys, selectedId],
  );

  useEffect(() => {
    if (!selectedSurvey || isCreating) return;

    setConfig({
      year: normalizeText(selectedSurvey.year),
      code: normalizeText(selectedSurvey.code),
      title: normalizeText(selectedSurvey.title),
      description: normalizeText(selectedSurvey.description),
      isCdr: Boolean(selectedSurvey.isCdr),
      link: normalizeText(selectedSurvey.link),
      level: selectedSurvey.level,
      enabled: Boolean(selectedSurvey.enabled),
      legacyLink: normalizeText(selectedSurvey.legacyLink),
      menu: selectedSurvey.menu,
      classes: normalizeText(selectedSurvey.classes),
    });
  }, [selectedSurvey, isCreating]);

  /* -------------------------
     SEARCH & PAGINATION
  ------------------------- */

  const filteredSurveys = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    if (!keyword) return surveys;

    return surveys.filter((survey) => {
      const searchableText = [
        survey.year,
        survey.code,
        survey.title,
        survey.description,
        survey.level,
      ]
        .map(normalizeText)
        .join(" ")
        .toLocaleLowerCase("vi");

      return searchableText.includes(keyword);
    });
  }, [surveys, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedSurveys = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSurveys.slice(start, start + pageSize);
  }, [filteredSurveys, page, pageSize]);

  const activeCount = surveys.filter((item) => item.enabled).length;
  const inactiveCount = surveys.length - activeCount;

  /* -------------------------
     FORM HANDLERS
  ------------------------- */

  function updateConfig<K extends keyof SurveyConfig>(
    key: K,
    value: SurveyConfig[K],
  ) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleCreate() {
    setIsCreating(true);
    setSelectedId(null);
    setConfig({ ...EMPTY_CONFIG });
    setError("");
    setSuccess("");
  }

  function handleSelect(survey: SurveyForm) {
    setIsCreating(false);
    setSelectedId(survey.id);
    setError("");
    setSuccess("");
  }

  function handleCancel() {
    setIsCreating(false);
    setError("");
    setSuccess("");

    if (selectedSurvey) {
      // Khôi phục toàn bộ dữ liệu từ bản ghi gốc, không chỉ set lại selectedId
      // (selectedId có thể không đổi nên effect đồng bộ form sẽ không chạy lại).
      setConfig({
        year: normalizeText(selectedSurvey.year),
        code: normalizeText(selectedSurvey.code),
        title: normalizeText(selectedSurvey.title),
        description: normalizeText(selectedSurvey.description),
        isCdr: Boolean(selectedSurvey.isCdr),
        link: normalizeText(selectedSurvey.link),
        level: selectedSurvey.level,
        enabled: Boolean(selectedSurvey.enabled),
        legacyLink: normalizeText(selectedSurvey.legacyLink),
        menu: selectedSurvey.menu,
        classes: normalizeText(selectedSurvey.classes),
      });
      setSelectedId(selectedSurvey.id);
    } else if (surveys.length > 0) {
      setSelectedId(surveys[0].id);
    } else {
      setSelectedId(null);
      setConfig({ ...EMPTY_CONFIG });
    }
  }

  /* -------------------------
     CREATE / UPDATE
  ------------------------- */

  async function handleSave() {
    if (!config.year.trim()) {
      setError("Vui lòng nhập năm hoặc đợt khảo sát.");
      return;
    }

    if (!config.code.trim()) {
      setError("Vui lòng nhập mã khảo sát.");
      return;
    }

    if (!config.title.trim()) {
      setError("Vui lòng nhập tên khảo sát.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: SurveyFormInput = {
        ...config,
        year: config.year.trim(),
        code: config.code.trim(),
        title: config.title.trim(),
        description: config.description?.trim() ?? "",
        link: config.link?.trim() ?? "",
        legacyLink: config.legacyLink?.trim() ?? "",
        menu: config.menu === "sidebar" ? "sidebar" : "main",
        classes: config.classes?.trim() ?? "",
      };

      if (isCreating) {
        const created = await surveysService.create(payload);
        setSelectedId(created.id);
        setSuccess("Thêm khảo sát thành công.");
      } else {
        if (selectedId === null) {
          throw new Error("Vui lòng chọn khảo sát cần cập nhật.");
        }

        await surveysService.update(selectedId, payload);
        setSuccess("Cập nhật khảo sát thành công.");
      }

      setIsCreating(false);
      await loadSurveys();
    } catch (err) {
      console.error("Không thể lưu khảo sát:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu khảo sát. Vui lòng kiểm tra kết nối máy chủ.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------
     TOGGLE STATUS
  ------------------------- */

  async function handleToggle(survey: SurveyForm) {
    setError("");
    setSuccess("");

    try {
      // Chỉ gửi trường cần cập nhật để tránh gửi id/createdAt/updatedAt
      // vào DTO PATCH của backend.
      await surveysService.update(survey.id, {
        enabled: !survey.enabled,
      });

      setSuccess(
        !survey.enabled
          ? "Đã bật hoạt động khảo sát."
          : "Đã tắt hoạt động khảo sát.",
      );

      await loadSurveys();
    } catch (err) {
      console.error("Không thể thay đổi trạng thái:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể thay đổi trạng thái khảo sát.",
      );
    }
  }

  /* -------------------------
     DELETE
  ------------------------- */

  async function handleDelete(survey: SurveyForm) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khảo sát "${survey.title}" không?`,
    );

    if (!confirmed) return;

    setDeleting(survey.id);
    setError("");
    setSuccess("");

    try {
      await surveysService.remove(survey.id);

      setSuccess("Xóa khảo sát thành công.");

      if (selectedId === survey.id) {
        setSelectedId(null);
      }

      await loadSurveys();
    } catch (err) {
      console.error("Không thể xóa khảo sát:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa khảo sát. Hãy kiểm tra dữ liệu liên quan.",
      );
    } finally {
      setDeleting(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AdminLayout>
      <main className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* PAGE HEADER */}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Hệ thống</span>
                <ChevronRight size={13} />
                <span>Quản lý khảo sát</span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Quản lý khảo sát
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý danh mục phiếu khảo sát, đường dẫn, phạm vi áp dụng và
                trạng thái hoạt động.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadSurveys()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Làm mới
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Printer size={16} />
                In danh sách
              </button>

              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
              >
                <Plus size={17} />
                Thêm khảo sát
              </button>
            </div>
          </div>

          {/* ALERTS */}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Đóng thông báo lỗi"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              <Check size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1">{success}</p>
              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Đóng thông báo thành công"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* STATISTICS */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Tổng số khảo sát"
              value={surveys.length}
              description="Tất cả phiếu khảo sát trong hệ thống"
              icon={FileText}
              iconClass="bg-blue-50 text-blue-700"
            />

            <StatCard
              title="Đang hoạt động"
              value={activeCount}
              description="Phiếu đang được bật"
              icon={Check}
              iconClass="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              title="Đã tắt"
              value={inactiveCount}
              description="Phiếu hiện không hoạt động"
              icon={Settings}
              iconClass="bg-amber-50 text-amber-700"
            />
          </section>

          {/* MAIN CONTENT */}

          <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            {/* LEFT: SURVEY LIST */}

            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Danh sách khảo sát
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Chọn một khảo sát để xem hoặc chỉnh sửa cấu hình.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {filteredSurveys.length} khảo sát
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Tìm theo mã, tên, năm..."
                      className={`${inputClass} pl-9`}
                    />
                  </div>

                  <select
                    aria-label="Số khảo sát mỗi trang"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className={`${inputClass} sm:w-32`}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} / trang
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-slate-500">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-blue-700"
                  />
                  <p className="text-sm">Đang tải dữ liệu khảo sát...</p>
                </div>
              ) : paginatedSurveys.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                    <FileText size={26} />
                  </div>

                  <p className="mt-4 font-medium text-slate-700">
                    {search
                      ? "Không tìm thấy khảo sát phù hợp"
                      : "Chưa có khảo sát"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {search
                      ? "Thử thay đổi từ khóa tìm kiếm."
                      : "Bạn có thể thêm khảo sát mới bằng nút phía trên."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {paginatedSurveys.map((survey) => {
                      const isSelected =
                        !isCreating && selectedId === survey.id;

                      return (
                        <div
                          key={survey.id}
                          className={`p-4 transition ${
                            isSelected
                              ? "border-l-4 border-l-blue-700 bg-blue-50/60"
                              : "border-l-4 border-l-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleSelect(survey)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                                  {survey.code || "Chưa có mã"}
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    survey.enabled
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {survey.enabled
                                    ? "Đang hoạt động"
                                    : "Đã tắt"}
                                </span>
                              </div>

                              <h3 className="mt-2 break-words font-semibold text-slate-800">
                                {survey.title || "Chưa có tên khảo sát"}
                              </h3>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>
                                  Năm/đợt: {survey.year || "Chưa thiết lập"}
                                </span>
                                <span>
                                  Cấp khảo sát:{" "}
                                  {normalizeText(survey.level) ||
                                    "Chưa thiết lập"}
                                </span>
                              </div>
                            </button>

                            <div className="flex shrink-0 items-center gap-1">
                              {survey.link && (
                                <a
                                  href={survey.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Mở đường dẫn khảo sát"
                                  onClick={(event) => event.stopPropagation()}
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}

                              <button
                                type="button"
                                title="Chỉnh sửa khảo sát"
                                onClick={() => handleSelect(survey)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                title="Xóa khảo sát"
                                disabled={deleting === survey.id}
                                onClick={() => void handleDelete(survey)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                {deleting === survey.id ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-xs text-slate-500">
                              ID: {survey.id}
                            </span>

                            <button
                              type="button"
                              onClick={() => void handleToggle(survey)}
                              className={`text-xs font-medium ${
                                survey.enabled
                                  ? "text-amber-700 hover:text-amber-800"
                                  : "text-emerald-700 hover:text-emerald-800"
                              }`}
                            >
                              {survey.enabled
                                ? "Tắt hoạt động"
                                : "Bật hoạt động"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PAGINATION */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Trang {page}/{totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="min-w-8 text-center text-sm font-medium text-slate-700">
                        {page}
                      </span>

                      <button
                        type="button"
                        aria-label="Trang sau"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: SURVEY CONFIGURATION */}

            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <Settings size={21} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {isCreating
                        ? "Thêm khảo sát mới"
                        : "Cấu hình khảo sát"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {isCreating
                        ? "Nhập thông tin cho khảo sát mới."
                        : selectedSurvey
                          ? `Đang chỉnh sửa: ${selectedSurvey.code}`
                          : "Chọn khảo sát trong danh sách để chỉnh sửa."}
                    </p>
                  </div>
                </div>

                {isCreating && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Mới
                  </span>
                )}
              </div>

              {!isCreating && !selectedSurvey ? (
                <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                  <FileText size={36} className="text-slate-300" />
                  <p className="mt-4 font-medium text-slate-700">
                    Chưa chọn khảo sát
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn một khảo sát ở danh sách hoặc tạo khảo sát mới.
                  </p>

                  <button
                    type="button"
                    onClick={handleCreate}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                  >
                    <Plus size={16} />
                    Thêm khảo sát
                  </button>
                </div>
              ) : (
                <div className="space-y-6 p-5">
                  {/* BASIC INFORMATION */}

                  <section>
                    <SectionTitle
                      title="1. Thông tin cơ bản"
                      description="Thông tin nhận diện và mô tả phiếu khảo sát."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField label="Năm/đợt khảo sát">
                        <input
                          value={config.year ?? ""}
                          onChange={(event) =>
                            updateConfig("year", event.target.value)
                          }
                          placeholder="Nhập năm hoặc mã đợt"
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label="Mã khảo sát" required>
                        <input
                          value={config.code ?? ""}
                          onChange={(event) =>
                            updateConfig("code", event.target.value)
                          }
                          placeholder="Nhập mã khảo sát"
                          className={inputClass}
                        />
                      </FormField>

                      <div className="sm:col-span-2">
                        <FormField label="Tên khảo sát" required>
                          <input
                            value={config.title ?? ""}
                            onChange={(event) =>
                              updateConfig("title", event.target.value)
                            }
                            placeholder="Nhập tên phiếu khảo sát"
                            className={inputClass}
                          />
                        </FormField>
                      </div>

                      <div className="sm:col-span-2">
                        <FormField label="Mô tả">
                          <textarea
                            value={config.description ?? ""}
                            onChange={(event) =>
                              updateConfig("description", event.target.value)
                            }
                            rows={3}
                            placeholder="Nhập mô tả hoặc mục đích khảo sát"
                            className={`${inputClass} resize-y`}
                          />
                        </FormField>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* LINKS */}

                  <section>
                    <SectionTitle
                      title="2. Đường dẫn khảo sát"
                      description="Cấu hình liên kết mở phiếu và đường dẫn cũ nếu có."
                    />

                    <div className="space-y-4">
                      <FormField label="Đường dẫn khảo sát">
                        <div className="relative">
                          <Link2
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="url"
                            value={config.link ?? ""}
                            onChange={(event) =>
                              updateConfig("link", event.target.value)
                            }
                            placeholder="https://..."
                            className={`${inputClass} pl-9`}
                          />
                        </div>
                      </FormField>

                      <FormField label="Đường dẫn cũ">
                        <input
                          type="url"
                          value={config.legacyLink ?? ""}
                          onChange={(event) =>
                            updateConfig("legacyLink", event.target.value)
                          }
                          placeholder="Nhập đường dẫn cũ nếu có"
                          className={inputClass}
                        />
                      </FormField>

                      {config.link?.trim() && (
                        <a
                          href={config.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                          <ExternalLink size={15} />
                          Kiểm tra đường dẫn
                        </a>
                      )}
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* SCOPE */}

                  <section>
                    <SectionTitle
                      title="3. Phạm vi áp dụng"
                      description="Thiết lập cấp khảo sát, lớp và vị trí hiển thị trên menu."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField label="Cấp khảo sát">
                        <input
                          value={normalizeText(config.level)}
                          onChange={(event) =>
                            updateConfig(
                              "level",
                              event.target.value as SurveyLevel,
                            )
                          }
                          placeholder="Nhập cấp khảo sát"
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label="Vị trí menu">
                        <input
                          value={config.menu ?? ""}
                          onChange={(event) =>
                            updateConfig(
                              "menu",
                              event.target.value === "sidebar" ? "sidebar" : "main",
                            )
                          }
                          placeholder="Ví dụ: main hoặc sidebar"
                          className={inputClass}
                        />
                      </FormField>

                      <div className="sm:col-span-2">
                        <FormField label="Danh sách lớp áp dụng">
                          <textarea
                            value={config.classes ?? ""}
                            onChange={(event) =>
                              updateConfig("classes", event.target.value)
                            }
                            rows={2}
                            placeholder="Nhập danh sách lớp theo định dạng hệ thống đang sử dụng"
                            className={`${inputClass} resize-y`}
                          />
                          <p className="mt-1.5 text-xs text-slate-500">
                            Giữ nguyên định dạng danh sách lớp mà backend hiện
                            tại yêu cầu.
                          </p>
                        </FormField>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-slate-100" />

                  {/* STATUS */}

                  <section>
                    <SectionTitle
                      title="4. Trạng thái khảo sát"
                      description="Kiểm soát hoạt động và phân loại phiếu khảo sát."
                    />

                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Kích hoạt khảo sát
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Cho phép khảo sát ở trạng thái hoạt động.
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={Boolean(config.enabled)}
                          onChange={(event) =>
                            updateConfig("enabled", event.target.checked)
                          }
                          className="h-4 w-4 accent-blue-700"
                        />
                      </label>

                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Phiếu khảo sát CĐR
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Đánh dấu nếu đây là phiếu khảo sát liên quan đến
                            chuẩn đầu ra.
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={Boolean(config.isCdr)}
                          onChange={(event) =>
                            updateConfig("isCdr", event.target.checked)
                          }
                          className="h-4 w-4 accent-blue-700"
                        />
                      </label>
                    </div>
                  </section>

                  {/* ACTIONS */}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Hủy
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}

                      {saving
                        ? "Đang lưu..."
                        : isCreating
                          ? "Tạo khảo sát"
                          : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <footer className="pb-4 text-center text-xs text-slate-400">
            Quản lý khảo sát · Dữ liệu được tải từ hệ thống
          </footer>
        </div>
      </main>
    </AdminLayout>
  );
}
