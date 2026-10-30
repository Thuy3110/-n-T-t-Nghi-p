"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  FilePenLine,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

type MatrixMethod = "GT" | "TT";

interface MatrixCourse {
  id: number;
  code: string;
  name: string;
}

interface MatrixClo {
  id: number;
  code: string;
  description: string;
}

interface MatrixPlo {
  id: number;
  code: string;
  description: string;
}

interface CloPloRow {
  id?: number;
  courseId: number | null;
  cloId: number;
  ploId: number;
  level: number;
  method: MatrixMethod;
}

interface CloPloData {
  major: { id: number; code: string; name: string };
  courses: MatrixCourse[];
  clos: MatrixClo[];
  plos: MatrixPlo[];
  rows: Array<{
    id: number;
    courseId: number | null;
    cloId: number;
    ploId: number;
    level: number;
    method: MatrixMethod;
  }>;
}

function CloPloMatrixEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorId = Number(searchParams.get("majorId"));
  const requestedYear = Number(searchParams.get("cohortYear"));
  const cohortYear =
    Number.isInteger(requestedYear) && requestedYear >= 1900
      ? requestedYear
      : new Date().getFullYear();

  const [matrixData, setMatrixData] = useState<CloPloData | null>(null);
  const [rows, setRows] = useState<CloPloRow[]>([]);
  const [savedRows, setSavedRows] = useState<CloPloRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [showCloEditor, setShowCloEditor] = useState(false);
  const [editingCloId, setEditingCloId] = useState<number | null>(null);
  const [cloDescriptionDraft, setCloDescriptionDraft] = useState("");
  const [savingClo, setSavingClo] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMatrix = useCallback(async (signal: AbortSignal) => {
    if (!Number.isInteger(majorId) || majorId <= 0) {
      setError("Thiếu hoặc sai mã ngành trên đường dẫn.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/matrices/clo-plo/${majorId}`,
        { cache: "no-store", signal },
      );
      if (!response.ok) {
        throw new Error(`Không tải được ma trận CLO–PLO (HTTP ${response.status}).`);
      }
      const data = (await response.json()) as CloPloData;
      const loadedRows = data.rows.map((row) => ({
        courseId: row.courseId,
        cloId: row.cloId,
        ploId: row.ploId,
        level: row.level,
        method: row.method,
      }));
      setMatrixData(data);
      setRows(loadedRows);
      setSavedRows(loadedRows);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải ma trận CLO–PLO.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [majorId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadMatrix(controller.signal));
    return () => controller.abort();
  }, [loadMatrix]);

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(savedRows);

  function updateRow(index: number, patch: Partial<CloPloRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
    setNotice("");
  }

  function addRow() {
    if (!matrixData || matrixData.clos.length === 0 || matrixData.plos.length === 0) {
      setError("Ngành này chưa có CLO hoặc PLO trong cơ sở dữ liệu.");
      return;
    }
    setRows((current) => [
      ...current,
      {
        courseId: matrixData.courses[0]?.id ?? null,
        cloId: matrixData.clos[0].id,
        ploId: matrixData.plos[0].id,
        level: 1,
        method: "TT",
      },
    ]);
    setError("");
    setNotice("");
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setNotice("");
  }

  function discardChanges() {
    setRows(savedRows);
    setError("");
    setNotice("");
  }

  async function saveMatrix() {
    if (!matrixData || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/matrices/clo-plo/${majorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            ...row,
            ...(row.courseId === null ? { courseId: undefined } : {}),
          })),
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `Không lưu được ma trận (HTTP ${response.status}). ${detail}`,
        );
      }
      const data = (await response.json()) as CloPloData;
      const updatedRows = data.rows.map((row) => ({
        courseId: row.courseId,
        cloId: row.cloId,
        ploId: row.ploId,
        level: row.level,
        method: row.method,
      }));
      setMatrixData(data);
      setRows(updatedRows);
      setSavedRows(updatedRows);
      setNotice("Đã lưu ma trận CLO–PLO.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu ma trận.",
      );
    } finally {
      setSaving(false);
    }
  }

  function courseName(courseId: number | null) {
    return matrixData?.courses.find((course) => course.id === courseId)?.code ?? "";
  }

  function cloData(cloId: number) {
    return matrixData?.clos.find((clo) => clo.id === cloId);
  }

  function startCloEdit(clo: MatrixClo) {
    setEditingCloId(clo.id);
    setCloDescriptionDraft(clo.description);
    setError("");
    setNotice("");
  }

  async function saveCloDescription() {
    if (editingCloId === null || !matrixData || savingClo) return;
    const description = cloDescriptionDraft.trim();
    if (!description) {
      setError("Nội dung CLO không được để trống.");
      return;
    }

    setSavingClo(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE}/clos/${editingCloId}/description`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `Không cập nhật được nội dung CLO (HTTP ${response.status}). ${detail}`,
        );
      }
      const updatedClo = (await response.json()) as MatrixClo & {
        majorId: number;
      };
      setMatrixData((current) =>
        current
          ? {
              ...current,
              clos: current.clos.map((clo) =>
                clo.id === updatedClo.id
                  ? { ...clo, description: updatedClo.description }
                  : clo,
              ),
            }
          : current,
      );
      setEditingCloId(null);
      setNotice(`Đã cập nhật nội dung ${updatedClo.code}.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể cập nhật nội dung CLO.",
      );
    } finally {
      setSavingClo(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#07508d]"
          >
            <ArrowLeft size={16} />
            Quản lý ma trận
          </button>
          <button
            type="button"
            onClick={() => setViewOnly((current) => !current)}
            disabled={!matrixData || loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#07508d] hover:bg-blue-50 disabled:opacity-50"
          >
            <Eye size={15} />
            {viewOnly ? "Quay lại chỉnh sửa" : "Xem ma trận CLO-PLO"}
          </button>
          <button
            type="button"
            onClick={() => setShowCloEditor((current) => !current)}
            disabled={!matrixData || loading || viewOnly}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#07508d] hover:bg-blue-50 disabled:opacity-50"
          >
            <FilePenLine size={15} />
            {showCloEditor ? "Đóng quản lý CLO" : "Sửa nội dung CLO"}
          </button>
        </div>

        <section className="flex min-h-[calc(100vh-190px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h1 className="text-lg font-bold text-slate-800">
              {viewOnly ? "Ma trận CLO-PLO" : "Sửa Ma trận CLO-PLO"}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {matrixData
                ? `Khóa ${cohortYear} - Ngành ${matrixData.major.code} · ${matrixData.major.name}`
                : `Khóa ${cohortYear}`}
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-7"
            >
              <Check size={15} />
              {notice}
            </div>
          )}

          {showCloEditor && matrixData && (
            <section className="mx-5 mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:mx-7">
              <h2 className="mb-3 text-sm font-bold text-slate-800">
                Nội dung chuẩn đầu ra học phần
              </h2>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {matrixData.clos.map((clo) => (
                  <div
                    key={clo.id}
                    className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-100 bg-white p-3"
                  >
                    <span className="min-w-14 pt-2 text-xs font-bold text-slate-700">
                      {clo.code}
                    </span>
                    {editingCloId === clo.id ? (
                      <textarea
                        aria-label={`Nội dung ${clo.code}`}
                        value={cloDescriptionDraft}
                        onChange={(event) =>
                          setCloDescriptionDraft(event.target.value)
                        }
                        rows={2}
                        className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#07508d]"
                      />
                    ) : (
                      <p className="min-w-[220px] flex-1 py-2 text-xs leading-5 text-slate-600">
                        {clo.description}
                      </p>
                    )}
                    {editingCloId === clo.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void saveCloDescription()}
                          disabled={savingClo}
                          className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          aria-label={`Lưu nội dung ${clo.code}`}
                          title="Lưu nội dung"
                        >
                          {savingClo ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <Check size={15} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCloId(null)}
                          disabled={savingClo}
                          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                          aria-label={`Hủy sửa ${clo.code}`}
                          title="Hủy"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCloEdit(clo)}
                        className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
                        aria-label={`Sửa nội dung ${clo.code}`}
                        title={`Sửa nội dung ${clo.code}`}
                      >
                        <FilePenLine size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex-1 overflow-x-auto px-2 sm:px-4">
            <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[#e6f0f9] text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <th className="w-[14%] px-4 py-4">Mã MH</th>
                  <th className="w-[10%] px-4 py-4">CLO</th>
                  <th className="w-[31%] px-4 py-4">CLO_DESC</th>
                  <th className="w-[12%] px-4 py-4">PLO</th>
                  <th className="w-[11%] px-4 py-4 text-center">Mức đóng góp</th>
                  <th className="w-[14%] px-4 py-4 text-center">Phương thức ĐG</th>
                  <th className="w-[8%] px-4 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-slate-500">
                      <LoaderCircle
                        size={20}
                        className="mx-auto mb-2 animate-spin"
                      />
                      Đang tải dữ liệu ma trận...
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr
                      key={`${row.cloId}-${row.ploId}-${index}`}
                      className="border-b border-slate-100 text-xs text-slate-700"
                    >
                      <td className="px-3 py-3">
                        {viewOnly ? (
                          courseName(row.courseId) || "—"
                        ) : (
                          <SelectField
                            ariaLabel="Mã học phần"
                            value={row.courseId ?? ""}
                            onChange={(value) =>
                              updateRow(index, {
                                courseId: value ? Number(value) : null,
                              })
                            }
                          >
                            <option value="">—</option>
                            {matrixData?.courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.code}
                              </option>
                            ))}
                          </SelectField>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {viewOnly ? (
                          cloData(row.cloId)?.code ?? "—"
                        ) : (
                          <SelectField
                            ariaLabel="CLO"
                            value={row.cloId}
                            onChange={(value) =>
                              updateRow(index, { cloId: Number(value) })
                            }
                          >
                            {matrixData?.clos.map((clo) => (
                              <option key={clo.id} value={clo.id}>
                                {clo.code}
                              </option>
                            ))}
                          </SelectField>
                        )}
                      </td>
                      <td className="px-3 py-3 leading-5 text-slate-600">
                        {cloData(row.cloId)?.description || "Chưa có mô tả CLO"}
                      </td>
                      <td className="px-3 py-3">
                        {viewOnly ? (
                          matrixData?.plos.find((plo) => plo.id === row.ploId)
                            ?.code ?? "—"
                        ) : (
                          <SelectField
                            ariaLabel="PLO"
                            value={row.ploId}
                            onChange={(value) =>
                              updateRow(index, { ploId: Number(value) })
                            }
                          >
                            {matrixData?.plos.map((plo) => (
                              <option key={plo.id} value={plo.id}>
                                {plo.code}
                              </option>
                            ))}
                          </SelectField>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {viewOnly ? (
                          ["", "I", "R", "M"][row.level] ?? row.level
                        ) : (
                          <SelectField
                            ariaLabel="Mức đóng góp"
                            value={row.level}
                            onChange={(value) =>
                              updateRow(index, { level: Number(value) })
                            }
                          >
                            <option value={1}>I</option>
                            <option value={2}>R</option>
                            <option value={3}>M</option>
                          </SelectField>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {viewOnly ? (
                          row.method
                        ) : (
                          <SelectField
                            ariaLabel="Phương thức đánh giá"
                            value={row.method}
                            onChange={(value) =>
                              updateRow(index, {
                                method: value as MatrixMethod,
                              })
                            }
                          >
                            <option value="TT">TT</option>
                            <option value="GT">GT</option>
                          </SelectField>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {!viewOnly && (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            aria-label={`Xóa dòng ma trận ${index + 1}`}
                            className="rounded-md p-2 text-orange-700 hover:bg-orange-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-sm text-slate-500"
                    >
                      Chưa có dòng ma trận CLO–PLO. Bấm “Thêm hàng” để nhập dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!viewOnly && (
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#fbfdff] px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={addRow}
                disabled={loading || !matrixData}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#07508d] px-4 text-xs font-semibold text-[#07508d] hover:bg-blue-50 disabled:opacity-50"
              >
                <Plus size={15} />
                Thêm hàng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={!hasChanges || saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <X size={14} />
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={() => void saveMatrix()}
                  disabled={!hasChanges || saving || loading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1769b0] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#07508d] disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? "Đang lưu..." : "Lưu lại"}
                </button>
              </div>
            </footer>
          )}
        </section>
    </div>
  );
}

function SelectField({
  ariaLabel,
  value,
  onChange,
  children,
}: {
  ariaLabel: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 pr-7 text-xs text-slate-700 outline-none focus:border-[#07508d]"
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </span>
  );
}

export default function CloPloMatrixPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f8fc] p-8 text-slate-500">
          Đang mở ma trận CLO–PLO...
        </main>
      }
    >
      <CloPloMatrixEditor />
    </Suspense>
  );
}
