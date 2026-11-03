import api from "./api";

export type ProgramMajor = {
  id: number;
  code: string;
  name: string;
  _count?: { courses: number; plos: number; clos: number };
};

export type Program = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  majors: ProgramMajor[];
  _count?: { majors: number };
};

export type ProgramExport = {
  program: { id: number; code: string; name: string; description?: string | null };
  evaluation: { threshold: number; status: "Đạt" | "Chưa đạt" | "Chưa có dữ liệu" };
  majors: Array<{
    id: number;
    code: string;
    name: string;
    description?: string | null;
    evaluation: { averagePloRate: number | null; threshold: number; status: "Đạt" | "Chưa đạt" | "Chưa có dữ liệu" };
    courses: Array<{ code: string; name: string; credits: number; semester?: number | null; moduleCode?: string | null; replacementCode?: string | null; replacementName?: string | null }>;
    plos: Array<{ id: number; code: string; description: string; targetPercent?: number | null; parentId?: number | null }>;
    clos: Array<{ code: string; description: string }>;
  }>;
  matrices: Array<{ majorCode: string; courseCode: string; cloCode: string; ploCode: string; level: number; method: string }>;
};

export type CtdtImportPayload = {
  ctdt: { MaCTDT: string; TenCTDT: string; MoTa?: string };
  nganh: Array<{ MaNganh: string; TenNganh: string; MoTa?: string }>;
  hocphan: Array<{ MaNganh: string; MaHocPhan: string; TenHocPhan: string; SoTinChi: number; HocKy?: number | string; MaHocPhanThayThe?: string; TenHocPhanThayThe?: string }>;
  plo: Array<{ MaNganh: string; MaPLO: string; MoTaPLO: string; NguongDat?: number | string; MaPLOCha?: string }>;
  clo: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MoTaCLO: string }>;
  matrix: Array<{ MaNganh: string; MaHocPhan: string; MaCLO: string; MaPLO: string; MucDongGop: number | string; PhuongPhap: string }>;
};

export async function getPrograms() {
  const response = await api.get<Program[]>("/programs");
  return response.data;
}

export async function createProgram(payload: { code: string; name: string; description?: string; majorCode: string; majorName: string; majorDescription?: string }) {
  const response = await api.post<Program>("/programs", payload);
  return response.data;
}

export async function addMajorToProgram(programId: number, payload: { code: string; name: string; description?: string }) {
  const response = await api.post(`/programs/${programId}/majors`, payload);
  return response.data;
}

export async function importProgram(payload: CtdtImportPayload) {
  const response = await api.post<{ programId: number; imported: Record<string, number> }>("/programs/import", payload);
  return response.data;
}

export async function deleteProgram(id: number) {
  await api.delete(`/programs/${id}`);
}

export async function getProgramExport(id: number) {
  const response = await api.get<ProgramExport>(`/programs/${id}/export`);
  return response.data;
}
