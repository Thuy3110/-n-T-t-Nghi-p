"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { deleteProgram, getProgramExport, getPrograms, importProgram, Program, CtdtImportPayload } from "@/services/programs.service";

const formatSheets = [
  { name: "CTDT", purpose: "Thông tin chương trình đào tạo", columns: ["MaCTDT", "TenCTDT", "MoTa"] },
  { name: "NGANH", purpose: "Ngành thuộc chương trình", columns: ["MaNganh", "TenNganh", "MaCTDT", "MoTa"] },
  { name: "HOCPHAN", purpose: "Danh sách học phần", columns: ["MaNganh", "MaHocPhan", "TenHocPhan", "SoTinChi", "HocKy", "MaHocPhanThayThe", "TenHocPhanThayThe"] },
  { name: "PLO", purpose: "Chuẩn đầu ra chương trình", columns: ["MaNganh", "MaPLO", "MoTaPLO", "NguongDat", "MaPLOCha"] },
  { name: "CLO", purpose: "Chuẩn đầu ra học phần", columns: ["MaNganh", "MaHocPhan", "MaCLO", "MoTaCLO"] },
  { name: "MA_TRAN_CLO_PLO", purpose: "Mức đóng góp của CLO vào PLO", columns: ["MaNganh", "MaHocPhan", "MaCLO", "MaPLO", "MucDongGop", "PhuongPhap"] },
];

function sampleValue(column: string) {
  const values: Record<string, string | number> = {
    MaCTDT: "CTDT-01", TenCTDT: "Chương trình đào tạo mẫu", MaNganh: "CNTT", TenNganh: "Công nghệ thông tin",
    MaHocPhan: "MH001", TenHocPhan: "Cơ sở dữ liệu", SoTinChi: 3, HocKy: 1, MaPLO: "PLO1", MoTaPLO: "Có khả năng...",
    NguongDat: 75, MaCLO: "CLO1", MoTaCLO: "Sinh viên có thể...", MucDongGop: "R", PhuongPhap: "TT",
  };
  return values[column] ?? "";
}

function downloadCtdtTemplate() {
  const workbook = XLSX.utils.book_new();
  const guide = [
    ["FORMAT CTĐT - NV-SMART-EDU"],
    ["Mục đích", "Nhập dữ liệu chương trình đào tạo theo cấu trúc chuẩn."],
    ["Quy tắc", "Không đổi tên sheet và tên cột; các mã liên kết phải tồn tại ở sheet cha."],
    ["MucDongGop", "Chỉ nhận I, R, M hoặc số 1, 2, 3."],
    ["PhuongPhap", "TT = trực tiếp; GT = gián tiếp."],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(guide), "HUONG_DAN");
  for (const sheet of formatSheets) {
    const rows = [sheet.columns, sheet.columns.map(sampleValue)];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = sheet.columns.map((column) => ({ wch: Math.max(16, column.length + 3) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  XLSX.writeFile(workbook, "format-CTDT-NV-SMART-EDU.xlsx");
}

const requiredImportSheets = formatSheets.map((sheet) => sheet.name);

function validateCtdtWorkbook(workbook: XLSX.WorkBook) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingSheets = requiredImportSheets.filter((sheet) => !workbook.SheetNames.includes(sheet));
  if (missingSheets.length) errors.push(`Thiếu sheet bắt buộc: ${missingSheets.join(", ")}.`);

  const rowsBySheet = new Map<string, Record<string, any>[]>();
  for (const sheet of formatSheets) {
    const worksheet = workbook.Sheets[sheet.name];
    if (!worksheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
    rowsBySheet.set(sheet.name, rows);
    const actualHeaders = rows.length ? Object.keys(rows[0]) : [];
    const missingColumns = sheet.columns.filter((column) => !actualHeaders.includes(column));
    if (missingColumns.length) errors.push(`Sheet ${sheet.name} thiếu cột: ${missingColumns.join(", ")}.`);
    if (!rows.length) warnings.push(`Sheet ${sheet.name} chưa có dữ liệu.`);
  }

  const ctdtRows = rowsBySheet.get("CTDT") || [];
  const majorRows = rowsBySheet.get("NGANH") || [];
  const courseRows = rowsBySheet.get("HOCPHAN") || [];
  const ploRows = rowsBySheet.get("PLO") || [];
  const cloRows = rowsBySheet.get("CLO") || [];
  const matrixRows = rowsBySheet.get("MA_TRAN_CLO_PLO") || [];
  const ctdtCodes = new Set(ctdtRows.map((row) => String(row.MaCTDT).trim()).filter(Boolean));
  const majorCodes = new Set(majorRows.map((row) => String(row.MaNganh).trim()).filter(Boolean));
  const courseCodes = new Set(courseRows.map((row) => String(row.MaHocPhan).trim()).filter(Boolean));
  const ploCodes = new Set(ploRows.map((row) => String(row.MaPLO).trim()).filter(Boolean));
  const cloCodes = new Set(cloRows.map((row) => String(row.MaCLO).trim()).filter(Boolean));

  if (ctdtRows.length !== 1) errors.push("Sheet CTDT phải có đúng một dòng chương trình đào tạo.");
  for (const [index, row] of majorRows.entries()) {
    const line = index + 2;
    if (!String(row.MaNganh).trim() || !String(row.TenNganh).trim()) errors.push(`NGANH dòng ${line}: thiếu mã hoặc tên ngành.`);
    if (!ctdtCodes.has(String(row.MaCTDT).trim())) errors.push(`NGANH dòng ${line}: MaCTDT không tồn tại trong sheet CTDT.`);
  }
  for (const [index, row] of courseRows.entries()) {
    const line = index + 2;
    if (!majorCodes.has(String(row.MaNganh).trim())) errors.push(`HOCPHAN dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!String(row.MaHocPhan).trim() || !String(row.TenHocPhan).trim()) errors.push(`HOCPHAN dòng ${line}: thiếu mã hoặc tên học phần.`);
    if (!Number.isFinite(Number(row.SoTinChi)) || Number(row.SoTinChi) <= 0) errors.push(`HOCPHAN dòng ${line}: SoTinChi phải là số dương.`);
  }
  for (const [index, row] of ploRows.entries()) {
    const line = index + 2;
    if (!majorCodes.has(String(row.MaNganh).trim())) errors.push(`PLO dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!String(row.MaPLO).trim() || !String(row.MoTaPLO).trim()) errors.push(`PLO dòng ${line}: thiếu mã hoặc mô tả PLO.`);
    if (row.NguongDat !== "" && (!Number.isFinite(Number(row.NguongDat)) || Number(row.NguongDat) < 0 || Number(row.NguongDat) > 100)) errors.push(`PLO dòng ${line}: NguongDat phải từ 0 đến 100.`);
  }
  for (const [index, row] of cloRows.entries()) {
    const line = index + 2;
    if (!majorCodes.has(String(row.MaNganh).trim())) errors.push(`CLO dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!courseCodes.has(String(row.MaHocPhan).trim())) errors.push(`CLO dòng ${line}: MaHocPhan không tồn tại trong sheet HOCPHAN.`);
    if (!String(row.MaCLO).trim() || !String(row.MoTaCLO).trim()) errors.push(`CLO dòng ${line}: thiếu mã hoặc mô tả CLO.`);
  }
  for (const [index, row] of matrixRows.entries()) {
    const line = index + 2;
    if (!majorCodes.has(String(row.MaNganh).trim()) || !courseCodes.has(String(row.MaHocPhan).trim()) || !cloCodes.has(String(row.MaCLO).trim()) || !ploCodes.has(String(row.MaPLO).trim())) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: mã ngành/học phần/CLO/PLO không tồn tại ở sheet cha.`);
    const level = String(row.MucDongGop).trim().toUpperCase();
    if (!["I", "R", "M", "1", "2", "3"].includes(level)) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: MucDongGop chỉ nhận I, R, M hoặc 1, 2, 3.`);
    if (!["TT", "GT"].includes(String(row.PhuongPhap).trim().toUpperCase())) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: PhuongPhap chỉ nhận TT hoặc GT.`);
  }
  return { errors, warnings, counts: Object.fromEntries([...rowsBySheet.entries()].map(([name, rows]) => [name, rows.length])) };
}

function downloadActualProgram(data: Awaited<ReturnType<typeof getProgramExport>>) {
  const workbook = XLSX.utils.book_new();
  const { program } = data;
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ MaCTDT: program.code, TenCTDT: program.name, MoTa: program.description || "" }]), "CTDT");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.majors.map((major) => ({ MaNganh: major.code, TenNganh: major.name, MaCTDT: program.code, MoTa: major.description || "" }))), "NGANH");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.majors.flatMap((major) => major.courses.map((course) => ({ MaNganh: major.code, MaHocPhan: course.code, TenHocPhan: course.name, SoTinChi: course.credits, HocKy: course.semester || "", MaHocPhanThayThe: course.replacementCode || "", TenHocPhanThayThe: course.replacementName || "" })))), "HOCPHAN");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.majors.flatMap((major) => major.plos.map((plo) => ({ MaNganh: major.code, MaPLO: plo.code, MoTaPLO: plo.description, NguongDat: plo.targetPercent ?? "", MaPLOCha: major.plos.find((parent) => parent.id === plo.parentId)?.code ?? "" })))), "PLO");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.majors.flatMap((major) => major.clos.map((clo) => ({ MaNganh: major.code, MaCLO: clo.code, MoTaCLO: clo.description })))), "CLO");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.matrices.map((matrix) => ({ MaNganh: matrix.majorCode, MaHocPhan: matrix.courseCode, MaCLO: matrix.cloCode, MaPLO: matrix.ploCode, MucDongGop: matrix.level, PhuongPhap: matrix.method }))), "MA_TRAN_CLO_PLO");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.majors.map((major) => ({ MaCTDT: program.code, MaNganh: major.code, TenNganh: major.name, TyLePLO: major.evaluation.averagePloRate ?? "Chưa có dữ liệu", NguongDat: major.evaluation.threshold, KetQua: major.evaluation.status }))), "DANH_GIA_CTDT");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ MaCTDT: program.code, TenCTDT: program.name, NguongDat: data.evaluation.threshold, KetQua: data.evaluation.status }]), "TONG_HOP_CTDT");
  XLSX.writeFile(workbook, `CTDT-${program.code}.xlsx`);
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [validation, setValidation] = useState<{ fileName: string; errors: string[]; warnings: string[]; counts: Record<string, number> } | null>(null);
  const [importPayload, setImportPayload] = useState<CtdtImportPayload | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadPrograms() {
    setLoading(true); setError("");
    try { setPrograms(await getPrograms()); } catch { setError("Không tải được danh sách chương trình đào tạo."); } finally { setLoading(false); }
  }
  useEffect(() => { void loadPrograms(); }, []);


  async function remove(program: Program) {
    if (program.majors.length > 0) { setError("Không thể xóa chương trình đang có ngành đào tạo."); return; }
    if (!window.confirm(`Xóa chương trình ${program.code}?`)) return;
    try { await deleteProgram(program.id); setNotice("Đã xóa chương trình đào tạo."); await loadPrograms(); }
    catch (cause: any) { setError(cause?.response?.data?.message || "Không thể xóa chương trình đào tạo."); }
  }

  async function exportProgram(program: Program) {
    if (program.majors.length === 0) {
      setError("CTĐT chưa có ngành nên chưa có học phần, PLO, CLO và ma trận để xuất.");
      return;
    }
    try { downloadActualProgram(await getProgramExport(program.id)); }
    catch { setError("Không thể xuất dữ liệu CTĐT hiện tại."); }
  }

  async function validateUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setNotice(""); setValidation(null); setImportPayload(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const result = validateCtdtWorkbook(workbook);
      setValidation({ fileName: file.name, ...result });
      if (!result.errors.length) {
        const rows = (sheet: string) => XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheet], { defval: "" });
        const ctdtRows = rows("CTDT");
        setImportPayload({ ctdt: ctdtRows[0] as CtdtImportPayload["ctdt"], nganh: rows("NGANH") as CtdtImportPayload["nganh"], hocphan: rows("HOCPHAN") as CtdtImportPayload["hocphan"], plo: rows("PLO") as CtdtImportPayload["plo"], clo: rows("CLO") as CtdtImportPayload["clo"], matrix: rows("MA_TRAN_CLO_PLO") as CtdtImportPayload["matrix"] });
        setNotice("File CTĐT đúng cấu trúc và các mã liên kết hợp lệ. Có thể nhập dữ liệu vào hệ thống.");
      }
    } catch (cause: any) {
      setError(cause?.message || "Không thể đọc file Excel CTĐT.");
    }
  }

  async function saveImportedData() {
    if (!importPayload) return;
    setImporting(true); setError(""); setNotice("");
    try {
      const result = await importProgram(importPayload);
      setNotice(`Đã cập nhật dữ liệu CTĐT vào MySQL: ${result.imported.majors} ngành, ${result.imported.courses} học phần, ${result.imported.plos} PLO, ${result.imported.clos} CLO và ${result.imported.matrices} dòng ma trận.`);
      setImportPayload(null); await loadPrograms();
    } catch (cause: any) {
      setError(cause?.response?.data?.message || "Không thể nhập dữ liệu CTĐT vào hệ thống.");
    } finally { setImporting(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="text-sm font-medium text-blue-700">Quản lý dữ liệu đào tạo</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Chương trình đào tạo</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Tải hoặc xuất file Excel, chỉnh sửa toàn bộ CTĐT, ngành, học phần, PLO, CLO và ma trận, sau đó upload để kiểm tra và cập nhật vào MySQL.</p></div><div className="flex flex-wrap gap-2"><Link href="/programs/evaluation" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><ClipboardCheck size={17} /> Đánh giá CTĐT</Link><button onClick={downloadCtdtTemplate} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Download size={17} /> Tải format CTĐT</button></div></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-semibold text-slate-900">Danh sách CTĐT</h2><p className="mt-1 text-sm text-slate-500">Dữ liệu được lấy từ MySQL qua API.</p></div><button onClick={() => void loadPrograms()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={16} /> Làm mới</button></div>{loading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</p> : programs.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có chương trình đào tạo.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Mã CTĐT</th><th className="px-5 py-3">Tên chương trình</th><th className="px-5 py-3">Ngành</th><th className="px-5 py-3">Cấu trúc dữ liệu</th><th className="px-5 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{programs.map((program) => <tr key={program.id}><td className="px-5 py-4 font-semibold text-blue-700">{program.code}</td><td className="px-5 py-4"><p className="font-medium text-slate-800">{program.name}</p><p className="mt-1 text-xs text-slate-500">{program.description || "Chưa có mô tả"}</p></td><td className="px-5 py-4">{program.majors.length ? program.majors.map((major) => <div key={major.id} className="mb-1">{major.code} - {major.name}</div>) : <span className="text-slate-400">Chưa gán ngành</span>}</td><td className="px-5 py-4 text-xs text-slate-600">{program.majors.reduce((sum, major) => sum + (major._count?.courses || 0), 0)} học phần · {program.majors.reduce((sum, major) => sum + (major._count?.plos || 0), 0)} PLO · {program.majors.reduce((sum, major) => sum + (major._count?.clos || 0), 0)} CLO</td><td className="px-5 py-4"><div className="flex items-center gap-1"><button onClick={() => void exportProgram(program)} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" title="Xuất dữ liệu CTĐT hiện tại"><Download size={17} /></button><button onClick={() => void remove(program)} disabled={program.majors.length > 0} title={program.majors.length > 0 ? "Không thể xóa CTĐT đang có ngành" : "Xóa CTĐT"} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FileSpreadsheet size={19} /> Cấu trúc file Excel CTĐT</h2><p className="mt-1 text-sm text-slate-500">Phần này hướng dẫn cấu trúc file dùng khi tải format, chỉnh sửa và upload lại. Các mã ở sheet con phải khớp với mã ở sheet cha để hệ thống lưu đúng quan hệ dữ liệu.</p><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{formatSheets.map((sheet) => { const purpose = sheet.name === "CTDT" ? "Thông tin chung của chương trình đào tạo" : sheet.name === "NGANH" ? "Ngành được liên kết với chương trình đào tạo" : sheet.name === "HOCPHAN" ? "Các học phần thuộc ngành" : sheet.name === "PLO" ? "Chuẩn đầu ra của ngành" : sheet.name === "CLO" ? "Chuẩn đầu ra của từng học phần" : "Liên kết CLO với PLO và mức đóng góp"; return <div key={sheet.name} className="rounded-lg border border-slate-200 p-4"><p className="font-semibold text-slate-800">{sheet.name}</p><p className="mt-1 text-xs text-slate-500">{purpose}</p><p className="mt-2 text-xs text-blue-700">{sheet.columns.join(" · ")}</p>{sheet.name === "MA_TRAN_CLO_PLO" && <p className="mt-2 text-xs text-slate-500">MucDongGop: I/R/M hoặc 1/2/3 · PhuongPhap: TT/GT</p>}{sheet.name === "PLO" && <p className="mt-2 text-xs text-slate-500">MaPLOCha dùng khi PLO có quan hệ kế thừa.</p>}</div>; })}</div><p className="mt-4 text-xs text-slate-500">Lưu ý: sheet CTDT thường có một dòng; các sheet còn lại có thể có nhiều dòng. Sheet HUONG_DAN trong file tải xuống chỉ dùng để giải thích quy tắc, không phải dữ liệu bắt buộc.</p></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Upload size={19} /> Kiểm tra và nhập file CTĐT</h2><p className="mt-1 text-sm text-slate-500">Tải file Excel lên để kiểm tra trước. Khi hợp lệ, bấm nút nhập để cập nhật dữ liệu vào MySQL.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><Upload size={16} /> Chọn file Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => void validateUpload(event)} /></label></div>{validation && <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-800">{validation.fileName}</p><div className={`mt-3 flex items-start gap-2 text-sm ${validation.errors.length ? "text-red-700" : "text-emerald-700"}`}>{validation.errors.length ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}<span>{validation.errors.length ? `Có ${validation.errors.length} lỗi cần sửa trước khi nhập.` : "File hợp lệ về cấu trúc và dữ liệu liên kết."}</span></div>{validation.errors.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">{validation.errors.slice(0, 30).map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}{validation.errors.length > 30 && <li>... và {validation.errors.length - 30} lỗi khác.</li>}</ul>}{validation.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-700">{validation.warnings.map((message) => <li key={message}>{message}</li>)}</ul>}<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">{Object.entries(validation.counts).map(([sheet, count]) => <span key={sheet} className="rounded-full bg-white px-3 py-1 shadow-sm">{sheet}: {count} dòng</span>)}</div>{!validation.errors.length && importPayload && <button onClick={() => void saveImportedData()} disabled={importing} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={16} />{importing ? "Đang nhập vào MySQL..." : "Nhập dữ liệu hợp lệ vào hệ thống"}</button>}</div>}</section>
  </div></AdminLayout>;
}
