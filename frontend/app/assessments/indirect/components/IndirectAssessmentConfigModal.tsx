"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Settings, X } from "lucide-react";
import { AnalysisConfig } from "../matrix/types";

interface IndirectAssessmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnalysisConfig | null;
  cohort?: string;
  majorCode?: string;
  overlayClassName?: string;
  onSave?: (newConfig: {
    ploThreshold: number;
    cloThreshold: number;
    enableContribution: boolean;
    enableSelfAssessment: boolean;
  }) => void | Promise<void>;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1457bd] focus-visible:ring-offset-2 ${
        checked ? "bg-[#1763aa]" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Lưu cấu hình thất bại.";
}

export default function IndirectAssessmentConfigModal({
  isOpen,
  onClose,
  config,
  cohort = "2025",
  majorCode = "",
  overlayClassName = "fixed inset-0",
  onSave,
}: IndirectAssessmentConfigModalProps) {
  const [ploThreshold, setPloThreshold] = useState(
    config?.ploThreshold ?? 75
  );
  const [cloThreshold, setCloThreshold] = useState(
    config?.cloThreshold ?? 3
  );
  const [enableContribution, setEnableContribution] = useState(
    config?.enableContribution ?? true
  );
  const [enableSelfAssessment, setEnableSelfAssessment] = useState(
    config?.enableSelfAssessment ?? true
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const cohortYear = cohort.match(/\d{4}/)?.[0] ?? cohort;
  const displayMajor = majorCode || config?.majorCode || "—";

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    try {
      await onSave?.({
        ploThreshold,
        cloThreshold,
        enableContribution,
        enableSelfAssessment,
      });
      onClose();
    } catch (error) {
      console.error("Save indirect assessment config failed:", error);
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`${overlayClassName} z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[3px] animate-in fade-in duration-200`}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <section
        aria-labelledby="indirect-config-title"
        aria-modal="true"
        role="dialog"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-[500px] flex-col overflow-hidden rounded-[20px] border border-slate-200/70 bg-white font-sans shadow-[0_24px_70px_-20px_rgba(15,23,42,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-blue-100 bg-[#eef6ff] px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe] text-[#1457bd]">
              <Settings size={17} />
            </span>
            <h2
              id="indirect-config-title"
              className="text-sm font-bold tracking-tight text-slate-900 sm:text-[15px]"
            >
              Thiết lập thông số đánh giá CĐR (GT)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1457bd] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-4">
          <section aria-labelledby="config-section-title">
            <SectionTitle id="config-section-title">
              Ngưỡng đạt tiêu chuẩn
            </SectionTitle>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Khóa học" value={`Khóa ${cohortYear}`} />
              <ReadOnlyField label="Mã ngành" value={displayMajor} />
              <NumberField
                label="Mức đạt của PLOI (%)"
                value={ploThreshold}
                min={0}
                max={100}
                suffix="%"
                onChange={setPloThreshold}
              />
              <NumberField
                label="Ngưỡng đạt CLO (Mức)"
                value={cloThreshold}
                min={1}
                max={5}
                step={0.1}
                suffix="Mức"
                onChange={setCloThreshold}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f5f9fd] px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700">
                  Bật mức đóng góp CLO/PLO
                </span>
                <div className="flex items-center gap-1">
                  {["I", "R", "M"].map((level) => (
                    <span
                      key={level}
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
              <Toggle
                checked={enableContribution}
                onChange={() => setEnableContribution((value) => !value)}
                label="Bật mức đóng góp"
              />
            </div>
          </section>

          <section aria-labelledby="self-assessment-title" className="mt-4">
            <SectionTitle id="self-assessment-title" tone="green">
              Tự đánh giá (TĐG)
            </SectionTitle>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800">
                  Cho phép SV tự đánh giá trực tuyến (CLO)
                </p>
              </div>
              <Toggle
                checked={enableSelfAssessment}
                onChange={() => setEnableSelfAssessment((value) => !value)}
                label="Cho phép sinh viên tự đánh giá trực tuyến"
              />
            </div>
          </section>

          {saveError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {saveError}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2.5 border-t border-blue-100 bg-[#f0f7ff] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-emerald-200 px-5 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#1763aa] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#0f4f91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1457bd] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {saving && <RefreshCw size={12} className="animate-spin" />}
            {saving ? "Đang lưu..." : "Lưu thiết lập"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  id,
  tone = "blue",
}: {
  children: string;
  id: string;
  tone?: "blue" | "green";
}) {
  return (
    <h3
      id={id}
      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] ${
        tone === "green" ? "text-emerald-800" : "text-slate-600"
      }`}
    >
      <span
        className={`h-3.5 w-[3px] rounded-full ${
          tone === "green" ? "bg-emerald-600" : "bg-[#1763aa]"
        }`}
      />
      {children}
    </h3>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-slate-500">{label}</p>
      <div className="flex h-10 items-center rounded-lg border border-blue-100 bg-[#eef6ff] px-3 text-xs font-semibold text-slate-700">
        {value}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-slate-500">
        {label}
      </span>
      <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 transition focus-within:border-[#1763aa] focus-within:ring-2 focus-within:ring-blue-100">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
        />
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      </span>
    </label>
  );
}
