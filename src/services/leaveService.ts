import api from "./api";
import type { Employee, LeaveRequest, LeaveType } from "../types";
import { daysBetweenInclusive, rangesOverlap } from "../utils/dateUtils";

// ---------- Leave Types ----------
export async function getLeaveTypes(): Promise<LeaveType[]> {
  const { data } = await api.get<LeaveType[]>("/leaveTypes");
  return data;
}

export async function createLeaveType(payload: Omit<LeaveType, "id">): Promise<LeaveType> {
  const { data } = await api.post<LeaveType>("/leaveTypes", payload);
  return data;
}

export async function updateLeaveType(id: string, payload: Partial<LeaveType>): Promise<LeaveType> {
  const { data } = await api.patch<LeaveType>(`/leaveTypes/${id}`, payload);
  return data;
}

export async function deleteLeaveType(id: string): Promise<void> {
  await api.delete(`/leaveTypes/${id}`);
}

// ---------- Leave Requests ----------
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const { data } = await api.get<LeaveRequest[]>("/leaveRequests");
  return data;
}

export async function getLeaveRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
  const { data } = await api.get<LeaveRequest[]>("/leaveRequests", { params: { employeeId } });
  return data;
}

export interface LeaveValidationResult {
  valid: boolean;
  errors: string[];
  numberOfDays: number;
}

/** Validates a leave request against balance and overlapping requests. */
export function validateLeaveRequest(
  employee: Employee,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  existingRequests: LeaveRequest[],
  excludeRequestId?: string
): LeaveValidationResult {
  const errors: string[] = [];
  const numberOfDays = daysBetweenInclusive(startDate, endDate);

  if (!startDate || !endDate) {
    errors.push("Start and end dates are required");
  } else if (startDate > endDate) {
    errors.push("Start date cannot be after end date");
  }

  if (numberOfDays > 0) {
    const balanceEntry = employee.leaveBalance.find((b) => b.leaveTypeId === leaveType.id);
    const remaining = balanceEntry ? balanceEntry.allocated - balanceEntry.used : 0;
    if (leaveType.name !== "Unpaid Leave" && numberOfDays > remaining) {
      errors.push(
        `Insufficient leave balance: requested ${numberOfDays} day(s), only ${remaining} remaining for ${leaveType.name}`
      );
    }
  }

  const overlap = existingRequests.some(
    (r) =>
      r.id !== excludeRequestId &&
      r.employeeId === employee.id &&
      (r.status === "Pending" || r.status === "Approved") &&
      rangesOverlap(startDate, endDate, r.startDate, r.endDate)
  );
  if (overlap) {
    errors.push("This date range overlaps with an existing pending or approved leave request");
  }

  return { valid: errors.length === 0, errors, numberOfDays };
}

export async function applyLeave(
  payload: Omit<LeaveRequest, "id" | "status" | "reviewedBy" | "reviewDate" | "reviewComment" | "appliedDate">
): Promise<LeaveRequest> {
  const { data } = await api.post<LeaveRequest>("/leaveRequests", {
    ...payload,
    appliedDate: new Date().toISOString().slice(0, 10),
    status: "Pending",
    reviewedBy: null,
    reviewDate: null,
    reviewComment: null,
  });
  return data;
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  const { data } = await api.patch<LeaveRequest>(`/leaveRequests/${id}`, { status: "Cancelled" });
  return data;
}

export async function reviewLeaveRequest(
  id: string,
  status: "Approved" | "Rejected",
  reviewerId: string,
  comment: string
): Promise<LeaveRequest> {
  const { data } = await api.patch<LeaveRequest>(`/leaveRequests/${id}`, {
    status,
    reviewedBy: reviewerId,
    reviewDate: new Date().toISOString().slice(0, 10),
    reviewComment: comment || null,
  });
  return data;
}

/** Adjusts an employee's leave balance (used days) after approval, e.g. delta = +days or -days */
export async function adjustLeaveBalance(
  employee: Employee,
  leaveTypeId: string,
  deltaDays: number
): Promise<Employee> {
  const nextBalance = employee.leaveBalance.map((b) =>
    b.leaveTypeId === leaveTypeId ? { ...b, used: Math.max(0, b.used + deltaDays) } : b
  );
  const { data } = await api.patch<Employee>(`/employees/${employee.id}`, { leaveBalance: nextBalance });
  return data;
}
