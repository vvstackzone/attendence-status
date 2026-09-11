import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { LogIn, LogOut, Clock, CheckCircle2, AlertCircle, Sparkles, MapPin, Coffee } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLookups } from "../../hooks/useLookups";
import * as attendanceService from "../../services/attendanceService";
import * as activityService from "../../services/activityService";
import type { Attendance, AttendanceStatus } from "../../types";
import { todayISO, formatDate, calculateWorkingHours } from "../../utils/dateUtils";

interface CheckInOutCardProps {
  onAttendanceUpdated?: () => void;
  compact?: boolean;
}

export default function CheckInOutCard({ onAttendanceUpdated, compact = false }: CheckInOutCardProps) {
  const { user } = useAuth();
  const { employees } = useLookups();
  const today = todayISO();

  // Find effective employee ID
  const effectiveEmployee = useMemo(() => {
    if (!user) return null;
    if (user.employeeId) {
      return employees.find((e) => e.id === user.employeeId) || null;
    }
    // Fallback match by email or first employee if admin test
    return employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) || null;
  }, [user, employees]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [fetchingRecord, setFetchingRecord] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Keep digital clock live
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance for the logged in user
  useEffect(() => {
    async function fetchToday() {
      if (!effectiveEmployee) {
        setFetchingRecord(false);
        return;
      }
      try {
        setFetchingRecord(true);
        const all = await attendanceService.getAttendance();
        const found = all.find((a) => a.employeeId === effectiveEmployee.id && a.date === today);
        setTodayRecord(found || null);
        if (found?.remarks) setRemarks(found.remarks);
      } catch (e) {
        console.error("Failed to load today's attendance", e);
      } finally {
        setFetchingRecord(false);
      }
    }
    fetchToday();
  }, [effectiveEmployee, today]);

  // Live elapsed working duration if checked in but not checked out
  const liveDuration = useMemo(() => {
    if (!todayRecord?.checkIn || todayRecord.checkOut) return null;
    const [h, m] = todayRecord.checkIn.split(":").map(Number);
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    const nowS = currentTime.getSeconds();
    
    let totalSec = (nowH * 3600 + nowM * 60 + nowS) - (h * 3600 + m * 60);
    if (totalSec < 0) totalSec = 0;
    
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }, [todayRecord, currentTime]);

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = !!todayRecord?.checkIn && !!todayRecord?.checkOut;
  const isOnLeave = todayRecord?.status === "On Leave";

  async function handleCheckIn() {
    if (!effectiveEmployee) {
      toast.error("No employee profile linked to current account for self check-in.");
      return;
    }
    setLoading(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    
    // Status detection: After 9:30 AM counts as Late
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status: AttendanceStatus = isLate ? "Late" : "Present";
    const noteText = remarks.trim() || (isLate ? "Arrived after 9:30 AM" : "Self check-in");

    try {
      if (todayRecord) {
        // Update existing record
        const updated = await attendanceService.updateAttendance(todayRecord.id, {
          checkIn: timeStr,
          status,
          remarks: noteText,
        });
        setTodayRecord(updated);
      } else {
        // Create new attendance record
        const created = await attendanceService.createAttendance({
          employeeId: effectiveEmployee.id,
          date: today,
          checkIn: timeStr,
          checkOut: null,
          status,
          remarks: noteText,
        });
        setTodayRecord(created);
      }

      await activityService.logActivity(
        user!.id,
        user!.name,
        "Checked In",
        `${user!.name} checked in at ${timeStr} (${status})`,
        effectiveEmployee.id
      );

      toast.success(`Checked in successfully at ${timeStr}! Have a great day.`);
      onAttendanceUpdated?.();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayRecord || !effectiveEmployee) return;
    setLoading(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const workingHours = calculateWorkingHours(todayRecord.checkIn, timeStr);

    try {
      const updated = await attendanceService.updateAttendance(todayRecord.id, {
        checkOut: timeStr,
        workingHours,
        remarks: remarks.trim() || todayRecord.remarks || "Self check-out",
      });
      setTodayRecord(updated);

      await activityService.logActivity(
        user!.id,
        user!.name,
        "Checked Out",
        `${user!.name} checked out at ${timeStr} (Total: ${workingHours || "N/A"})`,
        todayRecord.id
      );

      toast.success(`Checked out successfully at ${timeStr}! Total work time: ${workingHours || "N/A"}`);
      onAttendanceUpdated?.();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to check out");
    } finally {
      setLoading(false);
    }
  }

  const timeFormatted = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (compact) {
    return (
      <div className="card flex items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <Clock size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-gray-900 dark:text-white">{timeFormatted}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isCheckedIn 
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : isCheckedOut
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  : isOnLeave
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {isCheckedIn ? "Checked In" : isCheckedOut ? "Checked Out" : isOnLeave ? "On Leave" : "Not Marked"}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {todayRecord?.checkIn ? `In: ${todayRecord.checkIn}` : "No check-in yet"} 
              {todayRecord?.checkOut ? ` • Out: ${todayRecord.checkOut}` : liveDuration ? ` • Elapsed: ${liveDuration}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCheckedIn && !isCheckedOut && !isOnLeave && (
            <button
              onClick={handleCheckIn}
              disabled={loading || fetchingRecord}
              className="btn-primary !px-3.5 !py-2 text-xs font-semibold shadow-md sm:text-sm"
            >
              <LogIn size={15} />
              Check In
            </button>
          )}
          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="btn !border !border-amber-500/30 bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 !px-3.5 !py-2 text-xs font-semibold shadow-md dark:bg-amber-600 dark:hover:bg-amber-500 sm:text-sm"
            >
              <LogOut size={15} />
              Check Out
            </button>
          )}
          {isCheckedOut && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Completed
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6 transition-all duration-200 hover:shadow-md">
      {/* Decorative gradient background glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/15" />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left column: Live Clock & Today Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Live Attendance Terminal
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {timeFormatted}
            </h2>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {formatDate(today)}
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin size={13} className="text-primary-500" />
            {effectiveEmployee ? `${effectiveEmployee.fullName} (${effectiveEmployee.employeeId})` : user?.name}
          </p>
        </div>

        {/* Right column: Status & Actions */}
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                isCheckedIn
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/40"
                  : isCheckedOut
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800/40"
                  : isOnLeave
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {isCheckedIn ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Checked In (Working)
                </>
              ) : isCheckedOut ? (
                <>
                  <CheckCircle2 size={13} />
                  Day Completed
                </>
              ) : isOnLeave ? (
                <>
                  <Coffee size={13} />
                  On Leave
                </>
              ) : (
                <>
                  <AlertCircle size={13} />
                  Not Checked In
                </>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isCheckedIn && !isCheckedOut && !isOnLeave && (
              <button
                onClick={handleCheckIn}
                disabled={loading || fetchingRecord}
                className="btn-primary flex-1 sm:flex-none shadow-md shadow-primary-500/20 hover:shadow-lg !px-6 !py-2.5 font-semibold text-sm"
              >
                <LogIn size={18} />
                {loading ? "Recording..." : "Check In Now"}
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="btn flex-1 sm:flex-none !border !border-amber-500/40 bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-md shadow-amber-500/20 !px-6 !py-2.5 font-semibold text-sm dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <LogOut size={18} />
                {loading ? "Saving..." : "Check Out Now"}
              </button>
            )}

            {isCheckedOut && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
                <CheckCircle2 size={16} />
                Checked out for today • {todayRecord?.workingHours || "Done"}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="btn-ghost !px-2.5 !py-2 text-xs"
              title="Add remark/note"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Check In / Out Stats strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-slate-800/80 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-50/80 p-2.5 dark:bg-slate-800/50">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Check-In Time</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">
            {todayRecord?.checkIn || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50/80 p-2.5 dark:bg-slate-800/50">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Check-Out Time</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">
            {todayRecord?.checkOut || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50/80 p-2.5 dark:bg-slate-800/50">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Total Hours</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
            {todayRecord?.workingHours || (liveDuration ? "In Progress" : "—")}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50/80 p-2.5 dark:bg-slate-800/50">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">Live Timer</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {liveDuration || (todayRecord?.checkOut ? "Shift ended" : "Not started")}
          </p>
        </div>
      </div>

      {/* Optional Note input */}
      {showNotes && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-850">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-slate-300">
            Attendance Notes / Work Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input !py-1.5 text-xs"
              placeholder="e.g. Working from Client site / Arrived after dentist appointment"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            {todayRecord && (
              <button
                type="button"
                onClick={async () => {
                  if (!todayRecord) return;
                  try {
                    await attendanceService.updateAttendance(todayRecord.id, { remarks });
                    toast.success("Notes saved");
                  } catch (e: any) {
                    toast.error("Failed to save note");
                  }
                }}
                className="btn-secondary !px-3 !py-1.5 text-xs whitespace-nowrap"
              >
                Save Note
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
