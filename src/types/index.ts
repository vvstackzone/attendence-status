export type Role = "admin" | "hr" | "manager" | "employee";

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  employeeId?: string; // links to Employee.id for manager/employee roles
}

export type EmploymentStatus = "Active" | "Inactive" | "On Notice" | "Resigned";

export interface LeaveBalanceEntry {
  leaveTypeId: string;
  allocated: number;
  used: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  managerId: string | null;
  joiningDate: string; // ISO date
  employmentStatus: EmploymentStatus;
  leaveBalance: LeaveBalanceEntry[];
  profileImage?: string;
  createdDate: string;
}

export interface Department {
  id: string;
  name: string;
  headId: string | null;
  description: string;
  status: "Active" | "Inactive";
}

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Late"
  | "On Leave"
  | "Holiday"
  | "Week Off";

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // ISO date yyyy-MM-dd
  checkIn: string | null; // "09:15"
  checkOut: string | null; // "18:00"
  workingHours: string | null; // "8h 45m"
  status: AttendanceStatus;
  remarks: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string;
  maxDays: number;
  status: "Active" | "Inactive";
}

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  appliedDate: string;
  status: LeaveStatus;
  reviewedBy: string | null;
  reviewDate: string | null;
  reviewComment: string | null;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  relatedRecord: string | null;
  timestamp: string;
}

export interface SelectOption {
  label: string;
  value: string;
}
