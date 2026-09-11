import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Eye,
  Download,
} from "lucide-react";
import EmployeeAttendeeModal from "./EmployeeAttendeeModal";
import type { Employee, Attendance, Department } from "../../types";
import { formatDate, todayISO } from "../../utils/dateUtils";

interface LiveAttendeesTrackerProps {
  employees: Employee[];
  departments: Department[];
  allAttendance: Attendance[];
  scope?: "all" | "team";
  canEdit?: boolean;
  onRefresh?: () => void;
  title?: string;
}

type StatusFilterType = "all" | "checkedIn" | "checkedOut" | "late" | "absent" | "onLeave";

export default function LiveAttendeesTracker({
  employees,
  departments,
  allAttendance,
  scope = "all",
  canEdit = false,
  onRefresh,
  title = "Today's Live Attendees & Check-In / Out Feed",
}: LiveAttendeesTrackerProps) {
  const today = todayISO();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Map employee with their attendance for today
  const attendees = useMemo(() => {
    return employees.map((emp) => {
      const record = allAttendance.find((a) => a.employeeId === emp.id && a.date === today);
      const isCheckedIn = !!record?.checkIn && !record?.checkOut;
      const isCheckedOut = !!record?.checkIn && !!record?.checkOut;
      const isLate = record?.status === "Late";
      const isOnLeave = record?.status === "On Leave";
      const isAbsent = record?.status === "Absent" || (!record?.checkIn && !isOnLeave);

      let computedStatus: "Checked In" | "Checked Out" | "Late" | "On Leave" | "Not Checked In" = "Not Checked In";
      if (isCheckedIn && isLate) computedStatus = "Late";
      else if (isCheckedIn) computedStatus = "Checked In";
      else if (isCheckedOut) computedStatus = "Checked Out";
      else if (isOnLeave) computedStatus = "On Leave";
      else if (isAbsent) computedStatus = "Not Checked In";

      return {
        employee: emp,
        attendance: record,
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        workingHours: record?.workingHours || null,
        status: computedStatus,
        rawStatus: record?.status || "Absent",
        remarks: record?.remarks || "",
      };
    });
  }, [employees, allAttendance, today]);

  // Metric counts
  const counts = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter((a) => a.status === "Checked In" || a.status === "Late").length;
    const checkedOut = attendees.filter((a) => a.status === "Checked Out").length;
    const late = attendees.filter((a) => a.status === "Late").length;
    const onLeave = attendees.filter((a) => a.status === "On Leave").length;
    const notCheckedIn = attendees.filter((a) => a.status === "Not Checked In").length;
    return { total, checkedIn, checkedOut, late, onLeave, notCheckedIn };
  }, [attendees]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((item) => {
      const emp = item.employee;
      const matchesSearch =
        !q ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);

      const matchesDept = !deptFilter || emp.departmentId === deptFilter;

      let matchesStatus = true;
      if (statusFilter === "checkedIn") matchesStatus = item.status === "Checked In";
      else if (statusFilter === "checkedOut") matchesStatus = item.status === "Checked Out";
      else if (statusFilter === "late") matchesStatus = item.status === "Late";
      else if (statusFilter === "absent") matchesStatus = item.status === "Not Checked In";
      else if (statusFilter === "onLeave") matchesStatus = item.status === "On Leave";

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [attendees, search, deptFilter, statusFilter]);

  function exportCSV() {
    const headers = ["Employee ID", "Full Name", "Department", "Check-In", "Check-Out", "Working Hours", "Status", "Remarks"];
    const rows = filtered.map((item) => {
      const d = departments.find((dp) => dp.id === item.employee.departmentId)?.name || "—";
      return [
        `"${item.employee.employeeId}"`,
        `"${item.employee.fullName}"`,
        `"${d}"`,
        `"${item.checkIn || ""}"`,
        `"${item.checkOut || ""}"`,
        `"${item.workingHours || ""}"`,
        `"${item.status}"`,
        `"${item.remarks.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendees_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      {/* Header & Quick stats */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Live attendance status for {formatDate(today)} • {filtered.length} of {employees.length} employees shown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="btn-secondary !py-1.5 !px-3 text-xs font-semibold"
              title="Export attendees to CSV"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Quick Filter Status Chips */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
            }`}
          >
            All Attendees ({counts.total})
          </button>

          <button
            onClick={() => setStatusFilter("checkedIn")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "checkedIn"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
            }`}
          >
            In Office / Checked In ({counts.checkedIn})
          </button>

          <button
            onClick={() => setStatusFilter("checkedOut")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "checkedOut"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
            }`}
          >
            Checked Out ({counts.checkedOut})
          </button>

          <button
            onClick={() => setStatusFilter("late")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "late"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
            }`}
          >
            Late Arrivals ({counts.late})
          </button>

          <button
            onClick={() => setStatusFilter("absent")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
            }`}
          >
            Not Arrived ({counts.notCheckedIn})
          </button>

          <button
            onClick={() => setStatusFilter("onLeave")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === "onLeave"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/70"
            }`}
          >
            On Leave ({counts.onLeave})
          </button>
        </div>

        {/* Search & Department filters */}
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search employee by name, designation or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-9 text-xs sm:text-sm"
            />
          </div>

          {scope === "all" && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input sm:w-52 text-xs sm:text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Attendees Table / Mobile Cards */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto text-gray-300 dark:text-slate-600" size={40} />
            <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-slate-300">No attendees match your filter</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Try changing your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/80 font-semibold text-gray-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Department</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3 hidden md:table-cell">Check-Out</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Work Hours</th>
                  <th className="px-4 py-3">Live Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/70">
                {filtered.map((item) => {
                  const emp = item.employee;
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const initials = emp.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/90 dark:hover:bg-slate-800/60"
                    >
                      {/* Employee Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-bold text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                              {emp.fullName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">
                              {emp.employeeId} • <span className="sm:hidden">{dept?.name || "General"}</span>
                              <span className="hidden sm:inline">{emp.designation}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300 hidden sm:table-cell">
                        {dept?.name || "General"}
                      </td>

                      {/* Check-In */}
                      <td className="px-4 py-3">
                        {item.checkIn ? (
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.checkIn}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.checkOut ? (
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {item.checkOut}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Working Hours */}
                      <td className="px-4 py-3 hidden lg:table-cell font-mono text-gray-700 dark:text-slate-300">
                        {item.workingHours || (item.checkIn ? "In Progress" : "—")}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.status === "Checked In"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                              : item.status === "Checked Out"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                              : item.status === "Late"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              : item.status === "On Leave"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(emp);
                          }}
                          className="btn-secondary !py-1 !px-2.5 text-xs font-medium hover:bg-primary-50 dark:hover:bg-primary-950/40"
                        >
                          <Eye size={13} />
                          <span className="hidden sm:inline">Follow</span> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Attendee Details Modal */}
      <EmployeeAttendeeModal
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        departments={departments}
        allAttendance={allAttendance}
        canEdit={canEdit}
        onRefresh={onRefresh}
      />
    </div>
  );
}
