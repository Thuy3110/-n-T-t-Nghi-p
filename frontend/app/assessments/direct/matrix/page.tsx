"use client";

import { Suspense, useEffect, useState } from "react";
import MatrixTable from "../../direct/components/MatrixTable";
import AnalysisPanel from "../../direct/components/AnalysisPanel";
import { AnalysisConfig, Major } from "./types";
import { SlidersHorizontal, Download, X, Save, Settings, BookOpen, Info, ShieldCheck, Grid3X3, Pencil, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
// Helper to generate dynamic cohorts based on the current calendar year (from current year down to 2023)
const generateCohorts = () => {
  const currentYear = new Date().getFullYear();
  const list = [];
  for (let year = currentYear; year >= 2023; year--) {
    const kNum = year - 2000;
    list.push({
      value: `K${kNum}-${year}`,
      label: `Chọn Khóa học: Khóa ${year}`,
    });
  }
  return list;
};

function MatrixPageContent() {
  const cohorts = generateCohorts();
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [config, setConfig] = useState<AnalysisConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const defaultCohort = cohorts.find(c => c.value === "K25-2025")?.value || cohorts[0]?.value || "K25-2025";
  const [selectedCohort, setSelectedCohort] = useState(defaultCohort);
  const searchParams = useSearchParams();

  const majorIdFromUrl = searchParams.get("majorId");
  const cohortFromUrl = searchParams.get("cohort");
  useEffect(() => {
    if (cohortFromUrl) {
      setSelectedCohort(cohortFromUrl);
    }
  }, [cohortFromUrl]);

  useEffect(() => {
    if (majorIdFromUrl) {
      setSelectedMajor(Number(majorIdFromUrl));
    }
  }, [majorIdFromUrl]);
  // States for interactive modals
  const [activeModal, setActiveModal] = useState<"matrix" | "edit" | "courses" | null>(null);
  const [modalMajor, setModalMajor] = useState<any | null>(null);
  const [editPloThreshold, setEditPloThreshold] = useState<number>(75);
  const [editCloThreshold, setEditCloThreshold] = useState<number>(3);
  const [editEnableContribution, setEditEnableContribution] = useState<boolean>(true);
  const [editEnableSelfAssessment, setEditEnableSelfAssessment] = useState<boolean>(true);

  // 1. Gọi API lấy danh sách Ma trận/Ngành đào tạo
  useEffect(() => {
    setLoading(true);
    // Thay đổi URL thành endpoint API thực tế của bạn
    fetch("http://localhost:3001/majors")
      .then((res) => res.json())
      .then((data: Major[]) => {
        setMajors(data);
      })
      .catch((error) => console.error("Lỗi khi tải danh sách ma trận:", error))
      .finally(() => setLoading(false));
  }, []);

  // Parse the selected year from cohort selection e.g. "K25-2025" -> 2025
  const selectedYear = parseInt(selectedCohort.match(/\d{4}/)?.[0] || "2025", 10);

  // Filter majors where their dynamic database years include the selected cohort year
  const filteredMajors = majors.filter((major) => major.years?.includes(selectedYear));

  // Tự động cập nhật ngành được chọn khi danh sách ngành thay đổi hoặc khi chuyển khóa học
  useEffect(() => {
    if (filteredMajors.length > 0) {
      if (!filteredMajors.some(m => m.id === selectedMajor)) {
        setSelectedMajor(filteredMajors[0].id);
      }
    } else {
      setSelectedMajor(null);
    }
  }, [selectedCohort, majors]);

  // 2. Gọi API lấy cấu hình chi tiết (AnalysisConfig) của ngành đang được chọn
  useEffect(() => {
    if (!selectedMajor) {
      setConfig(null);
      return;
    }

    // Thay đổi URL thành endpoint API thực tế của bạn
    fetch(`http://localhost:3001/majors/${selectedMajor}`)
      .then((res) => res.json())
      .then((data) => {
        // Ánh xạ dữ liệu từ API vào state config
        setConfig({
          majorCode: data.majorCode ?? data.code,
          ploThreshold: data.ploThreshold ?? 75,
          cloThreshold: data.cloThreshold ?? 3,
          enableContribution: data.enableContribution ?? true,
          enableSelfAssessment: data.enableSelfAssessment ?? true,
          updatedAt: data.updatedAt,
        });
      })
      .catch((error) => console.error("Lỗi khi tải cấu hình chi tiết:", error));
  }, [selectedMajor]); // Dependency cố định chỉ có selectedMajor để tránh lỗi infinite loop

  // Callback mở Modal Ma trận PLO-CLO
  const handleViewMatrix = (major: Major) => {
    fetch(`http://localhost:3001/majors/${major.id}`)
      .then((res) => res.json())
      .then((data) => {
        setModalMajor(data);
        setActiveModal("matrix");
      })
      .catch((err) => {
        alert("Lỗi khi tải ma trận: " + err.message);
      });
  };

  // Callback mở Modal Chỉnh sửa cấu hình
  const handleEditConfig = (major: Major) => {
    fetch(`http://localhost:3001/majors/${major.id}`)
      .then((res) => res.json())
      .then((data) => {
        setModalMajor(data);
        setEditPloThreshold(data.ploThreshold ?? 75);
        setEditCloThreshold(data.cloThreshold ?? 3);
        setEditEnableContribution(data.enableContribution ?? true);
        setEditEnableSelfAssessment(data.enableSelfAssessment ?? true);
        setActiveModal("edit");
      })
      .catch((err) => {
        alert("Lỗi khi tải thông số cấu hình: " + err.message);
      });
  };

  // Callback mở Modal Danh sách học phần
  const handleViewCourses = (major: Major) => {
    fetch(`http://localhost:3001/majors/${major.id}`)
      .then((res) => res.json())
      .then((data) => {
        setModalMajor(data);
        setActiveModal("courses");
      })
      .catch((err) => {
        alert("Lỗi khi tải danh sách học phần: " + err.message);
      });
  };

  // Callback lưu cấu hình từ modal chỉnh sửa
  const handleSaveModalConfig = () => {
    if (!modalMajor) return;
    const body = {
      ploThreshold: editPloThreshold,
      cloThreshold: editCloThreshold,
      enableContribution: editEnableContribution,
      enableSelfAssessment: editEnableSelfAssessment
    };
    fetch(`http://localhost:3001/majors/${modalMajor.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
      .then((res) => res.json())
      .then((updated) => {
        alert("Lưu thông số cấu hình thành công!");
        setActiveModal(null);
        // Refresh danh sách ngành
        fetch("http://localhost:3001/majors")
          .then((res) => res.json())
          .then((data) => setMajors(data));
      })
      .catch((err) => {
        alert("Lỗi khi cập nhật cấu hình: " + err.message);
      });
  };

  // 3. Callback lưu cấu hình
  const handleSaveConfig = (newConfig: {
    ploThreshold: number;
    cloThreshold: number;
    enableContribution: boolean;
    enableSelfAssessment: boolean;
  }) => {
    if (!selectedMajor) return;

    fetch(`http://localhost:3001/majors/${selectedMajor}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newConfig),
    })
      .then((res) => res.json())
      .then((updated) => {
        setConfig({
          majorCode: updated.majorCode,
          ploThreshold: updated.ploThreshold,
          cloThreshold: updated.cloThreshold,
          enableContribution: updated.enableContribution,
          enableSelfAssessment: updated.enableSelfAssessment,
          updatedAt: updated.updatedAt,
        });
        alert("Lưu và đồng bộ cấu hình thành công!");
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật cấu hình:", error);
        alert("Lưu cấu hình thất bại.");
      });
  };

  return (
    <div className="px-8 py-8 bg-[#F8FAFC] min-h-screen font-sans w-full">

      {/* Title & Filter Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-4">
            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight leading-none">
              Quản lý Ma trận - Khung CTĐT - Khung PLO
            </h1>

            <div className="flex items-center gap-2">
              <button className="w-[34px] h-[34px] rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition cursor-pointer">
                <SlidersHorizontal size={15} />
              </button>
              <button className="w-[34px] h-[34px] rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition cursor-pointer">
                <Download size={15} />
              </button>
            </div>
          </div>
          <p className="text-[12px] text-slate-400">
            Trường ĐH Kiến trúc Đà Nẵng (DAU SMART-EDU)
          </p>
        </div>

        <div className="relative inline-block">
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-[240px] h-[38px] bg-white border border-slate-200 rounded-full pl-5 pr-10 text-[12px] font-medium text-slate-700 shadow-sm appearance-none outline-none focus:border-blue-400 cursor-pointer"
          >
            {cohorts.map((cohort) => (
              <option key={cohort.value} value={cohort.value}>
                {cohort.label}
              </option>
            ))}
          </select>
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none text-slate-400 border-l pl-2 border-slate-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Area: Flex Layout (Luôn giữ 2 cột Trái - Phải) */}
      <div className="flex items-start gap-8 w-full overflow-x-auto pb-4">

        {/* Bảng danh sách Ma trận (Bên trái) */}
        <div className="flex-1 min-w-[600px]">
          <MatrixTable
            majors={filteredMajors}
            selectedMajor={selectedMajor}
            onSelect={setSelectedMajor}
            loading={loading}
            cohort={selectedCohort}
            onViewMatrix={handleViewMatrix}
            onEditConfig={handleEditConfig}
            onViewCourses={handleViewCourses}
          />
        </div>

        {/* Thông số Phân tích (Bên phải) */}
        <div className="w-[340px] shrink-0 sticky top-10">
          <AnalysisPanel majors={filteredMajors} loading={loading} />
        </div>

      </div>

      {/* Modal Wrapper */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop with blur and transition */}
          <div
            onClick={() => setActiveModal(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          ></div>

          {/* Modal Container */}
          <div
            className={`
              relative bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] border border-slate-100/50
              w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
              ${activeModal === "matrix" ? "max-w-4xl" : activeModal === "courses" ? "max-w-2xl" : "max-w-md"}
            `}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                {activeModal === "matrix" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <Grid3X3 className="text-blue-600" size={18} />
                    Ma trận PLO - CLO: Ngành {modalMajor?.majorName || modalMajor?.name || modalMajor?.majorCode}
                  </h3>
                )}
                {activeModal === "edit" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <Pencil className="text-emerald-600" size={18} />
                    Cấu hình thông số: Ngành {modalMajor?.majorName || modalMajor?.name || modalMajor?.majorCode}
                  </h3>
                )}
                {activeModal === "courses" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <List className="text-indigo-600" size={18} />
                    Danh sách học phần: Ngành {modalMajor?.majorName || modalMajor?.name || modalMajor?.majorCode}
                  </h3>
                )}
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Mã ngành: {modalMajor?.majorCode || modalMajor?.code}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeModal === "matrix" && (
                <>
                  <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-2xl shadow-sm">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
                          <th className="p-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 min-w-[120px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r">
                            Mã CLO \ PLO
                          </th>
                          {(modalMajor?.plos || []).map((plo: any) => (
                            <th key={plo.id} className="p-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[80px]" title={plo.description}>
                              {plo.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!modalMajor?.clos || modalMajor.clos.length === 0) ? (
                          <tr>
                            <td colSpan={(modalMajor?.plos?.length || 0) + 1} className="p-8 text-center text-slate-400 text-sm">
                              Không có dữ liệu ma trận (Chưa định nghĩa PLO/CLO)
                            </td>
                          </tr>
                        ) : (
                          modalMajor.clos.map((clo: any) => (
                            <tr key={clo.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-[12px] font-bold text-slate-700 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r" title={clo.description}>
                                {clo.code}
                              </td>
                              {(modalMajor?.plos || []).map((plo: any) => {
                                const sum = clo.id + plo.id;
                                const val = sum % 3 === 0 ? "I" : sum % 3 === 1 ? "R" : "M";

                                let badgeStyle = "bg-blue-50 text-blue-600 border-blue-100";
                                let label = "Introduce (I) - Giới thiệu";
                                if (val === "R") {
                                  badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                  label = "Reinforce (R) - Phát triển";
                                } else if (val === "M") {
                                  badgeStyle = "bg-orange-50 text-orange-600 border-orange-100";
                                  label = "Mastery (M) - Thành thạo";
                                }

                                return (
                                  <td key={plo.id} className="p-3 text-center align-middle">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[12px] font-bold border ${badgeStyle}`} title={label}>
                                      {val}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 mt-4 p-4 bg-slate-50 rounded-2xl text-[12px] text-slate-500 border border-slate-100">
                    <span className="font-bold text-slate-700">Chú thích cấp học tập:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[10px]">I</span>
                      <span className="font-medium">Introduce (Giới thiệu)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[10px]">R</span>
                      <span className="font-medium">Reinforce (Phát triển)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100 font-bold text-[10px]">M</span>
                      <span className="font-medium">Mastery (Thành thạo)</span>
                    </div>
                  </div>
                </>
              )}

              {activeModal === "edit" && (
                <div className="flex flex-col gap-6">
                  {/* PLO Threshold */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-slate-700">Ngưỡng đạt PLO (%)</span>
                      <span className="text-[13px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">{editPloThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editPloThreshold}
                      onChange={(e) => setEditPloThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Tỷ lệ phần trăm tối thiểu các CLO đạt để tính là đạt PLO tương ứng.
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  {/* CLO Threshold */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-slate-700">Ngưỡng điểm đạt CLO</span>
                      <span className="text-[13px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">{editCloThreshold} / 5.0</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={editCloThreshold}
                      onChange={(e) => setEditCloThreshold(Number(e.target.value))}
                      className="w-full h-[40px] px-3 bg-white border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 font-medium"
                    />
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Mức thang điểm đánh giá trung bình tối thiểu để CLO được công nhận đạt.
                    </p>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Toggles */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-slate-700">Đóng góp từ học phần</span>
                        <span className="text-[11px] text-slate-400">Đồng bộ dữ liệu CLO từ kết quả học tập.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editEnableContribution}
                          onChange={(e) => setEditEnableContribution(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-slate-700">Đánh giá khảo sát tự học</span>
                        <span className="text-[11px] text-slate-400">Kết hợp tự khảo sát PO của sinh viên.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editEnableSelfAssessment}
                          onChange={(e) => setEditEnableSelfAssessment(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "courses" && (
                <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-2xl shadow-sm">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
                        <th className="p-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[60px]">STT</th>
                        <th className="p-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[130px]">Mã học phần</th>
                        <th className="p-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên học phần</th>
                        <th className="p-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">Số tín chỉ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!modalMajor?.courses || modalMajor.courses.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                            Chưa có học phần nào được thêm vào ngành này.
                          </td>
                        </tr>
                      ) : (
                        modalMajor.courses.map((course: any, idx: number) => (
                          <tr key={course.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-[12px] text-slate-400 text-center font-medium">{idx + 1}</td>
                            <td className="p-3 text-[12px] text-blue-600 font-semibold">{course.code}</td>
                            <td className="p-3 text-[13px] text-slate-700 font-semibold">{course.name}</td>
                            <td className="p-3 text-[12px] text-slate-600 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                                {course.credits} TC
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
              {activeModal === "edit" && (
                <button
                  onClick={handleSaveModalConfig}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
                >
                  <Save size={14} />
                  Lưu cấu hình
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatrixPage() {
  return <Suspense fallback={<div className="p-8">Đang tải ma trận...</div>}><MatrixPageContent /></Suspense>;
}
