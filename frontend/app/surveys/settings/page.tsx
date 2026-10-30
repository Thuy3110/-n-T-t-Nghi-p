
"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type SurveyForm = {
  id: number;
  year: string;
  code: string;
  title: string;
  description: string;
  isCdr: boolean;
  link: string;
  level: string;
  enabled: boolean;
  legacyLink: string;
  menu: string;
  classes: string;
};

const EMPTY_FORM: Omit<SurveyForm, "id"> = {
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

async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") ||
      localStorage.getItem("token")
      : null;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Yêu cầu thất bại (${response.status})`,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function normalizeSurvey(item: any): SurveyForm {
  return {
    id: Number(item.id),
    year: String(item.year ?? ""),
    code: String(item.code ?? ""),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    isCdr: Boolean(item.isCdr),
    link: String(item.link ?? ""),
    level: String(item.level ?? "LV1"),
    enabled: Boolean(item.enabled),
    legacyLink: String(item.legacyLink ?? ""),
    menu: String(item.menu ?? "main"),
    classes: String(item.classes ?? ""),
  };
}

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-10 w-full min-w-0 rounded-xl border border-transparent bg-[#eaf4ff] px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

export default function SurveysSettingsPage() {
  const [surveys, setSurveys] = useState<SurveyForm[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<SurveyForm, "id">>(
    EMPTY_FORM,
  );

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest<any>("/surveys");
      const rows: any[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const normalized = rows.map(normalizeSurvey);
      setSurveys(normalized);

      setSelectedId((current) => {
        if (current && normalized.some((item) => item.id === current)) {
          return current;
        }
        return normalized[0]?.id ?? null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách khảo sát.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  const filteredSurveys = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return surveys;

    return surveys.filter((survey) =>
      [
        survey.code,
        survey.title,
        survey.year,
        survey.level,
        survey.link,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [surveys, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSurveys.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const pageSurveys = filteredSurveys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedSurvey = surveys.find(
    (survey) => survey.id === selectedId,
  );

  const form = isCreating
    ? draft
    : selectedSurvey ?? null;

  const updateField = <K extends keyof Omit<SurveyForm, "id">>(
    key: K,
    value: Omit<SurveyForm, "id">[K],
  ) => {
    if (isCreating) {
      setDraft((previous) => ({ ...previous, [key]: value }));
      return;
    }

    if (selectedId === null) return;

    setSurveys((previous) =>
      previous.map((survey) =>
        survey.id === selectedId
          ? { ...survey, [key]: value }
          : survey,
      ),
    );
  };

  const selectSurvey = (survey: SurveyForm) => {
    setSelectedId(survey.id);
    setIsCreating(false);
    setDraft(EMPTY_FORM);
    setNotice("");
  };

  const startCreating = () => {
    setIsCreating(true);
    setSelectedId(null);
    setDraft({ ...EMPTY_FORM });
    setNotice("");
    setError("");
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setDraft(EMPTY_FORM);
    setNotice("");
    void loadSurveys();
  };

  const saveSurvey = async () => {
    if (!form) return;

    if (!form.code.trim() || !form.title.trim() || !form.year.trim()) {
      setError("Vui lòng nhập mã phiếu, tên phiếu và năm học.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      year: form.year.trim(),
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description,
      isCdr: form.isCdr,
      link: form.link,
      level: form.level,
      enabled: form.enabled,
      legacyLink: form.legacyLink,
      menu: form.menu,
      classes: form.classes,
    };

    try {
      if (isCreating) {
        const created = await apiRequest<any>("/surveys", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await loadSurveys();

        if (created?.id) {
          setSelectedId(Number(created.id));
        }

        setIsCreating(false);
        setNotice("Đã tạo phiếu khảo sát.");
      } else {
        if (selectedId === null) return;

        await apiRequest(`/surveys/${selectedId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        await loadSurveys();
        setSelectedId(selectedId);
        setNotice("Đã lưu cài đặt vào hệ thống.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu cài đặt khảo sát.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (survey: SurveyForm) => {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/surveys/${survey.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !survey.enabled }),
      });

      setSurveys((previous) =>
        previous.map((item) =>
          item.id === survey.id
            ? { ...item, enabled: !survey.enabled }
            : item,
        ),
      );

      setNotice(
        !survey.enabled
          ? "Đã bật phiếu khảo sát."
          : "Đã tắt phiếu khảo sát.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái phiếu.",
      );
    }
  };

  const deleteSurvey = async () => {
    if (isCreating || selectedId === null) {
      cancelEditing();
      return;
    }

    if (
      !window.confirm(
        "Bạn có chắc muốn xóa phiếu khảo sát này? Dữ liệu liên quan có thể bị xóa theo cấu hình cơ sở dữ liệu.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/surveys/${selectedId}`, {
        method: "DELETE",
      });

      setSurveys((previous) =>
        previous.filter((survey) => survey.id !== selectedId),
      );
      setSelectedId(null);
      setIsCreating(false);
      setNotice("Đã xóa phiếu khảo sát.");
      await loadSurveys();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa phiếu khảo sát.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openSurvey = (survey: SurveyForm) => {
    const url = survey.link.trim();

    if (!url) {
      setNotice("Phiếu này chưa được cấu hình đường dẫn.");
      return;
    }

    try {
      const normalizedUrl = /^https?:\/\//i.test(url)
        ? url
        : `${window.location.origin}/${url.replace(/^\/+/, "")}`;

      window.open(normalizedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError("Đường dẫn phiếu khảo sát không hợp lệ.");
    }
  };

  const printPage = () => window.print();

  const firstRecord =
    filteredSurveys.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastRecord = Math.min(
    currentPage * pageSize,
    filteredSurveys.length,
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-white text-slate-800">
        {/* Tiêu đề trang */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#18232c]">
              Cài đặt khảo sát
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý cấu hình và phân phối các biểu mẫu khảo sát ý kiến khách hàng.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>SDC Portal</span>
            <span>›</span>
            <span>Cài đặt hệ thống</span>
            <span>›</span>
            <span className="text-sky-800">Cài đặt KS</span>
          </div>
        </div>

        {/* Thông báo */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {/* Hai khu vực giống bố cục mẫu */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.95fr)]">
          {/* Danh sách phiếu */}
          <section className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
              <h2 className="max-w-[150px] text-base font-semibold leading-6 text-[#18232c]">
                Danh sách Cài đặt khảo sát chung
              </h2>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:max-w-[340px]">
                <div className="relative min-w-0 flex-1">
                  <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ⌕
                  </Icon>
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Tìm mã phiếu, tên..."
                    className="h-10 w-full rounded-xl bg-[#eaf4ff] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div className="flex h-12 items-center gap-2 rounded-xl bg-[#eaf4ff] px-3 text-xs text-slate-600">
                  <span>Hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="w-10 bg-transparent font-semibold outline-none"
                    aria-label="Số bản ghi mỗi trang"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[530px] table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <th className="w-[58px] px-2 pb-4 text-center">
                      HK
                    </th>
                    <th className="w-[120px] px-3 pb-4">Mã phiếu</th>
                    <th className="w-[52px] px-2 pb-4 text-center">
                      Link
                    </th>
                    <th className="w-[66px] px-2 pb-4 text-center">
                      Level
                    </th>
                    <th className="w-[72px] px-2 pb-4 text-center">
                      Trạng thái
                    </th>
                    <th className="w-[88px] px-2 pb-4 text-center">
                      Tool
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-14 text-center text-sm text-slate-500"
                      >
                        Đang tải dữ liệu từ hệ thống...
                      </td>
                    </tr>
                  ) : pageSurveys.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center"
                      >
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                          ▤
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          {search
                            ? "Không tìm thấy phiếu khảo sát phù hợp."
                            : "Chưa có dữ liệu phiếu khảo sát."}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Dữ liệu sẽ hiển thị tại đây khi có trong hệ thống.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pageSurveys.map((survey) => {
                      const active = selectedId === survey.id;

                      return (
                        <tr
                          key={survey.id}
                          onClick={() => selectSurvey(survey)}
                          className={`group cursor-pointer border-b border-slate-100 last:border-b-0 ${active ? "bg-sky-50/50" : "hover:bg-slate-50"
                            }`}
                        >
                          <td className="py-2 text-center align-middle">
                            <div
                              className={`flex min-h-[88px] items-center justify-center rounded-l-xl px-1 text-sm font-semibold ${active
                                  ? "bg-[#d9ecff] text-sky-900"
                                  : "bg-[#eaf4ff] text-sky-800"
                                }`}
                            >
                              {survey.year || "—"}
                            </div>
                          </td>

                          <td className="px-3 py-3 align-middle">
                            <p className="break-words text-sm font-semibold text-slate-800">
                              {survey.code || "Chưa có mã"}
                            </p>
                            <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-slate-500">
                              {survey.title || "Chưa có tên phiếu"}
                            </p>
                          </td>

                          <td className="px-2 text-center align-middle">
                            <button
                              type="button"
                              title="Mở phiếu khảo sát"
                              onClick={(event) => {
                                event.stopPropagation();
                                openSurvey(survey);
                              }}
                              className="rounded-lg p-2 text-slate-600 hover:bg-sky-100 hover:text-sky-800"
                            >
                              ↗
                            </button>
                          </td>

                          <td className="px-2 text-center align-middle">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${survey.level === "LV1"
                                  ? "bg-emerald-200 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                                }`}
                            >
                              {survey.level || "—"}
                            </span>
                          </td>

                          <td className="px-2 text-center align-middle">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={survey.enabled}
                              aria-label={`Trạng thái ${survey.code}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                void toggleEnabled(survey);
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${survey.enabled
                                  ? "bg-emerald-700"
                                  : "bg-slate-300"
                                }`}
                            >
                              <span
                                className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${survey.enabled
                                    ? "translate-x-4"
                                    : "translate-x-0.5"
                                  }`}
                              />
                            </button>
                          </td>

                          <td className="px-2 py-3 align-middle">
                            <div className="flex min-h-[86px] items-center justify-center gap-1 rounded-r-xl bg-[#eaf4ff]">
                              <button
                                type="button"
                                title="Chỉnh sửa"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectSurvey(survey);
                                }}
                                className="rounded-lg px-2 py-2 text-sky-800 hover:bg-white"
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                title="Xem phiếu"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openSurvey(survey);
                                }}
                                className="rounded-lg px-2 py-2 text-slate-600 hover:bg-white"
                              >
                                ◎
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                Hiển thị {firstRecord} - {lastRecord} của{" "}
                {filteredSurveys.length} bản ghi
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="h-8 w-8 rounded-lg bg-[#eaf1f8] text-slate-600 hover:bg-sky-100 disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (number) =>
                      number === 1 ||
                      number === totalPages ||
                      Math.abs(number - currentPage) <= 1,
                  )
                  .map((number, index, numbers) => (
                    <span key={number} className="contents">
                      {index > 0 && number - numbers[index - 1] > 1 && (
                        <span className="px-1">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(number)}
                        className={`h-8 min-w-8 rounded-lg px-2 font-semibold ${currentPage === number
                            ? "bg-sky-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {number}
                      </button>
                    </span>
                  ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="h-8 w-8 rounded-lg bg-[#eaf1f8] text-slate-600 hover:bg-sky-100 disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          {/* Bảng cài đặt bên phải */}
          <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 bg-[#edf3f9] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d9e8f5] text-lg text-sky-900">
                  ⚙
                </div>
                <h2 className="text-base font-semibold text-[#18232c]">
                  Cài đặt hệ thống KSYK
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={startCreating}
                  title="Tạo phiếu khảo sát"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xl text-sky-800 shadow-sm hover:bg-sky-50"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={printPage}
                  title="In trang"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg text-slate-600 shadow-sm hover:bg-slate-50"
                >
                  ▤
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {!form ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                    ⚙
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Chưa chọn phiếu khảo sát
                  </p>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                    Chọn một phiếu ở danh sách bên trái hoặc tạo phiếu mới để cấu hình.
                  </p>
                  <button
                    type="button"
                    onClick={startCreating}
                    className="mt-5 rounded-xl bg-sky-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800"
                  >
                    + Tạo phiếu khảo sát
                  </button>
                </div>
              ) : (
                <>
                  {/* Năm học và level */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <FieldLabel>NHHK / Năm học</FieldLabel>
                      <TextInput
                        value={form.year}
                        onChange={(value) => updateField("year", value)}
                        placeholder="Ví dụ: 2024-2025"
                      />
                    </div>

                    <div className="min-w-0">
                      <FieldLabel>Level</FieldLabel>
                      <select
                        value={form.level}
                        onChange={(event) =>
                          updateField("level", event.target.value)
                        }
                        className="h-10 w-full rounded-xl bg-[#eaf4ff] px-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="LV1">LV1 - Menu Sinh viên</option>
                        <option value="LV2">LV2 - Menu Giảng viên</option>
                        <option value="LV3">LV3</option>
                      </select>
                    </div>
                  </div>

                  {/* Chọn phiếu */}
                  <div>
                    <FieldLabel>Chọn mẫu phiếu</FieldLabel>
                    <select
                      value={isCreating ? "__new__" : String(selectedId ?? "")}
                      onChange={(event) => {
                        if (event.target.value === "__new__") {
                          startCreating();
                          return;
                        }

                        const item = surveys.find(
                          (survey) =>
                            survey.id === Number(event.target.value),
                        );

                        if (item) selectSurvey(item);
                      }}
                      className="h-10 w-full rounded-xl bg-[#eaf4ff] px-4 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="">
                        — Chọn mẫu phiếu khảo sát —
                      </option>
                      {surveys.map((survey) => (
                        <option key={survey.id} value={survey.id}>
                          {survey.code} - {survey.title}
                        </option>
                      ))}
                      {isCreating && (
                        <option value="__new__">Phiếu mới</option>
                      )}
                    </select>
                  </div>

                  {isCreating && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Mã phiếu</FieldLabel>
                        <TextInput
                          value={form.code}
                          onChange={(value) => updateField("code", value)}
                          placeholder="Nhập mã phiếu"
                        />
                      </div>
                      <div>
                        <FieldLabel>Tên phiếu</FieldLabel>
                        <TextInput
                          value={form.title}
                          onChange={(value) => updateField("title", value)}
                          placeholder="Nhập tên phiếu khảo sát"
                        />
                      </div>
                    </div>
                  )}

                  {!isCreating && (
                    <div>
                      <FieldLabel>Mã phiếu</FieldLabel>
                      <TextInput
                        value={form.code}
                        onChange={(value) => updateField("code", value)}
                        placeholder="Mã phiếu"
                      />
                    </div>
                  )}

                  {!isCreating && (
                    <div>
                      <FieldLabel>Tên phiếu khảo sát</FieldLabel>
                      <TextInput
                        value={form.title}
                        onChange={(value) => updateField("title", value)}
                        placeholder="Tên phiếu khảo sát"
                      />
                    </div>
                  )}

                  {/* Link hiện tại */}
                  <div>
                    <FieldLabel>Chọn link</FieldLabel>
                    <div className="flex h-10 items-center gap-2 rounded-xl bg-[#eaf4ff] px-4">
                      <span className="text-sm text-sky-800">↗</span>
                      <input
                        value={form.link}
                        onChange={(event) =>
                          updateField("link", event.target.value)
                        }
                        placeholder="Nhập đường dẫn phiếu khảo sát"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Link hệ thống cũ */}
                  <div>
                    <FieldLabel>Chọn link (hệ thống cũ)</FieldLabel>
                    <TextInput
                      value={form.legacyLink}
                      onChange={(value) =>
                        updateField("legacyLink", value)
                      }
                      placeholder="Nhập link cũ nếu có..."
                    />
                  </div>

                  {/* Menu */}
                  <div>
                    <FieldLabel>Menu</FieldLabel>
                    <div className="flex flex-wrap gap-x-5 gap-y-3 pt-1 text-sm">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="survey-menu"
                          value="main"
                          checked={form.menu === "main"}
                          onChange={() => updateField("menu", "main")}
                          className="h-4 w-4 accent-sky-900"
                        />
                        Main Dashboard
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="survey-menu"
                          value="sidebar"
                          checked={form.menu === "sidebar"}
                          onChange={() => updateField("menu", "sidebar")}
                          className="h-4 w-4 accent-sky-900"
                        />
                        Sidebar List
                      </label>
                    </div>
                  </div>

                  {/* Lớp khảo sát */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <FieldLabel>DS lớp KS</FieldLabel>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                        Tối đa 50 lớp
                      </span>
                    </div>
                    <textarea
                      value={form.classes}
                      onChange={(event) =>
                        updateField("classes", event.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                      placeholder={"Nhập mã lớp, phân tách bằng dấu phẩy\n(vd: CNTT1, CNTT2...)"}
                      className="w-full resize-y rounded-xl bg-[#eaf4ff] px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  {/* Trạng thái */}
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-3 py-3">
                    <span className="text-sm font-medium text-slate-700">
                      Kích hoạt phiếu khảo sát
                    </span>
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(event) =>
                        updateField("enabled", event.target.checked)
                      }
                      className="h-4 w-4 accent-emerald-700"
                    />
                  </label>

                  {/* Mô tả */}
                  <div>
                    <FieldLabel>Mô tả</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      rows={2}
                      placeholder="Mô tả phiếu khảo sát (nếu có)"
                      className="w-full resize-y rounded-xl bg-[#eaf4ff] px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  {/* Nút chức năng */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveSurvey()}
                      className="min-h-12 rounded-xl bg-sky-900 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/15 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Đang lưu..." : "Lưu lại"}
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEditing}
                      className="min-h-12 rounded-xl bg-emerald-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                    >
                      Bỏ qua
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void deleteSurvey()}
                      className="min-h-12 rounded-xl bg-red-700 px-2 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
                    >
                      {isCreating ? "Hủy tạo" : "Xóa cài đặt"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          aside,
          nav,
          button {
            display: none !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
