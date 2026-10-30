"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type Preferences = { language: string; theme: string; emailNotifications: boolean; taskNotifications: boolean };
const initial: Preferences = { language: "vi", theme: "light", emailNotifications: true, taskNotifications: true };

export default function PersonalSettingsPage() {
  const [settings, setSettings] = useState(initial); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { api.get<Preferences>("/users/me/preferences").then(({ data }) => setSettings({ ...initial, ...data })).catch(() => setError("Không thể tải cài đặt cá nhân.")); }, []);
  async function save() { setError(""); setMessage(""); try { const { data } = await api.patch<Preferences>("/users/me/preferences", settings); setSettings({ ...initial, ...data }); setMessage("Đã lưu cài đặt"); } catch { setError("Không thể lưu cài đặt cá nhân."); } }
  return <AdminLayout><main className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h1 className="text-2xl font-bold text-slate-900">Cài đặt cá nhân</h1><p className="mt-2 text-sm text-slate-500">Tùy chỉnh giao diện và thông báo của tài khoản.</p>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<div className="mt-6 grid gap-5"><label className="text-sm font-semibold">Ngôn ngữ<select value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label className="text-sm font-semibold">Giao diện<select value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal"><option value="light">Sáng</option><option value="dark">Tối</option></select></label><label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-sm"><input type="checkbox" checked={settings.emailNotifications} onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })} />Nhận thông báo qua email</label><label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-sm"><input type="checkbox" checked={settings.taskNotifications} onChange={e => setSettings({ ...settings, taskNotifications: e.target.checked })} />Nhắc nhở công việc cần thực hiện</label><button onClick={() => void save()} className="rounded-lg bg-[#165aa7] px-5 py-3 font-bold text-white">Lưu cài đặt</button></div></main></AdminLayout>;
}
