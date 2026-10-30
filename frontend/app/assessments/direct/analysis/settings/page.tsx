"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

interface MajorSummary {
  id: number;
  majorCode: string;
  majorName: string;
}

interface AnalysisThresholds {
  ploThreshold: number;
  cloThreshold: number;
}

const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  ploThreshold: 75,
  cloThreshold: 3,
};

function isThresholdResponse(data: unknown): data is AnalysisThresholds {
  return (
    data !== null &&
    typeof data === "object" &&
    "ploThreshold" in data &&
    typeof data.ploThreshold === "number" &&
    "cloThreshold" in data &&
    typeof data.cloThreshold === "number"
  );
}

function DirectAnalysisSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMajorId = Number(searchParams.get("majorId"));
  const cohort = searchParams.get("cohort") ?? "";

  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [majorId, setMajorId] = useState<number | null>(null);
  const [thresholds, setThresholds] =
    useState<AnalysisThresholds | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const majorsResponse = await fetch(`${API_BASE_URL}/majors`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!majorsResponse.ok) {
          throw new Error(
            `Không tải được danh sách ngành (HTTP ${majorsResponse.status}).`
          );
        }

        const majorsData: unknown = await majorsResponse.json();
        if (!Array.isArray(majorsData)) {
          throw new Error("API không trả về danh sách ngành hợp lệ.");
        }

        const availableMajors = majorsData.filter(
          (major): major is MajorSummary =>
            major !== null &&
            typeof major === "object" &&
            Number.isInteger(major.id) &&
            typeof major.majorCode === "string" &&
            typeof major.majorName === "string"
        );
        if (availableMajors.length === 0) {
          throw new Error("Chưa có ngành đào tạo để thiết lập thông số.");
        }

        const selectedMajor =
          availableMajors.find((major) => major.id === requestedMajorId) ??
          availableMajors[0];
        const response = await fetch(
          `${API_BASE_URL}/majors/${selectedMajor.id}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(
            `Không tải được thông số ngành (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();
        if (!isThresholdResponse(data)) {
          throw new Error("API không trả về ngưỡng PLO/CLO hợp lệ.");
        }

        if (controller.signal.aborted) return;
        setMajors(availableMajors);
        setMajorId(selectedMajor.id);
        setThresholds({
          ploThreshold: data.ploThreshold,
          cloThreshold: data.cloThreshold,
        });
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        console.error("Lỗi tải thiết lập phân tích trực tiếp:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải thông số phân tích."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSettings();
    return () => controller.abort();
  }, [requestedMajorId]);

  async function selectMajor(nextMajorId: number) {
    setMajorId(nextMajorId);
    setThresholds(null);
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/majors/${nextMajorId}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(
          `Không tải được thông số ngành (HTTP ${response.status}).`
        );
      }
      const data: unknown = await response.json();
      if (!isThresholdResponse(data)) {
        throw new Error("API không trả về ngưỡng PLO/CLO hợp lệ.");
      }
      setThresholds({
        ploThreshold: data.ploThreshold,
        cloThreshold: data.cloThreshold,
      });
      const params = new URLSearchParams({ majorId: String(nextMajorId) });
      if (cohort) params.set("cohort", cohort);
      router.replace(
        `/assessments/direct/analysis/settings?${params.toString()}`
      );
    } catch (cause) {
      console.error("Lỗi tải thông số ngành:", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải thông số phân tích."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(nextThresholds = thresholds) {
    if (majorId === null || nextThresholds === null) return;
    if (
      !Number.isFinite(nextThresholds.ploThreshold) ||
      nextThresholds.ploThreshold < 0 ||
      nextThresholds.ploThreshold > 100 ||
      !Number.isFinite(nextThresholds.cloThreshold) ||
      nextThresholds.cloThreshold < 1 ||
      nextThresholds.cloThreshold > 10
    ) {
      setError("Ngưỡng PLO phải từ 0–100%, ngưỡng CLO từ 1–10.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE_URL}/majors/${majorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextThresholds),
      });
      if (!response.ok) {
        throw new Error(
          `Không lưu được thông số đánh giá (HTTP ${response.status}).`
        );
      }

      const data: unknown = await response.json();
      if (!isThresholdResponse(data)) {
        throw new Error("API không xác nhận thông số PLO/CLO đã lưu.");
      }
      setThresholds({
        ploThreshold: data.ploThreshold,
        cloThreshold: data.cloThreshold,
      });
      setNotice("Đã lưu thông số đánh giá cho ngành.");
    } catch (cause) {
      console.error("Lỗi lưu thiết lập phân tích trực tiếp:", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể lưu thông số đánh giá."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedMajor = majors.find((major) => major.id === majorId);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] px-5 py-7 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/assessments/direct/analysis")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#165aa7]"
        >
          <ArrowLeft size={17} />
          Quay lại phân tích dữ liệu
        </button>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-3 border-b border-slate-100 bg-[#F4F8FD] px-5 py-5 sm:px-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-[#165aa7]">
              <Settings2 size={20} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#165aa7]">
                Phân tích dữ liệu trực tiếp
              </p>
              <h1 className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                Thiết lập thông số đánh giá
              </h1>
            </div>
          </header>

          <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-8">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <CheckCircle2 size={17} />
                {notice}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Ngành đào tạo
              </span>
              <select
                value={majorId ?? ""}
                disabled={loading || majors.length === 0}
                onChange={(event) =>
                  void selectMajor(Number(event.target.value))
                }
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#165aa7] disabled:bg-slate-50"
              >
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.majorCode} · {major.majorName}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-blue-100 bg-[#F6FAFE] p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800">
                  Ngưỡng đánh giá chuẩn đầu ra
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Các giá trị được lưu theo ngành và áp dụng cho khóa học của
                  ngành đó.
                </p>
              </div>

              <div className="space-y-3">
                <label className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <span className="text-sm font-medium text-slate-700">
                    Ngưỡng đạt PLO (%)
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={thresholds?.ploThreshold ?? ""}
                      disabled={loading || !thresholds}
                      onChange={(event) =>
                        setThresholds((current) =>
                          current
                            ? {
                                ...current,
                                ploThreshold:
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value),
                              }
                            : current
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-800 outline-none focus:border-[#165aa7] disabled:bg-slate-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      %
                    </span>
                  </div>
                </label>

                <label className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <span className="text-sm font-medium text-slate-700">
                    Ngưỡng đạt CLO (mức)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.1}
                    value={thresholds?.cloThreshold ?? ""}
                    disabled={loading || !thresholds}
                    onChange={(event) =>
                      setThresholds((current) =>
                        current
                          ? {
                              ...current,
                              cloThreshold:
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value),
                            }
                          : current
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#165aa7] disabled:bg-slate-100"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              {selectedMajor
                ? `Đang thiết lập cho ${selectedMajor.majorCode} · ${selectedMajor.majorName}${cohort ? ` · ${cohort}` : ""}.`
                : "Đang tải thông tin ngành..."}
              {" "}Các tiêu chí khác trong mẫu chưa được lưu trong hệ thống hiện
              tại nên không hiển thị giá trị giả định tại đây.
            </div>
          </div>

          <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={() =>
                void saveSettings({
                  ...DEFAULT_THRESHOLDS,
                })
              }
              disabled={loading || saving || !thresholds}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Đặt lại mặc định
            </button>
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={loading || saving || !thresholds}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#165aa7] px-5 text-sm font-semibold text-white transition hover:bg-[#124983] disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu thiết lập"}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default function DirectAnalysisSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
          Đang tải thiết lập thông số...
        </div>
      }
    >
      <DirectAnalysisSettings />
    </Suspense>
  );
}
