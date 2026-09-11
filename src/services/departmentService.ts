import api from "./api";
import type { Department } from "../types";

export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get<Department[]>("/departments");
  return data;
}

export async function createDepartment(payload: Omit<Department, "id">): Promise<Department> {
  const { data } = await api.post<Department>("/departments", payload);
  return data;
}

export async function updateDepartment(id: string, payload: Partial<Department>): Promise<Department> {
  const { data } = await api.patch<Department>(`/departments/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${id}`);
}
