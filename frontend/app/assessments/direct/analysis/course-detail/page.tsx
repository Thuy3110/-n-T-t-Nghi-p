
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Printer,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Save,
    X,
} from "lucide-react";

interface MajorInfo {
    id: number;
    code?: string;
    name?: string;
}

interface Course {
    id: number;
    code: string;
    name: string;
    credits: number;
    majorId?: number;
    major?: MajorInfo;

    // Các trường mở rộng: backend cần trả về dữ liệu tương ứng.
    moduleCode?: string | null;
    replacementCode?: string | null;
    replacementName?: string | null;
}

interface EditForm {
    code: string;
    name: string;
    credits: string;
    moduleCode: string;
    replacementCode: string;
    replacementName: string;
}

const API_BASE = (
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001"
).replace(/\/$/, "");

const PAGE_SIZE = 4;

const EMPTY_FORM: EditForm = {
    code: "",
    name: "",
    credits: "",
    moduleCode: "",
    replacementCode: "",
    replacementName: "",
};

function getErrorMessage(data: any, fallback: string): string {
    if (Array.isArray(data?.message)) {
        return data.message.join(", ");
    }

    return data?.message || fallback;
}

function normalizeCourse(data: any): Course {
    return {
        ...data,
        id: Number(data.id),
        code: data.code ?? "",
        name: data.name ?? "",
        credits: Number(data.credits ?? 0),

        moduleCode:
            data.moduleCode ??
            data.module?.code ??
            data.module?.name ??
            data.moduleName ??
            "",

        replacementCode:
            data.replacementCode ??
            data.replacementCourse?.code ??
            data.mhThayThe ??
            data.mhThayTheCode ??
            "",

        replacementName:
            data.replacementName ??
            data.replacementCourse?.name ??
            data.thayTheName ??
            data.tenMonThayThe ??
            "",
    };
}

function CourseDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseId = Number(searchParams.get("courseId"));
    const majorId = searchParams.get("majorId");
    const cohort = searchParams.get("cohort") || "";

    const [major, setMajor] = useState<MajorInfo | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);

    const loadCourses = useCallback(
        async (signal?: AbortSignal) => {
            let resolvedMajorId = Number(majorId);

            // Nếu URL không có majorId, xác định ngành từ học phần.
            if (
                !Number.isInteger(resolvedMajorId) ||
                resolvedMajorId <= 0
            ) {
                const response = await fetch(
                    `${API_BASE}/courses/${courseId}`,
                    {
                        cache: "no-store",
                        signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Không thể tải học phần ${courseId} (HTTP ${response.status}).`
                    );
                }

                const rawCourse = await response.json();
                const selected = normalizeCourse(rawCourse);

                resolvedMajorId = Number(
                    rawCourse.majorId ?? rawCourse.major?.id
                );

                if (
                    !Number.isInteger(resolvedMajorId) ||
                    resolvedMajorId <= 0
                ) {
                    setMajor(rawCourse.major ?? null);
                    setCourses([selected]);
                    setPage(1);
                    return;
                }
            }

            const response = await fetch(
                `${API_BASE}/courses?majorId=${resolvedMajorId}`,
                {
                    cache: "no-store",
                    signal,
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Không thể tải danh sách học phần (HTTP ${response.status}).`
                );
            }

            const data: unknown = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(
                    "API /courses không trả về danh sách học phần hợp lệ."
                );
            }

            const list = data.map(normalizeCourse);
            setCourses(list);
            setPage(1);

            const courseWithMajor = list.find((item) => item.major);

            if (courseWithMajor?.major) {
                setMajor(courseWithMajor.major);
            } else {
                const majorResponse = await fetch(
                    `${API_BASE}/majors/${resolvedMajorId}`,
                    {
                        cache: "no-store",
                        signal,
                    }
                );

                if (majorResponse.ok) {
                    const majorData = await majorResponse.json();

                    setMajor({
                        id: majorData.id,
                        code:
                            majorData.code ??
                            majorData.majorCode ??
                            "",
                        name:
                            majorData.name ??
                            majorData.majorName ??
                            "",
                    });
                }
            }
        },
        [courseId, majorId]
    );

    useEffect(() => {
        const controller = new AbortController();

        async function initialize() {
            try {
                setLoading(true);
                setError("");

                if (!Number.isInteger(courseId) || courseId <= 0) {
                    throw new Error("Mã học phần không hợp lệ.");
                }

                await loadCourses(controller.signal);
            } catch (err) {
                if (
                    err instanceof Error &&
                    err.name !== "AbortError"
                ) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void initialize();

        return () => controller.abort();
    }, [courseId, loadCourses]);

    const selectedCourse = courses.find(
        (course) => course.id === courseId
    );

    const totalPages = Math.max(
        1,
        Math.ceil(courses.length / PAGE_SIZE)
    );

    const visibleCourses = useMemo(
        () =>
            courses.slice(
                (page - 1) * PAGE_SIZE,
                page * PAGE_SIZE
            ),
        [courses, page]
    );

    const totalCredits = courses.reduce(
        (sum, course) => sum + Number(course.credits || 0),
        0
    );

    const majorCode = major?.code || "—";
    const majorName = major?.name || "Chương trình đào tạo";

    function startEditing(course: Course) {
        setEditingId(course.id);

        setEditForm({
            code: course.code ?? "",
            name: course.name ?? "",
            credits: String(course.credits ?? 0),
            moduleCode: course.moduleCode ?? "",
            replacementCode: course.replacementCode ?? "",
            replacementName: course.replacementName ?? "",
        });

        setError("");
        setSuccess("");
    }

    function cancelEditing() {
        setEditingId(null);
        setEditForm(EMPTY_FORM);
        setError("");
    }

    function updateField(
        field: keyof EditForm,
        value: string
    ) {
        setEditForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function saveCourse(courseIdToUpdate: number) {
        const code = editForm.code.trim();
        const name = editForm.name.trim();
        const credits = Number(editForm.credits);

        if (!code || !name) {
            setError(
                "Mã học phần và tên học phần không được để trống."
            );
            return;
        }

        if (
            editForm.credits.trim() === "" ||
            !Number.isInteger(credits) ||
            credits < 0
        ) {
            setError(
                "Số tín chỉ phải là số nguyên không âm."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                code,
                name,
                credits,
                moduleCode: editForm.moduleCode.trim() || null,
                replacementCode:
                    editForm.replacementCode.trim() || null,
                replacementName:
                    editForm.replacementName.trim() || null,
            };

            const response = await fetch(
                `${API_BASE}/courses/${courseIdToUpdate}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        `Cập nhật thất bại (HTTP ${response.status}).`
                    )
                );
            }

            // Ưu tiên dữ liệu backend trả về.
            // Nếu backend chưa trả đủ trường mở rộng, giữ giá trị vừa nhập.
            // Lấy lại dữ liệu thật từ backend sau khi cập nhật thành công.
            const verifyResponse = await fetch(
                `${API_BASE}/courses/${courseIdToUpdate}`,
                { cache: "no-store" }
            );

            if (!verifyResponse.ok) {
                throw new Error(
                    "Cập nhật thành công nhưng không thể tải lại dữ liệu học phần."
                );
            }

            const verifiedCourse = normalizeCourse(
                await verifyResponse.json()
            );

            setCourses((current) =>
                current.map((course) =>
                    course.id === courseIdToUpdate
                        ? verifiedCourse
                        : course
                )
            );

            setEditingId(null);
            setEditForm(EMPTY_FORM);
            setSuccess("Đã cập nhật và đồng bộ dữ liệu từ backend thành công.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Có lỗi khi cập nhật học phần."
            );
        } finally {
            setSaving(false);
        }
    }


    async function refreshCourses() {
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            setEditingId(null);
            setEditForm(EMPTY_FORM);

            await loadCourses();

            setSuccess("Đã đồng bộ lại dữ liệu từ backend.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể đồng bộ dữ liệu."
            );
        } finally {
            setLoading(false);
        }
    }


    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center gap-2 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Đang tải chi tiết học phần...
            </div>
        );
    }

    if (error && courses.length === 0) {
        return (
            <div className="min-h-[400px] bg-[#F8FAFC] p-8">
                <button
                    onClick={() => router.back()}
                    className="mb-5 flex items-center gap-2 text-sm font-medium text-blue-700"
                >
                    <ArrowLeft size={17} />
                    Quay lại
                </button>

                <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-600">
                    {error}
                    <button
                        onClick={refreshCourses}
                        className="ml-3 font-semibold underline"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!selectedCourse) {
        return (
            <div className="min-h-[400px] bg-[#F8FAFC] p-8">
                <button
                    onClick={() => router.back()}
                    className="mb-5 flex items-center gap-2 text-sm font-medium text-blue-700"
                >
                    <ArrowLeft size={17} />
                    Quay lại
                </button>

                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Không tìm thấy học phần có ID {courseId} trong ngành đã chọn.
                    <p className="mt-2 text-slate-500">
                        Hãy kiểm tra courseId và majorId trên URL.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white px-6 py-7 font-sans md:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                        <button
                            onClick={() => router.back()}
                            className="hover:text-blue-700"
                        >
                            Phân tích dữ liệu
                        </button>
                        <span>/</span>
                        <span className="text-blue-700">
                            Chi tiết học phần
                        </span>
                    </div>

                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#17232D]">
                        Khung chương trình đào tạo
                    </h1>

                    <p className="mt-1 text-sm uppercase tracking-wide text-slate-500">
                        NGÀNH: {majorCode} | KHÓA: {cohort || "—"} | {majorName}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-blue-700 hover:bg-slate-50"
                    >
                        <Printer size={16} />
                        Xuất file
                    </button>

                    <button
                        onClick={refreshCourses}
                        disabled={loading || saving}
                        className="flex h-11 items-center gap-2 rounded-xl bg-[#1761B0] px-5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Đồng bộ
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <div className="flex min-h-[80px] items-center gap-4 bg-[#F8FBFF] px-6">
                    <div className="h-8 w-1.5 rounded-full bg-emerald-700" />
                    <div>
                        <h2 className="text-lg font-bold text-[#17232D]">
                            Chi tiết học phần
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Chỉnh sửa thông tin học phần, mô-đun và môn thay thế.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1250px] border-collapse">
                        <thead>
                            <tr className="bg-[#F3F8FE] text-[11px] font-bold text-slate-500">
                                <th className="px-3 py-4 text-left">MODUN</th>
                                <th className="px-3 py-4 text-left">MAMH</th>
                                <th className="px-3 py-4 text-left">TÊN HỌC PHẦN</th>
                                <th className="px-2 py-4 text-center">TC</th>
                                <th className="px-2 py-4 text-center">HK</th>
                                <th className="px-3 py-4 text-left">MHTHAYTHE</th>
                                <th className="px-3 py-4 text-left">
                                    THAYTHE (TÊN THAY THẾ)
                                </th>
                                <th className="px-3 py-4 text-center">THAO TÁC</th>
                            </tr>
                        </thead>

                        <tbody>
                            {visibleCourses.map((course) => {
                                const isEditing = editingId === course.id;

                                return (
                                    <tr
                                        key={course.id}
                                        className="border-b border-slate-100 bg-white"
                                    >
                                        <td className="px-3 py-5 text-sm font-semibold text-blue-800">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.moduleCode}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "moduleCode",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 rounded-md border border-blue-300 px-2 py-2 text-sm"
                                                    aria-label="Mã mô-đun"
                                                    placeholder="M1"
                                                />
                                            ) : (
                                                course.moduleCode || "—"
                                            )}
                                        </td>

                                        <td className="px-3 py-4">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.code}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "code",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full min-w-32 rounded-md border border-blue-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                                    aria-label="Mã học phần"
                                                />
                                            ) : (
                                                <span className="text-xs text-slate-600">
                                                    {course.code}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-4">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.name}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full min-w-48 rounded-md border border-blue-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                                    aria-label="Tên học phần"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-[#17232D]">
                                                    {course.name}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-2 py-4 text-center">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={editForm.credits}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "credits",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-16 rounded-md border border-blue-300 px-1 py-2 text-center text-sm"
                                                    aria-label="Số tín chỉ"
                                                />
                                            ) : (
                                                <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-blue-800">
                                                    {course.credits}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-2 py-5 text-center text-sm text-slate-500">
                                            —
                                        </td>

                                        <td className="px-3 py-5">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.replacementCode}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "replacementCode",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full min-w-32 rounded-md border border-blue-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                                    aria-label="Mã môn học thay thế"
                                                    placeholder="Mã môn thay thế"
                                                />
                                            ) : (
                                                <span className="block rounded-lg border border-slate-200 bg-[#F5F9FE] px-3 py-2 text-xs text-slate-500">
                                                    {course.replacementCode || "—"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-5">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.replacementName}
                                                    onChange={(e) =>
                                                        updateField(
                                                            "replacementName",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full min-w-48 rounded-md border border-blue-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                                    aria-label="Tên môn học thay thế"
                                                    placeholder="Tên môn thay thế"
                                                />
                                            ) : (
                                                <span className="block rounded-lg border border-slate-200 bg-[#F5F9FE] px-3 py-2 text-xs text-slate-500">
                                                    {course.replacementName || "Chưa có dữ liệu thay thế"}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                saveCourse(course.id)
                                                            }
                                                            disabled={saving}
                                                            title="Lưu thay đổi"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                        >
                                                            <Save size={14} />
                                                            {saving ? "Đang lưu" : "Lưu"}
                                                        </button>

                                                        <button
                                                            onClick={cancelEditing}
                                                            disabled={saving}
                                                            title="Hủy chỉnh sửa"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                                        >
                                                            <X size={14} />
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            startEditing(course)
                                                        }
                                                        title="Sửa học phần"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil size={14} />
                                                        Sửa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {courses.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-12 text-center text-sm text-slate-400"
                                    >
                                        Chưa có học phần trong ngành đào tạo này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-5">
                    <div className="flex flex-wrap gap-5 text-xs text-slate-500">
                        <span>
                            Tổng số học phần:{" "}
                            <strong className="text-slate-800">
                                {courses.length}
                            </strong>
                        </span>

                        <span>
                            Tổng số tín chỉ:{" "}
                            <strong className="text-slate-800">
                                {totalCredits}
                            </strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <button
                            aria-label="Trang trước"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((current) => current - 1)
                            }
                            className="disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span>
                            Trang {page} / {totalPages}
                        </span>

                        <button
                            aria-label="Trang sau"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                            className="disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function CourseDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="p-10 text-center text-sm text-slate-500">
                    Đang tải trang chi tiết...
                </div>
            }
        >
            <CourseDetailContent />
        </Suspense>
    );
}
