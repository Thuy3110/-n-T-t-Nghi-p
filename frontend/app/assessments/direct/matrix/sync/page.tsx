"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Info,
    RotateCw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

type Course = {
    id: number;
    courseCode?: string;
    code?: string;
    courseName?: string;
    name?: string;
};

type PLO = {
    id: number;
    code?: string;
    name?: string;
};

type MatrixItem = {
    courseId?: number;
    ploId?: number;
    level?: number | string | null;
    value?: number | string | null;
};

type Major = {
    id: number;
    majorCode?: string;
    majorName?: string;
    code?: string;
    name?: string;

    courses?: Course[];
    plos?: PLO[];
    matrix?: MatrixItem[];
    matrices?: MatrixItem[];

    courseCount?: number;
    ploCount?: number;
    cloCount?: number;

    subjectCount?: number;
    plo?: number;
    clo?: number;
};

function SyncPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const majorId = searchParams.get("id");
    const cohort = searchParams.get("cohort") || "";

    const [major, setMajor] = useState<Major | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [error, setError] = useState("");

    const [direction, setDirection] =
        useState<"GT_TT" | "TT_GT">("GT_TT");

    /*
     * =========================================================
     * LẤY DỮ LIỆU NGÀNH TỪ MYSQL THÔNG QUA BACKEND
     * =========================================================
     */
    useEffect(() => {
        if (!majorId) {
            setError("Không tìm thấy mã ngành.");
            setLoading(false);
            return;
        }

        const loadMajor = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `http://localhost:3001/majors/${majorId}`,
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Không thể tải thông tin ngành từ máy chủ."
                    );
                }

                const data = await response.json();

                console.log("SYNC - Major:", data);

                setMajor(data);
            } catch (err: any) {
                console.error(err);

                setError(
                    err?.message ||
                    "Không thể tải dữ liệu ngành."
                );
            } finally {
                setLoading(false);
            }
        };

        loadMajor();
    }, [majorId]);

    /*
     * =========================================================
     * DỮ LIỆU TỪ MYSQL
     * =========================================================
     */

    const courses = useMemo(() => {
        return major?.courses ?? [];
    }, [major]);

    const plos = useMemo(() => {
        return major?.plos ?? [];
    }, [major]);

    const matrix = useMemo(() => {
        return major?.matrix ?? major?.matrices ?? [];
    }, [major]);

    /*
     * =========================================================
     * TÌM GIÁ TRỊ MAPPING
     * KHÔNG HARD-CODE DỮ LIỆU
     * =========================================================
     */

    const getMatrixValue = (
        courseId: number,
        ploId: number
    ) => {
        const item = matrix.find(
            (item) =>
                Number(item.courseId) === Number(courseId) &&
                Number(item.ploId) === Number(ploId)
        );

        if (!item) {
            return null;
        }

        return item.level ?? item.value ?? null;
    };

    /*
     * =========================================================
     * MÀU Ô MAPPING
     * MÀU CHỈ PHỤ THUỘC VÀO GIÁ TRỊ MYSQL
     * KHÔNG PHẢI DỮ LIỆU HARDCODE
     * =========================================================
     */

    const getLevelStyle = (value: any) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return {
                backgroundColor: "#F1F5F9",
                color: "#94A3B8",
            };
        }

        const numberValue = Number(value);

        if (numberValue === 1) {
            return {
                backgroundColor: "#DDF7EF",
                color: "#069669",
            };
        }

        if (numberValue === 2) {
            return {
                backgroundColor: "#DCE9FF",
                color: "#2563EB",
            };
        }

        if (numberValue === 3) {
            return {
                backgroundColor: "#FFDCCF",
                color: "#D94817",
            };
        }

        return {
            backgroundColor: "#F1F5F9",
            color: "#475569",
        };
    };

    /*
     * =========================================================
     * ĐẾM SỐ LIỆU
     * LẤY TỪ MYSQL
     * =========================================================
     */

    const courseCount =
        major?.courseCount ??
        major?.subjectCount ??
        courses.length;

    const ploCount =
        major?.ploCount ??
        major?.plo ??
        plos.length;

    const cloCount =
        major?.cloCount ??
        major?.clo ??
        0;

    /*
     * =========================================================
     * ĐỒNG BỘ
     * =========================================================
     */

    const handleSync = async () => {
        if (!majorId) return;

        try {
            setSyncing(true);
            setSyncSuccess(false);
            setError("");

            const response = await fetch(
                `http://localhost:3001/majors/${majorId}/sync`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Không thể đồng bộ dữ liệu."
                );
            }

            const data = await response.json();

            console.log("Sync result:", data);

            /*
             * Lấy lại dữ liệu mới nhất từ MySQL
             */
            const refreshResponse = await fetch(
                `http://localhost:3001/majors/${majorId}`,
                {
                    cache: "no-store",
                }
            );

            if (refreshResponse.ok) {
                const refreshedData =
                    await refreshResponse.json();

                setMajor(refreshedData);
            }

            setSyncSuccess(true);
        } catch (err: any) {
            console.error(err);

            setError(
                err?.message ||
                "Đồng bộ dữ liệu thất bại."
            );
        } finally {
            setSyncing(false);
        }
    };

    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        color: "#64748B",
                        fontSize: 14,
                    }}
                >
                    <RotateCw
                        size={20}
                        style={{
                            animation:
                                "spin 1s linear infinite",
                        }}
                    />

                    Đang tải dữ liệu...
                </div>
            </div>
        );
    }

    /*
     * =========================================================
     * ERROR
     * =========================================================
     */

    if (error && !major) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#F8FAFC",
                    padding: "40px 54px",
                }}
            >
                <button
                    onClick={() => router.back()}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "none",
                        background: "transparent",
                        color: "#64748B",
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    <ArrowLeft size={17} />
                    Quay lại
                </button>

                <div
                    style={{
                        marginTop: 32,
                        background: "#FFFFFF",
                        border:
                            "1px solid #FECACA",
                        borderRadius: 18,
                        padding: 24,
                        color: "#DC2626",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <AlertCircle size={20} />
                    {error}
                </div>
            </div>
        );
    }

    /*
     * =========================================================
     * GIAO DIỆN CHÍNH
     * =========================================================
     */

    return (
        <>
            <style jsx>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }

                .sync-page-button:hover {
                    background: #f8fafc !important;
                }

                .sync-direction-active:hover {
                    background: #eaf3ff !important;
                }

                .sync-primary:hover {
                    background: #125995 !important;
                }

                .sync-table-row:hover {
                    background: #f8fbff !important;
                }
            `}</style>

            <div
                style={{
                    minHeight: "100vh",
                    background: "#F8FAFC",
                    padding:
                        "34px 54px 42px 54px",
                    boxSizing: "border-box",
                }}
            >
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "flex-start",
                        marginBottom: 18,
                    }}
                >
                    <div>
                        <button
                            onClick={() =>
                                router.back()
                            }
                            style={{
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                                border: "none",
                                background:
                                    "transparent",
                                padding: 0,
                                color: "#64748B",
                                fontSize: 14,
                                cursor: "pointer",
                                marginBottom: 12,
                            }}
                        >
                            <ArrowLeft size={18} />
                            Quay lại
                        </button>

                        <h1
                            style={{
                                margin: 0,
                                fontSize: 25,
                                lineHeight: 1.25,
                                fontWeight: 700,
                                color: "#17212B",
                            }}
                        >
                            Đồng bộ Mapping PLO -
                            Học phần
                        </h1>

                        <p
                            style={{
                                margin:
                                    "9px 0 0 0",
                                fontSize: 15,
                                color: "#64748B",
                            }}
                        >
                            Ngành:{" "}
                            <span
                                style={{
                                    fontWeight: 500,
                                    color: "#475569",
                                }}
                            >
                                {major?.majorCode ||
                                    major?.code ||
                                    "--"}
                                {" - "}
                                {major?.majorName ||
                                    major?.name ||
                                    "Chưa có tên ngành"}
                            </span>
                        </p>
                    </div>

                    {/* NIÊN KHÓA */}

                    <div
                        style={{
                            background: "#FFFFFF",
                            border:
                                "1px solid #E2E8F0",
                            borderRadius: 16,
                            padding:
                                "13px 18px",
                            marginTop: 2,
                            minWidth: 150,
                            textAlign: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                color: "#94A3B8",
                                marginRight: 3,
                            }}
                        >
                            NIÊN KHÓA
                        </span>

                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#334155",
                            }}
                        >
                            {cohort || "--"}
                        </span>
                    </div>
                </div>

                {/* =====================================================
    TOOLBAR
====================================================== */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        marginBottom: 24,
                    }}
                >
                    {/* ================= NHÓM CHUYỂN HƯỚNG ================= */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            background: "#FFFFFF",
                            border: "1px solid #DCE4EC",
                            borderRadius: 12,
                            overflow: "hidden",
                            height: 48,
                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                        }}
                    >
                        {/* GT => TT */}
                        <button
                            type="button"
                            onClick={() => setDirection("GT_TT")}
                            className={
                                direction === "GT_TT"
                                    ? "sync-direction-active"
                                    : "sync-page-button"
                            }
                            style={{
                                height: 48,
                                minWidth: 112,
                                padding: "0 20px",
                                border: "none",
                                borderRight: "1px solid #E8EEF5",
                                background:
                                    direction === "GT_TT"
                                        ? "#EAF3FF"
                                        : "#FFFFFF",
                                color:
                                    direction === "GT_TT"
                                        ? "#1769B0"
                                        : "#64748B",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease",
                            }}
                        >
                            GT =&gt; TT
                        </button>

                        {/* TT => GT */}
                        <button
                            type="button"
                            onClick={() => setDirection("TT_GT")}
                            className={
                                direction === "TT_GT"
                                    ? "sync-direction-active"
                                    : "sync-page-button"
                            }
                            style={{
                                height: 48,
                                minWidth: 112,
                                padding: "0 20px",
                                border: "none",
                                background:
                                    direction === "TT_GT"
                                        ? "#EAF3FF"
                                        : "#FFFFFF",
                                color:
                                    direction === "TT_GT"
                                        ? "#1769B0"
                                        : "#64748B",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s ease",
                            }}
                        >
                            TT =&gt; GT
                        </button>
                    </div>

                    {/* ================= THÊM DÒNG MỚI ================= */}
                    <button
                        type="button"
                        className="sync-page-button"
                        style={{
                            height: 48,
                            minWidth: 178,
                            padding: "0 20px",
                            marginLeft: 10,
                            border: "1px solid #DCE4EC",
                            borderRadius: 12,
                            background: "#FFFFFF",
                            color: "#334155",
                            fontSize: 13,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            boxShadow:
                                "0 1px 2px rgba(15, 23, 42, 0.03)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <Plus size={16} strokeWidth={2} />
                        <span>Thêm dòng mới</span>
                    </button>
                </div>

                {/* =====================================================
                    NOTE
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        alignItems:
                            "center",
                        gap: 13,
                        background: "#F8FBFF",
                        border:
                            "1px solid #CBD5E1",
                        borderRadius: 15,
                        padding:
                            "13px 20px",
                        marginBottom: 10,
                        minHeight: 48,
                        boxSizing:
                            "border-box",
                    }}
                >
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            minWidth: 22,
                            borderRadius:
                                "50%",
                            border:
                                "1.5px solid #475569",
                            display: "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            color: "#475569",
                        }}
                    >
                        <Info size={13} />
                    </div>

                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: "#475569",
                            lineHeight: 1.5,
                        }}
                    >
                        <strong
                            style={{
                                color: "#334155",
                            }}
                        >
                            Lưu ý:
                        </strong>{" "}
                        Các mức định tính I, R, M
                        sẽ được hệ thống tự động
                        quy đổi thành các giá trị
                        định lượng 1, 2, 3 để thực
                        hiện tính toán.
                    </p>
                </div>

                {/* =====================================================
                    TABLE
                ====================================================== */}

                <div
                    style={{
                        background: "#FFFFFF",
                        border:
                            "1px solid #DCE4EC",
                        borderRadius: 17,
                        overflow: "hidden",
                        boxShadow:
                            "0 2px 6px rgba(15, 23, 42, 0.07)",
                    }}
                >
                    <div
                        style={{
                            overflowX: "auto",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                minWidth:
                                    Math.max(
                                        1000,
                                        500 +
                                        plos.length *
                                        75
                                    ),
                                borderCollapse:
                                    "separate",
                                borderSpacing: 0,
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            "#EEF6FF",
                                    }}
                                >
                                    <th
                                        style={{
                                            width: 170,
                                            minWidth: 170,
                                            padding:
                                                "12px 14px",
                                            textAlign:
                                                "left",
                                            color:
                                                "#64748B",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            borderBottom:
                                                "1px solid #DCE8F4",
                                            whiteSpace:
                                                "nowrap",
                                        }}
                                    >
                                        MÃ HỌC PHẦN
                                    </th>

                                    <th
                                        style={{
                                            width: 330,
                                            minWidth: 330,
                                            padding:
                                                "12px 14px",
                                            textAlign:
                                                "left",
                                            color:
                                                "#64748B",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            borderBottom:
                                                "1px solid #DCE8F4",
                                            whiteSpace:
                                                "nowrap",
                                        }}
                                    >
                                        TÊN HỌC PHẦN
                                    </th>

                                    {plos.map(
                                        (plo) => (
                                            <th
                                                key={
                                                    plo.id
                                                }
                                                style={{
                                                    width: 75,
                                                    minWidth: 75,
                                                    padding:
                                                        "12px 6px",
                                                    textAlign:
                                                        "center",
                                                    color:
                                                        "#2563EB",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    borderBottom:
                                                        "1px solid #DCE8F4",
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {plo.code ||
                                                    plo.name ||
                                                    `PLO ${plo.id}`}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {courses.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                2 +
                                                plos.length
                                            }
                                            style={{
                                                padding:
                                                    "50px 20px",
                                                textAlign:
                                                    "center",
                                                color:
                                                    "#94A3B8",
                                                fontSize: 13,
                                            }}
                                        >
                                            Không có
                                            dữ liệu học
                                            phần.
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map(
                                        (
                                            course
                                        ) => (
                                            <tr
                                                key={
                                                    course.id
                                                }
                                                className="sync-table-row"
                                                style={{
                                                    background:
                                                        "#FFFFFF",
                                                }}
                                            >
                                                {/* MÃ */}

                                                <td
                                                    style={{
                                                        padding:
                                                            "13px 14px",
                                                        height: 46,
                                                        borderBottom:
                                                            "1px solid #EDF2F7",
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: "#334155",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {course.courseCode ||
                                                        course.code ||
                                                        "--"}
                                                </td>

                                                {/* TÊN */}

                                                <td
                                                    style={{
                                                        padding:
                                                            "13px 14px",
                                                        height: 46,
                                                        borderBottom:
                                                            "1px solid #EDF2F7",
                                                        fontSize: 13,
                                                        color: "#475569",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {course.courseName ||
                                                        course.name ||
                                                        "Chưa có tên học phần"}
                                                </td>

                                                {/* MAPPING */}

                                                {plos.map(
                                                    (
                                                        plo
                                                    ) => {
                                                        const value =
                                                            getMatrixValue(
                                                                course.id,
                                                                plo.id
                                                            );

                                                        const levelStyle =
                                                            getLevelStyle(
                                                                value
                                                            );

                                                        return (
                                                            <td
                                                                key={
                                                                    plo.id
                                                                }
                                                                style={{
                                                                    width: 75,
                                                                    minWidth: 75,
                                                                    padding:
                                                                        "7px 5px",
                                                                    borderBottom:
                                                                        "1px solid #EDF2F7",
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        margin:
                                                                            "0 auto",
                                                                        borderRadius: 9,
                                                                        backgroundColor:
                                                                            levelStyle.backgroundColor,
                                                                        color:
                                                                            levelStyle.color,
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                        fontSize: 12,
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {value ??
                                                                        "-"}
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                )}
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =================================================
                        LEGEND
                    ================================================== */}

                    <div
                        style={{
                            display: "flex",
                            alignItems:
                                "center",
                            gap: 22,
                            padding:
                                "11px 14px",
                            borderTop:
                                "1px solid #EDF2F7",
                            minHeight: 44,
                            background:
                                "#FFFFFF",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#94A3B8",
                            }}
                        >
                            GHI CHÚ:
                        </span>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                1
                            </span>

                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#64748B",
                                }}
                            >
                                Mức I
                                (Introduced)
                            </span>
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                2
                            </span>

                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#64748B",
                                }}
                            >
                                Mức R
                                (Reinforced)
                            </span>
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                3
                            </span>

                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#64748B",
                                }}
                            >
                                Mức M
                                (Mastered)
                            </span>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    THỐNG KÊ - DỮ LIỆU MYSQL
                ====================================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(3, 1fr)",
                        gap: 16,
                        marginTop: 18,
                    }}
                >
                    <div
                        style={{
                            background: "#FFFFFF",
                            border:
                                "1px solid #E2E8F0",
                            borderRadius: 15,
                            padding:
                                "12px 18px",
                            minHeight: 68,
                            boxSizing:
                                "border-box",
                        }}
                    >
                        <div
                            style={{
                                color: "#94A3B8",
                                fontSize: 10,
                                marginBottom: 4,
                            }}
                        >
                            HỌC PHẦN
                        </div>

                        <div
                            style={{
                                color: "#17212B",
                                fontSize: 22,
                                fontWeight: 700,
                            }}
                        >
                            {courseCount}
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#FFFFFF",
                            border:
                                "1px solid #E2E8F0",
                            borderRadius: 15,
                            padding:
                                "12px 18px",
                            minHeight: 68,
                            boxSizing:
                                "border-box",
                        }}
                    >
                        <div
                            style={{
                                color: "#94A3B8",
                                fontSize: 10,
                                marginBottom: 4,
                            }}
                        >
                            PLO
                        </div>

                        <div
                            style={{
                                color: "#17212B",
                                fontSize: 22,
                                fontWeight: 700,
                            }}
                        >
                            {ploCount}
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#FFFFFF",
                            border:
                                "1px solid #E2E8F0",
                            borderRadius: 15,
                            padding:
                                "12px 18px",
                            minHeight: 68,
                            boxSizing:
                                "border-box",
                        }}
                    >
                        <div
                            style={{
                                color: "#94A3B8",
                                fontSize: 10,
                                marginBottom: 4,
                            }}
                        >
                            CLO
                        </div>

                        <div
                            style={{
                                color: "#17212B",
                                fontSize: 22,
                                fontWeight: 700,
                            }}
                        >
                            {cloCount}
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    BOTTOM
                ====================================================== */}

                <div
                    style={{
                        display: "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "space-between",
                        marginTop: 24,
                        paddingBottom: 10,
                    }}
                >
                    <button
                        onClick={() =>
                            router.back()
                        }
                        style={{
                            border: "none",
                            background:
                                "transparent",
                            color: "#64748B",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            padding:
                                "12px 0",
                        }}
                    >
                        Bỏ qua
                    </button>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="sync-primary"
                        style={{
                            minWidth: 205,
                            height: 46,
                            padding:
                                "0 26px",
                            border: "none",
                            borderRadius: 12,
                            background:
                                syncing
                                    ? "#93B8D8"
                                    : "#1769B0",
                            color: "#FFFFFF",
                            fontSize: 13,
                            fontWeight: 600,
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            gap: 9,
                            cursor: syncing
                                ? "not-allowed"
                                : "pointer",
                            boxShadow:
                                "0 7px 16px rgba(23,105,176,0.18)",
                        }}
                    >
                        <RotateCw
                            size={16}
                            style={{
                                animation:
                                    syncing
                                        ? "spin 1s linear infinite"
                                        : "none",
                            }}
                        />

                        {syncing
                            ? "Đang đồng bộ..."
                            : "Tiến hành Đồng bộ"}
                    </button>
                </div>

                {/* =====================================================
                    SUCCESS
                ====================================================== */}

                {syncSuccess && (
                    <div
                        style={{
                            marginTop: 8,
                            display: "flex",
                            alignItems:
                                "center",
                            gap: 9,
                            padding:
                                "11px 15px",
                            borderRadius: 10,
                            background:
                                "#ECFDF5",
                            border:
                                "1px solid #A7F3D0",
                            color: "#047857",
                            fontSize: 12,
                        }}
                    >
                        <CheckCircle2
                            size={17}
                        />

                        Đồng bộ dữ liệu thành
                        công.
                    </div>
                )}

                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && major && (
                    <div
                        style={{
                            marginTop: 8,
                            display: "flex",
                            alignItems:
                                "center",
                            gap: 9,
                            padding:
                                "11px 15px",
                            borderRadius: 10,
                            background:
                                "#FEF2F2",
                            border:
                                "1px solid #FECACA",
                            color: "#DC2626",
                            fontSize: 12,
                        }}
                    >
                        <AlertCircle
                            size={17}
                        />

                        {error}
                    </div>
                )}
            </div>
        </>
    );
}

export default function SyncPage() {
    return <Suspense fallback={<div className="p-8">Đang tải đồng bộ ma trận...</div>}><SyncPageContent /></Suspense>;
}
