import api from "./api";
import type { Attendance } from "../types";
import { calculateWorkingHours } from "../utils/dateUtils";

export async function getAttendance(): Promise<Attendance[]> {
  const { data } = await api.get<Attendance[]>("/attendance");
  return data;
}

export async function getAttendanceForEmployee(employeeId: string): Promise<Attendance[]> {
  const { data } = await api.get<Attendance[]>("/attendance", { params: { employeeId } });
  return data;
}

export async function getAttendanceForDate(date: string): Promise<Attendance[]> {
  const { data } = await api.get<Attendance[]>("/attendance", { params: { date } });
  return data;
}

export async function createAttendance(payload: Omit<Attendance, "id" | "workingHours">): Promise<Attendance> {
  const workingHours = calculateWorkingHours(payload.checkIn, payload.checkOut);
  const { data } = await api.post<Attendance>("/attendance", { ...payload, workingHours });
  return data;
}

export async function updateAttendance(
  id: string,
  payload: Partial<Omit<Attendance, "id">>
): Promise<Attendance> {
  const next = { ...payload } as Partial<Attendance>;
  if ("checkIn" in payload || "checkOut" in payload) {
    const { data: current } = await api.get<Attendance>(`/attendance/${id}`);
    const checkIn = payload.checkIn !== undefined ? payload.checkIn : current.checkIn;
    const checkOut = payload.checkOut !== undefined ? payload.checkOut : current.checkOut;
    next.workingHours = calculateWorkingHours(checkIn, checkOut);
  }
  const { data } = await api.patch<Attendance>(`/attendance/${id}`, next);
  return data;
}

export async function deleteAttendance(id: string): Promise<void> {
  await api.delete(`/attendance/${id}`);
}
