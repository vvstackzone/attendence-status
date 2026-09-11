import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Pencil,
  History,
  Award,
} from "lucide-react";
import Modal from "../common/Modal";
import Badge from "../common/Badge";
import type { Employee, Attendance, Department, AttendanceStatus } from "../../types";
import { formatDate, todayISO, calculateWorkingHours } from "../../utils/dateUtils";
import * as attendanceService from "../../services/attendanceService";
import * as activityService from "../../services/activityService";
import { useAuth } from "../../hooks/useAuth";

interface EmployeeAttendeeModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  departments: Department[];
  allAttendance: Attendance[];
  canEdit?: boolean;
  onRefresh?: () => void;
}

export default function EmployeeAttendeeModal({
  open,
  onClose,
  employee,
  departments,
  allAttendance,
  canEdit = false,
  onRefresh,
}: EmployeeAttendeeModalProps) {
  const { user } = useAuth();
  const today = todayISO();

  const [editingToday, setEditingToday] = useState(false);
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [statusVal, setStatusVal] = useState<AttendanceStatus>("Present");
  const [remarksVal, setRemarksVal] = useState("");
  const [saving, setSaving] = useState(false);

  const dept = departments.find((d) => d.id === employee?.departmentId);

  // Employee's full attendance records
  const empAttendance = useMemo(() => {
    if (!employee) return [];
    return allAttendance
      .filter((a) => a.employeeId === employee.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allAttendance, employee]);

  const todayRecord = useMemo(() => {
    if (!employee) return null;
    return empAttendance.find((a) => a.date === today) || null;
  }, [empAttendance, today, employee]);

  // Monthly summary stats
  const stats = useMemo(() => {
    const total = empAttendance.length;
    const present = empAttendance.filter((a) => a.status === "Present" || a.status === "Late").length;
    const late = empAttendance.filter((a) => a.status === "Late").length;
    const absent = empAttendance.filter((a) => a.status === "Absent").length;
    const halfDay = empAttendance.filter((a) => a.status === "Half Day").length;
    const onLeave = empAttendance.filter((a) => a.status === "On Leave").length;
    const countable = empAttendance.filter((a) => a.status !== "Week Off" && a.status !== "Holiday").length;
    const rate = countable > 0 ? ((present / countable) * 100).toFixed(1) : "0.0";
    return { total, present, late, absent, halfDay, onLeave, rate };
  }, [empAttendance]);

  function startEditToday() {
    setInTime(todayRecord?.checkIn || "09:00");
    setOutTime(todayRecord?.checkOut || "18:00");
    setStatusVal(todayRecord?.status || "Present");
    setRemarksVal(todayRecord?.remarks || "");
    setEditingToday(true);
  }

  async function handleSaveTodayOverride() {
    if (!employee) return;
    setSaving(true);
    const hrs = calculateWorkingHours(inTime || null, outTime || null);
    try {
      if (todayRecord) {
        await attendanceService.updateAttendance(todayRecord.id, {
          checkIn: inTime || null,
          checkOut: outTime || null,
          status: statusVal,
          remarks: remarksVal,
          workingHours: hrs,
        });
      } else {
        await attendanceService.createAttendance({
          employeeId: employee.id,
          date: today,
          checkIn: inTime || null,
          checkOut: outTime || null,
          status: statusVal,
          remarks: remarksVal,
        });
      }

      await activityService.logActivity(
        user!.id,
        user!.name,
        "Attendance Override",
        `${user!.name} updated today's check-in/out for ${employee.fullName}`,
        employee.id
      );

      toast.success("Attendance updated for today");
      setEditingToday(false);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return null;

  const initials = employee.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal open={open} onClose={onClose} title="Employee Attendee Profile" size="xl">
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gradient-to-r from-primary-50/50 via-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-md shadow-primary-500/20">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{employee.fullName}</h3>
                <span className="rounded-md bg-gray-200/70 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                  {employee.employeeId}
                </span>
                <Badge tone={employee.employmentStatus === "Active" ? "green" : "amber"}>
                  {employee.employmentStatus}
                </Badge>
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-300 sm:text-sm">
                {employee.designation} • {dept?.name || "General"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {employee.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {employee.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> Joined {formatDate(employee.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              Attendance Score
            </span>
            <div className="flex items-center gap-1.5 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              <Award size={20} />
              {stats.rate}%
            </div>
          </div>
        </div>

        {/* Today's Check-In / Check-Out Status Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-850">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary-600 dark:text-primary-400" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Today's Check-in &amp; Check-out Details ({formatDate(today)})
              </h4>
            </div>
            {canEdit && !editingToday && (
              <button
                onClick={startEditToday}
                className="btn-ghost !px-2.5 !py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40"
              >
                <Pencil size={13} /> Quick Override
              </button>
            )}
          </div>

          {!editingToday ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
                <span className="text-xs text-gray-500 dark:text-slate-400">Check-In Time</span>
                <p className="mt-1 font-mono text-base font-bold text-gray-900 dark:text-white">
                  {todayRecord?.checkIn || "Not Checked In"}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
                <span className="text-xs text-gray-500 dark:text-slate-400">Check-Out Time</span>
                <p className="mt-1 font-mono text-base font-bold text-gray-900 dark:text-white">
                  {todayRecord?.checkOut || (todayRecord?.checkIn ? "In Office" : "—")}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
                <span className="text-xs text-gray-500 dark:text-slate-400">Duration / Hours</span>
                <p className="mt-1 font-mono text-base font-bold text-primary-600 dark:text-primary-400">
                  {todayRecord?.workingHours || (todayRecord?.checkIn ? "Calculating..." : "—")}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-800/60">
                <span className="text-xs text-gray-500 dark:text-slate-400">Current Status</span>
                <div className="mt-1">
                  <Badge>{todayRecord?.status || "Absent"}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-primary-100 bg-primary-50/40 p-3.5 dark:border-primary-900/40 dark:bg-primary-950/20">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label text-xs">Status</label>
                  <select
                    className="input text-xs"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value as AttendanceStatus)}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Check-In</label>
                  <input
                    type="time"
                    className="input text-xs font-mono"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Check-Out</label>
                  <input
                    type="time"
                    className="input text-xs font-mono"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs">Remarks / Location</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Approved manual attendance"
                  value={remarksVal}
                  onChange={(e) => setRemarksVal(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn-secondary !py-1 !px-3 text-xs"
                  onClick={() => setEditingToday(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary !py-1 !px-3 text-xs"
                  disabled={saving}
                  onClick={handleSaveTodayOverride}
                >
                  {saving ? "Saving..." : "Save Today's Record"}
                </button>
              </div>
            </div>
          )}

          {todayRecord?.remarks && (
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 italic">
              Note: {todayRecord.remarks}
            </p>
          )}
        </div>

        {/* Attendance Summary Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="card p-3 text-center">
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Total Present</p>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.present}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Late Arrivals</p>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">{stats.late}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Half Days</p>
            <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">{stats.halfDay}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Absences</p>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Leaves Taken</p>
            <p className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">{stats.onLeave}</p>
          </div>
        </div>

        {/* Recent Attendance Logs Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-500 dark:text-slate-400" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recent Attendance Logs</h4>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 font-semibold text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Check-In</th>
                    <th className="px-3.5 py-2.5">Check-Out</th>
                    <th className="px-3.5 py-2.5">Working Hours</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800/80 dark:bg-slate-900">
                  {empAttendance.slice(0, 8).map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-3.5 py-2 font-medium text-gray-900 dark:text-white">
                        {formatDate(a.date)}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-gray-600 dark:text-slate-300">{a.checkIn || "—"}</td>
                      <td className="px-3.5 py-2 font-mono text-gray-600 dark:text-slate-300">{a.checkOut || "—"}</td>
                      <td className="px-3.5 py-2 font-mono text-primary-600 dark:text-primary-400">
                        {a.workingHours || "—"}
                      </td>
                      <td className="px-3.5 py-2">
                        <Badge>{a.status}</Badge>
                      </td>
                      <td className="px-3.5 py-2 text-gray-500 dark:text-slate-400 truncate max-w-[150px]">
                        {a.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
