"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { deleteProgram, getProgramExport, getPrograms, importProgram, Program, CtdtImportPayload } from "@/services/programs.service";
import {
  getLecturerAssessmentYears,
  getLecturerProgramReport,
  LecturerProgramReport,
} from "@/services/lecturer-assessment.service";

const formatSheets = [
  { name: "CTDT", purpose: "Thông tin chương trình đào tạo", columns: ["MaCTDT", "TenCTDT", "MoTa"] },
  { name: "NGANH", purpose: "Ngành thuộc chương trình", columns: ["MaNganh", "TenNganh", "MaCTDT", "MoTa"] },
  { name: "HOCPHAN", purpose: "Danh sách học phần", columns: ["MaNganh", "MaHocPhan", "TenHocPhan", "SoTinChi", "HocKy", "MaHocPhanThayThe", "TenHocPhanThayThe"] },
  { name: "PLO", purpose: "Chuẩn đầu ra chương trình", columns: ["MaNganh", "MaPLO", "MoTaPLO", "NguongDat", "MaPLOCha"] },
  { name: "CLO", purpose: "Chuẩn đầu ra học phần", columns: ["MaNganh", "MaHocPhan", "MaCLO", "MoTaCLO"] },
  { name: "MA_TRAN_CLO_PLO", purpose: "Mức đóng góp của CLO vào PLO", columns: ["MaNganh", "MaHocPhan", "MaCLO", "MaPLO", "MucDongGop", "PhuongPhap"] },
];

function downloadCtdtTemplate() {
  const workbook = XLSX.utils.book_new();
  const guide = [
    ["FORMAT CTĐT - NV-SMART-EDU"],
    ["Sheet", "Nội dung", "Quy tắc nhập"],
    ...formatSheets.map((sheet) => [
      sheet.name,
      sheet.purpose,
      `Các cột theo đúng thứ tự trong sheet: ${sheet.columns.join(", ")}`,
    ]),
    ["CTDT", "Thông tin chương trình", "Nhập đúng một dòng; MaCTDT và TenCTDT là bắt buộc."],
    ["NGANH", "Ngành thuộc chương trình", "Nhập ít nhất một ngành; MaNganh, TenNganh và MaCTDT là bắt buộc."],
    ["HOCPHAN", "Học phần thuộc ngành", "SoTinChi là số nguyên dương; HocKy từ 1 đến 8 (4 năm, 2 học kỳ/năm) hoặc để trống."],
    ["PLO", "Chuẩn đầu ra chương trình", "NguongDat từ 0 đến 100; MaPLOCha để trống nếu không có PLO cha."],
    ["CLO", "Chuẩn đầu ra học phần", "MaNganh và MaHocPhan phải khớp với sheet NGANH và HOCPHAN."],
    ["MA_TRAN_CLO_PLO", "Liên kết CLO với PLO", "MucDongGop: I/R/M hoặc 1/2/3; PhuongPhap: TT hoặc GT."],
    ["Liên kết dữ liệu", "", "MaNganh, MaHocPhan, MaPLO và MaCLO phải tồn tại đúng trong ngành tương ứng."],
    ["Lưu ý", "", "Không đổi tên sheet/cột. Xóa dòng tiêu đề hoặc sửa tên cột sẽ khiến file không được nhận dạng."],
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guide);
  guideSheet["!cols"] = [{ wch: 24 }, { wch: 34 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, "HUONG_DAN");
  for (const sheet of formatSheets) {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.columns]);
    worksheet["!cols"] = sheet.columns.map((column) => ({ wch: Math.max(16, column.length + 3) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  XLSX.writeFile(workbook, "format-CTDT-NV-SMART-EDU.xlsx");
}

function addCtdtSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: Record<string, unknown>[],
) {
  const definition = formatSheets.find((sheet) => sheet.name === name);
  if (!definition) throw new Error(`Không tìm thấy định dạng sheet ${name}.`);
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows, { header: definition.columns }),
    name,
  );
}

const requiredImportSheets = formatSheets.map((sheet) => sheet.name);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof Error && cause.message) return cause.message;
  if (isRecord(cause) && isRecord(cause.response) && isRecord(cause.response.data)) {
    const message = cause.response.data.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return message.join(", ");
    }
  }
  return fallback;
}

function validateCtdtWorkbook(workbook: XLSX.WorkBook) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingSheets = requiredImportSheets.filter((sheet) => !workbook.SheetNames.includes(sheet));
  if (missingSheets.length) errors.push(`Thiếu sheet bắt buộc: ${missingSheets.join(", ")}.`);

  const rowsBySheet = new Map<string, Record<string, unknown>[]>();
  for (const sheet of formatSheets) {
    const worksheet = workbook.Sheets[sheet.name];
    if (!worksheet) continue;
    const headerRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      blankrows: false,
    });
    const actualHeaders = (headerRows[0] ?? []).map((value) => String(value).trim());
    const nonEmptyHeaders = actualHeaders.filter(Boolean);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
    rowsBySheet.set(sheet.name, rows);
    const missingColumns = sheet.columns.filter((column) => !actualHeaders.includes(column));
    if (missingColumns.length) errors.push(`Sheet ${sheet.name} thiếu cột: ${missingColumns.join(", ")}.`);
    const unexpectedColumns = actualHeaders.filter((column) => column && !sheet.columns.includes(column));
    if (unexpectedColumns.length) errors.push(`Sheet ${sheet.name} có cột không thuộc format: ${[...new Set(unexpectedColumns)].join(", ")}.`);
    const duplicateColumns = actualHeaders.filter((column, index) => column && actualHeaders.indexOf(column) !== index);
    if (duplicateColumns.length) errors.push(`Sheet ${sheet.name} có tên cột bị trùng: ${[...new Set(duplicateColumns)].join(", ")}.`);
    if (nonEmptyHeaders.join("\u0000") !== sheet.columns.join("\u0000")) {
      errors.push(`Sheet ${sheet.name} phải giữ đúng thứ tự cột: ${sheet.columns.join(", ")}.`);
    }
    if (!rows.length) warnings.push(`Sheet ${sheet.name} chưa có dữ liệu.`);
  }

  const ctdtRows = rowsBySheet.get("CTDT") ?? [];
  const majorRows = rowsBySheet.get("NGANH") ?? [];
  const courseRows = rowsBySheet.get("HOCPHAN") ?? [];
  const ploRows = rowsBySheet.get("PLO") ?? [];
  const cloRows = rowsBySheet.get("CLO") ?? [];
  const matrixRows = rowsBySheet.get("MA_TRAN_CLO_PLO") ?? [];
  const text = (row: Record<string, unknown>, column: string) => String(row[column] ?? "").trim();
  const key = (value: string) => value.toUpperCase();
  const ctdtCodes = new Set(ctdtRows.map((row) => key(text(row, "MaCTDT"))).filter(Boolean));
  const majorCodes = new Set<string>();
  const courseCodes = new Set<string>();
  const courseKeys = new Set<string>();
  const ploKeys = new Set<string>();
  const ploParents: Array<{ line: number; major: string; code: string; parent: string }> = [];
  const cloCodesByMajor = new Map<string, string>();
  const cloCourseKeys = new Set<string>();

  if (ctdtRows.length !== 1) errors.push("Sheet CTDT phải có đúng một dòng chương trình đào tạo.");
  if (ctdtRows.length === 1 && (!text(ctdtRows[0], "MaCTDT") || !text(ctdtRows[0], "TenCTDT"))) {
    errors.push("Sheet CTDT: MaCTDT và TenCTDT là bắt buộc.");
  }
  if (!majorRows.length) errors.push("Sheet NGANH phải có ít nhất một ngành đào tạo.");
  for (const [index, row] of majorRows.entries()) {
    const line = index + 2;
    const majorCode = key(text(row, "MaNganh"));
    if (!majorCode || !text(row, "TenNganh")) errors.push(`NGANH dòng ${line}: thiếu mã hoặc tên ngành.`);
    if (majorCodes.has(majorCode)) errors.push(`NGANH dòng ${line}: mã ngành ${majorCode} bị trùng.`);
    if (majorCode) majorCodes.add(majorCode);
    if (!ctdtCodes.has(key(text(row, "MaCTDT")))) errors.push(`NGANH dòng ${line}: MaCTDT không khớp với chương trình trong sheet CTDT.`);
  }
  for (const [index, row] of courseRows.entries()) {
    const line = index + 2;
    const majorCode = key(text(row, "MaNganh"));
    const courseCode = key(text(row, "MaHocPhan"));
    if (!majorCodes.has(majorCode)) errors.push(`HOCPHAN dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!courseCode || !text(row, "TenHocPhan")) errors.push(`HOCPHAN dòng ${line}: thiếu mã hoặc tên học phần.`);
    if (courseCodes.has(courseCode)) errors.push(`HOCPHAN dòng ${line}: mã học phần ${courseCode} bị trùng.`);
    if (courseCode) {
      courseCodes.add(courseCode);
      courseKeys.add(`${majorCode}:${courseCode}`);
    }
    if (!Number.isInteger(Number(row.SoTinChi)) || Number(row.SoTinChi) <= 0) errors.push(`HOCPHAN dòng ${line}: SoTinChi phải là số nguyên dương.`);
    if (text(row, "HocKy") && (!Number.isInteger(Number(row.HocKy)) || Number(row.HocKy) < 1 || Number(row.HocKy) > 8)) errors.push(`HOCPHAN dòng ${line}: HocKy phải là số nguyên từ 1 đến 8 hoặc để trống.`);
  }
  for (const [index, row] of ploRows.entries()) {
    const line = index + 2;
    const majorCode = key(text(row, "MaNganh"));
    const ploCode = key(text(row, "MaPLO"));
    const ploKey = `${majorCode}:${ploCode}`;
    if (!majorCodes.has(majorCode)) errors.push(`PLO dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!ploCode || !text(row, "MoTaPLO")) errors.push(`PLO dòng ${line}: thiếu mã hoặc mô tả PLO.`);
    if (ploKeys.has(ploKey)) errors.push(`PLO dòng ${line}: mã PLO ${ploCode} bị trùng trong ngành.`);
    if (ploCode) ploKeys.add(ploKey);
    const threshold = text(row, "NguongDat");
    if (threshold && (!Number.isInteger(Number(threshold)) || Number(threshold) < 0 || Number(threshold) > 100)) errors.push(`PLO dòng ${line}: NguongDat phải là số nguyên từ 0 đến 100.`);
    ploParents.push({ line, major: majorCode, code: ploCode, parent: key(text(row, "MaPLOCha")) });
  }
  for (const [index, row] of cloRows.entries()) {
    const line = index + 2;
    const majorCode = key(text(row, "MaNganh"));
    const courseCode = key(text(row, "MaHocPhan"));
    const cloCode = key(text(row, "MaCLO"));
    if (!majorCodes.has(majorCode)) errors.push(`CLO dòng ${line}: MaNganh không tồn tại trong sheet NGANH.`);
    if (!courseKeys.has(`${majorCode}:${courseCode}`)) errors.push(`CLO dòng ${line}: MaHocPhan không tồn tại trong đúng ngành ở sheet HOCPHAN.`);
    if (!cloCode || !text(row, "MoTaCLO")) errors.push(`CLO dòng ${line}: thiếu mã hoặc mô tả CLO.`);
    const cloKey = `${majorCode}:${cloCode}`;
    const priorDescription = cloCodesByMajor.get(cloKey);
    if (priorDescription && priorDescription !== text(row, "MoTaCLO")) errors.push(`CLO dòng ${line}: mã CLO ${cloCode} trong cùng ngành có mô tả không nhất quán.`);
    if (cloCode) cloCodesByMajor.set(cloKey, text(row, "MoTaCLO"));
    const cloCourseKey = `${majorCode}:${courseCode}:${cloCode}`;
    if (cloCourseKeys.has(cloCourseKey)) errors.push(`CLO dòng ${line}: liên kết học phần/CLO bị trùng.`);
    if (cloCode && courseCode) cloCourseKeys.add(cloCourseKey);
  }
  for (const { line, major, code, parent } of ploParents) {
    if (parent && !ploKeys.has(`${major}:${parent}`)) errors.push(`PLO dòng ${line}: MaPLOCha không tồn tại trong cùng ngành.`);
    if (parent && parent === code) errors.push(`PLO dòng ${line}: PLO không thể là cha của chính nó.`);
  }
  const parentByPlo = new Map(ploParents.map(({ major, code, parent }) => [`${major}:${code}`, parent]));
  for (const { line, major, code } of ploParents) {
    const visited = new Set<string>();
    let current = code;
    while (current) {
      if (visited.has(current)) {
        errors.push(`PLO dòng ${line}: cấu trúc PLO cha-con bị vòng lặp.`);
        break;
      }
      visited.add(current);
      current = parentByPlo.get(`${major}:${current}`) ?? "";
    }
  }
  const matrixKeys = new Set<string>();
  const matrixCloKeys = new Set<string>();
  const matrixPloKeys = new Set<string>();
  for (const [index, row] of matrixRows.entries()) {
    const line = index + 2;
    const majorCode = key(text(row, "MaNganh"));
    const courseCode = key(text(row, "MaHocPhan"));
    const cloCode = key(text(row, "MaCLO"));
    const ploCode = key(text(row, "MaPLO"));
    if (!courseKeys.has(`${majorCode}:${courseCode}`) || !cloCourseKeys.has(`${majorCode}:${courseCode}:${cloCode}`) || !ploKeys.has(`${majorCode}:${ploCode}`)) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: mã ngành/học phần/CLO/PLO không tồn tại đúng trong ngành tương ứng.`);
    const matrixKey = `${majorCode}:${courseCode}:${cloCode}:${ploCode}`;
    if (matrixKeys.has(matrixKey)) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: liên kết CLO-PLO bị trùng.`);
    matrixKeys.add(matrixKey);
    matrixCloKeys.add(`${majorCode}:${courseCode}:${cloCode}`);
    matrixPloKeys.add(`${majorCode}:${ploCode}`);
    const level = text(row, "MucDongGop").toUpperCase();
    if (!["I", "R", "M", "1", "2", "3"].includes(level)) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: MucDongGop chỉ nhận I, R, M hoặc 1, 2, 3.`);
    if (!["TT", "GT"].includes(text(row, "PhuongPhap").toUpperCase())) errors.push(`MA_TRAN_CLO_PLO dòng ${line}: PhuongPhap chỉ nhận TT hoặc GT.`);
  }

  const ploCodesByMajor = new Map<string, Set<string>>();
  for (const { major, code } of ploParents) {
    const codes = ploCodesByMajor.get(major) ?? new Set<string>();
    codes.add(code);
    ploCodesByMajor.set(major, codes);
  }
  const ploCodesWithChildren = new Set<string>();
  for (const { major, code, parent } of ploParents) {
    if (parent) ploCodesWithChildren.add(`${major}:${parent}`);
    for (const possibleParent of ploCodesByMajor.get(major) ?? []) {
      if (code.startsWith(`${possibleParent}.`)) {
        ploCodesWithChildren.add(`${major}:${possibleParent}`);
      }
    }
  }

  for (const majorCode of majorCodes) {
    const majorCourseCodes = new Set(
      courseRows
        .filter((row) => key(text(row, "MaNganh")) === majorCode)
        .map((row) => key(text(row, "MaHocPhan"))),
    );
    if (!majorCourseCodes.size) warnings.push(`Ngành ${majorCode} chưa có học phần.`);
    if (!ploRows.some((row) => key(text(row, "MaNganh")) === majorCode)) {
      warnings.push(`Ngành ${majorCode} chưa có PLO; chưa thể đánh giá PLO.`);
    }
    if (!cloRows.some((row) => key(text(row, "MaNganh")) === majorCode)) {
      warnings.push(`Ngành ${majorCode} chưa có CLO; giảng viên chưa thể đánh giá CLO.`);
    }
    if (!matrixRows.some((row) => key(text(row, "MaNganh")) === majorCode)) {
      warnings.push(`Ngành ${majorCode} chưa có ma trận CLO–PLO; chưa thể tổng hợp kết quả PLO.`);
    }
    const coursesWithoutClo = courseRows
      .filter(
        (row) =>
          key(text(row, "MaNganh")) === majorCode &&
          ![...cloCourseKeys].some((cloKey) =>
            cloKey.startsWith(
              `${majorCode}:${key(text(row, "MaHocPhan"))}:`,
            ),
          ),
      )
      .map((row) => key(text(row, "MaHocPhan")));
    if (coursesWithoutClo.length) {
      warnings.push(
        `Ngành ${majorCode} có học phần chưa được gán CLO: ${coursesWithoutClo.join(", ")}.`,
      );
    }
    const closWithoutPloMapping = new Map<string, string[]>();
    for (const row of cloRows) {
      if (key(text(row, "MaNganh")) !== majorCode) continue;
      const courseCode = key(text(row, "MaHocPhan"));
      const cloCode = key(text(row, "MaCLO"));
      if (matrixCloKeys.has(`${majorCode}:${courseCode}:${cloCode}`)) continue;
      const missingClos = closWithoutPloMapping.get(courseCode) ?? [];
      missingClos.push(cloCode);
      closWithoutPloMapping.set(courseCode, missingClos);
    }
    if (closWithoutPloMapping.size) {
      const missingCloSummary = [...closWithoutPloMapping]
        .map(([courseCode, cloCodes]) => `${courseCode}: ${cloCodes.join(", ")}`)
        .join("; ");
      warnings.push(
        `Ngành ${majorCode} có ${[...closWithoutPloMapping.values()].reduce((count, codes) => count + codes.length, 0)} CLO chưa được gán vào ma trận PLO (${missingCloSummary}).`,
      );
    }
    const plosWithoutCloMapping = ploRows.filter((row) => {
      const ploCode = key(text(row, "MaPLO"));
      return key(text(row, "MaNganh")) === majorCode &&
        !ploCodesWithChildren.has(`${majorCode}:${ploCode}`) &&
        !matrixPloKeys.has(`${majorCode}:${ploCode}`);
    }).length;
    if (plosWithoutCloMapping) {
      warnings.push(
        `Ngành ${majorCode} có ${plosWithoutCloMapping} PLO chưa có liên kết CLO đóng góp.`,
      );
    }
  }

  return { errors, warnings, counts: Object.fromEntries([...rowsBySheet.entries()].map(([name, rows]) => [name, rows.length])) };
}

function worksheetName(value: string, usedNames: Set<string>) {
  const base = value.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
  let name = base;
  let suffix = 2;
  while (usedNames.has(name.toLowerCase())) {
    const tail = `_${suffix}`;
    name = `${base.slice(0, 31 - tail.length)}${tail}`;
    suffix += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function downloadActualProgram(
  data: Awaited<ReturnType<typeof getProgramExport>>,
  report: LecturerProgramReport["programs"][number],
) {
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set(["ctdt", "nganh", "hocphan", "plo", "clo", "ma_tran_clo_plo", "danh_gia_ctdt", "tong_hop_ctdt"]);
  const { program } = data;
  addCtdtSheet(workbook, "CTDT", [{ MaCTDT: program.code, TenCTDT: program.name, MoTa: program.description || "" }]);
  addCtdtSheet(workbook, "NGANH", data.majors.map((major) => ({ MaNganh: major.code, TenNganh: major.name, MaCTDT: program.code, MoTa: major.description || "" })));
  addCtdtSheet(workbook, "HOCPHAN", data.majors.flatMap((major) => major.courses.map((course) => ({ MaNganh: major.code, MaHocPhan: course.code, TenHocPhan: course.name, SoTinChi: course.credits, HocKy: course.semester || "", MaHocPhanThayThe: course.replacementCode || "", TenHocPhanThayThe: course.replacementName || "" }))));
  addCtdtSheet(workbook, "PLO", data.majors.flatMap((major) => major.plos.map((plo) => ({ MaNganh: major.code, MaPLO: plo.code, MoTaPLO: plo.description, NguongDat: plo.targetPercent ?? "", MaPLOCha: major.plos.find((parent) => parent.id === plo.parentId)?.code ?? "" }))));
  addCtdtSheet(workbook, "CLO", data.majors.flatMap((major) => major.clos.map((clo) => ({ MaNganh: major.code, MaHocPhan: clo.courseCode, MaCLO: clo.code, MoTaCLO: clo.description }))));
  addCtdtSheet(workbook, "MA_TRAN_CLO_PLO", data.matrices.map((matrix) => ({ MaNganh: matrix.majorCode, MaHocPhan: matrix.courseCode, MaCLO: matrix.cloCode, MaPLO: matrix.ploCode, MucDongGop: matrix.level, PhuongPhap: matrix.method })));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.majors.map((major) => ({ NamHoc: report.academicYear, MaCTDT: program.code, MaNganh: major.code, TenNganh: major.name, TyLePLO: major.evaluation.averagePloRate ?? "Chưa có dữ liệu", NguongDat: major.evaluation.threshold, KetQua: major.evaluation.status }))), "DANH_GIA_CTDT");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ NamHoc: report.academicYear, MaCTDT: program.code, TenCTDT: program.name, NguongDat: report.evaluation.threshold, KetQua: report.evaluation.status }]), "TONG_HOP_CTDT");
  for (const major of report.majors) {
    const rows = major.cloPloAssessments.map((assessment) => ({
      NamHoc: report.academicYear,
      MaNganh: major.code,
      TenNganh: major.name,
      MaHocPhan: assessment.courseCode,
      TenHocPhan: assessment.courseName,
      MaCLO: assessment.cloCode,
      MoTaCLO: assessment.cloDescription,
      TyLeDatCLOTrungBinh: assessment.averageRate ?? "Chưa có dữ liệu",
      SoGiangVienDanhGia: assessment.lecturerCount,
      GiangVienDanhGia: assessment.lecturerAssessments.map((item) => `${item.lecturerName} (${item.attainmentRate}%)`).join(", "),
      MaPLO: assessment.ploCode,
      TyLeDatPLO: assessment.ploAttainmentRate ?? "Chưa có dữ liệu",
      NguongDatPLO: major.evaluation.threshold,
      KetQuaPLO: assessment.ploStatus,
      MucDongGop: assessment.contributionLevel,
    }));
    const name = worksheetName(`CLO_PLO_${major.code}`, usedSheetNames);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, {
      header: ["NamHoc", "MaNganh", "TenNganh", "MaHocPhan", "TenHocPhan", "MaCLO", "MoTaCLO", "TyLeDatCLOTrungBinh", "SoGiangVienDanhGia", "GiangVienDanhGia", "MaPLO", "TyLeDatPLO", "NguongDatPLO", "KetQuaPLO", "MucDongGop"],
    }), name);
  }
  XLSX.writeFile(workbook, `CTDT-${program.code}-${report.academicYear}.xlsx`);
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [evaluationYears, setEvaluationYears] = useState<number[]>([]);
  const [selectedEvaluationYear, setSelectedEvaluationYear] = useState<number | null>(null);
  const [validation, setValidation] = useState<{ fileName: string; errors: string[]; warnings: string[]; counts: Record<string, number> } | null>(null);
  const [importPayload, setImportPayload] = useState<CtdtImportPayload | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadPrograms() {
    setLoading(true);
    setError("");
    try {
      setPrograms(await getPrograms());
    } catch (cause: unknown) {
      console.error("Lỗi tải danh sách chương trình đào tạo:", cause);
      setError(getErrorMessage(cause, "Không tải được danh sách chương trình đào tạo."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    void getPrograms()
      .then((result) => {
        if (active) setPrograms(result);
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải danh sách chương trình đào tạo:", cause);
        if (active) setError(getErrorMessage(cause, "Không tải được danh sách chương trình đào tạo."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    getLecturerAssessmentYears()
      .then((years) => {
        const orderedYears = [...years].sort((a, b) => b - a);
        setEvaluationYears(orderedYears);
        setSelectedEvaluationYear(orderedYears[0] ?? new Date().getFullYear());
      })
      .catch((cause: unknown) => {
        console.error("Lỗi tải các năm học đánh giá CTĐT:", cause);
        setError("Không tải được năm học đánh giá CTĐT.");
      });
  }, []);


  async function remove(program: Program) {
    if (program.majors.length > 0) { setError("Không thể xóa chương trình đang có ngành đào tạo."); return; }
    if (!window.confirm(`Xóa chương trình ${program.code}?`)) return;
    try { await deleteProgram(program.id); setNotice("Đã xóa chương trình đào tạo."); await loadPrograms(); }
    catch (cause: unknown) {
      console.error("Lỗi xóa chương trình đào tạo:", cause);
      setError(getErrorMessage(cause, "Không thể xóa chương trình đào tạo."));
    }
  }

  async function exportProgram(program: Program) {
    if (selectedEvaluationYear === null) {
      setError("Đang tải danh sách năm học đánh giá.");
      return;
    }
    if (program.majors.length === 0) {
      setError("CTĐT chưa có ngành nên chưa có học phần, PLO, CLO và ma trận để xuất.");
      return;
    }
    try {
      const [programData, reportData] = await Promise.all([
        getProgramExport(program.id),
        getLecturerProgramReport(selectedEvaluationYear),
      ]);
      const report = reportData.programs.find((item) => item.program.id === program.id);
      if (!report) throw new Error("Không tìm thấy kết quả đánh giá của CTĐT.");
      downloadActualProgram(programData, report);
    } catch (cause) {
      console.error("Lỗi xuất dữ liệu CTĐT và đánh giá:", cause);
      setError(cause instanceof Error ? cause.message : "Không thể xuất dữ liệu CTĐT hiện tại.");
    }
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
        const rows = (sheet: string) => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheet], { defval: "" });
        const ctdtRows = rows("CTDT");
        setImportPayload({ ctdt: ctdtRows[0] as CtdtImportPayload["ctdt"], nganh: rows("NGANH") as CtdtImportPayload["nganh"], hocphan: rows("HOCPHAN") as CtdtImportPayload["hocphan"], plo: rows("PLO") as CtdtImportPayload["plo"], clo: rows("CLO") as CtdtImportPayload["clo"], matrix: rows("MA_TRAN_CLO_PLO") as CtdtImportPayload["matrix"] });
        setNotice(
          result.warnings.length
            ? "File đúng định dạng và các mã liên kết hợp lệ. Có cảnh báo về dữ liệu còn thiếu; hãy xem danh sách bên dưới trước khi nhập."
            : "File đúng định dạng và các mã liên kết hợp lệ. Có thể nhập dữ liệu vào hệ thống.",
        );
      }
    } catch (cause: unknown) {
      console.error("Lỗi đọc file Excel CTĐT:", cause);
      setError(getErrorMessage(cause, "Không thể đọc file Excel CTĐT."));
    }
  }

  async function saveImportedData() {
    if (!importPayload) return;
    setImporting(true); setError(""); setNotice("");
    try {
      const result = await importProgram(importPayload);
      setNotice(`Đã cập nhật dữ liệu CTĐT vào MySQL: ${result.imported.majors} ngành, ${result.imported.courses} học phần, ${result.imported.plos} PLO, ${result.imported.clos} CLO và ${result.imported.matrices} dòng ma trận.`);
      setImportPayload(null); await loadPrograms();
    } catch (cause: unknown) {
      console.error("Lỗi nhập dữ liệu CTĐT:", cause);
      setError(getErrorMessage(cause, "Không thể nhập dữ liệu CTĐT vào hệ thống."));
    } finally { setImporting(false); }
  }

  return <AdminLayout><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="text-sm font-medium text-blue-700">Quản lý dữ liệu đào tạo</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Chương trình đào tạo</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Tải hoặc xuất file Excel, chỉnh sửa toàn bộ CTĐT, ngành, học phần, PLO, CLO và ma trận, sau đó upload để kiểm tra và cập nhật vào MySQL.</p></div><div className="flex flex-wrap items-end gap-2"><label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">Năm học đánh giá<select value={selectedEvaluationYear ?? ""} onChange={(event) => setSelectedEvaluationYear(Number(event.target.value))} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"><option value={new Date().getFullYear()}>{new Date().getFullYear()} (hiện tại)</option>{evaluationYears.filter((year) => year !== new Date().getFullYear()).map((year) => <option key={year} value={year}>{year}</option>)}</select></label><Link href="/programs/evaluation" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><ClipboardCheck size={17} /> Đánh giá CTĐT</Link><button onClick={downloadCtdtTemplate} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Download size={17} /> Tải format CTĐT</button></div></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-semibold text-slate-900">Danh sách CTĐT</h2><p className="mt-1 text-sm text-slate-500">Dữ liệu được lấy từ MySQL qua API.</p></div><button onClick={() => void loadPrograms()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={16} /> Làm mới</button></div>{loading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</p> : programs.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có chương trình đào tạo.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Mã CTĐT</th><th className="px-5 py-3">Tên chương trình</th><th className="px-5 py-3">Ngành</th><th className="px-5 py-3">Cấu trúc dữ liệu</th><th className="px-5 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{programs.map((program) => <tr key={program.id}><td className="px-5 py-4 font-semibold text-blue-700">{program.code}</td><td className="px-5 py-4"><p className="font-medium text-slate-800">{program.name}</p><p className="mt-1 text-xs text-slate-500">{program.description || "Chưa có mô tả"}</p></td><td className="px-5 py-4">{program.majors.length ? program.majors.map((major) => <div key={major.id} className="mb-1">{major.code} - {major.name}</div>) : <span className="text-slate-400">Chưa gán ngành</span>}</td><td className="px-5 py-4 text-xs text-slate-600">{program.majors.reduce((sum, major) => sum + (major._count?.courses || 0), 0)} học phần · {program.majors.reduce((sum, major) => sum + (major._count?.plos || 0), 0)} PLO · {program.majors.reduce((sum, major) => sum + (major._count?.clos || 0), 0)} CLO</td><td className="px-5 py-4"><div className="flex items-center gap-1"><button onClick={() => void exportProgram(program)} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" title="Xuất dữ liệu CTĐT hiện tại"><Download size={17} /></button><button onClick={() => void remove(program)} disabled={program.majors.length > 0} title={program.majors.length > 0 ? "Không thể xóa CTĐT đang có ngành" : "Xóa CTĐT"} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FileSpreadsheet size={19} /> Cấu trúc file Excel CTĐT</h2><p className="mt-1 text-sm text-slate-500">Phần này hướng dẫn cấu trúc file dùng khi tải format, chỉnh sửa và upload lại. Các mã ở sheet con phải khớp với mã ở sheet cha để hệ thống lưu đúng quan hệ dữ liệu.</p><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{formatSheets.map((sheet) => { const purpose = sheet.name === "CTDT" ? "Thông tin chung của chương trình đào tạo" : sheet.name === "NGANH" ? "Ngành được liên kết với chương trình đào tạo" : sheet.name === "HOCPHAN" ? "Các học phần thuộc ngành" : sheet.name === "PLO" ? "Chuẩn đầu ra của ngành" : sheet.name === "CLO" ? "Chuẩn đầu ra của từng học phần" : "Liên kết CLO với PLO và mức đóng góp"; return <div key={sheet.name} className="rounded-lg border border-slate-200 p-4"><p className="font-semibold text-slate-800">{sheet.name}</p><p className="mt-1 text-xs text-slate-500">{purpose}</p><p className="mt-2 text-xs text-blue-700">{sheet.columns.join(" · ")}</p>{sheet.name === "MA_TRAN_CLO_PLO" && <p className="mt-2 text-xs text-slate-500">MucDongGop: I/R/M hoặc 1/2/3 · PhuongPhap: TT/GT</p>}{sheet.name === "PLO" && <p className="mt-2 text-xs text-slate-500">MaPLOCha dùng khi PLO có quan hệ kế thừa.</p>}</div>; })}</div><p className="mt-4 text-xs text-slate-500">Lưu ý: sheet CTDT thường có một dòng; các sheet còn lại có thể có nhiều dòng. Sheet HUONG_DAN trong file tải xuống chỉ dùng để giải thích quy tắc, không phải dữ liệu bắt buộc.</p></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Upload size={19} /> Kiểm tra và nhập file CTĐT</h2><p className="mt-1 text-sm text-slate-500">Tải file Excel lên để kiểm tra tên sheet, thứ tự cột, dữ liệu bắt buộc và các liên kết mã. File có lỗi sẽ không thể nhập; cảnh báo về độ đầy đủ dữ liệu sẽ được hiển thị riêng.</p></div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><Upload size={16} /> Chọn file Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => void validateUpload(event)} /></label></div>{validation && <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-800">{validation.fileName}</p><div className={`mt-3 flex items-start gap-2 text-sm ${validation.errors.length ? "text-red-700" : "text-emerald-700"}`}>{validation.errors.length ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}<span>{validation.errors.length ? `Có ${validation.errors.length} lỗi cần sửa trước khi nhập.` : validation.warnings.length ? "File đúng định dạng, nhưng còn cảnh báo về độ đầy đủ của dữ liệu." : "File đúng định dạng, các trường bắt buộc và liên kết mã đều hợp lệ."}</span></div>{validation.errors.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">{validation.errors.slice(0, 30).map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}{validation.errors.length > 30 && <li>... và {validation.errors.length - 30} lỗi khác.</li>}</ul>}{validation.warnings.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-700">{validation.warnings.map((message) => <li key={message}>{message}</li>)}</ul>}<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">{Object.entries(validation.counts).map(([sheet, count]) => <span key={sheet} className="rounded-full bg-white px-3 py-1 shadow-sm">{sheet}: {count} dòng</span>)}</div>{!validation.errors.length && importPayload && <button onClick={() => void saveImportedData()} disabled={importing} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={16} />{importing ? "Đang nhập vào MySQL..." : "Nhập dữ liệu hợp lệ vào hệ thống"}</button>}</div>}</section>
  </div></AdminLayout>;
}
