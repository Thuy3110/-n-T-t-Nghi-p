"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FilePenLine,
  Info,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

type Method = "GT" | "TT";
type WeightValue = string | number | null;

interface MatrixEntry {
  id: number;
  courseId: number | null;
  course: {
    id: number;
    code: string;
    name: string;
    cc?: WeightValue;
    gk?: WeightValue;
    ck?: WeightValue;
    dgTrongSo?: WeightValue;
    [key: string]: unknown;
  } | null;
  cloId: number;
  clo: { id: number; code: string; description: string };
  ploId: number;
  plo: { id: number; code: string; description: string };
  level: number;
  method: Method;
  dgTrongSo?: WeightValue;
  assessmentWeight?: WeightValue;
  cc?: WeightValue;
  gk?: WeightValue;
  ck?: WeightValue;
  ccWeight?: WeightValue;
  gkWeight?: WeightValue;
  ckWeight?: WeightValue;
  weights?: {
    cc?: WeightValue;
    gk?: WeightValue;
    ck?: WeightValue;
    total?: WeightValue;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface MatrixResponse {
  major: { id: number; code: string; name: string };
  rows: MatrixEntry[];
}

interface MatrixViewRow {
  key: string;
  courseCode: string;
  courseName: string;
  cloCode: string;
  cloDescription: string;
  plos: Array<{
    code: string;
    level: number;
    dgTrongSo: WeightValue;
    cc: WeightValue;
    gk: WeightValue;
    ck: WeightValue;
  }>;
}

const levelDetails: Record<number, { code: string; label: string; style: string }> = {
  1: {
    code: "I",
    label: "Introductory",
    style: "bg-slate-200 text-slate-700",
  },
  2: {
    code: "R",
    label: "Reinforce",
    style: "bg-emerald-200 text-emerald-800",
  },
  3: {
    code: "M",
    label: "Mastery",
    style: "bg-[#1769b0] text-white",
  },
};

function IndirectCloPloMatrix() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorId = searchParams.get("majorId") ?? "";
  const cohortValue = searchParams.get("cohort") ?? "";
  const cohortYear =
    cohortValue.match(/\d{4}/)?.[0] ??
    searchParams.get("cohortYear") ??
    String(new Date().getFullYear());
  const parsedMajorId = Number(majorId);

  const [matrix, setMatrix] = useState<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatrix() {
      if (
        !majorId ||
        !Number.isInteger(parsedMajorId) ||
        parsedMajorId <= 0
      ) {
        setError("Thiếu hoặc sai mã ngành. Hãy mở ma trận từ danh sách ngành.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/matrices/clo-plo/${parsedMajorId}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            `Không tải được ma trận CLO–PLO (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();
        if (
          data === null ||
          typeof data !== "object" ||
          !("major" in data) ||
          !("rows" in data) ||
          !Array.isArray(data.rows)
        ) {
          throw new Error("API không trả về dữ liệu ma trận hợp lệ.");
        }

        setMatrix(data as MatrixResponse);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        console.error("Lỗi tải ma trận CLO–PLO:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải ma trận CLO–PLO."
        );
        setMatrix(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadMatrix();
    return () => controller.abort();
  }, [majorId, parsedMajorId]);

  const visibleRows = useMemo(() => {
    if (!matrix) return [];

    const groups = new Map<string, MatrixViewRow>();
    for (const entry of matrix.rows) {
      if (entry.method !== "GT") continue;

      const key = `${entry.courseId ?? "unassigned"}:${entry.cloId}`;
      const existing = groups.get(key);
      const weights = entry.weights;
      const readWeight = (...keys: string[]): WeightValue => {
        for (const key of keys) {
          const value =
            entry[key] ??
            entry.course?.[key] ??
            weights?.[key as keyof NonNullable<MatrixEntry["weights"]>];
          if (typeof value === "string" || typeof value === "number") {
            return value;
          }
        }
        return null;
      };
      const cc = readWeight("cc", "CC", "ccWeight", "cc_weight");
      const gk = readWeight("gk", "GK", "gkWeight", "gk_weight");
      const ck = readWeight(
        "ck",
        "CK",
        "thi",
        "THI",
        "ckWeight",
        "ck_weight"
      );
      const dgTrongSo = readWeight(
        "dgTrongSo",
        "assessmentWeight",
        "DG_TRONGSO",
        "dg_trongso",
        "totalWeight",
        "total"
      );
      const plo = {
        code: entry.plo?.code ?? `PLO ${entry.ploId}`,
        level: entry.level,
        dgTrongSo,
        cc,
        gk,
        ck,
      };

      if (existing) {
        existing.plos.push(plo);
      } else {
        groups.set(key, {
          key,
          courseCode: entry.course?.code ?? "—",
          courseName: entry.course?.name ?? "Chưa gán học phần",
          cloCode: entry.clo?.code ?? `CLO ${entry.cloId}`,
          cloDescription: entry.clo?.description ?? "",
          plos: [plo],
        });
      }
    }

    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return [...groups.values()]
      .map((row) => ({
        ...row,
        plos: row.plos.sort((a, b) =>
          a.code.localeCompare(b.code, "vi", { numeric: true })
        ),
      }))
      .filter((row) => {
        if (!normalizedQuery) return true;
        return [
          row.courseCode,
          row.courseName,
          row.cloCode,
          row.cloDescription,
          ...row.plos.map((plo) => plo.code),
        ]
          .join(" ")
          .toLocaleLowerCase("vi")
          .includes(normalizedQuery);
      })
      .sort((a, b) =>
        `${a.courseCode}-${a.cloCode}`.localeCompare(
          `${b.courseCode}-${b.cloCode}`,
          "vi",
          { numeric: true }
        )
      );
  }, [matrix, query]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visibleRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function exportExcel() {
    if (!matrix) return;

    const exportRows = visibleRows.flatMap((row) =>
      row.plos.map((plo) => ({
        "Mã học phần": row.courseCode,
        "Tên học phần": row.courseName,
        CLO: row.cloCode,
        "Mô tả CLO": row.cloDescription,
        "PLO liên kết": plo.code,
        "ĐG trọng số (CC-GK-CK)": formatWeight(plo.dgTrongSo),
        CC: formatWeight(plo.cc),
        GK: formatWeight(plo.gk),
        CK: formatWeight(plo.ck),
        "Mức đóng góp": levelDetails[plo.level]?.code ?? "—",
      }))
    );
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ma trận CLO-PLO");
    XLSX.writeFile(
      workbook,
      `Ma_tran_CLO_PLO_${matrix.major.code}_Khoa_${cohortYear}.xlsx`
    );
  }

  function formatWeight(value: WeightValue) {
    return value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  }

  function editMatrix() {
    const params = new URLSearchParams({
      majorId,
      cohortYear,
    });
    router.push(`/assessments/indirect/matrix/clo-plo?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-5 py-7 font-sans sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <button
                type="button"
                onClick={() => router.push("/assessments/indirect/matrix")}
                className="transition hover:text-slate-700"
              >
                Đào tạo
              </button>
              <span>›</span>
              <button
                type="button"
                onClick={() => router.push("/assessments/indirect/matrix")}
                className="transition hover:text-slate-700"
              >
                Ma trận (GT)
              </button>
              <span>›</span>
              <span className="text-[#165aa7]">
                Khóa {cohortYear}
                {matrix?.major.code ? ` - Ngành ${matrix.major.code}` : ""}
              </span>
            </div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900">
              Xem Ma trận CLO–PLO
            </h1>
            {matrix && (
              <p className="mt-1 text-sm text-slate-500">
                {matrix.major.code} · {matrix.major.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push("/assessments/indirect/matrix")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Danh sách ma trận
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_10px_35px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <label className="relative min-w-[230px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm kiếm môn học hoặc mã CLO/PLO..."
                aria-label="Tìm kiếm môn học hoặc mã CLO/PLO"
                className="h-10 w-full rounded-lg border border-transparent bg-[#EAF4FE] pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={editMatrix}
              disabled={!matrix}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#EAF4FE] px-4 text-sm font-bold text-[#165aa7] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilePenLine size={15} />
              Sửa ma trận
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={!matrix || visibleRows.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-100 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={() => router.push("/assessments/indirect/matrix")}
              aria-label="Đóng ma trận"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="bg-[#F4F8FD] text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Mã MH</th>
                  <th className="px-4 py-4">CLO</th>
                  <th className="px-4 py-4">PLOI Mapped</th>
                  <th className="px-4 py-4">ĐG trọng số (CC-GK-CK)</th>
                  <th className="px-3 py-4 text-center">CC</th>
                  <th className="px-3 py-4 text-center">GK</th>
                  <th className="px-3 py-4 text-center">CK</th>
                  <th className="px-5 py-4">MĐG (Level)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Đang tải ma trận từ dữ liệu ngành...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      {error
                        ? "Không thể hiển thị ma trận khi tải dữ liệu thất bại."
                        : "Không có liên kết CLO–PLO phù hợp với bộ lọc."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.key}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-[#165aa7]">
                          {row.courseCode}
                        </div>
                        <div className="mt-1 max-w-48 text-xs leading-5 text-slate-500">
                          {row.courseName}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="text-sm font-semibold text-slate-700"
                          title={row.cloDescription}
                        >
                          {row.cloCode}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.plos.map((plo, index) => (
                            <span
                              key={`${row.key}-${plo.code}-${index}`}
                              title={`${plo.code} · ${
                                levelDetails[plo.level]?.label ?? "Chưa xác định"
                              }`}
                              className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"
                            >
                              {plo.code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {formatWeight(
                          [...new Set(row.plos.map((plo) => plo.dgTrongSo))]
                            .filter((value) => value !== null)
                            .join(" / ") || null
                        )}
                      </td>
                      {(["cc", "gk", "ck"] as const).map((weightKey) => (
                        <td
                          key={`${row.key}-${weightKey}`}
                          className="px-3 py-4 text-center text-sm font-medium text-slate-600"
                        >
                          {formatWeight(
                            [...new Set(row.plos.map((plo) => plo[weightKey]))]
                              .filter((value) => value !== null)
                              .join(" / ") || null
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(row.plos.map((plo) => plo.level))]
                            .sort((a, b) => a - b)
                            .map((level) => {
                              const detail = levelDetails[level];
                              return (
                                <span
                                  key={`${row.key}-${level}`}
                                  title={detail?.label ?? "Mức chưa xác định"}
                                  className="inline-flex items-center gap-2"
                                >
                                  <span
                                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-extrabold ${
                                      detail?.style ??
                                      "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {level}
                                  </span>
                                  <span className="text-xs text-slate-600">
                                    {detail?.label ?? "Chưa xác định"}
                                  </span>
                                </span>
                              );
                            })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#F8FBFE] px-5 py-3 text-xs text-slate-600 sm:px-6">
            <span>
              Hiển thị {pageRows.length} / {visibleRows.length} dòng ma trận
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                aria-label="Trang trước"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-[#07508d] px-2 font-bold text-white">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                disabled={currentPage >= pageCount}
                aria-label="Trang sau"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </footer>
        </section>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(260px,0.65fr)_minmax(0,1.35fr)]">
          <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#07508d]">
              Mức độ đóng góp (MĐG)
            </h2>
            <div className="mt-4 space-y-3">
              {Object.entries(levelDetails).map(([level, detail]) => (
                <div
                  key={level}
                  className="flex items-center gap-3 text-sm text-slate-600"
                >
                  <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs font-extrabold ${detail.style}`}
                  >
                    {level}
                  </span>
                  <span>
                    {detail.code} -{" "}
                    {detail.code === "I"
                      ? "Introductory (Giới thiệu)"
                      : detail.code === "R"
                        ? "Reinforce (Tăng cường)"
                        : "Mastery (Thành thạo)"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-2">
              <Info size={19} className="mt-0.5 shrink-0 text-[#07508d]" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#07508d]">
                  Ghi chú đánh giá
                </h2>
                <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="text-slate-800">CC:</strong>{" "}
                      Chuyên cần.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="text-slate-800">GK:</strong>{" "}
                      Giữa kỳ.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="text-slate-800">CK:</strong>{" "}
                      Cuối kỳ.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="text-slate-800">PLOi:</strong>{" "}
                      Program Learning Outcome.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function IndirectCloPloMatrixPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">
          Đang mở ma trận CLO–PLO...
        </div>
      }
    >
      <IndirectCloPloMatrix />
    </Suspense>
  );
}
