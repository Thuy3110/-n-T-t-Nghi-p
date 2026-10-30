"use client";

import { useEffect, useState } from "react";
import MatrixTable from "../components/MatrixTable";
import AnalysisPanel from "../components/AnalysisPanel";
import IndirectAssessmentConfigModal from "../components/IndirectAssessmentConfigModal";
import { AnalysisConfig, Major } from "./types";
import { SlidersHorizontal, Download } from "lucide-react";

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

export default function MatrixPage() {
  const cohorts = generateCohorts();
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [config, setConfig] = useState<AnalysisConfig | null>(null);
  const [configMajorId, setConfigMajorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const defaultCohort = cohorts.find(c => c.value === "K25-2025")?.value || cohorts[0]?.value || "K25-2025";
  const [selectedCohort, setSelectedCohort] = useState(defaultCohort);

  // 1. Gọi API lấy danh sách Ma trận/Ngành đào tạo
  useEffect(() => {
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
  const selectedMajorId = filteredMajors.some(
    (major) => major.id === selectedMajor
  )
    ? selectedMajor
    : filteredMajors[0]?.id ?? null;

  // 2. Gọi API lấy cấu hình chi tiết (AnalysisConfig) của ngành đang được chọn
  useEffect(() => {
    if (selectedMajorId === null) return;

    const controller = new AbortController();
    fetch(`http://localhost:3001/majors/${selectedMajorId}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          majorCode: data.majorCode ?? data.code,
          ploThreshold: data.ploThreshold ?? 75,
          cloThreshold: data.cloThreshold ?? 3,
          enableContribution: data.enableContribution ?? true,
          enableSelfAssessment: data.enableSelfAssessment ?? true,
          updatedAt: data.updatedAt,
        });
        setConfigMajorId(selectedMajorId);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Lỗi khi tải cấu hình chi tiết:", error);
        }
      });

    return () => controller.abort();
  }, [selectedMajorId]);

  // 3. Callback lưu cấu hình
  const handleSaveConfig = async (newConfig: {
    ploThreshold: number;
    cloThreshold: number;
    enableContribution: boolean;
    enableSelfAssessment: boolean;
  }) => {
    if (selectedMajorId === null) {
      throw new Error("Chưa chọn ngành cần cấu hình.");
    }

    const response = await fetch(`http://localhost:3001/majors/${selectedMajorId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newConfig),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Không thể lưu cấu hình (${response.status}): ${detail}`);
    }

    const updated = await response.json();
    setConfig({
      majorCode: updated.majorCode ?? updated.code ?? config?.majorCode ?? "",
      ploThreshold: updated.ploThreshold ?? newConfig.ploThreshold,
      cloThreshold: updated.cloThreshold ?? newConfig.cloThreshold,
      enableContribution:
        updated.enableContribution ?? newConfig.enableContribution,
      enableSelfAssessment:
        updated.enableSelfAssessment ?? newConfig.enableSelfAssessment,
      updatedAt: updated.updatedAt,
    });
  };

  return (
    <div className="px-8 py-8 bg-[#F8FAFC] min-h-screen font-sans w-full">

      {/* Title & Filter Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-4">
            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight leading-none">
              Quản lý Ma trận - Khung CTĐT - Khung PLO (GT)
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                title="Thiết lập thông số đánh giá CĐR (GT)"
                className="w-[34px] h-[34px] rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1457bd] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition cursor-pointer"
              >
                <SlidersHorizontal size={15} />
              </button>
              <button className="w-[34px] h-[34px] rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition cursor-pointer">
                <Download size={15} />
              </button>
            </div>
          </div>
          <p className="text-[12px] text-slate-400">
            Trường ĐH Kiến trúc Đà Nẵng (DAU SMART-EDU Indirect Assessment)
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

      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_280px] items-start gap-4 pb-4">
        <div className="min-w-0 w-full">
          <MatrixTable
            majors={filteredMajors}
            selectedMajor={selectedMajor}
            onSelect={setSelectedMajor}
            loading={loading}
            cohort={selectedCohort}
            onOpenConfig={(m) => {
              setSelectedMajor(m.id);
              setConfigModalOpen(true);
            }}
          />
        </div>

        <div className="w-full min-w-0 sticky top-10">
          <AnalysisPanel config={config} onSave={handleSaveConfig} />
        </div>
      </div>

      {configModalOpen &&
        config &&
        configMajorId === selectedMajorId && (
        <IndirectAssessmentConfigModal
          key={selectedMajorId}
          isOpen
          onClose={() => setConfigModalOpen(false)}
          config={config}
          cohort={selectedCohort}
          majorCode={
            filteredMajors.find((m) => m.id === selectedMajorId)?.majorCode ||
            ""
          }
          overlayClassName="fixed inset-y-0 left-[270px] right-0"
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}