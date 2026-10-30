"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import type { MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Save,
  MoreVertical,
  ArrowLeft,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import Link from "next/link";

// Cấu hình địa chỉ backend trong file .env.local:
// NEXT_PUBLIC_API_URL=http://localhost:3001
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface PLO {
  id: number;
  code: string;
  description?: string | null;
}

interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  majorId: number;
  major?: {
    id: number;
    code: string;
    name: string;
  };
}

interface Major {
  id: number;
  code?: string;
  name?: string;
  majorCode?: string;
  majorName?: string;
  plos?: PLO[];
  matrixData?: string | null;
  enabledCoursesData?: string | null;
}

interface Cohort {
  value: string;
  label: string;
}

function generateCohorts(): Cohort[] {
  const currentYear = new Date().getFullYear();

  return Array.from(
    { length: Math.max(0, currentYear - 2022) },
    (_, index) => {
      const year = currentYear - index;

      return {
        value: `K${String(year).slice(-2)}-${year}`,
        label: `Khóa ${year}`,
      };
    }
  );
}

function getCourseCategory(code: string): string {
  const cleanCode = (code || "").toUpperCase();

  if (cleanCode.startsWith("LLCT") || cleanCode.startsWith("SK")) {
    return "Lý luận chính trị";
  }

  if (
    cleanCode.startsWith("IT") ||
    cleanCode.startsWith("KTPM")
  ) {
    const number = Number.parseInt(
      cleanCode.replace(/^[A-Z]+/i, ""),
      10
    );

    if (!Number.isNaN(number) && number >= 300) {
      return "Học phần chuyên ngành";
    }

    return "Học phần cơ sở ngành";
  }

  return "Học phần đại cương";
}

function parseObject<T>(
  value: string | null | undefined
): T | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as T;
    }

    return null;
  } catch {
    return null;
  }
}

function DataAnalysisForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const majorId = searchParams.get("id") || "";
  const cohortParam =
    searchParams.get("cohort") ||
    `K${String(new Date().getFullYear()).slice(-2)}-${new Date().getFullYear()}`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [major, setMajor] = useState<Major | null>(null);
  const [majorsList, setMajorsList] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [plos, setPlos] = useState<PLO[]>([]);

  const [matrix, setMatrix] = useState<
    Record<string, number | null>
  >({});

  const [enabledCourses, setEnabledCourses] = useState<
    Record<number, boolean>
  >({});

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const cohorts = generateCohorts();

  // 1. Lấy danh sách ngành từ backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadMajors() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/majors`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Không tải được danh sách ngành (HTTP ${response.status})`
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "API /majors không trả về danh sách ngành hợp lệ."
          );
        }

        setMajorsList(data as Major[]);

        // Nếu URL chưa có ngành, chọn ngành đầu tiên từ API.
        // Không tự đặt ID ngành.
        if (!majorId && data.length > 0) {
          const firstMajor = data[0] as Major;

          if (firstMajor.id) {
            const params = new URLSearchParams({
              id: String(firstMajor.id),
              cohort: cohortParam,
            });

            router.replace(
              `/assessments/direct/analysis/courses?${params.toString()}`
            );
          }
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("Lỗi tải danh sách ngành:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách ngành."
        );
      }
    }

    loadMajors();

    return () => controller.abort();
  }, [majorId, cohortParam, router]);

  // 2. Lấy ngành, học phần, PLO và cấu hình từ backend.
  useEffect(() => {
    const controller = new AbortController();

    async function loadMajorData() {
      const parsedMajorId = Number(majorId);

      if (
        !majorId ||
        !Number.isInteger(parsedMajorId) ||
        parsedMajorId <= 0
      ) {
        setMajor(null);
        setCourses([]);
        setPlos([]);
        setMatrix({});
        setEnabledCourses({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [majorResponse, coursesResponse] =
          await Promise.all([
            fetch(
              `${API_BASE_URL}/majors/${parsedMajorId}`,
              {
                signal: controller.signal,
                cache: "no-store",
              }
            ),
            fetch(
              `${API_BASE_URL}/courses?majorId=${parsedMajorId}`,
              {
                signal: controller.signal,
                cache: "no-store",
              }
            ),
          ]);

        if (!majorResponse.ok) {
          throw new Error(
            `Không tải được ngành ${parsedMajorId} (HTTP ${majorResponse.status}).`
          );
        }

        if (!coursesResponse.ok) {
          throw new Error(
            `Không tải được danh sách học phần (HTTP ${coursesResponse.status}).`
          );
        }

        const majorData: Major = await majorResponse.json();
        const coursesData: unknown = await coursesResponse.json();

        if (!Array.isArray(coursesData)) {
          throw new Error(
            "API /courses không trả về danh sách hợp lệ."
          );
        }

        const realCourses = (coursesData as Course[]).filter(
          (course) =>
            Number.isInteger(course.id) &&
            typeof course.code === "string" &&
            typeof course.name === "string"
        );

        setMajor(majorData);
        setCourses(realCourses);

        // Không tạo PLO giả nếu backend chưa có dữ liệu.
        setPlos(
          Array.isArray(majorData.plos)
            ? majorData.plos
            : []
        );

        // Chỉ hiển thị ma trận nếu backend trả về matrixData.
        const savedMatrix = parseObject<
          Record<string, number | null>
        >(majorData.matrixData);

        setMatrix(savedMatrix ?? {});

        // Trạng thái học phần lấy từ cấu hình backend nếu có.
        const savedEnabled = parseObject<
          Record<string, boolean>
        >(majorData.enabledCoursesData);

        if (savedEnabled) {
          const validEnabled: Record<number, boolean> = {};

          for (const course of realCourses) {
            validEnabled[course.id] =
              savedEnabled[course.id] !== false;
          }

          setEnabledCourses(validEnabled);
        } else {
          // Chưa có cấu hình: mặc định bật các học phần đang tải.
          // Đây là trạng thái giao diện, không phải dữ liệu mẫu.
          const initialEnabled: Record<number, boolean> = {};

          for (const course of realCourses) {
            initialEnabled[course.id] = true;
          }

          setEnabledCourses(initialEnabled);
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("Lỗi tải dữ liệu phân tích:", err);

        setMajor(null);
        setCourses([]);
        setPlos([]);
        setMatrix({});
        setEnabledCourses({});

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu phân tích."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMajorData();

    return () => controller.abort();
  }, [majorId]);

  // 3. Đóng menu khi bấm ra ngoài.
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };

    window.addEventListener("click", handleOutsideClick);

    return () => {
      window.removeEventListener(
        "click",
        handleOutsideClick
      );
    };
  }, []);

  // 4. Bật/tắt học phần.
  const handleToggleCourse = useCallback(
    (courseId: number, event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      setEnabledCourses((previous) => ({
        ...previous,
        [courseId]: previous[courseId] === false,
      }));
    },
    []
  );

  // 5. Lưu cấu hình lên backend.
  const handleSave = async () => {
    const parsedMajorId = Number(majorId);

    if (
      !majorId ||
      !Number.isInteger(parsedMajorId) ||
      parsedMajorId <= 0
    ) {
      setError("Vui lòng chọn ngành trước khi lưu.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/majors/${parsedMajorId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabledCoursesData: JSON.stringify(enabledCourses),
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          `Backend không lưu được cấu hình (HTTP ${response.status}). ${message}`
        );
      }

      alert("Đã lưu cấu hình học phần.");

      router.push("/assessments/direct");
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu cấu hình."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/assessments/direct");
  };

  const handleViewReport = () => {
    if (!majorId) return;
    const params = new URLSearchParams({
      id: majorId,
      cohort: cohortParam,
    });
    router.push(
      `/assessments/direct/analysis/results?${params.toString()}`
    );
  };

  const handleSelectMajor = (newMajorId: string) => {
    if (!newMajorId) return;

    const params = new URLSearchParams({
      id: newMajorId,
      cohort: cohortParam,
    });

    router.push(
      `/assessments/direct/analysis/courses?${params.toString()}`
    );
  };

  const handleSelectCohort = (newCohort: string) => {
    const params = new URLSearchParams({
      id: majorId,
      cohort: newCohort,
    });

    router.push(
      `/assessments/direct/analysis/courses?${params.toString()}`
    );
  };

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      course.code.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)
    );
  });

  const majorCode =
    major?.majorCode ?? major?.code ?? "";

  const majorName =
    major?.majorName ?? major?.name ?? "";

  if (loading) {
    return (
      <div className="flex min-h-64 w-full flex-col items-center justify-center px-8 py-16 font-medium text-slate-400">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        Đang tải dữ liệu từ backend...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] px-8 pb-16 pt-8 font-sans">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          <Link
            href="/assessments/direct"
            className="transition hover:text-slate-600"
          >
            ĐÀO TẠO
          </Link>

          <span className="text-slate-300">›</span>

          <span className="text-[#165aa7]">
            PHÂN TÍCH DỮ LIỆU
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Quay lại"
            >
              <ArrowLeft size={16} />
            </button>

            <h1 className="text-[20px] font-extrabold leading-none tracking-tight text-slate-800">
              Chọn môn học đánh giá
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="h-[38px] cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-[12px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Bỏ qua
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !majorId}
              className="flex h-[38px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[12px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Đang lưu..." : "Lưu lại"}
            </button>

            <button
              onClick={handleViewReport}
              disabled={!majorId}
              className="flex h-[38px] cursor-pointer items-center gap-2 rounded-xl bg-[#165aa7] px-5 text-[12px] font-bold text-white shadow-md shadow-[#165aa7]/10 transition hover:bg-[#124983] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BarChart2 size={14} />
              Xem báo cáo kết quả
            </button>
          </div>
        </div>
      </div>

      {/* Bộ lọc ngành và khóa */}
      <div
        className="flex flex-wrap items-center gap-3"
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        <select
          value={majorId}
          onChange={(event) =>
            handleSelectMajor(event.target.value)
          }
          className="max-w-full cursor-pointer appearance-none rounded-full border border-[#c2e7cc] bg-[#E6F4EA] px-4 py-2 text-[12px] font-extrabold text-[#137333] outline-none"
          aria-label="Chọn ngành"
        >
          <option value="" disabled>
            Chọn ngành
          </option>

          {majorsList.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.code ?? item.majorCode ?? ""} -{" "}
              {item.name ?? item.majorName ?? ""}
            </option>
          ))}
        </select>

        <select
          value={cohortParam}
          onChange={(event) =>
            handleSelectCohort(event.target.value)
          }
          className="cursor-pointer rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-[12px] font-extrabold text-slate-600 outline-none"
          aria-label="Chọn khóa"
        >
          {!cohorts.some(
            (cohort) => cohort.value === cohortParam
          ) && (
              <option value={cohortParam}>
                {cohortParam}
              </option>
            )}

          {cohorts.map((cohort) => (
            <option key={cohort.value} value={cohort.value}>
              {cohort.label} ({cohort.value})
            </option>
          ))}
        </select>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {/* Thông tin ngành lấy từ API */}
      {major && (
        <div className="mb-4 text-sm text-slate-500">
          Ngành:{" "}
          <span className="font-bold text-slate-700">
            {majorCode} {majorName}
          </span>
          <span className="mx-2 text-slate-300">|</span>
          Số học phần:{" "}
          <span className="font-bold text-slate-700">
            {courses.length}
          </span>
          <span className="mx-2 text-slate-300">|</span>
          Số PLO:{" "}
          <span className="font-bold text-slate-700">
            {plos.length}
          </span>
        </div>
      )}

      {/* Bảng học phần */}
      <div
        className="overflow-hidden rounded-[24px] bg-white shadow-sm"
        style={{
          boxShadow:
            "0 12px 40px -10px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 border-b border-slate-100/80 px-8 py-4">
          <h3 className="text-[15px] font-extrabold text-slate-800">
            Danh sách học phần
          </h3>

          <div className="relative w-full sm:w-[280px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />

            <input
              type="text"
              placeholder="Tìm mã hoặc tên học phần..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="h-[38px] w-full rounded-full border border-slate-200/80 bg-slate-50/50 pl-10 pr-4 text-[12px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto px-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold text-slate-600">
                <th className="px-3 py-5 text-center">
                  CHỌN
                </th>

                <th className="px-4 py-5 text-left">
                  MÃ HỌC PHẦN
                </th>

                <th className="px-4 py-5 text-left">
                  TÊN HỌC PHẦN
                </th>

                <th className="px-3 py-5 text-center">
                  TÍN CHỈ
                </th>

                {plos.map((plo) => (
                  <th
                    key={plo.id}
                    className="min-w-[75px] px-2 py-5 text-center"
                    title={plo.description ?? plo.code}
                  >
                    {plo.code}
                  </th>
                ))}

                <th className="px-3 py-5 text-center">
                  HÀNH ĐỘNG
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + plos.length}
                    className="py-16 text-center text-sm font-medium text-slate-400"
                  >
                    {error
                      ? "Không thể tải dữ liệu học phần."
                      : courses.length === 0
                        ? "Ngành này chưa có học phần trong cơ sở dữ liệu."
                        : "Không tìm thấy học phần phù hợp."}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const isEnabled =
                    enabledCourses[course.id] !== false;

                  return (
                    <tr
                      key={course.id}
                      className={`transition-colors ${isEnabled
                          ? "hover:bg-slate-50/50"
                          : "bg-slate-50/30"
                        }`}
                    >
                      <td className="px-3 py-5 text-center">
                        <button
                          type="button"
                          onClick={(event) =>
                            handleToggleCourse(
                              course.id,
                              event
                            )
                          }
                          aria-label={
                            isEnabled
                              ? "Tạm ngừng học phần"
                              : "Kích hoạt học phần"
                          }
                          aria-pressed={isEnabled}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isEnabled
                              ? "bg-[#165aa7]"
                              : "bg-slate-300"
                            }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${isEnabled
                                ? "translate-x-[22px]"
                                : "translate-x-[2px]"
                              }`}
                          />
                        </button>
                      </td>

                      <td className="px-4 py-5 text-[12px] font-bold">
                        <span
                          className={`rounded border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-slate-600 ${!isEnabled ? "opacity-50" : ""
                            }`}
                        >
                          {course.code}
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <div
                          className={`text-[13px] font-bold ${isEnabled
                              ? "text-slate-800"
                              : "text-slate-400 line-through"
                            }`}
                        >
                          {course.name}
                        </div>

                        <div className="mt-1 text-[11px] font-medium text-slate-400">
                          {getCourseCategory(course.code)}
                        </div>
                      </td>

                      <td className="px-3 py-5 text-center text-sm text-slate-600">
                        {course.credits}
                      </td>

                      {plos.map((plo) => {
                        const key = `${course.id}-${plo.id}`;
                        const value = matrix[key];
                        const hasValue =
                          isEnabled &&
                          value !== undefined &&
                          value !== null;

                        let badgeClass = "";

                        if (value === 3) {
                          badgeClass =
                            "bg-[#107c41] text-white";
                        } else if (value === 2) {
                          badgeClass =
                            "bg-[#D1F2D9] text-[#0f5132]";
                        } else if (value === 1) {
                          badgeClass =
                            "bg-[#E6F4EA] text-[#0f5132]";
                        }

                        return (
                          <td
                            key={plo.id}
                            className="px-2 py-5 text-center"
                          >
                            {hasValue ? (
                              <span
                                className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-xs font-bold ${badgeClass}`}
                              >
                                {value}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-300">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="relative px-3 py-5 text-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setActiveMenuId((current) =>
                              current === course.id
                                ? null
                                : course.id
                            );
                          }}
                          aria-label="Mở hành động học phần"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === course.id && (
                          <div
                            className="absolute right-8 top-12 z-50 w-44 rounded-xl border border-slate-100 bg-white py-1.5 text-left shadow-lg"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);

                                if (!majorId) {
                                  setError(
                                    "Vui lòng chọn ngành trước."
                                  );
                                  return;
                                }

                                const params =
                                  new URLSearchParams({
                                    id: majorId,
                                    cohort: cohortParam,
                                  });

                                router.push(
                                  `/assessments/direct/matrix/edit?${params.toString()}`
                                );
                              }}
                              className="block w-full px-4 py-2 text-left text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Cấu hình ma trận
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);

                                const selectedMajorId =
                                  course.majorId ??
                                  course.major?.id ??
                                  major?.id;

                                if (
                                  !selectedMajorId ||
                                  selectedMajorId <= 0
                                ) {
                                  setError(
                                    "Không xác định được ngành của học phần."
                                  );
                                  return;
                                }

                                const params =
                                  new URLSearchParams({
                                    courseId: String(course.id),
                                    majorId: String(
                                      selectedMajorId
                                    ),
                                    cohort: cohortParam,
                                  });

                                router.push(
                                  `/assessments/direct/analysis/course-detail?${params.toString()}`
                                );
                              }}
                              className="block w-full px-4 py-2 text-left text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-8 py-5">
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#165aa7]" />
              Đang được chọn
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Chưa được chọn
            </div>
          </div>

          <button
            onClick={handleViewReport}
            disabled={!majorId}
            className="flex items-center gap-2 rounded-xl bg-[#165aa7] px-5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-[#165aa7]/10 transition hover:bg-[#124983] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BarChart2 size={14} />
            Xem báo cáo kết quả
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full flex-col items-center justify-center px-8 py-16 font-medium text-slate-400">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          Đang tải trang...
        </div>
      }
    >
      <DataAnalysisForm />
    </Suspense>
  );
}