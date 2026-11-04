"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  Download,
  Save,
} from "lucide-react";
import { getMajors } from "@/services/major.service";
import {
  getLecturerAssessmentYears,
  getMajorLecturerAssessments,
  LecturerCourseAssessment,
  MajorLecturerAssessments,
  saveLecturerAssessments,
} from "@/services/lecturer-assessment.service";

type MajorOption = Awaited<ReturnType<typeof getMajors>>[number] & {
  years?: number[];
};

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

function exportAssessments(data: MajorLecturerAssessments) {
  const workbook = XLSX.utils.book_new();
  const summaryRows = data.courses.flatMap((course) =>
    course.clos.map((clo) => ({
      MaNganh: data.major.code,
      TenNganh: data.major.name,
      NamHoc: data.academicYear,
      MaHocPhan: course.code,
      TenHocPhan: course.name,
      MaCLO: clo.code,
      MoTaCLO: clo.description,
      TyLeDatCLOTrungBinh: clo.averageRate ?? "Chưa có dữ liệu",
      SoGiangVienDanhGia: clo.lecturerCount,
    })),
  );
  const lecturerRows = data.courses.flatMap((course) =>
    course.clos.flatMap((clo) =>
      clo.lecturerAssessments.map((assessment) => ({
        MaNganh: data.major.code,
        NamHoc: data.academicYear,
        MaHocPhan: course.code,
        TenHocPhan: course.name,
        MaCLO: clo.code,
        MoTaCLO: clo.description,
        GiangVienDanhGia: assessment.lecturerName,
        TyLeDatCLO: assessment.attainmentRate,
        CapNhatLuc: assessment.updatedAt,
      })),
    ),
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows, {
      header: [
        "MaNganh",
        "TenNganh",
        "NamHoc",
        "MaHocPhan",
        "TenHocPhan",
        "MaCLO",
        "MoTaCLO",
        "TyLeDatCLOTrungBinh",
        "SoGiangVienDanhGia",
      ],
    }),
    "TONG_HOP_CLO",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(lecturerRows, {
      header: [
        "MaNganh",
        "NamHoc",
        "MaHocPhan",
        "TenHocPhan",
        "MaCLO",
        "MoTaCLO",
        "GiangVienDanhGia",
        "TyLeDatCLO",
        "CapNhatLuc",
      ],
    }),
    "CHI_TIET_GIANG_VIEN",
  );
  XLSX.writeFile(
    workbook,
    `Danh-gia-giang-vien-${data.major.code}-${data.academicYear}.xlsx`,
  );
}

function makeDraft(courses: LecturerCourseAssessment[]) {
  const draft: Record<string, string> = {};
  for (const course of courses) {
    for (const clo of course.clos) {
      draft[`${course.id}:${clo.id}`] =
        clo.myRate === null ? "" : String(clo.myRate);
    }
  }
  return draft;
}

export default function LecturerAssessmentPage() {
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [assessmentYears, setAssessmentYears] = useState<number[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [data, setData] = useState<MajorLecturerAssessments | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getMajors(), getLecturerAssessmentYears()])
      .then(([majorOptions, years]) => {
        if (!active) return;
        setMajors(majorOptions);
        setAssessmentYears(years);
        setSelectedMajorId(
          majorOptions.length ? String(majorOptions[0].id) : "",
        );
        setSelectedYear(years[0] ?? new Date().getFullYear());
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải ngành/năm học đánh giá:", cause);
        if (active) {
          setError(
            getErrorMessage(cause, "Không thể tải danh sách ngành và năm học."),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadAssessments = useCallback(
    async (majorId: number, academicYear: number) => {
      const result = await getMajorLecturerAssessments(majorId, academicYear);
      setData(result);
      setDraft(makeDraft(result.courses));
    },
    [],
  );

  const handleMajorChange = (majorId: string) => {
    setLoadingAssessments(true);
    setError("");
    setNotice("");
    setSelectedMajorId(majorId);
  };

  const handleYearChange = (academicYear: number) => {
    setLoadingAssessments(true);
    setError("");
    setNotice("");
    setSelectedYear(academicYear);
  };

  useEffect(() => {
    const majorId = Number(selectedMajorId);
    if (!Number.isInteger(majorId) || majorId <= 0 || selectedYear === null) {
      return;
    }

    let active = true;
    void getMajorLecturerAssessments(majorId, selectedYear)
      .then((result) => {
        if (!active) return;
        setData(result);
        setDraft(makeDraft(result.courses));
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải đánh giá CLO của giảng viên:", cause);
        if (active) {
          setData(null);
          setError(
            getErrorMessage(cause, "Không thể tải đánh giá CLO của ngành."),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingAssessments(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMajorId, selectedYear]);

  const years = useMemo(() => {
    const result = new Set(assessmentYears);
    result.add(new Date().getFullYear());
    for (const major of majors) {
      for (const year of major.years ?? []) result.add(year);
    }
    return [...result].sort((a, b) => b - a);
  }, [assessmentYears, majors]);

  async function submitAssessments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const assessments = data.courses.flatMap((course) =>
        course.clos.map((clo) => {
          const value = draft[`${course.id}:${clo.id}`]?.trim() ?? "";
          return {
            courseId: course.id,
            cloId: clo.id,
            attainmentRate: value === "" ? null : Number(value),
          };
        }),
      );
      const result = await saveLecturerAssessments({
        majorId: data.major.id,
        academicYear: data.academicYear,
        assessments,
      });
      setNotice(`${result.message} (${result.savedCount} CLO có tỷ lệ đánh giá).`);
      await loadAssessments(data.major.id, data.academicYear);
      setAssessmentYears((current) =>
        current.includes(data.academicYear)
          ? current
          : [data.academicYear, ...current].sort((a, b) => b - a),
      );
    } catch (cause) {
      console.error("Lỗi lưu đánh giá CLO của giảng viên:", cause);
      setError(
        getErrorMessage(cause, "Không thể lưu đánh giá CLO."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">
            Đo lường - Đánh giá CĐR trực tiếp
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Đánh giá CLO của giảng viên
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Nhập tỷ lệ đạt CLO theo học phần và năm học. Kết quả được lưu gắn
            với tài khoản giảng viên; khi nhiều giảng viên cùng đánh giá, hệ
            thống hiển thị thêm tỷ lệ trung bình.
          </p>
        </div>
        <button
          type="button"
          disabled={!data || loadingAssessments}
          onClick={() => data && exportAssessments(data)}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={17} />
          Xuất Excel
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      <section className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Ngành đào tạo
          <select
            value={selectedMajorId}
            onChange={(event) => handleMajorChange(event.target.value)}
            disabled={loadingOptions}
            className="min-w-64 rounded-lg border border-slate-300 px-3 py-2"
          >
            {majors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.majorCode} - {major.majorName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Năm học
          <select
            value={selectedYear ?? ""}
            onChange={(event) => handleYearChange(Number(event.target.value))}
            disabled={loadingOptions}
            className="min-w-40 rounded-lg border border-slate-300 px-3 py-2"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loadingAssessments ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Đang tải danh sách CLO...
        </div>
      ) : data ? (
        <form onSubmit={submitAssessments} className="space-y-5">
          {data.courses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Ngành chưa có học phần hoặc CLO được liên kết với học phần.
            </div>
          ) : (
            data.courses.map((course) => (
              <section
                key={course.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">
                    {course.code} - {course.name}
                  </h2>
                  {course.semester !== null && (
                    <p className="mt-1 text-xs text-slate-500">
                      Học kỳ {course.semester}
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">CLO</th>
                        <th className="px-5 py-3">Tỷ lệ đạt của bạn (%)</th>
                        <th className="px-5 py-3">Trung bình (%)</th>
                        <th className="px-5 py-3">Giảng viên đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {course.clos.map((clo) => (
                        <tr key={clo.id}>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-slate-800">
                              {clo.code}
                            </span>
                            <p className="mt-1 text-xs text-slate-500">
                              {clo.description}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={draft[`${course.id}:${clo.id}`] ?? ""}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  [`${course.id}:${clo.id}`]:
                                    event.target.value,
                                }))
                              }
                              aria-label={`Tỷ lệ đạt ${clo.code} của giảng viên`}
                              placeholder="0–100"
                              className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                            />
                          </td>
                          <td className="px-5 py-3">
                            {clo.averageRate === null
                              ? "Chưa có dữ liệu"
                              : `${clo.averageRate}%`}
                          </td>
                          <td className="px-5 py-3">
                            {clo.lecturerAssessments.length
                              ? clo.lecturerAssessments
                                  .map(
                                    (assessment) =>
                                      `${assessment.lecturerName} (${assessment.attainmentRate}%)`,
                                  )
                                  .join(", ")
                              : "Chưa có đánh giá"}
                          </td>
                        </tr>
                      ))}
                      {course.clos.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-6 text-center text-slate-500"
                          >
                            Học phần này chưa có CLO được liên kết.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? "Đang lưu..." : "Lưu đánh giá"}
            </button>
          </div>
        </form>
      ) : !error && !loadingOptions && majors.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có ngành đào tạo để đánh giá.
        </div>
      ) : null}
    </main>
  );
}
