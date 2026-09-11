import api from "./api";
import type { Employee } from "../types";

export async function getEmployees(): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>("/employees");
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(payload: Omit<Employee, "id">): Promise<Employee> {
  const { data } = await api.post<Employee>("/employees", payload);
  return data;
}

export async function updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
  const { data } = await api.patch<Employee>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

export async function isEmployeeIdTaken(employeeId: string, excludeId?: string): Promise<boolean> {
  const { data } = await api.get<Employee[]>("/employees", { params: { employeeId } });
  return data.some((e) => e.id !== excludeId);
}

export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  const { data } = await api.get<Employee[]>("/employees", { params: { email } });
  return data.some((e) => e.id !== excludeId);
}
