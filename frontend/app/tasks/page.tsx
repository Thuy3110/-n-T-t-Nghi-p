"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/services/api";

type Task = { id: number; title: string; description: string; dueDate: string | null; priority: string; status: string };
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]); const [title, setTitle] = useState(""); const [error, setError] = useState("");
  const load = () => api.get<Task[]>("/users/me/tasks").then(({ data }) => setTasks(data)).catch(() => setError("Không thể tải danh sách công việc."));
  useEffect(() => { void load(); }, []);
  async function add(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; try { await api.post("/users/me/tasks", { title }); setTitle(""); await load(); } catch { setError("Không thể thêm công việc."); } }
  async function setStatus(task: Task, status: string) { await api.patch(`/users/me/tasks/${task.id}`, { status }); await load(); }
  async function remove(id: number) { await api.delete(`/users/me/tasks/${id}`); await load(); }
  return <AdminLayout><main className="mx-auto max-w-4xl space-y-5"><div><h1 className="text-2xl font-bold text-slate-900">Công việc cần thực hiện</h1><p className="mt-2 text-sm text-slate-500">Danh sách công việc cá nhân được lưu theo tài khoản đăng nhập.</p></div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={add} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập công việc mới..." className="h-11 flex-1 rounded-lg border border-slate-200 px-3" /><button className="rounded-lg bg-[#165aa7] px-5 font-bold text-white">Thêm</button></form><section className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{tasks.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có công việc nào.</p> : tasks.map(task => <div key={task.id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><p className={`font-semibold ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p><p className="mt-1 text-xs text-slate-500">Ưu tiên: {task.priority}</p></div><select value={task.status} onChange={e => void setStatus(task, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm"><option value="TODO">Chưa làm</option><option value="IN_PROGRESS">Đang làm</option><option value="DONE">Hoàn thành</option></select><button onClick={() => void remove(task.id)} className="text-sm font-semibold text-red-600">Xóa</button></div>)}</section></main></AdminLayout>;
}
