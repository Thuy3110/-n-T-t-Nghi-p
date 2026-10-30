import api from "./api";
import { Major } from "@/types/major.type";

export const getMajors = async (): Promise<Major[]> => {
  const response = await api.get<Major[]>("/majors");
  return response.data;
};

export const createMajor = async (
  data: Omit<Major, "id" | "createdAt">
): Promise<Major> => {
  const response = await api.post<Major>("/majors", data);
  return response.data;
};

export const updateMajor = async (
  id: number,
  data: Partial<Major>
): Promise<Major> => {
  const response = await api.patch<Major>(`/majors/${id}`, data);
  return response.data;
};

export const deleteMajor = async (
  id: number
): Promise<void> => {
  await api.delete(`/majors/${id}`);
};