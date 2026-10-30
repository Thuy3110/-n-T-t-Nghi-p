"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Search,
  Settings2,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface MajorSummary {
  id: number;
  majorCode: string;
  majorName: string;
  subjectCount: number;
  plo: number;
  clo: number;
  years: number[];
}

interface AnalysisThresholds {
  ploThreshold: number;
  cloThreshold: number;
}

function makeCohort(year: number) {
  return `K${String(year).slice(-2)}-${year}`;
}

function AnalysisOverview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams.get("id");
  const legacyCohort = searchParams.get("cohort");

  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [selectedCohort, setSelectedCohort] = useState(() =>
    makeCohort(new Date().getFullYear())
  );
  const [search, setSearch] = useState("");
  const [thresholds, setThresholds] =
    useState<AnalysisThresholds | null>(null);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!legacyId) return;

    const params = new URLSearchParams({ id: legacyId });
    if (legacyCohort) params.set("cohort", legacyCohort);
    router.replace(
      `/assessments/direct/analysis/courses?${params.toString()}`
    );
  }, [legacyCohort, legacyId, router]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMajors() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/majors`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Không tải được danh sách ngành (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("API /majors không trả về danh sách ngành hợp lệ.");
        }

        const records = data.filter(
          (item): item is MajorSummary =>
            item !== null &&
            typeof item === "object" &&
            Number.isInteger(item.id) &&
            typeof item.majorCode === "string" &&
            typeof item.majorName === "string" &&
            Number.isInteger(item.subjectCount) &&
            Number.isInteger(item.plo) &&
            Number.isInteger(item.clo) &&
            Array.isArray(item.years)
        );

        setMajors(records);

        const availableYears = records.flatMap((major) =>
          Array.isArray(major.years) ? major.years : []
        );
        const currentYear = new Date().getFullYear();
        if (
          availableYears.length > 0 &&
          !availableYears.includes(currentYear)
        ) {
          const latestYear = Math.max(...availableYears);
          setSelectedCohort(makeCohort(latestYear));
        }
      } catch (cause) {
        if (
          cause instanceof Error &&
          cause.name === "AbortError"
        ) {
          return;
        }

        console.error("Lỗi tải danh sách ngành phân tích:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải danh sách ngành."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMajors();
    return () => controller.abort();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 2023; year -= 1) {
      years.add(year);
    }
    for (const major of majors) {
      for (const year of major.years ?? []) years.add(year);
    }

    return [...years].sort((a, b) => b - a);
  }, [majors]);

  const selectedYear = Number(selectedCohort.match(/\d{4}/)?.[0]);
  const cohortMajors = useMemo(
    () =>
      majors.filter(
        (major) =>
          !major.years.length || major.years.includes(selectedYear)
      ),
    [majors, selectedYear]
  );
  const filteredMajors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cohortMajors.filter(
      (major) =>
        !query ||
        major.majorCode.toLowerCase().includes(query) ||
        major.majorName.toLowerCase().includes(query)
    );
  }, [cohortMajors, search]);

  const selectedMajor =
    filteredMajors.find((major) => major.id === selectedMajorId) ??
    filteredMajors[0] ??
    null;
  const thresholdsMajorId = selectedMajor?.id ?? null;

  useEffect(() => {
    if (thresholdsMajorId === null) return;

    const controller = new AbortController();

    async function loadThresholds() {
      setThresholds(null);
      setThresholdsLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/majors/${thresholdsMajorId}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(
            `Không tải được thông số ngành (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();
        if (
          data === null ||
          typeof data !== "object" ||
          !("ploThreshold" in data) ||
          !("cloThreshold" in data) ||
          typeof data.ploThreshold !== "number" ||
          typeof data.cloThreshold !== "number"
        ) {
          throw new Error("API không trả về thông số phân tích hợp lệ.");
        }

        setThresholds({
          ploThreshold: data.ploThreshold,
          cloThreshold: data.cloThreshold,
        });
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        console.error("Lỗi tải thông số phân tích ngành:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải thông số phân tích."
        );
      } finally {
        if (!controller.signal.aborted) setThresholdsLoading(false);
      }
    }

    void loadThresholds();
    return () => controller.abort();
  }, [thresholdsMajorId]);

  const startAnalysis = () => {
    if (!selectedMajor) return;

    const params = new URLSearchParams({
      id: String(selectedMajor.id),
      cohort: selectedCohort,
    });
    router.push(
      `/assessments/direct/analysis/courses?${params.toString()}`
    );
  };

  const openMatrix = () => {
    if (!selectedMajor) return;

    const params = new URLSearchParams({
      id: String(selectedMajor.id),
      cohort: selectedCohort,
    });
    router.push(`/assessments/direct/matrix/edit?${params.toString()}`);
  };

  const openSettings = () => {
    if (!selectedMajor) return;

    const params = new URLSearchParams({
      majorId: String(selectedMajor.id),
      cohort: selectedCohort,
    });
    router.push(
      `/assessments/direct/analysis/settings?${params.toString()}`
    );
  };

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] px-5 py-7 font-sans sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              Đào tạo <span className="px-1 text-slate-300">›</span>{" "}
              <span className="text-[#165aa7]">Phân tích dữ liệu</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Thực hiện phân tích dữ liệu
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Chọn ngành và khóa để xem dữ liệu hiện có, sau đó tiếp tục chọn học phần.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
            <GraduationCap size={17} className="text-[#165aa7]" />
            <span className="whitespace-nowrap">Khóa học</span>
            <select
              value={selectedCohort}
              onChange={(event) => setSelectedCohort(event.target.value)}
              className="max-w-[190px] cursor-pointer bg-transparent text-slate-800 outline-none"
              aria-label="Chọn khóa học"
            >
              {availableYears.map((year) => {
                const value = makeCohort(year);
                return (
                  <option key={value} value={value}>
                    Khóa {year}
                  </option>
                );
              })}
            </select>
          </label>
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

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-extrabold text-slate-800">
                  Danh sách ngành đào tạo
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Chọn một ngành để xem dữ liệu sẵn sàng phân tích.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm mã hoặc tên ngành..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  aria-label="Tìm ngành"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Chọn</th>
                    <th className="px-4 py-4">Khóa</th>
                    <th className="px-4 py-4">Mã ngành</th>
                    <th className="px-4 py-4">Tên ngành</th>
                    <th className="px-4 py-4 text-center">Học phần</th>
                    <th className="px-4 py-4 text-center">PLO</th>
                    <th className="px-5 py-4 text-center">CLO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center text-sm text-slate-400"
                      >
                        Đang tải danh sách ngành...
                      </td>
                    </tr>
                  ) : filteredMajors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center text-sm text-slate-400"
                      >
                        {error
                          ? "Không thể hiển thị dữ liệu khi chưa tải được danh sách ngành."
                          : "Không có ngành phù hợp với khóa và từ khóa đã chọn."}
                      </td>
                    </tr>
                  ) : (
                    filteredMajors.map((major) => {
                      const selected = selectedMajor?.id === major.id;
                      return (
                        <tr
                          key={major.id}
                          onClick={() => setSelectedMajorId(major.id)}
                          className={`cursor-pointer transition-colors ${
                            selected
                              ? "bg-[#EAF3FF]"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="radio"
                              name="analysis-major"
                              checked={selected}
                              onChange={() => setSelectedMajorId(major.id)}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Chọn ngành ${major.majorName}`}
                              className="h-4 w-4 accent-[#165aa7]"
                            />
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                            {selectedYear}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-[#165aa7]">
                            {major.majorCode}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                            {major.majorName}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-slate-600">
                            {major.subjectCount}
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-bold text-emerald-700">
                            {major.plo}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-bold text-teal-700">
                            {major.clo}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
              Hiển thị{" "}
              <span className="font-bold text-slate-600">
                {loading ? "—" : filteredMajors.length}
              </span>{" "}
              / {loading ? "—" : cohortMajors.length} ngành trong khóa này
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-5">
              <Settings2 size={18} className="text-[#165aa7]" />
              <h2 className="font-extrabold text-slate-800">
                Thông số phân tích
              </h2>
            </div>

            {selectedMajor ? (
              <div className="p-6">
                <div className="mb-5 rounded-xl bg-blue-50 p-4">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                    Cấu hình đánh giá CĐR
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-slate-800">
                    {selectedMajor.majorCode} · {selectedMajor.majorName}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    Khóa {selectedYear}
                  </div>
                </div>

                <p className="mb-4 text-xs leading-5 text-slate-500">
                  Ngưỡng được lưu theo ngành và dùng chung cho các khóa học.
                </p>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-[#EAF4FE] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Ngưỡng đạt PLO
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#165aa7]">
                      {thresholdsLoading
                        ? "—"
                        : thresholds
                          ? `${thresholds.ploThreshold}%`
                          : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-[#EAF4FE] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Ngưỡng đạt CLO
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-[#165aa7]">
                      {thresholdsLoading
                        ? "—"
                        : thresholds
                          ? thresholds.cloThreshold
                          : "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openSettings}
                  disabled={!thresholds || thresholdsLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#165aa7]/20 bg-white px-4 text-sm font-bold text-[#165aa7] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Settings2 size={16} />
                  Thiết lập thông số đánh giá
                </button>

                <div className="my-5 border-t border-slate-100" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen size={16} className="text-indigo-500" />
                      Học phần
                    </span>
                    <strong className="text-sm text-slate-800">
                      {selectedMajor.subjectCount}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <GraduationCap size={16} className="text-emerald-600" />
                      Chuẩn đầu ra PLO
                    </span>
                    <strong className="text-sm text-slate-800">
                      {selectedMajor.plo}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5">
                    <span className="flex items-center gap-2 text-sm text-slate-600">
                      <BarChart3 size={16} className="text-amber-600" />
                      Chuẩn đầu ra CLO
                    </span>
                    <strong className="text-sm text-slate-800">
                      {selectedMajor.clo}
                    </strong>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Dữ liệu được lấy từ khung chương trình hiện có. Ở bước tiếp
                  theo, bạn có thể chọn học phần được đưa vào phân tích.
                </p>

                <button
                  type="button"
                  onClick={startAnalysis}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#165aa7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#124983]"
                >
                  Chọn học phần phân tích
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={openMatrix}
                  className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <CheckCircle2 size={15} />
                  Kiểm tra ma trận CĐR
                </button>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                {loading
                  ? "Đang tải thông tin ngành..."
                  : "Chọn một ngành để xem thông tin phân tích."}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function DirectAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">
          Đang mở trang phân tích...
        </div>
      }
    >
      <AnalysisOverview />
    </Suspense>
  );
}
