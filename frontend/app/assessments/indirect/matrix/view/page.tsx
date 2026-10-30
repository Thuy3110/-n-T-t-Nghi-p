"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Grid3X3,
  Pencil,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number | null;
}

interface Plo {
  id: number;
  code: string;
  description: string;
}

interface MajorDetails {
  id: number;
  majorCode: string;
  majorName: string;
  code?: string;
  name?: string;
  courses: Course[];
  plos: Plo[];
  matrixData: string | null;
  enabledCoursesData: string | null;
}

type MatrixMode = "view" | "assessment" | "mapping";

interface MatrixLevel {
  value: number;
  code: string;
  label: string;
  color: string;
  hover: string;
}

const assessmentLevels: MatrixLevel[] = [
  { value: 1, code: "1", label: "Nhận biết / Biết", color: "bg-blue-100 text-blue-800", hover: "hover:bg-blue-200" },
  { value: 2, code: "2", label: "Hiểu / Áp dụng", color: "bg-blue-300 text-blue-950", hover: "hover:bg-blue-400" },
  { value: 3, code: "3", label: "Phân tích / Sáng tạo", color: "bg-blue-700 text-white", hover: "hover:bg-blue-800" },
];

const mappingLevels: MatrixLevel[] = [
  { value: 1, code: "I", label: "Introduce · Giới thiệu", color: "bg-orange-600 text-white", hover: "hover:bg-orange-700" },
  { value: 2, code: "R", label: "Reinforce · Củng cố", color: "bg-amber-400 text-white", hover: "hover:bg-amber-500" },
  { value: 3, code: "M", label: "Mastery · Thành thạo", color: "bg-emerald-600 text-white", hover: "hover:bg-emerald-700" },
  { value: 4, code: "A", label: "Assessment · Đánh giá", color: "bg-blue-700 text-white", hover: "hover:bg-blue-800" },
];

function MatrixViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorId = searchParams.get("majorId") ?? "";
  const yearFromUrl = Number(searchParams.get("cohortYear"));
  const cohortYear = Number.isInteger(yearFromUrl) && yearFromUrl >= 1900 && yearFromUrl <= 2200
    ? yearFromUrl
    : new Date().getFullYear();
  const invalidMajorId = !majorId || !Number.isInteger(Number(majorId)) || Number(majorId) <= 0;
  const [major, setMajor] = useState<MajorDetails | null>(null);
  const [mode, setMode] = useState<MatrixMode>(() =>
    searchParams.get("mode") === "assessment" ? "assessment" : "view",
  );
  const [matrixValues, setMatrixValues] = useState<Record<string, number | null>>({});
  const [savedMatrixValues, setSavedMatrixValues] = useState<Record<string, number | null>>({});
  const [enabledCourses, setEnabledCourses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (invalidMajorId) return;
    const controller = new AbortController();

    async function loadMatrix() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/majors/${majorId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Không tải được ma trận ngành (HTTP ${response.status}).`);
        const data = await response.json() as MajorDetails;
        let parsedMatrix: Record<string, number | null> = {};
        let parsedEnabledCourses: Record<string, boolean> = {};
        try {
          parsedMatrix = data.matrixData ? JSON.parse(data.matrixData) as Record<string, number | null> : {};
          parsedEnabledCourses = data.enabledCoursesData
            ? JSON.parse(data.enabledCoursesData) as Record<string, boolean>
            : {};
        } catch {
          throw new Error("Dữ liệu ma trận/ngành bị lỗi định dạng. Hãy kiểm tra cấu hình đã lưu.");
        }
        setMatrixValues(parsedMatrix);
        setSavedMatrixValues(parsedMatrix);
        setEnabledCourses(parsedEnabledCourses);
        setMajor(data);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Không thể tải ma trận.");
        setMajor(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadMatrix();
    return () => controller.abort();
  }, [invalidMajorId, majorId]);

  const courses = useMemo(
    () => [...(major?.courses ?? [])].sort((a, b) => a.code.localeCompare(b.code, "vi")),
    [major],
  );
  const hasUnsavedChanges = JSON.stringify(matrixValues) !== JSON.stringify(savedMatrixValues);
  const mappedPloCount = major?.plos.filter((plo) =>
    courses.some((course) => {
      const value = matrixValues[`${course.id}-${plo.id}`] ?? matrixValues[`${course.code}-${plo.code}`];
      return value !== null && value !== undefined;
    }),
  ).length ?? 0;
  const coverage = major?.plos.length
    ? Math.round((mappedPloCount / major.plos.length) * 100)
    : 0;

  function getCellValue(course: Course, plo: Plo) {
    const idKey = `${course.id}-${plo.id}`;
    if (matrixValues[idKey] !== undefined) return matrixValues[idKey];
    return matrixValues[`${course.code}-${plo.code}`] ?? null;
  }

  function isCourseEnabled(course: Course) {
    return enabledCourses[course.code] ?? enabledCourses[String(course.id)] ?? true;
  }

  function updateCell(course: Course, plo: Plo, value: number | null) {
    setMatrixValues((current) => ({
      ...current,
      [`${course.id}-${plo.id}`]: value,
      [`${course.code}-${plo.code}`]: value,
    }));
    setActiveCell(null);
    setSavedMessage("");
  }

  async function saveMatrix() {
    if (!major || saving || !hasUnsavedChanges) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch(`${API_BASE}/majors/${major.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixData: JSON.stringify(matrixValues),
          enabledCoursesData: major.enabledCoursesData,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Không lưu được ma trận (HTTP ${response.status}). ${detail}`);
      }
      setSavedMatrixValues(matrixValues);
      setSavedMessage("Đã lưu ma trận CĐR.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu ma trận.");
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setMatrixValues(savedMatrixValues);
    setActiveCell(null);
    setSavedMessage("");
    setError("");
  }

  function changeMode(nextMode: MatrixMode) {
    if (mode !== "view" && hasUnsavedChanges) {
      setError("Lưu hoặc bỏ thay đổi trước khi chuyển chế độ.");
      return;
    }
    setError("");
    setSavedMessage("");
    setActiveCell(null);
    setMode(nextMode);
  }

  function exportMatrix() {
    if (!major) return;
    const rows = courses.map((course) => {
      const row: Record<string, string | number> = {
        HK: course.semester ?? "",
        "Mã học phần": course.code,
        "Học phần": course.name,
      };
      for (const plo of major.plos) {
        const value = isCourseEnabled(course) ? getCellValue(course, plo) : null;
        row[plo.code] = mode === "mapping" && value
          ? mappingLevels.find((level) => level.value === value)?.code ?? value
          : value ?? "";
      }
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ma tran CDR");
    XLSX.writeFile(workbook, `Ma-tran-${major.majorCode}-K${cohortYear}.xlsx`);
  }

  const majorCode = major?.majorCode ?? major?.code ?? "—";
  const majorName = major?.majorName ?? major?.name ?? "";
  const visibleError = invalidMajorId ? "Thiếu hoặc sai mã ngành trên đường dẫn." : error;
  const isMapping = mode === "mapping";
  const activeLevels = isMapping ? mappingLevels : assessmentLevels;

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-6 font-sans text-slate-800 sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Grid3X3 size={17} />
              Ma trận chuẩn đầu ra
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Ma trận CĐR</h1>
            <p className="mt-2 text-sm text-slate-500">
              {majorCode} {majorName && `· ${majorName}`} <span className="mx-2">|</span> Khóa {cohortYear}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <button
              type="button"
              onClick={exportMatrix}
              disabled={!major || courses.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </header>

        {visibleError && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {visibleError}
          </div>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Độ phủ PLO</p>
              <p className="mt-2 text-4xl font-bold text-emerald-700">{loading ? "…" : `${coverage}%`}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${coverage}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{mappedPloCount} / {major?.plos.length ?? 0} PLO có học phần đóng góp</p>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Chú thích mức độ</h2>
              <div className="space-y-3">
                {activeLevels.map((level) => (
                  <div key={level.value} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${level.color}`}>
                      {level.code}
                    </span>
                    <span className="text-xs text-slate-600">{level.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold">
                  {mode === "view" ? "Ma trận CĐR" : mode === "assessment" ? "Đánh giá ma trận CĐR" : "Mapping PLO – Học phần"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === "view"
                    ? "Ma trận học phần và mức đóng góp PLO đã lưu"
                    : mode === "assessment"
                      ? "Nhấn vào ô để chọn mức đánh giá từ 1 đến 3"
                      : "Nhấn vào ô để chọn mức mapping I / R / M / A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Chế độ ma trận">
                  <button
                    type="button"
                    onClick={() => changeMode("view")}
                    aria-pressed={mode === "view"}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${mode === "view" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Eye size={14} /> Xem ma trận
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMode("assessment")}
                    aria-pressed={mode === "assessment"}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${mode === "assessment" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Pencil size={14} /> Đánh giá
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMode("mapping")}
                    aria-pressed={mode === "mapping"}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${mode === "mapping" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <Grid3X3 size={14} /> Mapping
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  Làm mới
                </button>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <table className="w-max table-fixed border-separate border-spacing-0">
                <colgroup>
                  <col style={{ width: 72 }} />
                  <col style={{ width: 128 }} />
                  <col style={{ width: 220 }} />
                  {(major?.plos ?? []).map((plo) => <col key={plo.id} style={{ width: 82 }} />)}
                </colgroup>
                <thead>
                  <tr className="bg-[#eaf3fc] text-xs font-semibold text-slate-700">
                    <th className="bg-[#eaf3fc] px-2 py-4 text-left">HK</th>
                    <th className="px-2 py-4 text-left">Mã học phần</th>
                    <th className="px-2 py-4 text-left">Học phần</th>
                    {(major?.plos ?? []).map((plo) => (
                      <th key={plo.id} className="px-1 py-4 text-center" title={plo.description}>
                        <span className="block">{plo.code}</span>
                        <span className="mt-1 block break-words text-[9px] font-normal text-slate-500">{plo.description}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={Math.max(3, (major?.plos.length ?? 0) + 3)} className="px-6 py-16 text-center text-sm text-slate-500">Đang tải dữ liệu ma trận...</td></tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(3, (major?.plos.length ?? 0) + 3)} className="px-6 py-16 text-center">
                        <p className="font-semibold text-slate-700">Ngành này chưa có học phần trong dữ liệu.</p>
                        <p className="mt-2 text-sm text-slate-500">Thêm học phần vào ngành để hiển thị ma trận.</p>
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => {
                      const enabled = isCourseEnabled(course);
                      return (
                        <tr key={course.id} className={`group border-t border-slate-100 text-sm ${enabled ? "hover:bg-slate-50/70" : "bg-slate-50/60 text-slate-400"}`}>
                          <td className={`px-2 py-3 font-semibold text-slate-700 ${enabled ? "bg-white group-hover:bg-slate-50" : "bg-slate-50"}`}>
                            {course.semester ? `HK ${course.semester}` : <span className="font-normal text-slate-400">Chưa có HK</span>}
                          </td>
                          <td className={`break-words px-2 py-3 font-semibold ${enabled ? "text-blue-700" : "text-slate-400"}`}>{course.code}</td>
                          <td className="break-words px-2 py-3">{course.name}</td>
                          {major?.plos.map((plo) => {
                            const value = enabled ? getCellValue(course, plo) : null;
                            const cellId = `${course.id}-${plo.id}`;
                            const selectedLevel = activeLevels.find((level) => level.value === value);
                            const displayValue = isMapping && selectedLevel
                              ? selectedLevel.code
                              : value;
                            return (
                              <td key={plo.id} className="relative px-1 py-3 text-center">
                                {mode === "view" ? (
                                  <span
                                    title={value ? (assessmentLevels.find((level) => level.value === value)?.label ?? "Mức chưa xác định") : "Chưa đánh giá"}
                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold ${
                                      value === 1 ? "bg-blue-100 text-blue-800"
                                        : value === 2 ? "bg-blue-300 text-blue-950"
                                          : value === 3 ? "bg-blue-700 text-white"
                                            : value === 4 ? "bg-slate-700 text-white"
                                              : "text-slate-300"
                                    }`}
                                  >
                                    {value ?? "—"}
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      disabled={!enabled}
                                      aria-label={`${course.code} – ${plo.code}: ${value ?? "chưa gán"}, nhấn để chỉnh sửa`}
                                      aria-expanded={activeCell === cellId}
                                      onClick={() => setActiveCell((current) => current === cellId ? null : cellId)}
                                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                                        selectedLevel?.color ?? "border border-dashed border-slate-200 text-slate-300 hover:border-blue-300 hover:text-blue-500"
                                      } disabled:cursor-not-allowed`}
                                      title={selectedLevel?.label ?? "Chọn mức"}
                                    >
                                      {displayValue ?? "+"}
                                    </button>
                                    {activeCell === cellId && enabled && (
                                      <div className={`absolute left-1/2 top-1/2 z-30 min-w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-blue-200 bg-white p-2 shadow-xl ${isMapping ? "grid grid-cols-2 gap-1" : "flex gap-1"}`}>
                                        {activeLevels.map((level) => (
                                          <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => updateCell(course, plo, level.value)}
                                            title={level.label}
                                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold ${level.color} ${level.hover}`}
                                          >
                                            {level.code}
                                          </button>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => updateCell(course, plo, null)}
                                          className="col-span-full mt-1 w-full rounded-lg py-1 text-[10px] font-semibold uppercase text-red-600 hover:bg-red-50"
                                        >
                                          Xóa liên kết
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {!loading && major && courses.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-[#eef5fc] text-xs font-semibold text-slate-700">
                      <td colSpan={3} className="bg-[#eef5fc] px-4 py-4">Thống kê độ phủ (SLHP)</td>
                      {major.plos.map((plo) => {
                        const count = courses.filter((course) => isCourseEnabled(course) && getCellValue(course, plo) !== null).length;
                        return <td key={plo.id} className="px-3 py-4 text-center">{count || "×"}</td>;
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              <span>{courses.length} học phần · {major?.plos.length ?? 0} PLO</span>
              <span>{mode === "mapping" ? "Mapping: I / R / M / A" : "Đánh giá: mức 1–3 theo màu trong chú thích"}</span>
            </div>
          </section>
        </div>

        {mode !== "view" && (hasUnsavedChanges || savedMessage) && (
          <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-xl sm:inset-x-8">
            <div className="flex items-center gap-2 text-sm">
              {hasUnsavedChanges
                ? <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                : <CheckCircle2 size={17} className="text-emerald-600" />}
              <span className="text-slate-600">{hasUnsavedChanges ? "Có thay đổi chưa lưu trong ma trận." : savedMessage}</span>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={14} /> Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={() => void saveMatrix()}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Đang lưu..." : "Lưu lại"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function MatrixViewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f5f8fc] p-8 text-slate-500">Đang mở ma trận CĐR...</main>}>
      <MatrixViewContent />
    </Suspense>
  );
}
