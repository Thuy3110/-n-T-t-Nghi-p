"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type Account = { id: number; fullName: string; username: string; email: string | null; role: string; isActive: boolean };
function roleLabel(role: string) {
  if (role === "LECTURER") return "Giảng viên";
  if (["ADMIN", "SUPER_ADMIN", "SUPER USER"].includes(role)) return "Quản trị viên";
  return "Người dùng";
}
export default function UsersPage() {
  const [users, setUsers] = useState<Account[]>([]); const [error, setError] = useState("");
  const load = () => api.get<Account[]>("/users").then(({ data }) => setUsers(data)).catch(() => setError("Chỉ Admin mới có thể xem danh sách tài khoản."));
  useEffect(() => { void load(); }, []);
  async function changeRole(id: number, role: string) { try { await api.patch(`/users/${id}/role`, { role }); await load(); } catch { setError("Không thể cập nhật quyền tài khoản."); } }
  return <AdminLayout><main className="mx-auto max-w-5xl space-y-5"><div><h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản</h1><p className="mt-2 text-sm text-slate-500">Admin phân quyền tài khoản thành người dùng hoặc giảng viên.</p></div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Họ tên</th><th className="px-5 py-3">Tài khoản</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Vai trò</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map(user => <tr key={user.id}><td className="px-5 py-4 font-semibold text-slate-800">{user.fullName}</td><td className="px-5 py-4">{user.username}</td><td className="px-5 py-4 text-slate-500">{user.email || "—"}</td><td className="px-5 py-4"><select value={user.role === "LECTURER" ? "LECTURER" : "USER"} disabled={["ADMIN", "SUPER_ADMIN", "SUPER USER"].includes(user.role)} onChange={e => void changeRole(user.id, e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2"><option value="USER">Người dùng</option><option value="LECTURER">Giảng viên</option></select><span className="ml-2 text-xs text-slate-500">{roleLabel(user.role)}</span></td></tr>)}</tbody></table></div>{users.length === 0 && !error && <p className="p-8 text-center text-sm text-slate-500">Chưa có tài khoản.</p>}</section></main></AdminLayout>;
}
