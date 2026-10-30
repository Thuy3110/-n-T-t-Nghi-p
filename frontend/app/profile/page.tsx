"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type Profile = { id: number; fullName: string; phone?: string | null; username: string; email?: string | null; role: string; createdAt: string };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api.get<Profile>("/users/me").then(({ data }) => { setProfile(data); setForm({ fullName: data.fullName, phone: data.phone ?? "", email: data.email ?? "" }); }).catch(() => setError("Không thể tải hồ sơ cá nhân.")); }, []);
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); setMessage(""); try { const { data } = await api.patch<Profile>("/users/me", form); setProfile(data); localStorage.setItem("user", JSON.stringify(data)); setMessage("Đã cập nhật hồ sơ cá nhân."); } catch { setError("Không thể lưu hồ sơ. Vui lòng kiểm tra email."); } }
  return <AdminLayout><main className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1><p className="mt-2 text-sm text-slate-500">Thông tin tài khoản đang đăng nhập.</p>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<form onSubmit={submit} className="mt-6 grid gap-4"><label className="text-sm font-semibold">Tên hiển thị<input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label><label className="text-sm font-semibold">Tên đăng nhập<input disabled value={profile?.username ?? ""} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-normal" /></label><label className="text-sm font-semibold">Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label><label className="text-sm font-semibold">Số điện thoại<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label><button className="mt-2 rounded-lg bg-[#165aa7] px-5 py-3 font-bold text-white">Lưu hồ sơ</button></form></main></AdminLayout>;
}
