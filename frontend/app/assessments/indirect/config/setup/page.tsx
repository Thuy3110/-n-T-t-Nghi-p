"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import IndirectAssessmentConfigModal from "../../components/IndirectAssessmentConfigModal";
import { AnalysisConfig, Major } from "../../matrix/types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

type MajorConfigResponse = Partial<AnalysisConfig> &
  Pick<Major, "id" | "majorName" | "majorCode"> & {
    code?: string;
    years?: number[];
  };

function ConfigSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorIdParam = searchParams.get("majorId");
  const [major, setMajor] = useState<Major | null>(null);
  const [config, setConfig] = useState<AnalysisConfig | null>(null);
  const [cohortYear, setCohortYear] = useState("2025");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadConfig = async () => {
      try {
        const majorsResponse = await fetch(`${API_BASE}/majors`, {
          signal: controller.signal,
        });
        if (!majorsResponse.ok) {
          throw new Error(
            `Không thể tải danh sách ngành (${majorsResponse.status}).`
          );
        }

        const majors = (await majorsResponse.json()) as Major[];
        const requestedId = Number(majorIdParam);
        const selectedMajor =
          majors.find((item) => item.id === requestedId) ?? majors[0];
        if (!selectedMajor) {
          throw new Error("Chưa có ngành đào tạo để thiết lập thông số.");
        }

        const response = await fetch(
          `${API_BASE}/majors/${selectedMajor.id}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(
            `Không thể tải cấu hình ngành (${response.status}).`
          );
        }

        const data = (await response.json()) as MajorConfigResponse;
        if (controller.signal.aborted) return;

        setMajor(selectedMajor);
        setConfig({
          majorCode: data.majorCode || data.code || selectedMajor.majorCode,
          ploThreshold: data.ploThreshold ?? 75,
          cloThreshold: data.cloThreshold ?? 3,
          enableContribution: data.enableContribution ?? true,
          enableSelfAssessment: data.enableSelfAssessment ?? true,
          updatedAt: data.updatedAt,
        });
        setCohortYear(String(data.years?.[0] ?? selectedMajor.years?.[0] ?? 2025));
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error("Error loading indirect assessment config:", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải thông số đánh giá."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadConfig();
    return () => controller.abort();
  }, [majorIdParam]);

  const handleSave = async (newConfig: {
    ploThreshold: number;
    cloThreshold: number;
    enableContribution: boolean;
    enableSelfAssessment: boolean;
  }) => {
    if (!major) throw new Error("Chưa chọn ngành cần cấu hình.");

    const response = await fetch(`${API_BASE}/majors/${major.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Không thể lưu cấu hình (${response.status}): ${detail}`);
    }

    const updated = (await response.json()) as Partial<AnalysisConfig>;
    setConfig({
      majorCode: updated.majorCode || config?.majorCode || major.majorCode,
      ploThreshold: updated.ploThreshold ?? newConfig.ploThreshold,
      cloThreshold: updated.cloThreshold ?? newConfig.cloThreshold,
      enableContribution:
        updated.enableContribution ?? newConfig.enableContribution,
      enableSelfAssessment:
        updated.enableSelfAssessment ?? newConfig.enableSelfAssessment,
      updatedAt: updated.updatedAt,
    });
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/assessments/indirect/config");
    }
  };

  return (
    <>
      <div className="min-h-[calc(100vh-136px)] rounded-[28px] border border-slate-200/70 bg-white/50" />

      {error && (
        <div
          role="alert"
          className="fixed left-[286px] right-4 top-20 z-[110] mx-auto flex max-w-xl items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
        >
          <AlertCircle size={17} className="shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div
          role="status"
          className="fixed left-[270px] right-0 top-1/2 z-[110] -translate-y-1/2 text-center text-sm font-medium text-slate-600"
        >
          Đang tải thông tin ngành...
        </div>
      )}

      {major && config && (
        <IndirectAssessmentConfigModal
          key={major.id}
          isOpen
          onClose={handleClose}
          config={config}
          cohort={`K${Number(cohortYear) - 2000}-${cohortYear}`}
          majorCode={major.majorCode}
          overlayClassName="fixed inset-y-0 left-[270px] right-0"
          onSave={handleSave}
        />
      )}
    </>
  );
}

export default function IndirectConfigSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-500">
          Đang tải thông tin cấu hình...
        </div>
      }
    >
      <ConfigSetupContent />
    </Suspense>
  );
}
