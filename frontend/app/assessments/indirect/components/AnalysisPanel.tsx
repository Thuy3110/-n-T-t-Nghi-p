"use client";

import { useEffect, useState } from "react";
import { AnalysisConfig } from "../../indirect/matrix/types";
import { RotateCw } from "lucide-react";

interface Props {
  config: AnalysisConfig | null;
  onSave?: (newConfig: {
    ploThreshold: number;
    cloThreshold: number;
    enableContribution: boolean;
    enableSelfAssessment: boolean;
  }) => void;
}

export default function AnalysisPanel({ config, onSave }: Props) {
  const [ploThreshold, setPloThreshold] = useState<number>(0);
  const [cloThreshold, setCloThreshold] = useState<number>(0);
  const [enableContribution, setEnableContribution] = useState<boolean>(false);
  const [enableSelfAssessment, setEnableSelfAssessment] = useState<boolean>(false);

  useEffect(() => {
    if (!config) return;

    setPloThreshold(config.ploThreshold ?? 0);
    setCloThreshold(config.cloThreshold ?? 0);
    setEnableContribution(!!config.enableContribution);
    setEnableSelfAssessment(!!config.enableSelfAssessment);
  }, [config]);

  if (!config) return null;

  // Format dynamic updatedAt time
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ploThreshold,
        cloThreshold,
        enableContribution,
        enableSelfAssessment,
      });
    }
  };

  return (
    <div
      className="bg-white rounded-[30px] overflow-hidden"
      style={{
        paddingTop: "40px",
        paddingBottom: "40px",
        boxShadow: "0 10px 40px -10px rgba(15, 23, 42, 0.08), 0 2px 10px -5px rgba(15, 23, 42, 0.03)"
      }}
    >
      {/* HEADER */}
      <div className="px-8 pt-0 pb-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-slate-800">
              Thông số Phân tích - Đánh giá
            </h2>
            <span className="shrink-0 px-2.5 py-0.5 rounded bg-blue-50 text-[#165aa7] text-[10px] font-bold uppercase tracking-wider select-none">
              Active
            </span>
          </div>
          <p className="text-[12px] text-slate-400">
            Cấu hình tham số đánh giá chuẩn đầu ra
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-8 pt-6 pb-0 flex flex-col gap-6">
        {/* MAJOR CODE */}
        <div
          className="rounded-2xl flex items-center justify-between"
          style={{ backgroundColor: "#F8FAFC", padding: "18px 24px" }}
        >
          <span className="text-[14px] text-slate-500 font-semibold">
            Mã ngành học:
          </span>
          <span className="bg-white border border-slate-200/60 rounded-xl px-5 py-2 text-[14px] font-bold text-slate-800 shadow-sm select-all">
            {config.majorCode}
          </span>
        </div>

        {/* CONTRIBUTION TOGGLE */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-bold text-[14px] text-slate-800">
              Bật/Tắt Mức đóng góp
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kích hoạt trọng số thành phần
            </p>
          </div>

          <button
            onClick={() => setEnableContribution(!enableContribution)}
            className="relative rounded-full transition-colors duration-200 outline-none shrink-0 cursor-pointer"
            style={{
              width: "44px",
              height: "24px",
              backgroundColor: enableContribution ? "#059669" : "#E2E8F0",
            }}
          >
            <span
              className="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{
                top: "3px",
                left: "3px",
                width: "18px",
                height: "18px",
                transform: enableContribution ? "translateX(20px)" : "translateX(0px)",
              }}
            />
          </button>
        </div>

        {/* PLO THRESHOLD */}
        <div className="flex flex-col gap-2.5">
          <p className="font-bold text-[14px] text-slate-800">
            Mức đạt của PLOi (Gián tiếp)
          </p>
          <div
            className="rounded-2xl px-5 py-3 flex items-center justify-between"
            style={{ backgroundColor: "#EAF3FF" }}
          >
            <input
              type="number"
              value={ploThreshold ?? ""}
              onChange={(e) => setPloThreshold(Number(e.target.value))}
              className="bg-transparent outline-none text-[26px] font-bold text-slate-800 w-full"
            />
            <span className="text-slate-400 text-lg font-medium select-none">%</span>
          </div>
          <p className="text-[11px] text-slate-400">
            * Ngưỡng tối thiểu công nhận hoàn thành PLO
          </p>
        </div>

        <div className="border-t border-slate-100" />

        {/* SELF ASSESSMENT SECTION */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            TỰ ĐÁNH GIÁ (TĐG)
          </h3>

          <div className="flex items-center justify-between py-1">
            <p className="font-bold text-[14px] text-slate-800">
              SV TDG CLO
            </p>
            <button
              onClick={() => setEnableSelfAssessment(!enableSelfAssessment)}
              className="relative rounded-full transition-colors duration-200 outline-none shrink-0 cursor-pointer"
              style={{
                width: "44px",
                height: "24px",
                backgroundColor: enableSelfAssessment ? "#059669" : "#E2E8F0",
              }}
            >
              <span
                className="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{
                  top: "3px",
                  left: "3px",
                  width: "18px",
                  height: "18px",
                  transform: enableSelfAssessment ? "translateX(20px)" : "translateX(0px)",
                }}
              />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="font-bold text-[14px] text-slate-800">
              Mức đạt CLO
            </p>
            <div
              className="flex items-center justify-between rounded-2xl h-[46px] overflow-hidden"
              style={{ backgroundColor: "#EAF3FF" }}
            >
              <button
                onClick={() => setCloThreshold((v) => Math.max(1, v - 1))}
                className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-blue-100/30 transition text-xl font-medium"
              >
                −
              </button>
              <span className="flex-1 text-center font-bold text-[15px] text-slate-800 select-none">
                {cloThreshold}
              </span>
              <button
                onClick={() => setCloThreshold((v) => Math.min(5, v + 1))}
                className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-blue-100/30 transition text-xl font-medium"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Thang đo định mức năng lực (1-5)
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* CONTRIBUTION LEVELS SECTION */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            MỨC ĐÓNG GÓP CLO/PLO
          </h3>

          <div className="flex flex-col gap-3">
            {/* Introduce */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 text-white font-bold text-[13px] flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: "#EF4444",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px"
                  }}
                >
                  I
                </div>
                <span className="font-semibold text-[14px] text-red-800">
                  Introduce
                </span>
              </div>
              <span
                className="text-[11px] font-bold flex items-center justify-center shadow-sm select-none"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#EF4444",
                  padding: "4px 12px",
                  borderRadius: "9999px"
                }}
              >
                Mức 1
              </span>
            </div>

            {/* Reinforce */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ backgroundColor: "#FFFBEB" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 text-white font-bold text-[13px] flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: "#F59E0B",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px"
                  }}
                >
                  R
                </div>
                <span className="font-semibold text-[14px] text-amber-800">
                  Reinforce
                </span>
              </div>
              <span
                className="text-[11px] font-bold flex items-center justify-center shadow-sm select-none"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#D97706",
                  padding: "4px 12px",
                  borderRadius: "9999px"
                }}
              >
                Mức 2
              </span>
            </div>

            {/* Mastery */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-3"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 text-white font-bold text-[13px] flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: "#10B981",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px"
                  }}
                >
                  M
                </div>
                <span className="font-semibold text-[14px] text-emerald-800">
                  Mastery
                </span>
              </div>
              <span
                className="text-[11px] font-bold flex items-center justify-center shadow-sm select-none"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#10B981",
                  padding: "4px 12px",
                  borderRadius: "9999px"
                }}
              >
                Mức 3
              </span>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full h-[50px] rounded-2xl bg-[#165aa7] hover:bg-[#124983] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(22,90,167,0.25)] transition-all duration-200 cursor-pointer"
          >
            <RotateCw size={16} className="text-white" />
            <span>Lưu & Đồng bộ</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold mt-4">
            LẦN CẬP NHẬT CUỐI: {formatTime(config.updatedAt) || "CHƯA CẬP NHẬT"}
          </p>
        </div>
      </div>
    </div>
  );
}
