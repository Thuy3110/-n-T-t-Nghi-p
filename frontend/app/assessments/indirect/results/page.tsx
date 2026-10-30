"use client";

import { ChangeEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Upload,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const importHeaders = [
  "studentCode",
  "studentName",
  "majorCode",
  "cohortYear",
  "courseCode",
  "cloCode",
  "score",
];

interface MajorSummary {
  id: number;
  majorCode: string;
  majorName: string;
  subjectCount: number;
  plo: number;
  clo: number;
}

interface PloResult {
  ploId: number;
  code: string;
  description: string;
  scorePercent: number | null;
  achieved: boolean | null;
}

interface StudentResult {
  id: number;
  studentCode: string;
  fullName: string;
  totalPloScorePercent: number | null;
  totalPloAchieved: boolean | null;
  ploResults: PloResult[];
}

interface PloResultsData {
  major: { id: number; code: string; name: string };
  cohortYear: number;
  mappedPloCount: number;
  attainmentThresholdPercent: number;
  studentCount: number;
  evaluatedCount: number;
  achievedCount: number;
  attainmentRate: number | null;
  plos: Array<{ id: number; code: string; description: string }>;
  students: StudentResult[];
}

function isMajorSummary(value: unknown): value is MajorSummary {
  if (!value || typeof value !== "object") return false;
  const major = value as Record<string, unknown>;
  return (
    typeof major.id === "number" &&
    typeof major.majorCode === "string" &&
    typeof major.majorName === "string"
  );
}

function authorizationHeader(): { Authorization: string } {
  const token = window.localStorage.getItem("accessToken");
  if (!token) throw new Error("Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.");
  return { Authorization: `Bearer ${token}` };
}

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const requestedMajorId = searchParams.get("majorId") ?? "";
  const requestedCohortYear = Number(searchParams.get("cohortYear"));
  const initialCohortYear = Number.isInteger(requestedCohortYear) &&
    requestedCohortYear >= 1900 && requestedCohortYear <= 2200
    ? requestedCohortYear
    : new Date().getFullYear();
  const [majors, setMajors] = useState<MajorSummary[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState(requestedMajorId);
  const [cohortYear, setCohortYear] = useState(initialCohortYear);
  const [results, setResults] = useState<PloResultsData | null>(null);
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMajors() {
      setLoadingMajors(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/majors`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Không tải được danh sách ngành (HTTP ${response.status}).`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isMajorSummary)) {
          throw new Error("API /majors không trả về danh sách ngành hợp lệ.");
        }
        setMajors(data);
        setSelectedMajorId((current) =>
          current && data.some((major) => String(major.id) === current)
            ? current
            : data[0] ? String(data[0].id) : "",
        );
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Không thể tải danh sách ngành.");
      } finally {
        if (!controller.signal.aborted) setLoadingMajors(false);
      }
    }

    void loadMajors();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchResults() {
      if (!selectedMajorId) {
        setResults(null);
        return;
      }
      setLoadingResults(true);
      setError("");
      try {
        const params = new URLSearchParams({
          majorId: selectedMajorId,
          cohortYear: String(cohortYear),
        });
        const response = await fetch(`${API_BASE}/assessments/plo-results?${params}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: authorizationHeader(),
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`Không tải được kết quả đánh giá (HTTP ${response.status}). ${detail}`);
        }
        setResults(await response.json() as PloResultsData);
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setResults(null);
        setError(cause instanceof Error ? cause.message : "Không thể tải kết quả đánh giá.");
      } finally {
        if (!controller.signal.aborted) setLoadingResults(false);
      }
    }

    void fetchResults();
    return () => controller.abort();
  }, [cohortYear, selectedMajorId]);

  const loadResults = useCallback(async () => {
    if (!selectedMajorId) return;
    setLoadingResults(true);
    setError("");
    try {
      const params = new URLSearchParams({
        majorId: selectedMajorId,
        cohortYear: String(cohortYear),
      });
      const response = await fetch(`${API_BASE}/assessments/plo-results?${params}`, {
        cache: "no-store",
        headers: authorizationHeader(),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Không tải được kết quả đánh giá (HTTP ${response.status}). ${detail}`);
      }
      setResults(await response.json() as PloResultsData);
    } catch (cause) {
      setResults(null);
      setError(cause instanceof Error ? cause.message : "Không thể tải kết quả đánh giá.");
    } finally {
      setLoadingResults(false);
    }
  }, [cohortYear, selectedMajorId]);

  function downloadTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([importHeaders]);
    worksheet["!cols"] = importHeaders.map((header) => ({ wch: Math.max(header.length + 3, 16) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Diem CLO");
    XLSX.writeFile(workbook, "Mau-nhap-diem-CLO.xlsx");
  }

  async function importScores(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    setMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("File Excel không có trang tính.");

      const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const nonEmptyRecords = records.filter((record) =>
        Object.values(record).some((value) => String(value).trim() !== ""),
      );
      const rows = nonEmptyRecords.map((record, index) => {
        const normalized = new Map(
          Object.entries(record).map(([key, value]) => [key.trim().toLowerCase(), value]),
        );
        const value = (header: string) => normalized.get(header.toLowerCase());
        const rawScore = String(value("score") ?? "").trim();
        const row = {
          studentCode: String(value("studentCode") ?? "").trim(),
          studentName: String(value("studentName") ?? "").trim(),
          majorCode: String(value("majorCode") ?? "").trim(),
          cohortYear: Number(value("cohortYear")),
          courseCode: String(value("courseCode") ?? "").trim(),
          cloCode: String(value("cloCode") ?? "").trim(),
          score: Number(rawScore),
        };
        if (
          !row.studentCode || !row.studentName || !row.majorCode ||
          !row.courseCode || !row.cloCode ||
          !Number.isInteger(row.cohortYear) || !rawScore || !Number.isFinite(row.score)
        ) {
          throw new Error(`Dòng ${index + 2}: thiếu cột bắt buộc hoặc dữ liệu không hợp lệ.`);
        }
        return row;
      }).filter((row) =>
        row.studentCode || row.studentName || row.majorCode || row.courseCode || row.cloCode,
      );

      if (rows.length === 0) throw new Error("File không có dòng điểm CLO.");
      if (!selectedMajor) throw new Error("Hãy chọn ngành trước khi nhập điểm.");
      if (rows.some((row) => row.majorCode.toUpperCase() !== selectedMajor.majorCode.toUpperCase())) {
        throw new Error(`Mã ngành trong file phải là ${selectedMajor.majorCode} đã chọn trên màn hình.`);
      }
      if (rows.some((row) => row.cohortYear !== cohortYear)) {
        throw new Error(`Năm khóa trong file phải khớp với khóa ${cohortYear} đã chọn trên màn hình.`);
      }
      const response = await fetch(`${API_BASE}/assessments/import-clo-scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authorizationHeader(),
        },
        body: JSON.stringify({ rows }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Không nhập được điểm CLO (HTTP ${response.status}). ${detail}`);
      }

      const imported = await response.json() as { importedRows: number; studentCount: number };
      setMessage(`Đã nhập/cập nhật ${imported.importedRows} dòng điểm cho ${imported.studentCount} sinh viên.`);
      await loadResults();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể nhập file Excel.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function exportResults() {
    if (!results || results.students.length === 0) return;

    const studentRows = results.students.map((student) => {
      const row: Record<string, string | number> = {
        "Mã sinh viên": student.studentCode,
        "Tên sinh viên": student.fullName,
        "Tổng PLO (%)": student.totalPloScorePercent ?? "Chưa có dữ liệu",
        "Tổng PLO - Kết quả": student.totalPloAchieved === null
          ? "Chưa có dữ liệu"
          : student.totalPloAchieved ? "Đạt" : "Chưa đạt",
      };
      for (const plo of results.plos) {
        const result = student.ploResults.find((item) => item.ploId === plo.id);
        row[`${plo.code} (%)`] = result?.scorePercent ?? "Chưa có dữ liệu";
        row[`${plo.code} - Kết quả`] = result?.achieved === null || result?.achieved === undefined
          ? "Chưa có dữ liệu"
          : result.achieved ? "Đạt" : "Chưa đạt";
      }
      return row;
    });
    const summary = [
      { Thông_tin: "Ngành", Giá_trị: `${results.major.code} - ${results.major.name}` },
      { Thông_tin: "Khóa", Giá_trị: results.cohortYear },
      { Thông_tin: "Ngưỡng đạt PLO (%)", Giá_trị: results.attainmentThresholdPercent },
      { Thông_tin: "Tỷ lệ đạt", Giá_trị: results.attainmentRate ?? "Chưa có dữ liệu" },
      { Thông_tin: "Số sinh viên", Giá_trị: results.studentCount },
      { Thông_tin: "Lượt đánh giá PLO", Giá_trị: results.evaluatedCount },
      { Thông_tin: "Lượt đạt PLO", Giá_trị: results.achievedCount },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentRows), "Ket qua sinh vien");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Tong hop");
    XLSX.writeFile(workbook, `Ket-qua-PLO-${results.major.code}-K${results.cohortYear}.xlsx`);
  }

  const selectedMajor = majors.find((major) => String(major.id) === selectedMajorId);

  return (
    <main className="min-h-screen bg-[#f4f8fc] px-4 py-6 font-sans text-slate-800 sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Đo lường - Đánh giá chuẩn đầu ra
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Kết quả đánh giá sinh viên theo ngành
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Tính mức đạt từng PLO từ điểm CLO của sinh viên và trọng số ma trận CLO–PLO.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FileSpreadsheet size={16} />
              Tải mẫu Excel
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={importing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50 disabled:opacity-60"
            >
              {importing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? "Đang nhập..." : "Nhập điểm CLO"}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => void importScores(event)}
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Printer size={16} />
              In trang
            </button>
            <button
              type="button"
              onClick={exportResults}
              disabled={!results || results.students.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.8fr]">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Sinh viên có dữ liệu</span>
              <Users size={18} className="text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-bold">{loadingResults ? "…" : results?.studentCount ?? 0}</p>
            <p className="mt-1 text-xs text-slate-400">Đã nhập điểm CLO trong khóa được chọn</p>
          </article>

          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Tỷ lệ đạt PLO</span>
              <BarChart3 size={18} className="text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-bold">
              {loadingResults ? "…" : results?.attainmentRate === null || !results ? "—" : `${results.attainmentRate}%`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {results ? `${results.achievedCount}/${results.evaluatedCount} lượt đánh giá đạt` : "Chưa có kết quả"}
            </p>
          </article>

          <article className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-2">
            <div>
              <label htmlFor="major-select" className="mb-2 block text-sm font-semibold text-slate-700">
                Ngành đào tạo
              </label>
              <select
                id="major-select"
                value={selectedMajorId}
                onChange={(event) => setSelectedMajorId(event.target.value)}
                disabled={loadingMajors || majors.length === 0}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
              >
                {loadingMajors && <option value="">Đang tải danh sách ngành...</option>}
                {!loadingMajors && majors.length === 0 && <option value="">Chưa có ngành</option>}
                {majors.map((major) => (
                  <option key={major.id} value={String(major.id)}>
                    {major.majorCode} - {major.majorName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cohort-year" className="mb-2 block text-sm font-semibold text-slate-700">
                Khóa nhập học
              </label>
              <input
                id="cohort-year"
                type="number"
                min={1900}
                max={2200}
                value={cohortYear}
                onChange={(event) => setCohortYear(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
              <p className="mt-2 text-xs text-slate-500">
                PLO: {loadingResults ? "…" : results?.plos.length ?? selectedMajor?.plo ?? 0}
                {" · "}Ngưỡng đạt: {results?.attainmentThresholdPercent ?? 75}%
              </p>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold">Chi tiết kết quả PLO</h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedMajor
                  ? `${selectedMajor.majorCode} - ${selectedMajor.majorName} · Khóa ${cohortYear}`
                  : "Chọn ngành để xem kết quả"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadResults()}
              disabled={loadingResults}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={14} className={loadingResults ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã sinh viên</th>
                  <th className="px-5 py-4">Tên sinh viên</th>
                  {(results?.plos ?? []).map((plo) => (
                    <th key={plo.id} className="min-w-24 px-3 py-4 text-center" title={plo.description}>
                      {plo.code}
                    </th>
                  ))}
                  <th className="px-5 py-4 text-center">Tổng PLO</th>
                  <th className="px-5 py-4 text-center">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {loadingResults ? (
                  <tr><td colSpan={Math.max(4, (results?.plos.length ?? 0) + 4)} className="px-6 py-14 text-center text-sm text-slate-500">Đang tải kết quả đánh giá...</td></tr>
                ) : !results || results.students.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(4, (results?.plos.length ?? 0) + 4)} className="px-6 py-14 text-center">
                      <p className="font-semibold text-slate-800">Chưa có điểm CLO cho ngành/khóa này</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Tải mẫu Excel, nhập mỗi dòng một điểm CLO của sinh viên rồi bấm “Nhập điểm CLO”.
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.students.map((student) => {
                    return (
                      <tr key={student.id} className="border-t border-slate-100 text-sm">
                        <td className="px-5 py-4 font-semibold text-blue-700">{student.studentCode}</td>
                        <td className="px-5 py-4">{student.fullName}</td>
                        {results.plos.map((plo) => {
                          const item = student.ploResults.find((result) => result.ploId === plo.id);
                          return (
                            <td key={plo.id} className="px-3 py-4 text-center">
                              {item?.scorePercent === null || item?.scorePercent === undefined ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <span className={item.achieved ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                                  {item.scorePercent}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-5 py-4 text-center">
                          {student.totalPloScorePercent === null ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={student.totalPloAchieved ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                              {student.totalPloScorePercent}%
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {student.totalPloAchieved === true ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 size={13} /> Đạt</span>
                          ) : student.totalPloAchieved === false ? (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Chưa đạt</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Thiếu dữ liệu</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {results && results.students.length > 0 && results.evaluatedCount === 0 && (
          <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {results.mappedPloCount === 0
              ? "Chưa thể tính kết quả PLO: hiện không có liên kết CLO–PLO trong ma trận cho ngành này. Hãy cấu hình ma trận trước khi xem kết quả."
              : "Chưa thể tính kết quả PLO: chưa có điểm CLO nào khớp với các CLO đã liên kết trong ma trận cho ngành này."}
          </div>
        )}

        <aside className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <p>
            Điểm CLO nhập theo thang 0–10. Điểm PLO được tính bằng trung bình có trọng số mức đóng góp trong ma trận CLO–PLO; kết quả đạt khi bằng hoặc cao hơn ngưỡng PLO cấu hình ({results?.attainmentThresholdPercent ?? 75}%). Mỗi lần nhập cùng sinh viên, học phần và CLO sẽ cập nhật điểm đã có.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default function IndirectAssessmentResultsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f8fc] p-8 text-slate-500">Đang mở kết quả đánh giá...</main>}>
      <ResultsPageContent />
    </Suspense>
  );
}
