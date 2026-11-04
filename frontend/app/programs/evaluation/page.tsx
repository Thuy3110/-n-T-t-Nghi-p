"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Download,
  RefreshCw,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  AttainmentStatus,
  getLecturerAssessmentYears,
  getLecturerProgramReport,
  LecturerProgramReport,
} from "@/services/lecturer-assessment.service";

function statusStyle(status: AttainmentStatus) {
  if (status === "Đạt") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "Chưa đạt") {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function worksheetName(value: string, usedNames: Set<string>) {
  const base = value.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
  let name = base;
  let suffix = 2;
  while (usedNames.has(name.toLowerCase())) {
    const tail = `_${suffix}`;
    name = `${base.slice(0, 31 - tail.length)}${tail}`;
    suffix += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function exportProgramReport(report: LecturerProgramReport) {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const summaryRows = report.programs.map(({ program, evaluation }) => ({
    NamHoc: report.academicYear,
    MaCTDT: program.code,
    TenCTDT: program.name,
    NguongDatPLO: evaluation.threshold,
    KetQuaCTDT: evaluation.status,
  }));
  const majorRows = report.programs.flatMap(({ program, majors }) =>
    majors.map((major) => ({
      NamHoc: report.academicYear,
      MaCTDT: program.code,
      TenCTDT: program.name,
      MaNganh: major.code,
      TenNganh: major.name,
      TyLePLOBinhQuan: major.evaluation.averagePloRate ?? "Chưa có dữ liệu",
      NguongDatPLO: major.evaluation.threshold,
      KetQua: major.evaluation.status,
    })),
  );

  const summarySheet = worksheetName("TONG_HOP_CTDT", usedNames);
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows, {
      header: ["NamHoc", "MaCTDT", "TenCTDT", "NguongDatPLO", "KetQuaCTDT"],
    }),
    summarySheet,
  );
  const majorSummarySheet = worksheetName("DANH_GIA_CTDT", usedNames);
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(majorRows, {
      header: [
        "NamHoc",
        "MaCTDT",
        "TenCTDT",
        "MaNganh",
        "TenNganh",
        "TyLePLOBinhQuan",
        "NguongDatPLO",
        "KetQua",
      ],
    }),
    majorSummarySheet,
  );

  for (const { program, majors } of report.programs) {
    for (const major of majors) {
      const rows = major.cloPloAssessments.map((assessment) => ({
        NamHoc: report.academicYear,
        MaCTDT: program.code,
        MaNganh: major.code,
        TenNganh: major.name,
        MaHocPhan: assessment.courseCode,
        TenHocPhan: assessment.courseName,
        MaCLO: assessment.cloCode,
        MoTaCLO: assessment.cloDescription,
        TyLeDatCLOTrungBinh: assessment.averageRate ?? "Chưa có dữ liệu",
        SoGiangVienDanhGia: assessment.lecturerCount,
        GiangVienDanhGia: assessment.lecturerAssessments
          .map(
            (lecturer) =>
              `${lecturer.lecturerName} (${lecturer.attainmentRate}%)`,
          )
          .join(", "),
        MaPLO: assessment.ploCode,
        TyLeDatPLO: assessment.ploAttainmentRate ?? "Chưa có dữ liệu",
        NguongDatPLO: major.evaluation.threshold,
        KetQuaPLO: assessment.ploStatus,
        MucDongGop: assessment.contributionLevel,
      }));
      const name = worksheetName(`CLO_PLO_${program.code}_${major.code}`, usedNames);
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rows, {
          header: [
            "NamHoc",
            "MaCTDT",
            "MaNganh",
            "TenNganh",
            "MaHocPhan",
            "TenHocPhan",
            "MaCLO",
            "MoTaCLO",
            "TyLeDatCLOTrungBinh",
            "SoGiangVienDanhGia",
            "GiangVienDanhGia",
            "MaPLO",
            "TyLeDatPLO",
            "NguongDatPLO",
            "KetQuaPLO",
            "MucDongGop",
          ],
        }),
        name,
      );
    }
  }

  XLSX.writeFile(
    workbook,
    `Danh-gia-CTDT-${report.academicYear}.xlsx`,
  );
}

export default function ProgramEvaluationPage() {
  const [report, setReport] = useState<LecturerProgramReport | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getLecturerAssessmentYears()
      .then((availableYears) => {
        if (!active) return;
        const orderedYears = [...availableYears].sort((a, b) => b - a);
        setYears(orderedYears);
        setSelectedYear(orderedYears[0] ?? new Date().getFullYear());
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải năm học đánh giá CTĐT:", cause);
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải danh sách năm học đánh giá.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedYear === null) return;
    let active = true;
    void getLecturerProgramReport(selectedYear)
      .then((result) => {
        if (active) {
          setReport(result);
          setYears((current) =>
            current.includes(selectedYear)
              ? current
              : [selectedYear, ...current].sort((a, b) => b - a),
          );
        }
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải kết quả đánh giá chương trình:", cause);
        if (active) {
          setReport(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải kết quả đánh giá chương trình.",
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

  const refreshResults = () => {
    if (selectedYear === null) return;
    setLoading(true);
    setError("");
    void getLecturerProgramReport(selectedYear)
      .then(setReport)
      .catch((cause: unknown) => {
        console.error("Lỗi làm mới kết quả đánh giá chương trình:", cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải kết quả đánh giá chương trình.",
        );
      })
      .finally(() => setLoading(false));
  };

  const achievedCount =
    report?.programs.filter(
      (program) => program.evaluation.status === "Đạt",
    ).length ?? 0;
  const notAchievedCount =
    report?.programs.filter(
      (program) => program.evaluation.status === "Chưa đạt",
    ).length ?? 0;
  const noDataCount =
    report?.programs.filter(
      (program) => program.evaluation.status === "Chưa có dữ liệu",
    ).length ?? 0;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/programs"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              <ArrowLeft size={16} />
              Quản lý CTĐT
            </Link>
            <p className="text-sm font-medium text-blue-700">
              Quản lý dữ liệu đào tạo
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Đánh giá chương trình đào tạo
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Trạng thái được tính từ tỷ lệ CLO do giảng viên đánh giá, quy đổi
              sang PLO theo trọng số ma trận của từng ngành. Kết quả được phân
              tách theo năm học.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/assessments/direct/lecturer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <ClipboardCheck size={17} />
              Nhập đánh giá CLO
            </Link>
            <button
              type="button"
              onClick={() => report && exportProgramReport(report)}
              disabled={!report || loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={refreshResults}
              disabled={loading || selectedYear === null}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          {error && (
            <div
              role="alert"
              className="flex flex-1 items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            Năm học đánh giá
            <select
              value={selectedYear ?? ""}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setSelectedYear(Number(event.target.value));
              }}
              disabled={!years.length}
              className="min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && report && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tổng số CTĐT", value: report.programs.length, tone: "text-slate-900" },
              { label: "Đạt", value: achievedCount, tone: "text-emerald-700" },
              { label: "Chưa đạt", value: notAchievedCount, tone: "text-red-700" },
              { label: "Chưa có dữ liệu", value: noDataCount, tone: "text-amber-700" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className={`mt-2 text-2xl font-bold ${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ClipboardCheck size={20} className="text-blue-700" />
              Kết quả theo chương trình
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              CTĐT chỉ đạt khi tất cả ngành có dữ liệu và tỷ lệ PLO bình quân
              của từng ngành đạt ngưỡng của năm học đã chọn ({report?.threshold ?? 75}%).
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Đang tải kết quả đánh giá...
            </div>
          ) : !error && report?.programs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Chưa có chương trình đào tạo.
            </div>
          ) : (
            !error &&
            report?.programs.map(({ program, evaluation, majors }) => (
              <article
                key={program.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {program.code}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {program.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${statusStyle(evaluation.status)}`}
                  >
                    {evaluation.status === "Đạt" && <CheckCircle2 size={16} />}
                    {evaluation.status}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {majors.map((major) => (
                    <details key={major.id} className="group">
                      <summary className="grid cursor-pointer list-none gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px_100px_130px] sm:items-center">
                        <span>
                          <span className="font-semibold text-slate-800">
                            {major.code}
                          </span>
                          <span className="ml-2 text-slate-600">
                            {major.name}
                          </span>
                        </span>
                        <span className="text-sm text-slate-700">
                          {major.evaluation.averagePloRate === null
                            ? "Chưa có tỷ lệ PLO"
                            : `${major.evaluation.averagePloRate}%`}
                        </span>
                        <span className="text-sm text-slate-500">
                          Ngưỡng {major.evaluation.threshold}%
                        </span>
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(major.evaluation.status)}`}
                        >
                          {major.evaluation.status}
                        </span>
                      </summary>
                      <div className="overflow-x-auto px-5 pb-5">
                        <table className="w-full min-w-[600px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-4 py-3">PLO</th>
                              <th className="px-4 py-3">Tỷ lệ đạt</th>
                              <th className="px-4 py-3">Ngưỡng</th>
                              <th className="px-4 py-3">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {major.plos.map((plo) => (
                              <tr key={plo.id}>
                                <td className="px-4 py-3">
                                  <span className="font-medium text-slate-800">
                                    {plo.code}
                                  </span>
                                  <span className="ml-2 text-slate-500">
                                    {plo.description}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {plo.attainmentRate === null
                                    ? "Chưa có dữ liệu"
                                    : `${plo.attainmentRate}%`}
                                </td>
                                <td className="px-4 py-3">
                                  {major.evaluation.threshold}%
                                </td>
                                <td className="px-4 py-3">{plo.status}</td>
                              </tr>
                            ))}
                            {major.plos.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-5 text-center text-slate-500"
                                >
                                  Ngành chưa khai báo PLO.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                  {majors.length === 0 && (
                    <p className="p-5 text-sm text-slate-500">
                      Chương trình chưa có ngành để đánh giá.
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
