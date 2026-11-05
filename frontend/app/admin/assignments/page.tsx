"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  assignCourses,
  getCourseAssignments,
} from "@/services/lecturer-assessment.service";

type LecturerInfo = {
  id: number;
  fullName: string;
  username: string;
  role: string;
  courses: Array<{
    id: number;
    code: string;
    name: string;
    major: { code: string; name: string };
  }>;
};

type CourseInfo = {
  id: number;
  code: string;
  name: string;
  major: { id: number; code: string; name: string };
};

export default function CourseAssignmentsPage() {
  const [lecturers, setLecturers] = useState<LecturerInfo[]>([]);
  const [allCourses, setAllCourses] = useState<CourseInfo[]>([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState<number | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [searchLecturer, setSearchLecturer] = useState<string>("");
  const [searchCourse, setSearchCourse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCourseAssignments();
      setLecturers(res.lecturers);
      setAllCourses(res.allCourses);

      if (res.lecturers.length > 0) {
        if (!selectedLecturerId || !res.lecturers.some((l) => l.id === selectedLecturerId)) {
          selectLecturer(res.lecturers[0]);
        } else {
          const current = res.lecturers.find((l) => l.id === selectedLecturerId);
          if (current) setSelectedCourseIds(current.courses.map((c) => c.id));
        }
      }
    } catch (err: any) {
      console.error("Lỗi tải phân công giảng dạy:", err);
      setError(err?.response?.data?.message || "Không tải được dữ liệu phân công giảng dạy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectLecturer = (lecturer: LecturerInfo) => {
    setSelectedLecturerId(lecturer.id);
    setSelectedCourseIds(lecturer.courses.map((c) => c.id));
    setNotice("");
    setError("");
  };

  const selectedLecturer = useMemo(() => {
    return lecturers.find((l) => l.id === selectedLecturerId) ?? null;
  }, [lecturers, selectedLecturerId]);

  const filteredLecturers = useMemo(() => {
    const q = searchLecturer.trim().toLowerCase();
    if (!q) return lecturers;
    return lecturers.filter(
      (l) => l.fullName.toLowerCase().includes(q) || l.username.toLowerCase().includes(q)
    );
  }, [lecturers, searchLecturer]);

  const filteredCourses = useMemo(() => {
    const q = searchCourse.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.major.name.toLowerCase().includes(q)
    );
  }, [allCourses, searchCourse]);

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSave = async () => {
    if (!selectedLecturerId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await assignCourses({
        userId: selectedLecturerId,
        courseIds: selectedCourseIds,
      });
      setNotice(res.message);
      await loadData();
    } catch (err: any) {
      console.error("Lỗi lưu phân công:", err);
      setError(err?.response?.data?.message || "Không thể lưu phân công môn học.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Tiêu đề trang */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <ClipboardCheck size={14} />
              Quản trị đào tạo
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Phân công giảng dạy học phần
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gán các môn học cho giảng viên phụ trách để khi giảng viên đăng nhập chỉ thấy các môn mình đứng lớp để đánh giá CĐR (CLO).
            </p>
          </div>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cột 1: Danh sách Giảng viên (4 cột) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Users size={17} className="text-blue-600" />
                Danh sách Giảng viên ({lecturers.length})
              </h2>
            </div>

            {/* Ô tìm kiếm giảng viên */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc username..."
                value={searchLecturer}
                onChange={(e) => setSearchLecturer(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Đang tải danh sách giảng viên...</div>
            ) : filteredLecturers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Không tìm thấy giảng viên.</div>
            ) : (
              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredLecturers.map((lecturer) => {
                  const isSelected = lecturer.id === selectedLecturerId;
                  return (
                    <button
                      key={lecturer.id}
                      type="button"
                      onClick={() => selectLecturer(lecturer)}
                      className={`w-full text-left rounded-lg p-3 transition border ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                          : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-slate-900">{lecturer.fullName}</p>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {lecturer.courses.length} môn
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">@{lecturer.username}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột 2: Chọn môn học phân công cho giảng viên (8 cột) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8 space-y-4">
            {selectedLecturer ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Phân công cho: <span className="text-blue-700">{selectedLecturer.fullName}</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đang chọn: <strong className="text-slate-800">{selectedCourseIds.length}</strong> học phần
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? "Đang lưu..." : "Lưu phân công"}
                  </button>
                </div>

                {/* Ô tìm kiếm môn học */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã học phần, tên học phần hoặc ngành..."
                    value={searchCourse}
                    onChange={(e) => setSearchCourse(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Danh sách các môn học để tick chọn */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredCourses.map((course) => {
                    const isChecked = selectedCourseIds.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                          isChecked
                            ? "bg-blue-50/60 border-blue-400"
                            : "bg-white border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCourse(course.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs rounded bg-blue-100 text-blue-800 px-2 py-0.5">
                              {course.code}
                            </span>
                            <span className="font-semibold text-sm text-slate-900">{course.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Ngành: {course.major.name} ({course.major.code})</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">
                Vui lòng chọn giảng viên ở danh sách bên trái để thực hiện phân công.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

