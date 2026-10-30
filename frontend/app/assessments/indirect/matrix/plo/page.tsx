"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, LoaderCircle, Save, Trash2, X } from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

interface Plo {
  id: number;
  code: string;
  description: string;
  targetPercent: number | null;
}

interface PloData {
  major: { id: number; code: string; name: string };
  plos: Plo[];
}

function PloFrameworkEditor() {
  const searchParams = useSearchParams();
  const majorId = Number(searchParams.get("majorId"));
  const requestedYear = Number(searchParams.get("cohortYear"));
  const cohortYear =
    Number.isInteger(requestedYear) && requestedYear >= 1900
      ? requestedYear
      : new Date().getFullYear();

  const [data, setData] = useState<PloData | null>(null);
  const [targets, setTargets] = useState<Record<number, string>>({});
  const [savedTargets, setSavedTargets] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPlos = useCallback(async (signal: AbortSignal) => {
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
        throw new Error(`Không tải được khung PLO (HTTP ${response.status}).`);
      }
      const result = (await response.json()) as PloData;
      const saved = Object.fromEntries(
        result.plos.map((plo) => [
          plo.id,
          plo.targetPercent == null ? "" : String(plo.targetPercent),
        ]),
      );
      setData(result);
      setTargets(saved);
      setSavedTargets(saved);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(
        cause instanceof Error ? cause.message : "Không thể tải khung PLO.",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [majorId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadPlos(controller.signal));
    return () => controller.abort();
  }, [loadPlos]);

  const hasChanges = JSON.stringify(targets) !== JSON.stringify(savedTargets);
  const hasInvalidTarget = Object.values(targets).some((value) => {
    if (!value.trim()) return false;
    const numericValue = Number(value);
    return !Number.isInteger(numericValue) || numericValue < 0 || numericValue > 100;
  });

  function updateTarget(ploId: number, value: string) {
    setTargets((current) => ({ ...current, [ploId]: value }));
    setError("");
    setNotice("");
  }

  function discardChanges() {
    setTargets(savedTargets);
    setError("");
    setNotice("");
  }

  async function saveTargets() {
    if (!data || saving || hasInvalidTarget) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE}/plos/major/${majorId}/targets`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targets: data.plos.map((plo) => ({
              id: plo.id,
              targetPercent:
                targets[plo.id] === "" ? null : Number(targets[plo.id]),
            })),
          }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Không lưu được mục tiêu PLO (HTTP ${response.status}). ${detail}`);
      }
      const result = (await response.json()) as PloData;
      const saved = Object.fromEntries(
        result.plos.map((plo) => [
          plo.id,
          plo.targetPercent == null ? "" : String(plo.targetPercent),
        ]),
      );
      setData(result);
      setTargets(saved);
      setSavedTargets(saved);
      setNotice("Đã lưu mục tiêu PLO.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu mục tiêu PLO.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-6 flex min-h-10 items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          {data
            ? `Khóa ${cohortYear} · ${data.major.code} · ${data.major.name}`
            : `Khóa ${cohortYear}`}
        </p>
        <button
          type="button"
          onClick={() => setViewOnly((current) => !current)}
          disabled={!data || loading}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#1769b0] bg-white px-4 text-xs font-semibold text-[#1769b0] hover:bg-blue-50 disabled:opacity-50"
        >
          <Eye size={15} />
          {viewOnly ? "Quay lại chỉnh sửa" : "Xem khung CĐR"}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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
            className="mx-5 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-7"
          >
            {notice}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[60%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="h-12 bg-[#f3f8fd] text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Nội dung chuẩn đầu ra</th>
                <th className="px-4 py-3">Mục tiêu (%)</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="h-[360px] text-center text-sm text-slate-500">
                    <LoaderCircle size={20} className="mx-auto mb-2 animate-spin" />
                    Đang tải khung PLO...
                  </td>
                </tr>
              ) : data?.plos.length ? (
                <>
                  {data.plos.map((plo, index) => (
                    <tr
                      key={plo.id}
                      className={`min-h-[68px] border-b border-slate-100 text-xs text-slate-700 ${
                        index % 2 === 0 ? "bg-[#f8fbfe]" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-5 leading-5 text-slate-700">
                        {plo.description}
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative max-w-[96px]">
                          <input
                            aria-label={`Mục tiêu phần trăm ${plo.code}`}
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={targets[plo.id] ?? ""}
                            readOnly={viewOnly}
                            onChange={(event) =>
                              updateTarget(plo.id, event.target.value)
                            }
                            className={`h-9 w-full rounded-lg border px-3 pr-7 text-center text-xs font-semibold outline-none focus:border-[#1769b0] ${
                              viewOnly
                                ? "border-transparent bg-[#eaf4fd] text-[#1769b0]"
                                : "border-slate-200 bg-white text-[#1769b0]"
                            }`}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            %
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {!viewOnly && (
                          <button
                            type="button"
                            title={`Xóa mục tiêu của ${plo.code}`}
                            aria-label={`Xóa mục tiêu phần trăm ${plo.code}`}
                            disabled={!targets[plo.id]}
                            onClick={() => updateTarget(plo.id, "")}
                            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr aria-hidden="true">
                    <td colSpan={3} className="h-[120px]" />
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={3} className="h-[360px] text-center text-sm text-slate-500">
                    Ngành này chưa có chuẩn đầu ra PLO trong cơ sở dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {!viewOnly && (
        <footer className="flex flex-wrap items-center justify-end gap-3 px-2 py-5">
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
            onClick={() => void saveTargets()}
            disabled={!hasChanges || saving || loading || hasInvalidTarget}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1769b0] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#07508d] disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Đang lưu..." : "Lưu lại"}
          </button>
        </footer>
      )}
        {hasInvalidTarget && (
          <p className="px-2 pb-2 text-right text-xs text-red-600" role="alert">
            Mục tiêu phải là số nguyên từ 0 đến 100.
          </p>
        )}
    </div>
  );
}

export default function PloFrameworkPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-8 text-slate-500">
          Đang mở khung PLO...
        </main>
      }
    >
      <PloFrameworkEditor />
    </Suspense>
  );
}
