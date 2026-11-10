"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  getLecturerAssessmentYears,
  getMyAssignedCourses,
  MyAssignedCourse,
  MyCoursesResponse,
  saveCourseAssessments,
} from "@/services/lecturer-assessment.service";

function getErrorMessage(cause: unknown, fallback: string) {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "response" in cause &&
    typeof cause.response === "object" &&
    cause.response !== null &&
    "data" in cause.response &&
    typeof cause.response.data === "object" &&
    cause.response.data !== null &&
    "message" in cause.response.data
  ) {
    const message = cause.response.data.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
  }
  return cause instanceof Error ? cause.message : fallback;
}

export default function LecturerPortalPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [portalData, setPortalData] = useState<MyCoursesResponse | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const selectedCourseIdRef = useRef<number | null>(null);
  const [draftRates, setDraftRates] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [excelSummary, setExcelSummary] = useState<{
    fileName: string;
    studentCount: number;
    results: Array<{
      cloCode: string;
      passCount: number;
      totalCount: number;
      rate: number;
    }>;
  } | null>(null);

  // 1. Tải danh sách năm học
  useEffect(() => {
    getLecturerAssessmentYears()
      .then((data) => {
        const sorted = [...data].sort((a, b) => b - a);
        setYears(sorted);
        if (sorted.length > 0) {
          setSelectedYear(sorted[0]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách năm học:", err);
      });
  }, []);

  const initDraftRates = useCallback((course: MyAssignedCourse) => {
    const draft: Record<number, string> = {};
    for (const clo of course.clos) {
      draft[clo.id] = clo.myRate === null ? "" : String(clo.myRate);
    }
    setDraftRates(draft);
  }, []);

  const selectCourse = useCallback((course: MyAssignedCourse) => {
    selectedCourseIdRef.current = course.id;
    setSelectedCourseId(course.id);
    setNotice("");
    setError("");
    setExcelSummary(null);
    initDraftRates(course);
  }, [initDraftRates]);

  // 2. Tải danh sách môn học của giảng viên
  const loadMyCourses = useCallback(async (year: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyAssignedCourses(year);
      setPortalData(res);
      const requestedCourseId = Number(new URLSearchParams(window.location.search).get("courseId"));
      const requestedCourse = Number.isInteger(requestedCourseId)
        ? res.courses.find((course) => course.id === requestedCourseId)
        : undefined;
      if (requestedCourse) {
        selectCourse(requestedCourse);
      } else if (requestedCourseId > 0) {
        if (res.courses[0]) selectCourse(res.courses[0]);
        setError("Học phần được chọn không có trong danh sách hiện có của tài khoản.");
      } else if (res.courses.length > 0) {
        // Giữ môn đang chọn nếu hợp lệ, ngược lại chọn môn đầu tiên
        if (!selectedCourseIdRef.current || !res.courses.some((c) => c.id === selectedCourseIdRef.current)) {
          selectCourse(res.courses[0]);
        } else {
          const current = res.courses.find((c) => c.id === selectedCourseIdRef.current);
          if (current) initDraftRates(current);
        }
      } else {
        selectedCourseIdRef.current = null;
        setSelectedCourseId(null);
        setDraftRates({});
      }
    } catch (err) {
      console.error("Lỗi tải danh sách học phần:", err);
      setError(getErrorMessage(err, "Không tải được danh sách học phần được phân công."));
    } finally {
      setLoading(false);
    }
  }, [initDraftRates, selectCourse]);

  useEffect(() => {
    if (selectedYear) {
      // Loading remote course data is the purpose of this effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadMyCourses(selectedYear);
    }
  }, [loadMyCourses, selectedYear]);

  const currentCourse = useMemo(() => {
    return portalData?.courses.find((c) => c.id === selectedCourseId) ?? null;
  }, [portalData, selectedCourseId]);

  // Thống kê tiến độ
  const stats = useMemo(() => {
    const total = portalData?.courses.length ?? 0;
    const completed = portalData?.courses.filter((c) => c.isEvaluated).length ?? 0;
    const pending = total - completed;
    return { total, completed, pending };
  }, [portalData]);

  // Thay đổi % CLO thủ công
  const handleRateChange = (cloId: number, val: string) => {
    setDraftRates((prev) => ({ ...prev, [cloId]: val }));
  };

  // 3. Tải file mẫu Excel động theo môn học
  const downloadDynamicTemplate = () => {
    if (!currentCourse) return;
    const workbook = XLSX.utils.book_new();

    // Tiêu đề cột
    const headers = ["STT", "MaSV", "HoVaTen", ...currentCourse.clos.map((c) => c.code), "GhiChu"];

    const aoaData = [
      [`BẢNG ĐIỂM HỌC PHẦN: ${currentCourse.name.toUpperCase()} (${currentCourse.code})`],
      [`Ngành: ${currentCourse.major.name} | Năm học: ${selectedYear} | Thang điểm: 0 - 10 (Điểm >= 5.0 là Đạt CLO)`],
      [],
      headers,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

    // Độ rộng cột
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 26 },
      ...currentCourse.clos.map(() => ({ wch: 14 })),
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "BANG_DIEM_CLO");
    XLSX.writeFile(workbook, `Mau-nhap-diem-${currentCourse.code}.xlsx`);
  };

  // 4. Đọc file Excel bảng điểm sinh viên và tự động tính tỷ lệ % CLO
  const handleUploadStudentScores = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !currentCourse) return;

    setError("");
    setNotice("");
    setExcelSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) throw new Error("File Excel không có nội dung.");

      // Nhận diện dòng header
      const rawHeaderRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      let headerRowIndex = rawHeaderRows.findIndex((row) =>
        row.some((cell) => {
          const str = String(cell || "").toLowerCase().replace(/[\s_]/g, "");
          return str === "masv" || str === "studentcode" || str === "mssv";
        })
      );
      if (headerRowIndex === -1) headerRowIndex = 0;

      const actualHeaders = (rawHeaderRows[headerRowIndex] || []).map((h) => String(h || "").trim());
      const sampleNoteColumn = actualHeaders.findIndex(
        (header) => header.toLowerCase().replace(/[\s_]/g, "") === "ghichu",
      );

      // Lấy dữ liệu sinh viên từ dòng sau header
      const dataRows = rawHeaderRows.slice(headerRowIndex + 1);

      // Tìm vị trí các cột CLO
      const cloColIndexes: Record<string, number> = {};
      for (const clo of currentCourse.clos) {
        const idx = actualHeaders.findIndex(
          (h) => h.toUpperCase() === clo.code.toUpperCase() || h.toUpperCase().includes(clo.code.toUpperCase())
        );
        if (idx !== -1) {
          cloColIndexes[clo.code] = idx;
        }
      }

      const missingClos = currentCourse.clos.filter((clo) => cloColIndexes[clo.code] === undefined);
      if (missingClos.length > 0) {
        throw new Error(
          `File thiếu cột CLO: ${missingClos.map((clo) => clo.code).join(", ")}. Vui lòng dùng file mẫu của học phần này.`
        );
      }

      // Tính toán tỷ lệ %
      const passThreshold = 5.0; // Thang 10, >= 5.0 là Đạt
      const results: Array<{
        cloCode: string;
        passCount: number;
        totalCount: number;
        rate: number;
      }> = [];

      const newDraft = { ...draftRates };

      for (const clo of currentCourse.clos) {
        const colIdx = cloColIndexes[clo.code];
        if (colIdx === undefined) continue;

        let totalValid = 0;
        let passCount = 0;

        for (const [rowIndex, row] of dataRows.entries()) {
          if (
            sampleNoteColumn !== -1 &&
            String(row[sampleNoteColumn] ?? "").toLowerCase().includes("mẫu ví dụ")
          ) {
            continue;
          }
          const rawVal = row[colIdx];
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") continue;

          // Bỏ qua các dòng hướng dẫn từ những file mẫu cũ.
          if (String(rawVal).includes("Mô tả") || String(rawVal) === "--") continue;

          const num = Number(String(rawVal).replace(",", "."));
          if (!Number.isFinite(num) || num < 0 || num > 10) {
            throw new Error(`Dòng ${headerRowIndex + rowIndex + 2}, cột ${clo.code}: điểm phải là số từ 0 đến 10.`);
          }
          totalValid++;
          if (num >= passThreshold) {
            passCount++;
          }
        }

        if (totalValid > 0) {
          const rate = Number(((passCount / totalValid) * 100).toFixed(2));
          results.push({
            cloCode: clo.code,
            passCount,
            totalCount: totalValid,
            rate,
          });
          newDraft[clo.id] = String(rate);
        }
      }

      if (results.length === 0) {
        throw new Error("File chưa có dòng điểm hợp lệ. Hãy nhập điểm sinh viên rồi tải lại.");
      }

      const studentCount = Math.max(...results.map((r) => r.totalCount), 0);
      setDraftRates(newDraft);
      setExcelSummary({
        fileName: file.name,
        studentCount,
        results,
      });

      setNotice(
        `Đã đọc thành công bảng điểm của ${studentCount} sinh viên và tự động tính tỷ lệ % cho ${results.length} chuẩn đầu ra (CLO).`
      );
    } catch (err) {
      console.error("Lỗi đọc file Excel bảng điểm:", err);
      setError(getErrorMessage(err, "Không đọc được file bảng điểm Excel."));
    }
  };

  // 5. Lưu đánh giá học phần
  const handleSave = async () => {
    if (!currentCourse) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const assessments = currentCourse.clos.map((clo) => {
        const val = draftRates[clo.id];
        const num = val === undefined || val === "" ? null : Number(val);
        return {
          courseId: currentCourse.id,
          cloId: clo.id,
          attainmentRate: num,
        };
      });

      // Kiểm tra hợp lệ
      for (const a of assessments) {
        if (a.attainmentRate !== null && (a.attainmentRate < 0 || a.attainmentRate > 100)) {
          throw new Error("Tỷ lệ đạt phải nằm trong khoảng từ 0% đến 100%.");
        }
      }

      const res = await saveCourseAssessments({
        courseId: currentCourse.id,
        academicYear: selectedYear,
        assessments,
      });

      setNotice(res.message);
      await loadMyCourses(selectedYear);
    } catch (err) {
      console.error("Lỗi lưu đánh giá học phần:", err);
      setError(getErrorMessage(err, "Không thể lưu kết quả đánh giá."));
    } finally {
      setSaving(false);
    }
  };

  // 6. Xuất báo cáo học phần Excel
  const handleExportCourseReport = () => {
    if (!currentCourse) return;
    const workbook = XLSX.utils.book_new();

    const threshold = 75; // Ngưỡng đạt chuẩn

    const summaryRows = [
      ["BÁO CÁO KẾT QUẢ ĐÁNH GIÁ CHUẨN ĐẦU RA HỌC PHẦN (CLO)"],
      ["HỌC PHẦN:", currentCourse.name, "MÃ HỌC PHẦN:", currentCourse.code],
      ["NGÀNH ĐÀO TẠO:", currentCourse.major.name, "NĂM HỌC:", selectedYear],
      ["GIẢNG VIÊN ĐÁNH GIÁ:", portalData?.lecturer.fullName || "Giảng viên", "NGƯỠNG ĐẠT CHUẨN:", `${threshold}%`],
      [],
      ["STT", "Mã CLO", "Mô tả Chuẩn đầu ra", "Tỷ lệ đạt của Giảng viên (%)", "Tỷ lệ đạt bình quân môn (%)", "Kết quả"],
      ...currentCourse.clos.map((clo, idx) => {
        const rate = clo.myRate;
        const status = rate === null ? "Chưa đánh giá" : rate >= threshold ? "ĐẠT" : "CHƯA ĐẠT";
        return [
          idx + 1,
          clo.code,
          clo.description,
          rate === null ? "Chưa nhập" : `${rate}%`,
          clo.averageRate === null ? "Chưa có dữ liệu" : `${clo.averageRate}%`,
          status,
        ];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 45 },
      { wch: 28 },
      { wch: 28 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "BAO_CAO_CLO");
    XLSX.writeFile(workbook, `Bao-cao-danh-gia-CLO-${currentCourse.code}-${selectedYear}.xlsx`);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Banner Chào Giảng viên & Bộ chọn năm học */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-700 via-sky-700 to-teal-700 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles size={14} className="text-amber-300" />
                Không gian làm việc Giảng viên (Lecturer Portal)
              </div>
              <h1 className="mt-2 text-2xl font-bold md:text-3xl">
                Xin chào, {portalData?.lecturer.fullName || "Quý Giảng viên"}!
              </h1>
              <p className="mt-1 text-sm text-blue-100">
                Đánh giá mức độ đạt Chuẩn đầu ra (CLO) cho các học phần mà Quý Thầy/Cô trực tiếp phụ trách giảng dạy.
              </p>
            </div>

            {/* Năm học selector */}
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <Calendar size={20} className="text-amber-300 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Năm học đánh giá</p>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="mt-1 rounded-lg border border-white/20 bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      Năm học {y} - {y + 1}
                    </option>
                  ))}
                  {!years.includes(new Date().getFullYear()) && (
                    <option value={new Date().getFullYear()}>
                      Năm học {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 3 Thẻ thống kê nhanh */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-3.5 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 text-white">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium">Học phần phụ trách</p>
                <p className="text-2xl font-black">{stats.total} môn</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-emerald-500/20 p-3.5 backdrop-blur-sm border border-emerald-400/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/40 text-emerald-100">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-emerald-100 font-medium">Đã hoàn thành đánh giá</p>
                <p className="text-2xl font-black">{stats.completed} môn</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-amber-500/20 p-3.5 backdrop-blur-sm border border-amber-400/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/40 text-amber-100">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-amber-100 font-medium">Chưa hoàn thành</p>
                <p className="text-2xl font-black">{stats.pending} môn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo thông điệp */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        {/* Nội dung chính: Cột trái (Danh sách môn) & Cột phải (Chi tiết đánh giá) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột trái: Danh sách môn học phụ trách (4 cột) */}
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="flex items-center gap-2 font-bold text-slate-800">
                  <Layers size={18} className="text-blue-600" />
                  Môn học phụ trách ({stats.total})
                </h2>
                <button
                  onClick={() => void loadMyCourses(selectedYear)}
                  disabled={loading}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  title="Làm mới danh sách"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">Đang tải danh sách học phần...</div>
              ) : portalData?.courses.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                  Chưa có học phần nào được phân công trong năm học {selectedYear}.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {portalData?.courses.map((course) => {
                    const isSelected = course.id === selectedCourseId;
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => selectCourse(course)}
                        className={`w-full text-left rounded-xl p-3.5 transition border ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                              {course.code}
                            </span>
                            <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                              {course.name}
                            </h3>
                          </div>
                          {course.isEvaluated ? (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 size={12} /> Đã đánh giá
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                              <Clock size={12} /> {course.evaluatedCloCount}/{course.totalCloCount} CLO
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100/80 pt-2">
                          <span>{course.credits} tín chỉ • HK {course.semester || "Chưa xếp"}</span>
                          <span className="truncate max-w-[140px] text-slate-600 font-medium">
                            {course.major.code}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Bảng đánh giá CLO của môn đang chọn (8 cột) */}
          <div className="space-y-4 lg:col-span-8">
            {currentCourse ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                {/* Header môn học & Thanh công cụ */}
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">
                        {currentCourse.code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Ngành: {currentCourse.major.name}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-xl font-bold text-slate-900">
                      {currentCourse.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Số tín chỉ: <strong className="text-slate-700">{currentCourse.credits}</strong> • Số chuẩn đầu ra:{" "}
                      <strong className="text-slate-700">{currentCourse.clos.length} CLO</strong>
                    </p>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadDynamicTemplate}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      title="Tải file Excel mẫu gồm các cột CLO của môn này"
                    >
                      <Download size={14} className="text-blue-600" />
                      Tải mẫu Excel
                    </button>

                    <label
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                      title="Tải lên bảng điểm lớp để hệ thống tự động tính % đạt CLO"
                    >
                      <Upload size={14} className="text-emerald-700" />
                      Tải bảng điểm lớp
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleUploadStudentScores}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleExportCourseReport}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      title="Xuất phiếu báo cáo đánh giá học phần ra Excel"
                    >
                      <FileSpreadsheet size={14} className="text-teal-600" />
                      Xuất báo cáo
                    </button>
                  </div>
                </div>

                {/* Kết quả phân tích tự động từ Excel (nếu có) */}
                {excelSummary && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="font-bold text-emerald-900 text-sm">
                          Kết quả tự động đọc bảng điểm: {excelSummary.fileName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">
                        Sĩ số: {excelSummary.studentCount} sinh viên
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {excelSummary.results.map((r) => (
                        <div key={r.cloCode} className="rounded-lg bg-white p-2.5 shadow-sm border border-emerald-100">
                          <p className="text-xs font-bold text-slate-600">{r.cloCode}</p>
                          <p className="text-lg font-black text-emerald-700">{r.rate}%</p>
                          <p className="text-[11px] text-slate-500">
                            {r.passCount}/{r.totalCount} SV đạt
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bảng nhập đánh giá CLO */}
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Danh sách Chuẩn đầu ra (CLO) & Tỷ lệ đạt
                    </h3>
                    <span className="text-xs text-slate-500">
                      Ngưỡng đạt khuyến nghị: <strong className="text-blue-700">75%</strong>
                    </span>
                  </div>

                  {currentCourse.clos.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500 border rounded-lg bg-slate-50">
                      Học phần này chưa được gán chuẩn đầu ra (CLO) trong CTĐT.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">STT</th>
                            <th className="px-4 py-3 w-28">Mã CLO</th>
                            <th className="px-4 py-3">Mô tả chuẩn đầu ra</th>
                            <th className="px-4 py-3 w-32 text-center">Tỷ lệ đạt bộ môn</th>
                            <th className="px-4 py-3 w-44 text-center">
                              Tỷ lệ của bạn (%) <span className="text-red-500">*</span>
                            </th>
                            <th className="px-4 py-3 w-28 text-center">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentCourse.clos.map((clo, index) => {
                            const valStr = draftRates[clo.id] ?? "";
                            const valNum = valStr === "" ? null : Number(valStr);
                            const isPassed = valNum !== null && valNum >= 75;

                            return (
                              <tr key={clo.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-center text-slate-400 font-medium">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">
                                  {clo.code}
                                </td>
                                <td className="px-4 py-3 text-slate-700 text-xs leading-relaxed">
                                  {clo.description}
                                </td>
                                <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">
                                  {clo.averageRate !== null ? (
                                    <span className="font-semibold text-slate-700">
                                      {clo.averageRate}%
                                      <span className="block text-[10px] text-slate-400 font-normal">
                                        ({clo.lecturerCount} GV)
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step="0.1"
                                      placeholder="0 - 100"
                                      value={valStr}
                                      onChange={(e) => handleRateChange(clo.id, e.target.value)}
                                      className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center text-sm font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <span className="text-xs font-semibold text-slate-500">%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  {valNum === null ? (
                                    <span className="inline-block rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                      Chưa nhập
                                    </span>
                                  ) : isPassed ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                                      <CheckCircle2 size={13} /> ĐẠT
                                    </span>
                                  ) : (
                                    <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                      CHƯA ĐẠT
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Nút Lưu kết quả */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || currentCourse.clos.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 disabled:opacity-50 transition"
                  >
                    <Save size={16} />
                    {saving ? "Đang lưu..." : "Lưu đánh giá học phần"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Vui lòng chọn một học phần ở cột bên trái để bắt đầu đánh giá.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
