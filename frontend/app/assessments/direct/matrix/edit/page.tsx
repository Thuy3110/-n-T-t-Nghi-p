"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Download,
  Save,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

interface PLOItem {
  id: number;
  code: string;
  description: string;
}

interface CourseItem {
  id: number;
  code: string;
  name: string;
  credits: number;
}

const levelCodes: Record<number, string> = { 1: "I", 2: "R", 3: "M", 4: "A" };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function parseRecord(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") return {};

  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`Dữ liệu ${fieldName} từ máy chủ không hợp lệ.`);
    }
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error(`Dữ liệu ${fieldName} từ máy chủ không hợp lệ.`);
  }

  return parsed as Record<string, unknown>;
}

function normalizeCourses(value: unknown): CourseItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (course): course is Record<string, unknown> =>
        course !== null &&
        typeof course === "object" &&
        Number.isInteger(course.id) &&
        typeof course.code === "string" &&
        typeof course.name === "string"
    )
    .map((course) => ({
      id: Number(course.id),
      code: String(course.code),
      name: String(course.name),
      credits: Number(course.credits ?? 0),
    }));
}

function normalizePlos(value: unknown): PLOItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (plo): plo is Record<string, unknown> =>
        plo !== null &&
        typeof plo === "object" &&
        Number.isInteger(plo.id) &&
        typeof plo.code === "string"
    )
    .map((plo) => ({
      id: Number(plo.id),
      code: String(plo.code),
      description:
        typeof plo.description === "string" ? plo.description : "",
    }));
}

function normalizeMatrix(value: unknown) {
  const record = parseRecord(value, "ma trận");
  const matrix: Record<string, number | null> = {};

  for (const [key, cell] of Object.entries(record)) {
    if (cell === null || cell === 1 || cell === 2 || cell === 3 || cell === 4) {
      matrix[key] = cell;
    } else {
      throw new Error(`Giá trị ô ma trận "${key}" không hợp lệ.`);
    }
  }

  return matrix;
}

function formatUpdatedAt(value: unknown) {
  if (typeof value !== "string") return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function MatrixEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorId = searchParams.get("id") || "";
  const cohortParam = searchParams.get("cohort") || "K25-2025";
  const cohortYear = cohortParam.match(/\d{4}/)?.[0] || "2025";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [majorCode, setMajorCode] = useState("");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [plos, setPlos] = useState<PLOItem[]>([]);
  const [enabledCourses, setEnabledCourses] = useState<Record<string, boolean>>({});
  const [matrix, setMatrix] = useState<Record<string, number | null>>({});
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const parsedMajorId = Number(majorId);

    async function loadMajor() {
      setDataLoaded(false);
      setLoading(true);
      setError("");

      if (
        !majorId ||
        !Number.isInteger(parsedMajorId) ||
        parsedMajorId <= 0
      ) {
        setError("Vui lòng chọn ngành từ danh sách trước khi mở ma trận.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/majors/${parsedMajorId}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            `Không tải được dữ liệu ngành (HTTP ${response.status}).`
          );
        }

        const data: unknown = await response.json();
        if (data === null || typeof data !== "object") {
          throw new Error("Không tìm thấy dữ liệu ngành được yêu cầu.");
        }

        const major = data as Record<string, unknown>;
        const loadedCourses = normalizeCourses(major.courses);
        const loadedPlos = normalizePlos(major.plos);
        const loadedMatrix = normalizeMatrix(major.matrixData);
        const savedEnabled = parseRecord(
          major.enabledCoursesData,
          "trạng thái học phần"
        );
        const loadedEnabled: Record<string, boolean> = {};

        for (const course of loadedCourses) {
          const enabled =
            savedEnabled[course.code] !== false &&
            savedEnabled[String(course.id)] !== false;
          loadedEnabled[course.code] = enabled;
          loadedEnabled[String(course.id)] = enabled;
        }

        setMajorCode(String(major.majorCode ?? major.code ?? ""));
        setCourses(loadedCourses);
        setPlos(loadedPlos);
        setMatrix(loadedMatrix);
        setEnabledCourses(loadedEnabled);
        setLastUpdated(formatUpdatedAt(major.updatedAt));
        setDataLoaded(true);
      } catch (cause) {
        if (
          cause instanceof Error &&
          cause.name === "AbortError"
        ) {
          return;
        }

        console.error("Lỗi tải dữ liệu ma trận:", cause);
        setMajorCode("");
        setCourses([]);
        setPlos([]);
        setMatrix({});
        setEnabledCourses({});
        setLastUpdated("");
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể tải dữ liệu ma trận."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMajor();
    return () => controller.abort();
  }, [majorId]);

  const isCourseEnabled = (course: CourseItem) => {
    if (enabledCourses[course.code] !== undefined) return enabledCourses[course.code];
    if (enabledCourses[String(course.id)] !== undefined) return enabledCourses[String(course.id)];
    return true;
  };

  const handleToggleCourse = (course: CourseItem) => {
    const currentStatus = isCourseEnabled(course);
    const newStatus = !currentStatus;
    setEnabledCourses((prev) => ({
      ...prev,
      [course.code]: newStatus,
      [String(course.id)]: newStatus,
    }));
  };

  const getCellValue = (course: CourseItem, plo: PLOItem) => {
    const codeKey = `${course.code}-${plo.code}`;
    const idKey = `${course.id}-${plo.id}`;
    if (matrix[codeKey] !== undefined) return matrix[codeKey];
    if (matrix[idKey] !== undefined) return matrix[idKey];
    return null;
  };

  // Click handler to cycle values through I, R, M, A, then clear.
  const handleCellClick = (course: CourseItem, plo: PLOItem) => {
    if (!isCourseEnabled(course)) return; // Disallow edits on disabled rows
    const codeKey = `${course.code}-${plo.code}`;
    const idKey = `${course.id}-${plo.id}`;
    const currentVal = getCellValue(course, plo);

    let newVal: number | null = null;
    if (currentVal === undefined || currentVal === null) {
      newVal = 1;
    } else if (currentVal === 1) {
      newVal = 2;
    } else if (currentVal === 2) {
      newVal = 3;
    } else if (currentVal === 3) {
      newVal = 4;
    } else if (currentVal === 4) {
      newVal = null;
    }

    setMatrix((prev) => ({
      ...prev,
      [codeKey]: newVal,
      [idKey]: newVal,
    }));
  };

  const handleSave = async () => {
    if (!majorId || !dataLoaded) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/majors/${majorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixData: JSON.stringify(matrix),
          enabledCoursesData: JSON.stringify(enabledCourses),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          `Không lưu được ma trận (HTTP ${response.status}). ${message}`
        );
      }

      const updated: unknown = await response.json();
      const updatedAt =
        updated !== null && typeof updated === "object"
          ? (updated as Record<string, unknown>).updatedAt
          : undefined;
      setLastUpdated(
        formatUpdatedAt(updatedAt) ||
          new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date())
      );
      alert("Lưu thay đổi ma trận CĐR thành công!");
      router.push("/assessments/direct/matrix");
    } catch (cause) {
      console.error("Lỗi lưu ma trận CĐR:", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể lưu ma trận CĐR."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/assessments/direct/matrix");
  };

  const handleExportExcel = () => {
    let csv = "MAMH,Tên môn học," + plos.map((p) => p.code).join(",") + "\n";
    courses.forEach((c) => {
      const row = [
        c.code,
        `"${c.name}"`,
        ...plos.map((p) => getCellValue(c, p) || ""),
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ma_tran_CDR_Nganh_${majorCode}_Khoa_${cohortYear}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="px-8 py-20 flex flex-col items-center justify-center text-slate-400 font-medium w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#165aa7] mb-3"></div>
        Đang tải dữ liệu ma trận...
      </div>
    );
  }

  return (
    <div className="px-8 pt-6 pb-16 bg-[#F8FAFC] min-h-screen font-sans w-full flex flex-col">
      {/* Top Header Section */}
      <div className="flex flex-col gap-1 mb-6">
        {/* Breadcrumb */}
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Link href="/assessments/direct/matrix" className="hover:text-slate-600 transition">
            ĐÀO TẠO
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-500">MA TRẬN CĐR</span>
        </div>

        {/* Title, Badges & Top Actions */}
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
              Chỉnh sửa Ma trận CĐR
            </h1>
            <div className="flex items-center gap-2 mt-3 select-none">
              <span
                className="bg-[#E6F4EA] text-[#137333] rounded-full uppercase"
                style={{
                  padding: "4px 14px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  border: "1px solid #c2e7cc",
                }}
              >
                NGÀNH {majorCode}
              </span>
              <span
                className="bg-[#f1f5f9] text-[#475569] rounded-full uppercase"
                style={{
                  padding: "4px 14px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  border: "1px solid #e2e8f0",
                }}
              >
                KHÓA {cohortYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={courses.length === 0}
              className="h-[38px] px-4 rounded-xl border border-slate-200 bg-white flex items-center gap-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              <Download size={15} className="text-slate-500" />
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dataLoaded}
              className="h-[38px] px-5 rounded-xl bg-[#165aa7] text-white flex items-center gap-2 text-[12.5px] font-bold hover:bg-[#124983] transition shadow-md shadow-[#165aa7]/15 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Đang lưu..." : "Lưu lại"}
            </button>
          </div>
        </div>
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

      {/* Main Table Card */}
      <div
        className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-slate-100"
        style={{ boxShadow: "0 10px 30px -8px rgba(15, 23, 42, 0.05)" }}
      >
        {/* Table Header Bar */}
        <div
          className="flex items-center justify-between border-b border-slate-100/90"
          style={{ height: "70px", paddingLeft: "32px", paddingRight: "32px" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#165aa7] rounded-full"></span>
            <h3 className="text-[15px] font-extrabold text-slate-800">
              Bảng chi tiết Ma trận học phần
            </h3>
          </div>

          <div className="flex items-center gap-4 text-[12px] font-medium select-none">
          {[
            ["I", "Introduce", "#ea580c"],
            ["R", "Reinforce", "#fbbf24"],
            ["M", "Mastery", "#059669"],
            ["A", "Assessment", "#165aa7"],
          ].map(([code, label, color]) => (
            <div key={code} className="flex items-center gap-2 text-slate-600">
              <span className="h-3.5 w-3.5 rounded-[3px]" style={{ backgroundColor: color }} />
              <span className="font-semibold text-slate-600 text-[12px]">{code} - {label}</span>
            </div>
          ))}
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
              title="Bộ lọc"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto" style={{ paddingLeft: "28px", paddingRight: "28px" }}>
          <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-slate-100 text-[12px] font-extrabold text-slate-600 select-none">
                <th className="text-center" style={{ width: "90px", padding: "18px 8px" }}>
                  CHỌN
                </th>
                <th className="text-left" style={{ width: "130px", padding: "18px 16px" }}>
                  MAMH
                </th>
                <th className="text-left" style={{ width: "32%", padding: "18px 16px" }}>
                  TÊN MÔN HỌC
                </th>
                {plos.map((plo) => (
                  <th
                    key={plo.id}
                    className="text-center bg-[#F4F9FD]/60 font-extrabold text-slate-700"
                    style={{ width: "85px", padding: "18px 4px" }}
                    title={plo.description}
                  >
                    {plo.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {courses.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + plos.length}
                    className="px-5 py-16 text-center text-sm text-slate-400"
                  >
                    {error
                      ? "Không có dữ liệu ma trận để hiển thị."
                      : "Ngành này chưa có học phần trong dữ liệu ma trận."}
                  </td>
                </tr>
              )}
              {courses.map((course) => {
                const isEnabled = isCourseEnabled(course);

                return (
                  <tr
                    key={course.id}
                    className={`transition-colors duration-150 ${
                      isEnabled ? "hover:bg-slate-50/40" : "bg-white"
                    }`}
                  >
                    {/* Toggle Switch */}
                    <td className="text-center align-middle" style={{ padding: "18px 8px" }}>
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCourse(course)}
                          style={{
                            width: "42px",
                            height: "22px",
                            borderRadius: "11px",
                            position: "relative",
                            cursor: "pointer",
                            border: "none",
                            backgroundColor: isEnabled ? "#165aa7" : "#cbd5e1",
                            padding: 0,
                            transition: "background-color 0.2s ease-in-out",
                            outline: "none",
                            display: "block",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: "2px",
                              backgroundColor: "#ffffff",
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              boxShadow:
                                "0 1px 3px rgba(15, 23, 42, 0.2), 0 1px 2px rgba(15, 23, 42, 0.1)",
                              left: isEnabled ? "22px" : "2px",
                              transition: "left 0.2s ease-in-out",
                            }}
                          />
                        </button>
                      </div>
                    </td>

                    {/* Course Code */}
                    <td
                      className="align-middle font-medium text-[13px]"
                      style={{ padding: "18px 16px" }}
                    >
                      <span className={isEnabled ? "text-slate-500 font-semibold" : "text-slate-300 font-medium"}>
                        {course.code}
                      </span>
                    </td>

                    {/* Course Name */}
                    <td
                      className="align-middle text-[13.5px]"
                      style={{ padding: "18px 16px" }}
                    >
                      <span
                        className={
                          isEnabled
                            ? "text-slate-800 font-bold"
                            : "text-slate-400 font-medium"
                        }
                      >
                        {course.name}
                      </span>
                    </td>

                    {/* Matrix Cells */}
                    {plos.map((plo) => {
                      const value = getCellValue(course, plo);
                      const isValueEmpty = value === undefined || value === null;

                      let cellStyle: React.CSSProperties = {
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12.5px",
                        fontWeight: "800",
                        transition: "all 0.15s ease",
                        userSelect: "none",
                        outline: "none",
                        padding: 0,
                      };

                      if (!isEnabled) {
                        // Inactive/disabled row: if value exists, show muted gray circle (matching screenshot)
                        if (!isValueEmpty) {
                          cellStyle = {
                            ...cellStyle,
                            backgroundColor: "#e2e8f0",
                            color: "#94a3b8",
                            border: "none",
                            cursor: "not-allowed",
                          };
                        } else {
                          cellStyle = {
                            ...cellStyle,
                            backgroundColor: "transparent",
                            color: "transparent",
                            border: "none",
                            cursor: "not-allowed",
                          };
                        }
                      } else if (value === 4) {
                        cellStyle = {
                          ...cellStyle,
                          backgroundColor: "#165aa7",
                          color: "#ffffff",
                          border: "1px solid #165aa7",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(22, 90, 167, 0.25)",
                        };
                      } else if (value === 3) {
                        cellStyle = {
                          ...cellStyle,
                          backgroundColor: "#059669",
                          color: "#ffffff",
                          border: "1px solid #059669",
                          cursor: "pointer",
                        };
                      } else if (value === 2) {
                        cellStyle = {
                          ...cellStyle,
                          backgroundColor: "#fbbf24",
                          color: "#ffffff",
                          border: "1px solid #fbbf24",
                          cursor: "pointer",
                        };
                      } else if (value === 1) {
                        cellStyle = {
                          ...cellStyle,
                          backgroundColor: "#ea580c",
                          color: "#ffffff",
                          border: "1px solid #ea580c",
                          cursor: "pointer",
                        };
                      } else {
                        // Empty cell
                        cellStyle = {
                          ...cellStyle,
                          backgroundColor: "transparent",
                          color: "transparent",
                          border: "1px dashed transparent",
                          cursor: "pointer",
                        };
                      }

                      return (
                        <td
                          key={plo.id}
                          className="text-center align-middle"
                          style={{ padding: "18px 4px" }}
                        >
                          <div className="flex justify-center items-center">
                            <button
                              type="button"
                              onClick={() => handleCellClick(course, plo)}
                              disabled={!isEnabled}
                              style={cellStyle}
                              className={
                                isEnabled && isValueEmpty
                                  ? "hover:border-slate-300 hover:text-slate-400"
                                  : ""
                              }
                            >
                              {!isValueEmpty ? (levelCodes[value!] ?? "") : ""}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          style={{
            padding: "18px 32px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#94a3b8",
            userSelect: "none",
          }}
        >
          <span>
            Tổng số{" "}
            <span className="font-semibold text-slate-600">
              {courses.length}
            </span>{" "}
            học phần
          </span>
          <span>
            Cập nhật lần cuối: {lastUpdated || "Chưa có thông tin"}
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "14px",
          marginTop: "28px",
          marginBottom: "40px",
          userSelect: "none",
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="h-[44px] px-7 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-[13px] font-bold text-[#15803d] hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <X size={16} className="text-[#15803d]" />
          Bỏ qua
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dataLoaded}
          className="h-[44px] px-7 rounded-xl bg-[#165aa7] text-white flex items-center justify-center gap-2 text-[13px] font-bold hover:bg-[#124983] transition shadow-md shadow-[#165aa7]/15 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          {saving ? "Đang lưu..." : "Lưu lại thay đổi"}
        </button>
      </div>
    </div>
  );
}

export default function MatrixEditPage() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-20 flex flex-col items-center justify-center text-slate-400 font-medium w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#165aa7] mb-3"></div>
          Đang tải dữ liệu trang...
        </div>
      }
    >
      <MatrixEditForm />
    </Suspense>
  );
}
