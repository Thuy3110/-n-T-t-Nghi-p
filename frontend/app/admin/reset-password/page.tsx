"use client";

import { FormEvent, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { authService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (newPassword.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirm) return setError("Mật khẩu xác nhận không khớp.");
    try {
      setSaving(true);
      const response = await authService.resetPassword({ username: username.trim(), newPassword });
      setMessage(response.data?.message || "Cấp lại mật khẩu thành công.");
      setUsername(""); setNewPassword(""); setConfirm("");
    } catch (cause: any) {
      setError(cause?.response?.data?.message || "Không thể cấp lại mật khẩu.");
    } finally { setSaving(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-[#881337]">Cấp lại mật khẩu</h1><p className="mt-2 text-sm text-slate-500">Chức năng dành cho tài khoản quản trị để đặt lại mật khẩu cho người dùng.</p>{error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={submit} className="mt-6 space-y-4"><Field label="Tên đăng nhập cần cấp lại" value={username} onChange={setUsername} type="text"/><Field label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} type="password"/><Field label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} type="password"/><button disabled={saving} className="w-full rounded-xl bg-[#165aa7] py-3 font-bold text-white disabled:opacity-50">{saving ? "Đang xử lý..." : "Cấp lại mật khẩu"}</button></form></div></AdminLayout>;
}

function Field({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"/></label>;
}

