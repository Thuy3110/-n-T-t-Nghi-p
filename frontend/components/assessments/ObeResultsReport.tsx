"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  AttainmentStatus,
  getLecturerAssessmentYears,
  getLecturerProgramReport,
  LecturerProgramReport,
} from "@/services/lecturer-assessment.service";

function statusStyle(status: AttainmentStatus) {
  if (status === "Đạt") return "bg-emerald-50 text-emerald-700";
  if (status === "Chưa đạt") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function downloadReport(
  program: LecturerProgramReport["programs"][number],
  majorId: number,
  academicYear: number,
) {
  const major = program.majors.find((item) => item.id === majorId);
  if (!major) return;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      major.plos.map((plo) => ({
        NamHoc: academicYear,
        MaCTDT: program.program.code,
        MaNganh: major.code,
        MaPLO: plo.code,
        MoTaPLO: plo.description,
        TyLeDatPLO: plo.attainmentRate ?? "Chưa có dữ liệu",
        NguongDat: major.evaluation.threshold,
        KetQua: plo.status,
      })),
    ),
    "PLO",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      major.cloAssessments.map((assessment) => ({
        NamHoc: academicYear,
        MaNganh: major.code,
        MaHocPhan: assessment.courseCode,
        TenHocPhan: assessment.courseName,
        MaCLO: assessment.cloCode,
        MoTaCLO: assessment.cloDescription,
        TyLeDatCLOTrungBinh: assessment.averageRate ?? "Chưa có dữ liệu",
        SoGiangVienDanhGia: assessment.lecturerCount,
        DanhGiaGiangVien: assessment.lecturerAssessments
          .map((item) => `${item.lecturerName} (${item.attainmentRate}%)`)
          .join(", "),
      })),
    ),
    "CLO",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      major.cloPloAssessments.map((assessment) => ({
        NamHoc: academicYear,
        MaNganh: major.code,
        MaHocPhan: assessment.courseCode,
        TenHocPhan: assessment.courseName,
        MaCLO: assessment.cloCode,
        TyLeDatCLO: assessment.averageRate ?? "Chưa có dữ liệu",
        MaPLO: assessment.ploCode,
        TyLeDatPLO: assessment.ploAttainmentRate ?? "Chưa có dữ liệu",
        MucDongGop: assessment.contributionLevel,
        KetQuaPLO: assessment.ploStatus,
      })),
    ),
    "CLO_PLO",
  );
  XLSX.writeFile(
    workbook,
    `Bao-cao-OBE-${major.code}-${academicYear}.xlsx`,
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const majorId = Number(
    searchParams.get("id") ?? searchParams.get("majorId") ?? "",
  );
  const cohortParam = searchParams.get("cohort") ?? "";
  const requestedYear =
    Number(cohortParam.match(/\d{4}/)?.[0]) || null;

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [report, setReport] = useState<LecturerProgramReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getLecturerAssessmentYears()
      .then((availableYears) => {
        if (!active) return;
        const ordered = [...availableYears].sort((a, b) => b - a);
        const initialYear =
          requestedYear ?? ordered[0] ?? new Date().getFullYear();
        setYears(
          ordered.includes(initialYear)
            ? ordered
            : [initialYear, ...ordered],
        );
        setSelectedYear(initialYear);
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải năm học báo cáo OBE:", cause);
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không tải được danh sách năm học đánh giá.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [requestedYear]);

  useEffect(() => {
    if (selectedYear === null) return;
    let active = true;

    void getLecturerProgramReport(selectedYear)
      .then((result) => {
        if (active) setReport(result);
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải dữ liệu báo cáo OBE:", cause);
        if (active) {
          setReport(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Không tải được dữ liệu báo cáo OBE.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear]);

  const selectedProgram = useMemo(
    () =>
      report?.programs.find((item) =>
        item.majors.some((major) => major.id === majorId),
      ) ?? null,
    [majorId, report],
  );
  const selectedMajor =
    selectedProgram?.majors.find((major) => major.id === majorId) ?? null;

  const refresh = () => {
    if (selectedYear === null) return;
    setLoading(true);
    setError("");
    void getLecturerProgramReport(selectedYear)
      .then(setReport)
      .catch((cause: unknown) => {
        console.error("Lỗi làm mới báo cáo OBE:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không tải được dữ liệu báo cáo OBE.",
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/assessments/direct/analysis/courses"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              <ArrowLeft size={16} />
              Quay lại phân tích dữ liệu
            </Link>
            <p className="text-sm font-medium text-blue-700">
              Đánh giá chuẩn đầu ra theo OBE
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Báo cáo CLO – PLO
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Báo cáo tổng hợp tỷ lệ CLO do giảng viên lưu và kết quả PLO được
              tính theo ma trận đóng góp. Không cần dữ liệu điểm riêng từng
              sinh viên.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
              Năm học đánh giá
              <select
                value={selectedYear ?? ""}
                onChange={(event) => {
                  setLoading(true);
                  setError("");
                  setSelectedYear(Number(event.target.value));
                }}
                disabled={!years.length}
                className="h-11 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                selectedProgram &&
                selectedYear !== null &&
                downloadReport(selectedProgram, majorId, selectedYear)
              }
              disabled={!selectedProgram || !selectedMajor || loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              <Download size={16} />
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={loading || selectedYear === null}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Đang tải báo cáo OBE...
          </div>
        ) : !error && !selectedMajor ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800"
          >
            Không tìm thấy ngành phù hợp với mã ngành trong đường dẫn báo cáo.
            Vui lòng quay lại danh sách học phần và mở báo cáo từ đúng ngành.
          </div>
        ) : (
          selectedProgram &&
          selectedMajor && (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {selectedProgram.program.code} · {selectedMajor.code} ·{" "}
                      Năm học {selectedYear}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedProgram.program.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Ngành: {selectedMajor.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyle(selectedMajor.evaluation.status)}`}
                    >
                      Ngành: {selectedMajor.evaluation.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyle(selectedProgram.evaluation.status)}`}
                    >
                      CTĐT: {selectedProgram.evaluation.status}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Ngưỡng PLO: {selectedMajor.evaluation.threshold}% · Tỷ lệ PLO
                  bình quân:{" "}
                  {selectedMajor.evaluation.averagePloRate === null
                    ? "Chưa có dữ liệu"
                    : `${selectedMajor.evaluation.averagePloRate}%`}
                </p>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <CheckCircle2 size={19} className="text-blue-700" />
                    Kết quả PLO của ngành
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    PLO được tính từ tỷ lệ CLO đã đánh giá và trọng số trong ma
                    trận CLO–PLO.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Mã PLO</th>
                        <th className="px-5 py-3">Mô tả</th>
                        <th className="px-5 py-3">Tỷ lệ đạt</th>
                        <th className="px-5 py-3">Ngưỡng</th>
                        <th className="px-5 py-3">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMajor.plos.map((plo) => (
                        <tr key={plo.id}>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {plo.code}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {plo.description}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {plo.attainmentRate === null
                              ? "Chưa có dữ liệu"
                              : `${plo.attainmentRate}%`}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {selectedMajor.evaluation.threshold}%
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(plo.status)}`}
                            >
                              {plo.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {selectedMajor.plos.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-6 text-center text-slate-500"
                          >
                            Ngành chưa khai báo PLO.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Chi tiết đánh giá CLO theo học phần
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tỷ lệ CLO là trung bình kết quả giảng viên đã lưu trong năm
                    học được chọn.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Học phần</th>
                        <th className="px-5 py-3">CLO</th>
                        <th className="px-5 py-3">Mô tả CLO</th>
                        <th className="px-5 py-3">Tỷ lệ đạt CLO</th>
                        <th className="px-5 py-3">Số GV đánh giá</th>
                        <th className="px-5 py-3">Người đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMajor.cloAssessments.map((assessment) => (
                        <tr
                          key={`${assessment.courseId}-${assessment.cloId}`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-slate-800">
                              {assessment.courseCode}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {assessment.courseName}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-blue-700">
                            {assessment.cloCode}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {assessment.cloDescription}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {assessment.averageRate === null
                              ? "Chưa có dữ liệu"
                              : `${assessment.averageRate}%`}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {assessment.lecturerCount}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {assessment.lecturerAssessments.length
                              ? assessment.lecturerAssessments
                                  .map(
                                    (item) =>
                                      `${item.lecturerName} (${item.attainmentRate}%)`,
                                  )
                                  .join(", ")
                              : "Chưa có đánh giá"}
                          </td>
                        </tr>
                      ))}
                      {selectedMajor.cloAssessments.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-6 text-center text-slate-500"
                          >
                            Chưa có dữ liệu đánh giá CLO cho năm học này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Liên kết đóng góp CLO–PLO
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chi tiết tỷ lệ CLO được dùng để tính PLO và mức đóng góp
                    theo ma trận.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Học phần</th>
                        <th className="px-5 py-3">CLO</th>
                        <th className="px-5 py-3">Tỷ lệ CLO</th>
                        <th className="px-5 py-3">PLO</th>
                        <th className="px-5 py-3">Tỷ lệ PLO</th>
                        <th className="px-5 py-3">Mức đóng góp</th>
                        <th className="px-5 py-3">Kết quả PLO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMajor.cloPloAssessments.map((item, index) => (
                        <tr
                          key={`${item.courseId}-${item.cloId}-${item.ploCode}-${index}`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-slate-800">
                              {item.courseCode}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {item.courseName}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-blue-700">
                            {item.cloCode}
                          </td>
                          <td className="px-5 py-3">
                            {item.averageRate === null
                              ? "Chưa có dữ liệu"
                              : `${item.averageRate}%`}
                          </td>
                          <td className="px-5 py-3 font-semibold text-indigo-700">
                            {item.ploCode}
                          </td>
                          <td className="px-5 py-3">
                            {item.ploAttainmentRate === null
                              ? "Chưa có dữ liệu"
                              : `${item.ploAttainmentRate}%`}
                          </td>
                          <td className="px-5 py-3">
                            {item.contributionLevel}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(item.ploStatus)}`}
                            >
                              {item.ploStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {selectedMajor.cloPloAssessments.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-6 text-center text-slate-500"
                          >
                            Chưa có liên kết CLO–PLO hoặc chưa có dữ liệu đánh
                            giá cho năm học này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        )}
    </div>
  );
}

export default function ObeResultsReport() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-slate-500">
          Đang khởi tạo báo cáo OBE...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
