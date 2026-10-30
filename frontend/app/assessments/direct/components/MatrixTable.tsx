"use client";

import { Major } from "../../direct/matrix/types";
import { useRouter } from "next/navigation";
import {
  Grid3X3,
  Pencil,
  List,
  MoreVertical,
  RotateCw,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  majors: Major[];
  selectedMajor: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  cohort?: string;
  onViewMatrix?: (major: Major) => void;
  onEditConfig?: (major: Major) => void;
  onViewCourses?: (major: Major) => void;
}

export default function MatrixTable({
  majors,
  selectedMajor,
  onSelect,
  loading,
  cohort = "K25-2025",
  onViewMatrix,
  onEditConfig,
  onViewCourses,
}: Props) {
  const router = useRouter();

  // Helper to format numbers with a leading zero if they are < 10
  const formatNumber = (num: number) => String(num).padStart(2, "0");

  // Derive academic year dynamically from the selected cohort passed down from parent
  const getMajorYear = (major: Major) => {
    const yearMatch = cohort.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : "2025";
  };

  return (
    <div
      className="bg-white overflow-hidden"
      style={{
        borderRadius: "30px",
        boxShadow: "0 12px 40px -10px rgba(15, 23, 42, 0.08), 0 2px 12px -4px rgba(15, 23, 42, 0.03)"
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-slate-100"
        style={{ height: "76px", paddingLeft: "32px", paddingRight: "32px" }}
      >
        <h2 className="text-[16px] font-bold text-slate-800">
          Danh sách các ngành đào tạo
        </h2>

        <div className="bg-[#E6F4EA] text-[#137333] px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider select-none">
          NIÊN KHÓA {cohort.match(/\d{4}/)?.[0] || "2025"}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "26%" }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100">
              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "32px", paddingRight: "20px", textAlign: "left", color: "#1e293b" }}
              >
                KHÓA
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "24px", paddingRight: "20px", textAlign: "left", color: "#1e293b" }}
              >
                MÃ NGÀNH
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "20px", paddingRight: "20px", textAlign: "left", color: "#1e293b" }}
              >
                TÊN NGÀNH
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "20px", paddingRight: "20px", textAlign: "center", color: "#1e293b" }}
              >
                SL HP
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "16px", paddingRight: "16px", textAlign: "center", color: "#1e293b" }}
              >
                MT
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "16px", paddingRight: "16px", textAlign: "center", color: "#1e293b" }}
              >
                KG
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "12px", paddingRight: "12px", textAlign: "center", color: "#1e293b" }}
              >
                PO
              </th>

              <th
                className="py-5 text-[13px] uppercase tracking-wider font-extrabold"
                style={{ paddingLeft: "32px", paddingRight: "32px", textAlign: "center", color: "#1e293b" }}
              >
                TOOL
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-14 text-slate-400 text-sm font-medium"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading &&
              majors.map((major) => {
                const active = selectedMajor === major.id;

                return (
                  <tr
                    key={major.id}
                    onClick={() => onSelect(major.id)}
                    className={`
                      cursor-pointer
                      transition-colors duration-150
                      ${active
                        ? "bg-[#EAF3FF]"
                        : "hover:bg-slate-50"
                      }
                    `}
                  >
                    <td className="py-5 align-middle" style={{ paddingLeft: "32px", paddingRight: "20px", textAlign: "left" }}>
                      <div className="text-[13px] text-slate-700 font-bold leading-tight">
                        {getMajorYear(major)}
                      </div>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "24px", paddingRight: "20px", textAlign: "left" }}>
                      <span className="text-[13px] text-[#165aa7] hover:underline font-bold transition-all duration-150">
                        {major.majorCode}
                      </span>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "20px", paddingRight: "20px", textAlign: "left" }}>
                      <div className="text-[14px] text-slate-800 font-semibold leading-snug whitespace-normal break-words">
                        {major.majorName}
                      </div>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "20px", paddingRight: "20px", textAlign: "center" }}>
                      <span className="inline-flex items-center justify-center bg-slate-100/80 text-slate-600 w-8 h-8 rounded-lg text-[13px] font-bold">
                        {formatNumber(major.subjectCount)}
                      </span>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "16px", paddingRight: "16px", textAlign: "center" }}>
                      <span className="text-[14px] text-emerald-600 font-bold">
                        {formatNumber(major.plo)}
                      </span>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "16px", paddingRight: "16px", textAlign: "center" }}>
                      <span className="text-[14px] text-teal-600 font-bold">
                        {formatNumber(major.clo)}
                      </span>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "12px", paddingRight: "12px", textAlign: "center" }}>
                      <span className="text-[14px] text-orange-600 font-bold">
                        {formatNumber(major.kg)}
                      </span>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "32px", paddingRight: "32px", textAlign: "center" }}>
                      <div className="flex justify-center items-center" style={{ gap: "10px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/assessments/direct/matrix/framework?majorId=${major.id}&cohort=${cohort}`,
                            );
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer"
                          style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff", color: "#1a73e8", borderColor: "#dbeafe" }}
                          title="Thiết lập khung đánh giá CĐR (TT)"
                        >
                          <Target size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(major.id);
                            if (onViewMatrix) onViewMatrix(major);
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer"
                          style={{ width: "32px", height: "32px", backgroundColor: "#eff6ff", color: "#1a73e8", borderColor: "#dbeafe" }}
                          title="Ma trận"
                        >
                          <Grid3X3 size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assessments/direct/matrix/edit?id=${major.id}&cohort=${cohort}`);
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer"
                          style={{ width: "32px", height: "32px", backgroundColor: "#ecfdf5", color: "#047857", borderColor: "#d1fae5" }}
                          title="Sửa ma trận"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewCourses) onViewCourses(major);
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer"
                          style={{ width: "32px", height: "32px", backgroundColor: "#eef2ff", color: "#4f46e5", borderColor: "#e0e7ff" }}
                          title="Danh sách"
                        >
                          <List size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Bảng thao tác bổ sung cho ngành: ${major.majorName}`);
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer"
                          style={{ width: "32px", height: "32px", backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fef3c7" }}
                          title="Khác"
                        >
                          <MoreVertical size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            router.push(
                              `/assessments/direct/matrix/sync?id=${major.id}&cohort=${cohort}`
                            );
                          }}
                          className="rounded-lg flex items-center justify-center border transition duration-150 cursor-pointer hover:scale-105"
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#ecfdf5",
                            color: "#059669",
                            borderColor: "#d1fae5",
                          }}
                          title="Đồng bộ"
                        >
                          <RotateCw size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="h-[64px] px-8 flex items-center justify-between border-t border-slate-100 bg-white">
        <span className="text-[13px] text-slate-400">
          Hiển thị{" "}
          <span className="font-semibold text-slate-600">
            {majors.length}
          </span>{" "}
          / {majors.length} ngành đào tạo
        </span>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
            <ChevronLeft size={16} />
          </button>

          <button
            className="w-8 h-8 rounded-lg text-white text-[13px] font-semibold flex items-center justify-center shadow-sm"
            style={{ width: "32px", height: "32px", backgroundColor: "#165aa7" }}
          >
            1
          </button>

          <button className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-[13px] font-medium flex items-center justify-center transition">
            2
          </button>

          <button className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-[13px] font-medium flex items-center justify-center transition">
            3
          </button>

          <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}