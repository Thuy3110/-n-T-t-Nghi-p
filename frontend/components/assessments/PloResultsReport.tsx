
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  Download,
  Table2,
  SlidersHorizontal,
  Layers,
  UserX,
  Info,
  Clock,
} from "lucide-react";
import api from "@/services/api";

// =====================================================
// TYPES
// =====================================================

interface PloMeta {
  id: number;
  code: string;
  description: string;
  parentId: number | null;
  isGroupHeader: boolean;
}

interface StudentPloResult {
  ploId: number;
  code: string;
  description: string;
  parentId: number | null;
  scorePercent: number | null;
  achieved: boolean | null;
}

interface StudentRow {
  id: number;
  studentCode: string;
  fullName: string;
  slmh: number;
  ploResults: StudentPloResult[];
}

interface PloReportData {
  major: {
    id: number;
    code: string;
    name: string;
  };
  cohortYear: number;
  hasHierarchy: boolean;
  mappedPloCount: number;
  attainmentThresholdPercent: number;
  studentCount: number;
  evaluatedCount: number;
  achievedCount: number;
  attainmentRate: number | null;
  plos: PloMeta[];
  students: StudentRow[];
}

// =====================================================
// STYLE
// =====================================================

const thBase: React.CSSProperties = {
  padding: "9px 10px",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#64748b",
  textAlign: "center",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  borderBottom: "1px solid #e2e8f0",
};

const tdBase: React.CSSProperties = {
  padding: "9px 10px",
  textAlign: "center",
  verticalAlign: "middle",
  fontSize: 13,
};

// =====================================================
// COMPONENTS
// =====================================================

function KqBadge({
  achieved,
}: {
  achieved: boolean | null;
}) {
  if (achieved === null) {
    return (
      <span
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontWeight: 700,
        }}
      >
        —
      </span>
    );
  }

  if (achieved) {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: "#dcfce7",
          color: "#15803d",
          letterSpacing: "0.04em",
        }}
      >
        ĐẠT
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        letterSpacing: "0.04em",
      }}
    >
      H
    </span>
  );
}

function ChildScoreCell({
  val,
  threshold,
}: {
  val: number | null;
  threshold: number;
}) {
  if (val === null) {
    return (
      <span style={{ color: "#cbd5e1", fontSize: 14 }}>
        —
      </span>
    );
  }

  const fail = val < threshold;

  return (
    <span
      style={{
        fontWeight: 700,
        color: fail ? "#ef4444" : "#1e293b",
      }}
    >
      {Math.round(val)}
    </span>
  );
}

function ParentScoreCell({
  val,
  threshold,
}: {
  val: number | null;
  threshold: number;
}) {
  if (val === null) {
    return (
      <span style={{ color: "#cbd5e1", fontSize: 14 }}>
        —
      </span>
    );
  }

  const fail = val < threshold;

  return (
    <span
      style={{
        fontWeight: 800,
        color: fail ? "#ef4444" : "#1e293b",
      }}
    >
      {Math.round(val)}%
    </span>
  );
}

function ConfigCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "12px 16px",
        minWidth: 0,
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "#64748b",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: accent ?? "#165aa7",
          margin: "4px 0 0",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// =====================================================
// MAIN REPORT
// =====================================================

function ReportContent() {
  const searchParams = useSearchParams();

  const majorId =
    searchParams.get("id") ??
    searchParams.get("majorId") ??
    "";

  const cohortParam = searchParams.get("cohort") ?? "";

  const cohortYear =
    Number(cohortParam.match(/\d{4}/)?.[0]) ||
    new Date().getFullYear();

  const [data, setData] =
    useState<PloReportData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(
    null
  );

  // ---------------------------------------------------
  // Fetch API: không phụ thuộc vào việc có dữ liệu hay không
  // ---------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");
      setData(null);
      setElapsed(null);

      if (!majorId || !Number.isInteger(Number(majorId))) {
        setError(
          "Chưa có thông tin ngành hợp lệ. Vui lòng chọn ngành để tải dữ liệu."
        );
        setLoading(false);
        return;
      }

      const startTime = performance.now();

      try {
        const response = await api.get<PloReportData>(
          `/assessments/plo-results?majorId=${encodeURIComponent(
            majorId
          )}&cohortYear=${encodeURIComponent(
            String(cohortYear)
          )}`,
          {
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        const result = response.data;

        // Kiểm tra cấu trúc dữ liệu trước khi hiển thị.
        if (
          result &&
          typeof result === "object" &&
          Array.isArray(result.students) &&
          Array.isArray(result.plos)
        ) {
          setData(result);
        } else {
          setError(
            "API chưa trả về đúng cấu trúc dữ liệu báo cáo."
          );
        }

        setElapsed(
          Math.round(performance.now() - startTime)
        );
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        const errorObject = err as {
          response?: {
            status?: number;
            data?: {
              message?: string;
            };
          };
          message?: string;
          name?: string;
        };

        if (
          errorObject.name === "CanceledError" ||
          errorObject.name === "AbortError"
        ) {
          return;
        }

        if (errorObject.response?.status === 401) {
          setError(
            "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại. Giao diện báo cáo vẫn được giữ nguyên."
          );
        } else if (errorObject.response?.status === 403) {
          setError(
            "Bạn không có quyền xem dữ liệu báo cáo này."
          );
        } else {
          setError(
            errorObject.response?.data?.message ??
              "Chưa tải được dữ liệu đánh giá. Bạn vẫn có thể xem bố cục báo cáo."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      controller.abort();
    };
  }, [majorId, cohortYear]);

  // ---------------------------------------------------
  // PLO columns
  // Nếu chưa có dữ liệu thì dùng tên cột dự phòng,
  // không tạo dữ liệu đánh giá giả.
  // ---------------------------------------------------

  const {
    childPlos,
    parentPlos,
    flatPlos,
    hasHierarchy,
  } = useMemo(() => {
    const emptyPloColumns: PloMeta[] = [
      {
        id: -1,
        code: "PLO1",
        description: "",
        parentId: null,
        isGroupHeader: false,
      },
      {
        id: -2,
        code: "PLO2",
        description: "",
        parentId: null,
        isGroupHeader: false,
      },
      {
        id: -3,
        code: "PLO3",
        description: "",
        parentId: null,
        isGroupHeader: false,
      },
      {
        id: -4,
        code: "PLO4",
        description: "",
        parentId: null,
        isGroupHeader: false,
      },
    ];

    if (!data) {
      return {
        childPlos: [] as PloMeta[],
        parentPlos: [] as PloMeta[],
        flatPlos: emptyPloColumns,
        hasHierarchy: false,
      };
    }

    const availablePlos = Array.isArray(data.plos)
      ? data.plos
      : [];

    const child = availablePlos.filter(
      (plo) => plo.parentId !== null
    );

    const parent = availablePlos.filter(
      (plo) =>
        plo.parentId === null && !plo.isGroupHeader
    );

    return {
      childPlos: child,
      parentPlos: parent,
      flatPlos:
        availablePlos.length > 0
          ? availablePlos
          : emptyPloColumns,
      hasHierarchy: data.hasHierarchy && child.length > 0,
    };
  }, [data]);

  const major = data?.major ?? {
    id: Number(majorId) || 0,
    code: "",
    name: "Chưa có dữ liệu ngành",
  };

  const students = Array.isArray(data?.students)
    ? data.students
    : [];

  const attainmentThresholdPercent =
    data?.attainmentThresholdPercent ?? 75;

  const detailCols = hasHierarchy ? childPlos : [];
  const summaryCols = hasHierarchy
    ? parentPlos
    : flatPlos;

  const totalColumns =
    3 +
    (hasHierarchy ? detailCols.length : 0) +
    summaryCols.length +
    2;

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        padding: "0 16px 64px",
        boxSizing: "border-box",
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Tiêu đề trang luôn hiển thị */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#0f172a",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Báo cáo Đánh giá
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            margin: "4px 0 0",
          }}
        >
          Hệ thống quản lý chuẩn đầu ra SDC Portal
        </p>
      </div>

      {/* Thông báo chỉ nằm trong một vùng nhỏ */}
      {(loading || error) && (
        <div
          role="status"
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${
              error ? "#fed7aa" : "#bfdbfe"
            }`,
            backgroundColor: error
              ? "#fff7ed"
              : "#eff6ff",
            color: error ? "#9a3412" : "#1d4ed8",
            fontSize: 13,
          }}
        >
          {loading
            ? "Đang tải dữ liệu đánh giá..."
            : error}
        </div>
      )}

      {/* CARD BÁO CÁO */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#165aa7",
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                Kết quả Đánh giá Mức độ Người học đạt
                Chuẩn đầu ra
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "#475569",
                  marginTop: 5,
                  marginBottom: 0,
                }}
              >
                Học kỳ — · Năm học {cohortYear}
                <span
                  style={{
                    margin: "0 8px",
                    color: "#cbd5e1",
                  }}
                >
                  •
                </span>
                {major.code
                  ? `${major.code} – ${major.name}`
                  : major.name}
              </p>
            </div>

            {/* Nút thao tác báo cáo */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexShrink: 0,
              }}
            >
              {[
                {
                  icon: <Printer size={15} />,
                  title: "In báo cáo",
                  action: "print",
                },
                {
                  icon: <Download size={15} />,
                  title: "Xuất dữ liệu",
                  action: "export",
                },
                {
                  icon: <Table2 size={15} />,
                  title: "Chế độ bảng",
                  action: "table",
                },
                {
                  icon: <SlidersHorizontal size={15} />,
                  title: "Lọc",
                  action: "filter",
                },
                {
                  icon: <Layers size={15} />,
                  title: "Nhóm PLO",
                  action: "group",
                },
                {
                  icon: <UserX size={15} />,
                  title: "Ẩn sinh viên",
                  action: "hide",
                },
              ].map((button) => (
                <button
                  key={button.action}
                  type="button"
                  title={button.title}
                  onClick={() => {
                    if (button.action === "print") {
                      window.print();
                    } else if (
                      button.action === "export"
                    ) {
                      setError(
                        "Chức năng xuất dữ liệu cần được kết nối với định dạng xuất báo cáo."
                      );
                    } else {
                      setError(
                        `Chức năng "${button.title}" chưa được cấu hình.`
                      );
                    }
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {button.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BẢNG KẾT QUẢ */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 850,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    width: 40,
                    borderRight: "1px solid #e2e8f0",
                  }}
                >
                  #
                </th>

                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    textAlign: "left",
                    minWidth: 110,
                  }}
                >
                  MASV
                </th>

                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    textAlign: "left",
                    minWidth: 160,
                  }}
                >
                  Họ và tên
                </th>

                {hasHierarchy &&
                  detailCols.length > 0 && (
                    <th
                      colSpan={detailCols.length}
                      style={{
                        ...thBase,
                        backgroundColor: "#f0f9ff",
                        color: "#0369a1",
                        borderLeft: "2px solid #bae6fd",
                        borderBottom:
                          "1px solid #bae6fd",
                      }}
                    >
                      CHI TIẾT PLO
                    </th>
                  )}

                {summaryCols.length > 0 && (
                  <th
                    colSpan={summaryCols.length}
                    style={{
                      ...thBase,
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      borderLeft: hasHierarchy
                        ? "2px solid #bfdbfe"
                        : undefined,
                      borderBottom:
                        "1px solid #bfdbfe",
                    }}
                  >
                    TỔNG HỢP PLO
                  </th>
                )}

                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    minWidth: 60,
                    borderLeft: "1px solid #e2e8f0",
                  }}
                >
                  KQ
                </th>

                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    minWidth: 56,
                  }}
                >
                  SLMH
                </th>
              </tr>

              <tr
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                {hasHierarchy &&
                  detailCols.map((plo) => (
                    <th
                      key={plo.id}
                      title={plo.description}
                      style={{
                        ...thBase,
                        fontSize: 10,
                        padding: "5px 8px",
                        backgroundColor: "#f0f9ff",
                        color: "#0369a1",
                        borderLeft: "1px solid #e0f2fe",
                      }}
                    >
                      {plo.code.replace(/^PLO?\.?/i, "")}
                    </th>
                  ))}

                {summaryCols.map((plo) => (
                  <th
                    key={plo.id}
                    title={plo.description}
                    style={{
                      ...thBase,
                      fontSize: 10,
                      padding: "5px 8px",
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      borderLeft: "1px solid #dbeafe",
                    }}
                  >
                    {plo.code}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={totalColumns}
                    style={{
                      ...tdBase,
                      padding: "42px 20px",
                      color: "#94a3b8",
                      textAlign: "center",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {loading
                      ? "Đang tải dữ liệu đánh giá..."
                      : "Chưa có dữ liệu sinh viên. Bảng sẽ hiển thị kết quả khi có dữ liệu đánh giá."}
                  </td>
                </tr>
              )}

              {students.map((student, index) => {
                const results = Array.isArray(
                  student.ploResults
                )
                  ? student.ploResults
                  : [];

                const summaryResults = results.filter(
                  (result) =>
                    summaryCols.some(
                      (plo) => plo.id === result.ploId
                    )
                );

                const evaluated = summaryResults.filter(
                  (result) => result.achieved !== null
                );

                const allAchieved =
                  evaluated.length > 0 &&
                  evaluated.every(
                    (result) => result.achieved === true
                  );

                const overallKq =
                  evaluated.length === 0
                    ? null
                    : allAchieved;

                const rowBg =
                  index % 2 === 0 ? "#fff" : "#fafbfd";

                return (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor: rowBg,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor =
                        "#eff6ff";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor =
                        rowBg;
                    }}
                  >
                    <td
                      style={{
                        ...tdBase,
                        color: "#94a3b8",
                        fontWeight: 600,
                        fontSize: 12,
                        borderRight:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td
                      style={{
                        ...tdBase,
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          color: "#165aa7",
                          fontWeight: 700,
                        }}
                      >
                        {student.studentCode || "—"}
                      </span>
                    </td>

                    <td
                      style={{
                        ...tdBase,
                        textAlign: "left",
                        fontWeight: 500,
                        color: "#334155",
                      }}
                    >
                      {student.fullName || "—"}
                    </td>

                    {hasHierarchy &&
                      detailCols.map((plo) => {
                        const result = results.find(
                          (item) => item.ploId === plo.id
                        );

                        return (
                          <td
                            key={plo.id}
                            style={{
                              ...tdBase,
                              borderLeft:
                                "1px solid #f0f9ff",
                            }}
                          >
                            <ChildScoreCell
                              val={
                                result?.scorePercent ?? null
                              }
                              threshold={
                                attainmentThresholdPercent
                              }
                            />
                          </td>
                        );
                      })}

                    {summaryCols.map((plo) => {
                      const result = results.find(
                        (item) => item.ploId === plo.id
                      );

                      return (
                        <td
                          key={plo.id}
                          style={{
                            ...tdBase,
                            borderLeft:
                              "1px solid #eff6ff",
                          }}
                        >
                          <ParentScoreCell
                            val={
                              result?.scorePercent ?? null
                            }
                            threshold={
                              attainmentThresholdPercent
                            }
                          />
                        </td>
                      );
                    })}

                    <td
                      style={{
                        ...tdBase,
                        borderLeft:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <KqBadge achieved={overallKq} />
                    </td>

                    <td
                      style={{
                        ...tdBase,
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {Number.isFinite(student.slmh)
                        ? student.slmh
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* THỐNG KÊ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "13px 22px",
            borderTop: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#475569",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                }}
              />
              Tổng số SV đạt:{" "}
              <strong style={{ color: "#1e293b" }}>
                {data
                  ? `${data.achievedCount}/${data.studentCount}`
                  : "—"}
              </strong>
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#475569",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              Tỷ lệ đạt:{" "}
              <strong style={{ color: "#16a34a" }}>
                {data?.attainmentRate !== null &&
                data?.attainmentRate !== undefined
                  ? `${data.attainmentRate}%`
                  : "—"}
              </strong>
            </span>
          </div>

          {elapsed !== null && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "#94a3b8",
              }}
            >
              <Clock size={13} />
              Thời gian xử lý:{" "}
              {(elapsed / 1000).toFixed(3)} giây
            </span>
          )}
        </div>

        {/* CẤU HÌNH ĐÁNH GIÁ */}
        <div
          style={{
            padding: "18px 22px 24px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11,
              fontWeight: 800,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            <Info size={14} />
            Ghi chú &amp; Cấu hình đánh giá
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 10,
            }}
          >
            <ConfigCard
              label="Cách ĐG (1.Tính ĐTB; 2.Đếm MH đạt)"
              value="—"
            />

            <ConfigCard
              label="Mục tiêu đạt PLO (%)"
              value={
                data
                  ? `${attainmentThresholdPercent}%`
                  : "—"
              }
            />

            <ConfigCard
              label="Mục tiêu đạt PLOti (%)"
              value={
                data
                  ? `${attainmentThresholdPercent}%`
                  : "—"
              }
              accent="#f97316"
            />

            <ConfigCard
              label="TK các MH có mức đóng góp từ"
              value="—"
            />

            <ConfigCard
              label="DSSV (1.All SV/2.Đủ ĐK/3.Đ.ký TN)"
              value="—"
            />

            <ConfigCard
              label="Mục tiêu đạt PLOi (%)"
              value={
                data
                  ? `${attainmentThresholdPercent}%`
                  : "—"
              }
            />

            <ConfigCard
              label="Mục tiêu đạt PLOti (điểm TBC)"
              value="—"
              accent="#f97316"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PAGE EXPORT
// =====================================================

export default function PloResultsReport() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
            color: "#94a3b8",
            fontSize: 14,
          }}
        >
          Đang khởi tạo báo cáo...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
