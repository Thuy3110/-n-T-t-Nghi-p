"use client";

import { FormEvent, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { authService } from "@/services/auth.service";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    if (newPassword.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
    try {
      setSaving(true);
      const response = await authService.changePassword({ currentPassword, newPassword });
      setMessage(response.data?.message || "Đổi mật khẩu thành công.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (cause: any) {
      setError(cause?.response?.data?.message || "Không thể đổi mật khẩu.");
    } finally { setSaving(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-[#881337]">Đổi mật khẩu đăng nhập</h1><p className="mt-2 text-sm text-slate-500">Mật khẩu mới sẽ được mã hóa và lưu trong hệ thống.</p>{error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<form onSubmit={submit} className="mt-6 space-y-4"><Field label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword}/><Field label="Mật khẩu mới" value={newPassword} onChange={setNewPassword}/><Field label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword}/><button disabled={saving} className="w-full rounded-xl bg-[#881337] py-3 font-bold text-white disabled:opacity-50">{saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</button></form></div></AdminLayout>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input required type="password" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"/></label>;
}

