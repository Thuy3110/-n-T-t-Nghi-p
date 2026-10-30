"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Printer,
  RotateCw,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

interface FrameworkEntry {
  id?: number;
  key: string;
  code: string;
  description: string;
  targetPercent: number | null;
  isGroupHeader: boolean;
  parentCode: string | null;
}

interface FrameworkData {
  major: { id: number; code: string; name: string };
  plos: Array<{
    id: number;
    code: string;
    description: string;
    targetPercent: number | null;
    directTargetPercent: number | null;
    isGroupHeader: boolean;
    parentId: number | null;
    parent: { code: string } | null;
  }>;
}

type AssessmentType = "direct" | "indirect";

function mapEntries(
  data: FrameworkData,
  assessmentType: AssessmentType,
): FrameworkEntry[] {
  return data.plos.map((entry) => ({
    id: entry.id,
    key: `plo-${entry.id}`,
    code: entry.code,
    description: entry.description,
    targetPercent:
      assessmentType === "direct"
        ? entry.directTargetPercent
        : entry.targetPercent,
    isGroupHeader: entry.isGroupHeader,
    parentCode: entry.parent?.code ?? null,
  }));
}

function FrameworkPageContent({
  assessmentType,
}: {
  assessmentType: AssessmentType;
}) {
  const searchParams = useSearchParams();
  const majorId = Number(searchParams.get("majorId"));
  const cohort = searchParams.get("cohort") ?? "K25-2025";
  const [data, setData] = useState<FrameworkData | null>(null);
  const [entries, setEntries] = useState<FrameworkEntry[]>([]);
  const [savedEntries, setSavedEntries] = useState<FrameworkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFramework = useCallback(async (signal: AbortSignal) => {
    if (!Number.isInteger(majorId) || majorId <= 0) {
      setError("Thiếu hoặc sai mã ngành trên đường dẫn.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/plos/major/${majorId}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) {
        throw new Error(`Không tải được khung CĐR (HTTP ${response.status}).`);
      }
      const result = (await response.json()) as FrameworkData;
      const loaded = mapEntries(result, assessmentType);
      setData(result);
      setEntries(loaded);
      setSavedEntries(loaded);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Không thể tải khung CĐR.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [assessmentType, majorId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadFramework(controller.signal));
    return () => controller.abort();
  }, [loadFramework]);

  const groups = useMemo(
    () => entries.filter((entry) => entry.isGroupHeader),
    [entries],
  );
  const visibleEntries = useMemo(() => {
    if (!expanded) return entries.filter((entry) => entry.isGroupHeader);
    return entries;
  }, [entries, expanded]);
  const measurableEntries = entries.filter(
    (entry) => !entry.isGroupHeader && entry.targetPercent !== null,
  );
  const averageTarget = measurableEntries.length
    ? measurableEntries.reduce(
        (sum, entry) => sum + (entry.targetPercent ?? 0),
        0,
      ) / measurableEntries.length
    : null;
  const hasChanges = JSON.stringify(entries) !== JSON.stringify(savedEntries);
  const invalidTargets = entries.some(
    (entry) =>
      !entry.isGroupHeader &&
      entry.targetPercent !== null &&
      (!Number.isInteger(entry.targetPercent) ||
        entry.targetPercent < 0 ||
        entry.targetPercent > 100),
  );

  function updateEntry(key: string, patch: Partial<FrameworkEntry>) {
    setEntries((current) => {
      const selected = current.find((entry) => entry.key === key);
      if (!selected) return current;
      return current.map((entry) => {
        if (entry.key === key) return { ...entry, ...patch };
        if (
          selected.isGroupHeader &&
          patch.code !== undefined &&
          entry.parentCode === selected.code
        ) {
          return { ...entry, parentCode: patch.code };
        }
        if (
          selected.isGroupHeader &&
          patch.isGroupHeader === false &&
          entry.parentCode === selected.code
        ) {
          return { ...entry, parentCode: null };
        }
        return entry;
      });
    });
    setNotice("");
  }

  function addGroup() {
    setEntries((current) => [
      ...current,
      {
        key: `new-${crypto.randomUUID()}`,
        code: "",
        description: "",
        targetPercent: null,
        isGroupHeader: true,
        parentCode: null,
      },
    ]);
    setError("");
  }

  function addOutcome(parentCode: string | null = null) {
    if (groups.length === 0) {
      setError("Hãy thêm tiêu đề nhóm trước khi thêm nội dung chuẩn đầu ra.");
      return;
    }
    const parent = parentCode ?? groups[0].code;
    if (!parent) {
      setError("Nhập mã cho tiêu đề nhóm trước khi thêm nội dung.");
      return;
    }
    setEntries((current) => [
      ...current,
      {
        key: `new-${crypto.randomUUID()}`,
        code: "",
        description: "",
        targetPercent: 75,
        isGroupHeader: false,
        parentCode: parent,
      },
    ]);
    setError("");
  }

  function removeEntry(key: string) {
    const target = entries.find((entry) => entry.key === key);
    if (!target) return;
    setEntries((current) =>
      current
        .filter((entry) => entry.key !== key)
        .map((entry) =>
          target.isGroupHeader && entry.parentCode === target.code
            ? { ...entry, parentCode: null }
            : entry,
        ),
    );
    setError("");
  }

  function discardChanges() {
    setEntries(savedEntries);
    setError("");
    setNotice("");
    setEditing(false);
  }

  async function saveFramework() {
    if (!data || saving || invalidTargets) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE}/plos/major/${majorId}/framework`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentType,
            entries: entries.map((entry) => ({
              ...(entry.id ? { id: entry.id } : {}),
              code: entry.code.trim(),
              description: entry.description.trim(),
              targetPercent: entry.isGroupHeader ? null : entry.targetPercent,
              isGroupHeader: entry.isGroupHeader,
              parentCode: entry.parentCode || null,
            })),
          }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Không lưu được khung CĐR (HTTP ${response.status}). ${detail}`);
      }
      const result = (await response.json()) as FrameworkData;
      const updated = mapEntries(result, assessmentType);
      setData(result);
      setEntries(updated);
      setSavedEntries(updated);
      setNotice("Đã lưu và đồng bộ khung đánh giá CĐR.");
      setEditing(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu khung CĐR.",
      );
    } finally {
      setSaving(false);
    }
  }

  function exportFramework() {
    if (!data) return;
    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const lines = [
      ["Mã chuẩn", "Mô tả năng lực", "Mục tiêu (%)", "Loại", "Nhóm cha"],
      ...entries.map((entry) => [
        entry.code,
        entry.description,
        entry.isGroupHeader ? "Group Header" : entry.targetPercent ?? "",
        entry.isGroupHeader ? "Nhóm" : "Chỉ số",
        entry.parentCode ?? "",
      ]),
    ];
    const csv = `\uFEFF${lines.map((line) => line.map(escapeCsv).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Khung-CDR-${data.major.code}-${cohort}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const matrixHref =
    assessmentType === "direct"
      ? "/assessments/direct/matrix"
      : "/assessments/indirect/matrix";

  const displayMajorCode = data?.major.code ?? "";
  const cohortYear = cohort.match(/\d{4}/)?.[0] ?? cohort;

  // Group entries for hierarchical display
  const structuredGroups = useMemo(() => {
    const groupHeaders = entries.filter((e) => e.isGroupHeader);
    if (groupHeaders.length > 0) {
      return groupHeaders.map((group) => {
        const children = entries.filter(
          (e) =>
            !e.isGroupHeader &&
            (e.parentCode === group.code ||
              (!e.parentCode && e.code.startsWith(group.code))),
        );
        return { group, children };
      });
    }
    // Fallback if no group headers exist
    return [
      {
        group: {
          key: "general",
          code: "PLO",
          description: "Chuẩn đầu ra chương trình đào tạo",
          targetPercent: null,
          isGroupHeader: true,
          parentCode: null,
        },
        children: entries,
      },
    ];
  }, [entries]);

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 font-sans">
      {/* Breadcrumb matching mockup */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href={matrixHref}
          className="hover:text-blue-600 transition-colors"
        >
          Matrix Management
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="font-semibold text-[#1457bd]">
          Thiết lập Khung đánh giá CĐR
        </span>
      </nav>

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
          Thiết lập Khung đánh giá CĐR
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded bg-[#a7f3d0] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#065f46] shadow-2xs">
            NGÀNH: {displayMajorCode}
          </span>
          <span className="text-slate-300 font-bold">·</span>
          <span className="text-xs text-slate-500 font-medium">
            Khóa: {cohortYear}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 animate-in fade-in"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 flex items-center gap-2 animate-in fade-in"
        >
          <Check size={15} className="text-emerald-600" />
          {notice}
        </div>
      )}

      {/* Main Card with Table matching mockup */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[66%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#f0f5fa] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-8 py-3.5 text-left">MÃ CĐR</th>
                <th className="px-4 py-3.5 text-left">MÔ TẢ CHI TIẾT / KPI THÀNH PHẦN</th>
                <th className="px-8 py-3.5 text-center">MỤC TIÊU (TARGET %)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="h-64 text-center text-sm text-slate-500">
                    <LoaderCircle size={22} className="mx-auto mb-2 animate-spin text-[#1457bd]" />
                    Đang tải khung đánh giá CĐR...
                  </td>
                </tr>
              ) : structuredGroups.length ? (
                structuredGroups.map(({ group, children }) => (
                  <Suspense key={group.key} fallback={null}>
                    {/* Group Header Row */}
                    <tr className="bg-white border-b border-slate-100/60 hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-sm text-[#1457bd]">
                        {group.code}
                      </td>
                      <td className="px-4 py-4 font-bold text-sm text-slate-800">
                        {group.description}
                      </td>
                      <td className="px-8 py-4 text-center text-xs text-slate-400">
                        {/* Group headers do not have target percentage in mockup */}
                      </td>
                    </tr>

                    {/* Children Rows */}
                    {children.map((child) => (
                      <tr
                        key={child.key}
                        className="border-b border-slate-100/60 hover:bg-blue-50/20 transition-colors"
                      >
                        <td className="px-8 py-3.5 text-xs font-normal text-slate-600 pl-10">
                          {child.code}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 leading-relaxed pr-6">
                          {child.description}
                        </td>
                        <td className="px-8 py-3.5 text-center">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={child.targetPercent ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? null
                                    : Math.max(0, Math.min(100, Number(e.target.value)));
                                updateEntry(child.key, { targetPercent: val });
                              }}
                              placeholder="75"
                              className="w-20 h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-[#1457bd] focus:ring-2 focus:ring-blue-100 transition"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Suspense>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="h-64 text-center text-sm text-slate-500">
                    Chưa có dữ liệu khung CĐR cho ngành này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer matching mockup */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-8 py-5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={!data || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Pencil size={13} className="text-slate-500" />
            Sửa khung CĐR
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={discardChanges}
              disabled={!hasChanges}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => void saveFramework()}
              disabled={!hasChanges || saving || loading || invalidTargets}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1457bd] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f49a3] disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {saving ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <RotateCw size={13} />
              )}
              Lưu &amp; Đồng bộ
            </button>
          </div>
        </div>
      </section>

      {editing && data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="framework-editor-title"
            className="flex max-h-[92vh] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between bg-[#1763a5] px-6 py-4 text-white">
              <div>
                <h2 id="framework-editor-title" className="text-base font-bold uppercase">
                  Thiết lập khung đánh giá CĐR
                </h2>
                <p className="mt-1 text-[10px] uppercase text-blue-100">
                  Ngành: {data.major.code} · Khóa {cohort.match(/\d{4}/)?.[0] ?? "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={discardChanges}
                className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Đóng cửa sổ thiết lập"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Cấu trúc Chuẩn đầu ra (PLO)
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Khai báo nhóm, chỉ số con và mục tiêu năng lực cần đạt.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={exportFramework}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#075da9] hover:bg-blue-50"
                >
                  <Download size={14} />
                  Xuất file
                </button>
                <button
                  type="button"
                  onClick={() => void saveFramework()}
                  disabled={!hasChanges || saving || invalidTargets}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#075da9] hover:bg-blue-50 disabled:opacity-50"
                >
                  {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Đồng bộ
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="mx-6 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto px-6">
              <table className="w-full min-w-[700px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[55%]" />
                  <col className="w-[19%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-[#e8f2fb]">
                  <tr className="text-[10px] font-bold uppercase text-slate-600">
                    <th className="px-3 py-3 text-left">Mã chuẩn (PLOI)</th>
                    <th className="px-3 py-3 text-left">Mô tả năng lực (PLOI_CDES)</th>
                    <th className="px-3 py-3 text-center">Mục tiêu (%)</th>
                    <th className="px-3 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.key}
                      className={`border-b border-slate-100 ${
                        entry.isGroupHeader ? "bg-[#f3f9fe]" : "bg-white"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={`Mã chuẩn ${entry.code || "mới"}`}
                          value={entry.code}
                          onChange={(event) =>
                            updateEntry(entry.key, { code: event.target.value })
                          }
                          placeholder={entry.isGroupHeader ? "PLO1" : "PLO1.1"}
                          className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-semibold text-[#075da9] outline-none focus:border-[#1769b0]"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          aria-label={`Mô tả năng lực ${entry.code || "mới"}`}
                          value={entry.description}
                          onChange={(event) =>
                            updateEntry(entry.key, { description: event.target.value })
                          }
                          placeholder="Nhập mô tả năng lực"
                          className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-[#1769b0]"
                        />
                        <div className="mt-1 flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[10px] text-slate-500">
                            <input
                              type="checkbox"
                              checked={entry.isGroupHeader}
                              onChange={(event) =>
                                updateEntry(entry.key, {
                                  isGroupHeader: event.target.checked,
                                  parentCode: null,
                                  targetPercent: event.target.checked
                                    ? null
                                    : entry.targetPercent ?? 75,
                                })
                              }
                            />
                            Tiêu đề nhóm
                          </label>
                          {!entry.isGroupHeader && (
                            <label className="flex items-center gap-1 text-[10px] text-slate-500">
                              Nhóm cha
                              <select
                                value={entry.parentCode ?? ""}
                                onChange={(event) =>
                                  updateEntry(entry.key, {
                                    parentCode: event.target.value || null,
                                  })
                                }
                                className="h-6 max-w-[150px] rounded border border-slate-200 bg-white px-1 text-[10px]"
                              >
                                <option value="">Không thuộc nhóm</option>
                                {groups
                                  .filter((group) => group.key !== entry.key && group.code)
                                  .map((group) => (
                                    <option key={group.key} value={group.code}>
                                      {group.code}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {entry.isGroupHeader ? (
                          <span className="block text-center text-[10px] text-slate-500">
                            Group Header
                          </span>
                        ) : (
                          <div className="relative mx-auto max-w-[100px]">
                            <input
                              aria-label={`Mục tiêu ${entry.code || "mới"}`}
                              type="number"
                              min={0}
                              max={100}
                              value={entry.targetPercent ?? ""}
                              onChange={(event) =>
                                updateEntry(entry.key, {
                                  targetPercent:
                                    event.target.value === ""
                                      ? null
                                      : Number(event.target.value),
                                })
                              }
                              className="h-9 w-full rounded-md border border-slate-200 px-3 pr-7 text-center text-xs font-semibold text-slate-700 outline-none focus:border-[#1769b0]"
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              %
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.key)}
                          aria-label={`Xóa ${entry.code || "dòng mới"}`}
                          title="Xóa dòng"
                          className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invalidTargets && (
                <p className="py-2 text-xs text-red-600" role="alert">
                  Mục tiêu phải là số nguyên từ 0 đến 100.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#f7fbff] px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addGroup}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1769b0] px-3 text-xs font-semibold text-[#075da9] hover:bg-blue-50"
                >
                  <Plus size={14} />
                  Thêm nhóm
                </button>
                <button
                  type="button"
                  onClick={() => addOutcome()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1769b0] px-3 text-xs font-semibold text-[#075da9] hover:bg-blue-50"
                >
                  <Plus size={14} />
                  Thêm chỉ số
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={!hasChanges || saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <X size={14} />
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={() => void saveFramework()}
                  disabled={!hasChanges || saving || invalidTargets}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1769b0] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#07508d] disabled:opacity-50"
                >
                  {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                  Lưu lại
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "blue" | "green" | "orange";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-lg font-bold leading-6 text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function FrameworkPageView({
  assessmentType,
}: {
  assessmentType: AssessmentType;
}) {
  return (
    <Suspense
      fallback={
        <main className="p-8 text-sm text-slate-500">
          Đang mở khung đánh giá CĐR...
        </main>
      }
    >
      <FrameworkPageContent assessmentType={assessmentType} />
    </Suspense>
  );
}
