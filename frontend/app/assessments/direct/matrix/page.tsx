"use client";

import { Suspense, useEffect, useState } from "react";
import MatrixTable from "../../direct/components/MatrixTable";
import AnalysisPanel from "../../direct/components/AnalysisPanel";
import { AnalysisConfig, Major } from "./types";
import * as XLSX from "xlsx";
import { SlidersHorizontal, Download, X, Save, Settings, BookOpen, Info, ShieldCheck, Grid3X3, Pencil, List, GraduationCap, BarChart2, AlertTriangle, CheckCircle2 } from "lucide-react";
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


// Dữ liệu chuẩn AUN-QA / ABET cho Chuẩn đầu ra (PLO)
const DEFAULT_PLOS = [
  { id: 1, code: "PLO1", name: "Kiến thức Đại cương & Nền tảng Khoa học", description: "Vận dụng thành thạo kiến thức về lý luận chính trị, pháp luật đại cương, quốc phòng - an ninh, toán học (Giải tích, Đại số, Xác suất thống kê, Toán rời rạc) và phương pháp nghiên cứu khoa học vào việc phân tích, mô hình hóa các bài toán tin học và công nghệ.", targetPercent: 75, level: "R (Reinforce)" },
  { id: 2, code: "PLO2", name: "Cơ sở Công nghệ thông tin & Máy tính", description: "Nắm vững nguyên lý hoạt động của máy tính, kiến trúc phần cứng, hệ điều hành, mạng máy tính, cơ sở dữ liệu và bảo mật thông tin để thiết kế và quản trị hạ tầng CNTT vững chắc.", targetPercent: 75, level: "R (Reinforce)" },
  { id: 3, code: "PLO3", name: "Phân tích, Thiết kế & Phát triển Phần mềm", description: "Làm chủ các phương pháp phân tích thiết kế giải thuật, lập trình hướng đối tượng, quy trình công nghệ phần mềm và các kiến trúc hệ thống hiện đại (Web, Mobile, Enterprise) để xây dựng giải pháp phần mềm tối ưu.", targetPercent: 75, level: "M (Mastery)" },
  { id: 4, code: "PLO4", name: "Chuyên sâu Công nghệ tiên tiến", description: "Cập nhật và vận dụng kiến thức chuyên sâu thuộc các lĩnh vực công nghệ mới như Trí tuệ nhân tạo (AI), Chuỗi khối (Blockchain), Internet kết nối vạn vật (IoT), Điện toán đám mây (Cloud) và Hệ thống phân tán vào các ứng dụng thực tế.", targetPercent: 75, level: "M (Mastery)" },
  { id: 5, code: "PLO5", name: "Kỹ năng Lập trình & Kỹ thuật Phần mềm", description: "Thành thạo kỹ năng viết mã nguồn sạch (clean code), gỡ lỗi, kiểm thử phần mềm (Testing), quản lý phiên bản mã nguồn (Git) và triển khai ứng dụng trên các nền tảng đa dạng (Desktop, Web, Mobile, Cloud).", targetPercent: 75, level: "M (Mastery)" },
  { id: 6, code: "PLO6", name: "Kỹ năng Tư duy Phân tích & Giải quyết vấn đề", description: "Có khả năng khảo sát nghiệp vụ thực tế, xác định bài toán, lựa chọn cấu trúc dữ liệu - thuật toán - công nghệ phù hợp để thiết kế giải pháp tổng thể giải quyết các vấn đề phức tạp trong kỹ thuật và doanh nghiệp.", targetPercent: 75, level: "M (Mastery)" },
  { id: 7, code: "PLO7", name: "Kỹ năng Ngoại ngữ & Giao tiếp Chuyên môn", description: "Sử dụng hiệu quả Tiếng Anh (hoặc Tiếng Nhật / Tiếng Hàn) trong giao tiếp, đọc hiểu tài liệu kỹ thuật, viết báo cáo giải pháp và thuyết trình chuyên môn trước đối tác, hội đồng hoặc khách hàng.", targetPercent: 75, level: "R (Reinforce)" },
  { id: 8, code: "PLO8", name: "Kỹ năng Làm việc nhóm & Quản lý Dự án", description: "Thành thạo kỹ năng làm việc nhóm, điều phối công việc, lập kế hoạch, kiểm soát tiến độ và quản lý rủi ro dự án phần mềm theo các mô hình Agile/Scrum hoặc PMBOK.", targetPercent: 75, level: "M (Mastery)" },
  { id: 9, code: "PLO9", name: "Tác phong Nghề nghiệp & Đạo đức CNTT", description: "Thực hiện đúng các quy định về an toàn thông tin, tuân thủ bản quyền phần mềm, bảo mật dữ liệu cá nhân/doanh nghiệp và thể hiện đạo đức nghề nghiệp, tính kiên trì, cẩn trọng trong công việc kỹ thuật.", targetPercent: 75, level: "R (Reinforce)" },
  { id: 10, code: "PLO10", name: "Tự học & Thích ứng Chuyển đổi số", description: "Có năng lực tự học, tự nghiên cứu, chủ động cập nhật các xu hướng công nghệ mới nổi và sẵn sàng thích ứng với sự thay đổi liên tục của thị trường lao động và nền kinh tế số.", targetPercent: 75, level: "M (Mastery)" },
];

// Dữ liệu học phần chuẩn CTĐT cho AUN-QA Blueprint
const DEFAULT_COURSES = [
  { id: 1, code: "MTA103", name: "Toán cao cấp A1", credits: 3, semester: 1 },
  { id: 2, code: "ITP101", name: "Nhập môn lập trình", credits: 3, semester: 1 },
  { id: 3, code: "PEM101", name: "Pháp luật đại cương", credits: 2, semester: 1 },
  { id: 4, code: "OOP201", name: "Lập trình hướng đối tượng (Java)", credits: 3, semester: 2 },
  { id: 5, code: "DSA201", name: "Cấu trúc dữ liệu và giải thuật", credits: 3, semester: 2 },
  { id: 6, code: "CAO201", name: "Kiến trúc máy tính & Vi xử lý", credits: 3, semester: 3 },
  { id: 7, code: "DBS201", name: "Hệ quản trị cơ sở dữ liệu", credits: 3, semester: 3 },
  { id: 8, code: "SWE201", name: "Công nghệ phần mềm", credits: 3, semester: 4 },
  { id: 9, code: "PRW201", name: "Lập trình ứng dụng Web", credits: 3, semester: 4 },
  { id: 10, code: "MOB201", name: "Lập trình thiết bị di động", credits: 3, semester: 5 },
  { id: 11, code: "AFI201", name: "Trí tuệ nhân tạo và Ứng dụng", credits: 3, semester: 6 },
  { id: 12, code: "PRM301", name: "Quản trị dự án phần mềm", credits: 3, semester: 7 },
  { id: 13, code: "FIP402", name: "Đồ án tốt nghiệp / Khóa luận", credits: 10, semester: 9 },
];

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
  const [activeModal, setActiveModal] = useState<"matrix" | "edit" | "courses" | "plos" | "blueprint" | null>(null);
  const [courseWeights, setCourseWeights] = useState<Record<string, { process: number; midterm: number; practice: number; final: number }>>({});
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

  // Callback mở Modal Danh sách Chuẩn đầu ra PLO
  
  const getEffectivePlos = () => {
    if (modalMajor?.plos && modalMajor.plos.length > 0) return modalMajor.plos;
    return DEFAULT_PLOS;
  };

  const getEffectiveCourses = () => {
    if (modalMajor?.courses && modalMajor.courses.length > 0) return modalMajor.courses;
    return DEFAULT_COURSES;
  };

  const cleanMajorName = () => {
    const raw = modalMajor?.majorName || modalMajor?.name || modalMajor?.majorCode || "Công nghệ thông tin";
    return raw.replace(/^Ngành\s+/i, '');
  };

  const handleViewPlos = (major: Major) => {
    fetch(`http://localhost:3001/majors/${major.id}`)
      .then((res) => res.json())
      .then((data) => {
        setModalMajor(data);
        setActiveModal("plos");
      })
      .catch((err) => {
        alert("Lỗi khi tải danh sách PLO: " + err.message);
      });
  };

  // Callback xuất ma trận trong modal ra Excel
  const handleExportModalMatrix = () => {
    if (!modalMajor) return;
    const plos = modalMajor.plos || [];
    const clos = modalMajor.clos || [];
    let parsedMatrix: any = {};
    if (modalMajor.matrixData) {
      try {
        parsedMatrix = typeof modalMajor.matrixData === "string" ? JSON.parse(modalMajor.matrixData) : modalMajor.matrixData;
      } catch (e) {}
    }
    const rows = clos.map((clo: any) => {
      const matchCourseCode = clo.code.split("-")[0];
      const row: Record<string, string> = {
        "Mã CLO": clo.code,
        "Mô tả CLO": clo.description || "",
      };
      plos.forEach((plo: any) => {
        let levelNum = parsedMatrix[`${matchCourseCode}-${plo.code}`] ?? parsedMatrix[`${clo.code}-${plo.code}`] ?? null;
        if (!levelNum && plo.matrices) {
          const m = plo.matrices.find((mat: any) => mat.cloId === clo.id);
          if (m) levelNum = m.level;
        }
        row[plo.code] = levelNum === 1 ? "I" : levelNum === 2 ? "R" : levelNum === 3 ? "M" : "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ma tran CLO-PLO");
    XLSX.writeFile(workbook, `Ma_tran_CLO_PLO_${modalMajor.majorCode || "Nganh"}.xlsx`);
  };

  // Callback xuất danh sách PLO ra Excel
  
  // Callback mở Modal AUN-QA Blueprint (Kiểm tra phân bổ phương thức & trọng số điểm 100%)
  const handleViewBlueprint = (major: Major) => {
    fetch(`http://localhost:3001/majors/${major.id}`)
      .then((res) => res.json())
      .then((data) => {
        setModalMajor(data);
        // Khởi tạo trọng số mặc định cho từng học phần
        const initialWeights: Record<string, { process: number; midterm: number; practice: number; final: number }> = {};
        (data.courses || []).forEach((c: any, idx: number) => {
          // Tạo một môn học có trọng số lệch 100% để kiểm thử cảnh báo AUN-QA
          if (idx === 1) {
            initialWeights[c.code] = { process: 10, midterm: 30, practice: 0, final: 50 }; // 90% -> Cảnh báo
          } else if (c.credits >= 3) {
            initialWeights[c.code] = { process: 10, midterm: 20, practice: 20, final: 50 }; // 100%
          } else {
            initialWeights[c.code] = { process: 10, midterm: 30, practice: 0, final: 60 }; // 100%
          }
        });
        setCourseWeights(initialWeights);
        setActiveModal("blueprint");
      })
      .catch((err) => {
        alert("Lỗi khi tải thông tin ngành: " + err.message);
      });
  };

  const handleWeightChange = (courseCode: string, field: "process" | "midterm" | "practice" | "final", val: number) => {
    setCourseWeights((prev) => ({
      ...prev,
      [courseCode]: {
        ...(prev[courseCode] || { process: 10, midterm: 30, practice: 0, final: 60 }),
        [field]: Number.isNaN(val) ? 0 : val,
      },
    }));
  };

    const handleExportBlueprint = () => {
    if (!modalMajor) return;
    const courses = getEffectiveCourses();
    const rows = courses.map((c: any, idx: number) => {
      const w = courseWeights[c.code] || { process: 10, midterm: 30, practice: 0, final: 60 };
      const total = (w.process || 0) + (w.midterm || 0) + (w.practice || 0) + (w.final || 0);
      return {
        STT: idx + 1,
        "Học kỳ": c.semester ? `HK ${c.semester}` : "—",
        "Mã học phần": c.code,
        "Tên học phần": c.name,
        "Số TC": c.credits,
        "Quá trình (%)": w.process,
        "Giữa kỳ (%)": w.midterm,
        "Thực hành (%)": w.practice,
        "Cuối kỳ (%)": w.final,
        "Tổng trọng số (%)": total,
        "Đánh giá AUN-QA": total === 100 ? "ĐẠT (100%)" : `LỆCH (${total}%)`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AUN-QA Blueprint");
    XLSX.writeFile(workbook, `AUN_QA_Blueprint_${modalMajor.majorCode || "Nganh"}.xlsx`);
  };

    const handleExportPlos = () => {
    if (!modalMajor) return;
    const plos = getEffectivePlos();
    const rows = plos.map((plo: any, idx: number) => ({
      STT: idx + 1,
      "Mã PLO": plo.code,
      "Tên / Miền năng lực": plo.name || `Chuẩn đầu ra ${plo.code}`,
      "Mô tả Chuẩn đầu ra (PLO)": plo.description || "",
      "Ngưỡng đạt tối thiểu (%)": `${plo.targetPercent ?? modalMajor.ploThreshold ?? 75}%`,
      "Mức độ AUN-QA": plo.level || "M (Mastery)",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sach PLO");
    XLSX.writeFile(workbook, `Danh_sach_PLO_${modalMajor.majorCode || "Nganh"}.xlsx`);
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
            onViewPlos={handleViewPlos}
            onViewBlueprint={handleViewBlueprint}
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
              ${activeModal === "matrix" || activeModal === "plos" || activeModal === "blueprint" ? "max-w-5xl" : activeModal === "courses" ? "max-w-3xl" : "max-w-md"}
            `}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                {activeModal === "blueprint" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="text-blue-600" size={18} />
                    Ma trận Phương thức Đánh giá (AUN-QA Blueprint): Ngành {cleanMajorName()}
                  </h3>
                )}
                {activeModal === "matrix" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <Grid3X3 className="text-blue-600" size={18} />
                    Ma trận PLO - CLO: Ngành {cleanMajorName()}
                  </h3>
                )}
                {activeModal === "edit" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <Pencil className="text-emerald-600" size={18} />
                    Cấu hình thông số: Ngành {cleanMajorName()}
                  </h3>
                )}
                {activeModal === "plos" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-emerald-600" size={18} />
                    Danh sách Chuẩn đầu ra (PLO): Ngành {cleanMajorName()}
                  </h3>
                )}
                {activeModal === "courses" && (
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    <List className="text-indigo-600" size={18} />
                    Danh sách học phần: Ngành {cleanMajorName()}
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
              {activeModal === "plos" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-800 text-[12px] leading-relaxed">
                    <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                    <span>
                      Hệ thống Chuẩn đầu ra (PLO) được chuẩn hóa theo chuẩn quốc tế <strong>AUN-QA</strong> và <strong>ABET</strong>. Mỗi PLO định nghĩa rõ ràng miền năng lực, ngưỡng đạt và cấp độ kỳ vọng trong chương trình đào tạo.
                    </span>
                  </div>

                  <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-2xl shadow-xs">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3 text-center w-[50px]">STT</th>
                          <th className="p-3 text-center w-[90px]">Mã PLO</th>
                          <th className="p-3 text-left min-w-[200px]">Tên Chuẩn đầu ra</th>
                          <th className="p-3 text-left min-w-[320px]">Mô tả chi tiết</th>
                          <th className="p-3 text-center w-[120px]">Cấp độ</th>
                          <th className="p-3 text-center w-[90px]">Ngưỡng đạt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getEffectivePlos().map((plo: any, idx: number) => {
                          const isMastery = (plo.level || "").includes("M");
                          return (
                            <tr key={plo.id || idx} className="hover:bg-slate-50/60 transition">
                              <td className="p-3 text-center text-[12px] text-slate-400 font-medium">{idx + 1}</td>
                              <td className="p-3 text-center align-middle">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[12px] border border-emerald-200">
                                  {plo.code}
                                </span>
                              </td>
                              <td className="p-3 text-[13px] font-semibold text-slate-800 align-top">
                                {plo.name || `Chuẩn đầu ra ${plo.code}`}
                              </td>
                              <td className="p-3 text-[12px] text-slate-600 leading-relaxed align-top">
                                {plo.description || "Chưa có bản mô tả chi tiết."}
                              </td>
                              <td className="p-3 text-center align-middle">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                  isMastery
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {plo.level || "R (Reinforce)"}
                                </span>
                              </td>
                              <td className="p-3 text-center align-middle">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[12px]">
                                  {plo.targetPercent ?? modalMajor?.ploThreshold ?? 75}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModal === "blueprint" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-800 text-[12px] leading-relaxed">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Quy chuẩn Đánh giá AUN-QA Criterion 3 & ABET:</p>
                      <p className="text-slate-600 mt-0.5">
                        Tổng trọng số các thành phần đánh giá học phần (Quá trình + Giữa kỳ + Thực hành/BTL + Cuối kỳ) bắt buộc phải đạt chính xác <strong>100%</strong>. Nếu sai lệch (&ne; 100%), hệ thống sẽ cảnh báo màu đỏ để đảm bảo độ tin cậy trong kiểm định chất lượng giáo dục.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-[50vh] border border-slate-100 rounded-2xl shadow-xs">
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3 text-center w-[50px]">STT</th>
                          <th className="p-3 text-center w-[70px]">Học kỳ</th>
                          <th className="p-3 text-left w-[100px]">Mã HP</th>
                          <th className="p-3 text-left min-w-[180px]">Tên học phần</th>
                          <th className="p-3 text-center w-[60px]">Số TC</th>
                          <th className="p-3 text-center w-[85px]">Quá trình</th>
                          <th className="p-3 text-center w-[85px]">Giữa kỳ</th>
                          <th className="p-3 text-center w-[85px]">Thực hành</th>
                          <th className="p-3 text-center w-[85px]">Cuối kỳ</th>
                          <th className="p-3 text-center w-[85px]">Tổng (%)</th>
                          <th className="p-3 text-center min-w-[140px]">Trạng thái AUN-QA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getEffectiveCourses().map((c: any, idx: number) => {
                          const w = courseWeights[c.code] || { process: 10, midterm: 30, practice: 0, final: 60 };
                          const total = (w.process || 0) + (w.midterm || 0) + (w.practice || 0) + (w.final || 0);
                          const isInvalid = total !== 100;
                          return (
                            <tr key={c.id || idx} className={`hover:bg-slate-50/60 transition ${isInvalid ? "bg-red-50/20" : ""}`}>
                              <td className="p-3 text-center text-[12px] text-slate-400 font-medium">{idx + 1}</td>
                              <td className="p-3 text-center align-middle">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-slate-600">
                                  {c.semester ? `HK ${c.semester}` : "—"}
                                </span>
                              </td>
                              <td className="p-3 text-[12px] font-bold text-blue-600">{c.code}</td>
                              <td className="p-3 text-[13px] font-semibold text-slate-800">{c.name}</td>
                              <td className="p-3 text-center text-[12px] font-medium text-slate-600">{c.credits} TC</td>
                              <td className="p-2 text-center align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={w.process}
                                  onChange={(e) => handleWeightChange(c.code, "process", Number(e.target.value))}
                                  className="w-14 text-center py-1 text-[12px] font-medium border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-2 text-center align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={w.midterm}
                                  onChange={(e) => handleWeightChange(c.code, "midterm", Number(e.target.value))}
                                  className="w-14 text-center py-1 text-[12px] font-medium border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-2 text-center align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={w.practice}
                                  onChange={(e) => handleWeightChange(c.code, "practice", Number(e.target.value))}
                                  className="w-14 text-center py-1 text-[12px] font-medium border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-2 text-center align-middle">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={w.final}
                                  onChange={(e) => handleWeightChange(c.code, "final", Number(e.target.value))}
                                  className="w-14 text-center py-1 text-[12px] font-medium border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-3 text-center align-middle">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[12px] font-bold ${
                                  isInvalid ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {total}%
                                </span>
                              </td>
                              <td className="p-3 text-center align-middle">
                                {isInvalid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold border border-red-200" title="Sai quy chuẩn AUN-QA: Tổng trọng số phải là 100%">
                                    <AlertTriangle size={13} />
                                    Lệch trọng số ({total}%)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                    <CheckCircle2 size={13} />
                                    Đạt chuẩn AUN-QA
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
                                let levelNum = null;
                                if (modalMajor?.matrixData) {
                                  try {
                                    const parsed = typeof modalMajor.matrixData === "string" ? JSON.parse(modalMajor.matrixData) : modalMajor.matrixData;
                                    const matchCourseCode = clo.code.split("-")[0];
                                    levelNum = parsed[`${matchCourseCode}-${plo.code}`] ?? parsed[`${clo.code}-${plo.code}`] ?? null;
                                  } catch (e) {}
                                }
                                if (!levelNum && plo.matrices) {
                                  const m = plo.matrices.find((mat: any) => mat.cloId === clo.id);
                                  if (m) levelNum = m.level;
                                }
                                const val = levelNum === 1 ? "I" : levelNum === 2 ? "R" : levelNum === 3 ? "M" : null;
                                if (!val) {
                                  return (
                                    <td key={plo.id} className="p-3 text-center align-middle text-slate-300 text-[12px]">
                                      -
                                    </td>
                                  );
                                }

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
                        <th className="p-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[80px]">Học kỳ</th>
                        <th className="p-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[130px]">Mã học phần</th>
                        <th className="p-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên học phần</th>
                        <th className="p-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[100px]">Số tín chỉ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!modalMajor?.courses || modalMajor.courses.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                            Chưa có học phần nào được thêm vào ngành này.
                          </td>
                        </tr>
                      ) : (
                        [...(modalMajor.courses || [])].sort((a: any, b: any) => {
                          const semA = a.semester ?? 999;
                          const semB = b.semester ?? 999;
                          if (semA !== semB) return semA - semB;
                          return String(a.code).localeCompare(String(b.code), "vi");
                        }).map((course: any, idx: number) => (
                          <tr key={course.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-[12px] text-slate-400 text-center font-medium">{idx + 1}</td>
                            <td className="p-3 text-center align-middle">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-slate-600">
                                {course.semester ? `HK ${course.semester}` : "—"}
                              </span>
                            </td>
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                {activeModal === "plos" && (
                  <button
                    onClick={handleExportPlos}
                    className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    Xuất Danh sách PLO (Excel)
                  </button>
                )}
                {activeModal === "blueprint" && (
                  <button
                    onClick={handleExportBlueprint}
                    className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    Xuất AUN-QA Blueprint (Excel)
                  </button>
                )}
                {activeModal === "matrix" && (
                  <button
                    onClick={handleExportModalMatrix}
                    className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    Xuất Ma trận CLO-PLO (Excel)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                {activeModal === "edit" && (
                  <button
                    onClick={handleSaveModalConfig}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/10"
                  >
                    <Save size={14} />
                    Lưu cấu hình
                  </button>
                )}
              </div>
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
