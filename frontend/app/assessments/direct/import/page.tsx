"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, FileUp, GraduationCap, Search, Upload, Users, X } from "lucide-react";
import * as XLSX from "xlsx";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
const headers = ["MaSV", "MaMH", "MaCLO", "Diem", "GhiChu"];
type Major = { id: number; code?: string; majorCode?: string; name?: string; majorName?: string };
type Course = { id: number; code: string; name: string };
type Cohort = { id: number; year: number };
type Clo = { id: number; code: string; description?: string };
type Row = { studentCode: string; courseCode: string; cloCode: string; score: number | string; rowNumber: number; status: "valid" | "invalid"; message?: string };

function auth(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: "Bearer " + token } : {};
}
function norm(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function normalizeCourseCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/O/g, "0").replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]+)(\d+)$/);
  return match ? match[1] + Number(match[2]) : compact;
}
function valueOf(record: Record<string, unknown>, names: string[]) {
  const map = new Map(Object.entries(record).map(([key, value]) => [norm(key), value]));
  for (const name of names) {
    const value = map.get(norm(name));
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

export default function ImportPage() {
  const input = useRef<HTMLInputElement>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [clos, setClos] = useState<Clo[]>([]);
  const [majorId, setMajorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [cloCode, setCloCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const course = courses.find((item) => String(item.id) === courseId);
  const valid = preview.filter((item) => item.status === "valid").length;
  const invalid = preview.length - valid;

  useEffect(() => {
    fetch(API + "/majors", { headers: auth(), cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Không tải được danh sách ngành.")))
      .then((data) => setMajors(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setCourses([]); setCohorts([]); setClos([]); setCourseId(""); setCohortId(""); setCloCode(""); setPreview([]);
    if (!majorId) return;
    setBusy(true);
    Promise.all([
      fetch(API + "/courses?majorId=" + majorId, { headers: auth() }).then((r) => r.json()),
      fetch(API + "/courses/cohorts?majorId=" + majorId, { headers: auth() }).then((r) => r.json()),
      fetch(API + "/majors/" + majorId, { headers: auth() }).then((r) => r.json()),
    ]).then(([courseData, cohortData, majorData]) => {
      setCourses(Array.isArray(courseData) ? courseData : []);
      setCohorts(Array.isArray(cohortData) ? cohortData : []);
      setClos(Array.isArray(majorData?.clos) ? majorData.clos : []);
    }).catch(() => setError("Không tải được dữ liệu ngành, học phần, khóa hoặc CLO.")).finally(() => setBusy(false));
  }, [majorId]);

  function chooseFile(selected?: File) {
    setError(""); setSuccess(""); setPreview([]);
    if (!selected) return;
    if (!/\.(xlsx|xls)$/i.test(selected.name)) return setError("Chỉ chấp nhận file .xlsx hoặc .xls.");
    if (selected.size > 10 * 1024 * 1024) return setError("File không được vượt quá 10 MB.");
    setFile(selected);
  }

  async function previewFile() {
    setError(""); setSuccess("");
    if (!majorId || !courseId || !cohortId) return setError("Vui lòng chọn ngành, học phần và khóa.");
    if (!file) return setError("Vui lòng chọn file Excel.");
    try {
      setBusy(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Nhap diem"] || workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("File không có worksheet.");
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!data.length) throw new Error("Worksheet không có dữ liệu.");
      setPreview(data.map((record, index) => {
        const studentCode = valueOf(record, ["MaSV", "studentCode", "maSinhVien"]);
        const courseCode = valueOf(record, ["MaMH", "courseCode", "maHocPhan"]);
        const code = valueOf(record, ["MaCLO", "cloCode", "clo"]);
        const raw = valueOf(record, ["Diem", "score", "diemClo"]);
        const score = Number(raw);
        const errors: string[] = [];
        if (!studentCode) errors.push("Thiếu MaSV");
        if (!courseCode) errors.push("Thiếu MaMH");
        if (!code) errors.push("Thiếu MaCLO");
        if (!raw || !Number.isFinite(score) || score < 0 || score > 10) errors.push("Điểm phải từ 0 đến 10");
        if (course && normalizeCourseCode(courseCode) !== normalizeCourseCode(course.code)) errors.push("Sai học phần đã chọn");
        if (cloCode && code.toLowerCase() !== cloCode.toLowerCase()) errors.push("Sai CLO đã chọn");
        return { studentCode, courseCode, cloCode: code, score: raw ? score : "", rowNumber: index + 2, status: errors.length ? "invalid" : "valid", message: errors.join("; ") };
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được file Excel.");
    } finally {
      setBusy(false);
    }
  }

  async function importFile() {
    if (!file || !preview.length || invalid) return;
    try {
      setBusy(true); setError(""); setSuccess("");
      const body = new FormData(); body.append("file", file);
      const response = await fetch(API + "/student-scores/import-excel", { method: "POST", headers: auth(), body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Không thể lưu điểm.");
      setSuccess("Đã lưu " + String(result.successCount ?? 0) + " dòng vào StudentCloScore.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu điểm.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const sheet = XLSX.utils.aoa_to_sheet([headers, ["SV001", "MH001", "CLO1", 8.5, ""]]);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Nhap diem");
    XLSX.writeFile(book, "mau-nhap-diem-CLO.xlsx");
  }

  return <main className="min-h-screen bg-slate-50 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="mb-2 text-sm text-slate-500">Quản lý đào tạo / Nhập điểm</p><h1 className="text-2xl font-bold text-slate-900">Nhập điểm từ Excel</h1><p className="mt-2 text-sm text-slate-500">Điểm hợp lệ được ghi theo sinh viên, học phần và CLO.</p></div><button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm text-blue-700"><Download size={17}/>Tải file Excel mẫu</button></div>
    {error && <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle/><span className="flex-1">{error}</span><button onClick={() => setError("")}><X size={17}/></button></div>}
    {success && <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2/>{success}</div>}
    <section className="rounded-xl border bg-white shadow-sm"><div className="border-b p-5"><div className="flex items-center gap-3"><ClipboardCheck className="text-blue-700"/><div><h2 className="font-semibold">Thông tin bảng điểm</h2><p className="text-sm text-slate-500">Chọn dữ liệu đã có trong cơ sở dữ liệu.</p></div></div></div><div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm font-medium"><span className="mb-2 block"><GraduationCap size={16} className="mr-2 inline"/>Ngành</span><select value={majorId} onChange={(e) => setMajorId(e.target.value)} className="w-full rounded-lg border px-3 py-2.5"><option value="">-- Chọn ngành --</option>{majors.map((item) => <option key={item.id} value={item.id}>{item.code || item.majorCode} - {item.name || item.majorName}</option>)}</select></label>
      <label className="text-sm font-medium"><span className="mb-2 block"><BookOpen size={16} className="mr-2 inline"/>Học phần</span><select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!majorId} className="w-full rounded-lg border px-3 py-2.5"><option value="">-- Chọn học phần --</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></label>
      <label className="text-sm font-medium"><span className="mb-2 block"><Users size={16} className="mr-2 inline"/>Khóa</span><select value={cohortId} onChange={(e) => setCohortId(e.target.value)} disabled={!majorId} className="w-full rounded-lg border px-3 py-2.5"><option value="">-- Chọn khóa --</option>{cohorts.map((item) => <option key={item.id} value={item.id}>Khóa {item.year}</option>)}</select></label>
      <label className="text-sm font-medium"><span className="mb-2 block">CLO (lọc tùy chọn)</span><select value={cloCode} onChange={(e) => setCloCode(e.target.value)} disabled={!majorId} className="w-full rounded-lg border px-3 py-2.5"><option value="">-- Tất cả CLO --</option>{clos.map((item) => <option key={item.id} value={item.code}>{item.code}</option>)}</select></label>
    </div><p className="px-5 pb-5 text-xs text-slate-500">Cột bắt buộc: MaSV, MaMH, MaCLO, Diem. Sinh viên, học phần và liên kết Course-CLO phải tồn tại.</p></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm"><input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])}/><div role="button" tabIndex={0} onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); }} className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><FileUp size={30} className="mx-auto text-blue-700"/><p className="mt-3 font-semibold">Kéo thả file Excel hoặc nhấn để chọn</p><p className="mt-2 text-xs text-slate-500">Tối đa 10 MB</p></div>{file && <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-4"><span className="flex items-center gap-2 text-sm"><FileSpreadsheet className="text-emerald-700"/>{file.name}</span><button onClick={() => { setFile(null); setPreview([]); }}><X size={17}/></button></div>}<div className="mt-5 flex justify-end"><button onClick={previewFile} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm text-white disabled:bg-slate-300"><Search size={17}/>{busy ? "Đang xử lý..." : "Kiểm tra dữ liệu"}</button></div></section>
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="flex justify-between border-b p-5"><div><h2 className="font-semibold">Xem trước dữ liệu</h2><p className="mt-1 text-sm text-slate-500">{course?.code || "Chưa chọn học phần"}</p></div><div className="flex gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Hợp lệ: {valid}</span><span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">Lỗi: {invalid}</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Dòng</th><th className="px-5 py-3">MaSV</th><th className="px-5 py-3">MaMH</th><th className="px-5 py-3">MaCLO</th><th className="px-5 py-3">Điểm</th><th className="px-5 py-3">Kiểm tra</th></tr></thead><tbody className="divide-y">{preview.length ? preview.map((row) => <tr key={row.rowNumber}><td className="px-5 py-3">{row.rowNumber}</td><td className="px-5 py-3 font-medium">{row.studentCode}</td><td className="px-5 py-3">{row.courseCode}</td><td className="px-5 py-3">{row.cloCode}</td><td className="px-5 py-3 font-semibold">{row.score}</td><td className="px-5 py-3">{row.status === "valid" ? <span className="text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline"/>Hợp lệ</span> : <span className="text-red-700"><AlertCircle size={15} className="mr-1 inline"/>{row.message}</span>}</td></tr>) : <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-400">Chưa có dữ liệu xem trước</td></tr>}</tbody></table></div><div className="flex justify-end border-t p-5"><button onClick={importFile} disabled={!preview.length || invalid > 0 || busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm text-white disabled:bg-slate-300"><Upload size={17}/>{busy ? "Đang lưu..." : "Xác nhận nhập điểm"}</button></div></section>
  </div></main>;
}

