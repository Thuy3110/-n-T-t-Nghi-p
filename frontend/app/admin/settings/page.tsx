"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
type Settings = { systemName: string; institutionName: string; supportEmail: string; supportPhone: string; defaultLanguage: string; maintenanceMode: boolean };
const empty: Settings = { systemName: "", institutionName: "", supportEmail: "", supportPhone: "", defaultLanguage: "vi", maintenanceMode: false };

function auth(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: "Bearer " + token, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API + "/system-settings", { headers: auth(), cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Không tải được cài đặt hệ thống.")))
      .then((data) => setSettings({ ...empty, ...data }))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được cài đặt."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(API + "/system-settings", { method: "PUT", headers: auth(), body: JSON.stringify(settings) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể lưu cài đặt.");
      setSettings({ ...empty, ...data }); setMessage("Đã lưu cài đặt hệ thống vào MySQL.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu cài đặt."); }
    finally { setSaving(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-[#881337]">Cài đặt hệ thống</h1><p className="mt-2 text-sm text-slate-500">Thông tin cấu hình chung của hệ thống hỗ trợ giáo dục.</p>{error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}{loading ? <p className="mt-6 text-sm text-slate-500">Đang tải cấu hình...</p> : <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Tên hệ thống" value={settings.systemName} onChange={(value) => setSettings({ ...settings, systemName: value })}/><Field label="Tên đơn vị áp dụng" value={settings.institutionName} onChange={(value) => setSettings({ ...settings, institutionName: value })}/><Field label="Email hỗ trợ" value={settings.supportEmail} onChange={(value) => setSettings({ ...settings, supportEmail: value })} type="email"/><Field label="Số điện thoại hỗ trợ" value={settings.supportPhone} onChange={(value) => setSettings({ ...settings, supportPhone: value })}/><label className="text-sm font-semibold text-slate-700">Ngôn ngữ mặc định<select value={settings.defaultLanguage} onChange={(event) => setSettings({ ...settings, defaultLanguage: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-sm font-semibold"><input type="checkbox" checked={settings.maintenanceMode} onChange={(event) => setSettings({ ...settings, maintenanceMode: event.target.checked })}/>Bật chế độ bảo trì</label><button disabled={saving} className="md:col-span-2 rounded-xl bg-[#165aa7] py-3 font-bold text-white disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu cài đặt hệ thống"}</button></form>}</div></AdminLayout>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"/></label>;
}

