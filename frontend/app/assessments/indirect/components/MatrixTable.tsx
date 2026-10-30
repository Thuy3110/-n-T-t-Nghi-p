"use client";

import { Major } from "../../direct/matrix/types";
import { useRouter } from "next/navigation";
import {
  Network,
  Eye,
  Pencil,
  Target,
  Scale,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  majors: Major[];
  selectedMajor: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  cohort?: string;
  onOpenConfig?: (major: Major) => void;
}

export default function MatrixTable({
  majors,
  selectedMajor,
  onSelect,
  loading,
  cohort = "K25-2025",
  onOpenConfig,
}: Props) {
  const router = useRouter();

  // Helper to format numbers with a leading zero if they are < 10
  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div
      className="bg-white rounded-[30px] overflow-hidden"
      style={{ boxShadow: "0 10px 40px -10px rgba(15, 23, 42, 0.08), 0 2px 10px -5px rgba(15, 23, 42, 0.03)" }}
    >
      {/* Header */}
      <div className="h-[72px] px-8 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-[16px] font-bold text-slate-800">
          Bảng danh sách Ma trận
        </h2>

        <div className="flex items-center gap-3 text-slate-400">
          <SlidersHorizontal
            size={18}
            className="cursor-pointer hover:text-slate-600 transition"
          />
          <MoreVertical
            size={18}
            className="cursor-pointer hover:text-slate-600 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "26%" }} />
          </colgroup>
          <thead>
            <tr className="bg-[#F4F8FD] border-b border-slate-100">
              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "12px", paddingRight: "12px", width: "12%", textAlign: "left" }}
              >
                KHÓA
              </th>

              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "12px", paddingRight: "12px", width: "12%", textAlign: "left" }}
              >
                NGANH
              </th>

              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "12px", paddingRight: "12px", width: "22%", textAlign: "left" }}
              >
                TÊN NGÀNH
              </th>

              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "8px", paddingRight: "8px", width: "8%", textAlign: "center" }}
              >
                SLMH
              </th>

              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "8px", paddingRight: "8px", width: "20%", textAlign: "center" }}
              >
                PLO/CLO/KG
              </th>

              <th
                className="py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                style={{ paddingLeft: "8px", paddingRight: "8px", width: "26%", textAlign: "center" }}
              >
                TOOL
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={6}
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
                    <td className="py-5 align-middle" style={{ paddingLeft: "12px", paddingRight: "12px", textAlign: "left" }}>
                      <div className="text-[13px] text-slate-500 font-medium leading-tight whitespace-pre-wrap">
                        {cohort.includes("-") ? `${cohort.split("-")[0]}-\n${cohort.split("-")[1]}` : cohort}
                      </div>
                    </td>

                    <td className="py-5 align-middle text-[13px] text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis" style={{ paddingLeft: "12px", paddingRight: "12px", textAlign: "left" }}>
                      {major.majorCode}
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "12px", paddingRight: "12px", textAlign: "left" }}>
                      <div className="text-[14px] text-slate-800 font-medium leading-snug whitespace-normal break-words">
                        {major.majorName}
                      </div>
                    </td>

                    <td className="py-5 align-middle text-[13px] text-slate-600 font-medium" style={{ paddingLeft: "8px", paddingRight: "8px", textAlign: "center" }}>
                      {major.subjectCount}
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "8px", paddingRight: "8px", textAlign: "center" }}>
                      <div className="flex justify-center gap-1">
                        <span
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "9999px",
                            backgroundColor: "#E0E7FF",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {formatNumber(major.plo)}
                        </span>

                        <span
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "9999px",
                            backgroundColor: "#D1FAE5",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {formatNumber(major.clo)}
                        </span>

                        <span
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "9999px",
                            backgroundColor: "#FFE7D8",
                            color: "#EA580C",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "bold",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {formatNumber(major.kg)}
                        </span>
                      </div>
                    </td>

                    <td className="py-5 align-middle" style={{ paddingLeft: "8px", paddingRight: "8px", textAlign: "center" }}>
                      <div className="flex flex-wrap justify-center gap-1 text-[#165AA7]">
                        <button
                          type="button"
                          title="Thiết lập ma trận PLO–Học phần"
                          aria-label={`Thiết lập ma trận PLO–Học phần ngành ${major.majorName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const year = cohort.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
                            router.push(`/assessments/indirect/matrix/view?majorId=${major.id}&cohortYear=${year}`);
                          }}
                          className="rounded p-1 hover:bg-blue-50 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Network size={18} />
                        </button>
                        <button
                          type="button"
                          title="Thiết lập khung đánh giá CĐR"
                          aria-label={`Thiết lập khung đánh giá CĐR ngành ${major.majorName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const year = cohort.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
                            const cohortCode = `K${year.slice(-2)}-${year}`;
                            router.push(`/assessments/indirect/matrix/framework?majorId=${major.id}&cohort=${cohortCode}`);
                          }}
                          className="rounded p-1 text-blue-700 transition-transform hover:scale-110 hover:bg-blue-50 active:scale-95"
                        >
                          <Target size={18} />
                        </button>
                        <button
                          type="button"
                          title="Thiết lập thông số đánh giá CĐR (GT)"
                          aria-label={`Thiết lập thông số đánh giá CĐR ngành ${major.majorName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (onOpenConfig) {
                              onOpenConfig(major);
                            } else {
                              router.push(`/assessments/indirect/config?majorId=${major.id}`);
                            }
                          }}
                          className="rounded p-1 text-amber-600 transition-transform hover:scale-110 hover:bg-amber-50 active:scale-95"
                        >
                          <SlidersHorizontal size={17} />
                        </button>
                        <button
                          type="button"
                          title="Sửa ma trận CLO-PLO"
                          aria-label={`Sửa ma trận CLO-PLO ngành ${major.majorName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const year = cohort.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
                            router.push(`/assessments/indirect/matrix/clo-plo?majorId=${major.id}&cohortYear=${year}`);
                          }}
                          className="rounded p-1 text-emerald-700 hover:bg-emerald-50 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          title="Xem ma trận CLO-PLO"
                          aria-label={`Xem ma trận CLO-PLO ngành ${major.majorName}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            const year = cohort.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
                            router.push(
                              `/assessments/indirect/matrix/clo-plo/view?majorId=${major.id}&cohortYear=${year}`,
                            );
                          }}
                          className="rounded p-1 hover:bg-blue-50 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          title="Chức năng chưa được gắn"
                          aria-label={`Công cụ đánh giá ${major.majorName} chưa được gắn chức năng`}
                          disabled
                          className="cursor-not-allowed rounded p-1 text-slate-300"
                        >
                          <Scale size={18} />
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