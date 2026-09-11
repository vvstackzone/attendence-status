import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Wallet, Clock, CheckCircle2, XCircle, PlusCircle, ArrowRight } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import CheckInOutCard from "../../components/attendance/CheckInOutCard";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import * as attendanceService from "../../services/attendanceService";
import * as leaveService from "../../services/leaveService";
import { todayISO, formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { employees, leaveTypeMap, loading: lookupsLoading, error: lookupsError } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const today = todayISO();
  const employee = employees.find((e) => e.id === user?.employeeId);

  const myAttendance = useMemo(
    () => (attendanceQ.data || []).filter((a) => a.employeeId === user?.employeeId),
    [attendanceQ.data, user]
  );
  const myRequests = useMemo(
    () => (requestsQ.data || []).filter((r) => r.employeeId === user?.employeeId),
    [requestsQ.data, user]
  );

  const todayRecord = myAttendance.find((a) => a.date === today);
  const todayStatus = todayRecord?.status || (todayRecord?.checkIn ? "Present" : "Not Marked");
  const pending = myRequests.filter((r) => r.status === "Pending").length;
  const approved = myRequests.filter((r) => r.status === "Approved").length;
  const rejected = myRequests.filter((r) => r.status === "Rejected").length;

  const totalRemaining = useMemo(() => {
    if (!employee) return 0;
    return employee.leaveBalance.reduce((sum, b) => sum + (b.allocated - b.used), 0);
  }, [employee]);

  const recentAttendance = [...myAttendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const loading = lookupsLoading || attendanceQ.loading || requestsQ.loading;
  const error = lookupsError || attendanceQ.error || requestsQ.error;

  function handleRefresh() {
    attendanceQ.refetch();
    requestsQ.refetch();
  }

  if (loading) return <LoadingState label="Loading your workspace..." />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Employee"}`}
        subtitle={formatDate(today)}
        actions={
          <Link to="/employee/leaves" className="btn-primary text-xs">
            <PlusCircle size={14} /> Apply for Leave
          </Link>
        }
      />

      {/* Interactive Check-In / Check-Out Card */}
      <CheckInOutCard onAttendanceUpdated={handleRefresh} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Attendance" value={todayStatus} icon={CalendarCheck} tone="primary" />
        <StatCard label="Available Leave Days" value={totalRemaining} icon={Wallet} tone="purple" suffix="days" />
        <StatCard label="Pending Requests" value={pending} icon={Clock} tone="amber" />
        <StatCard label="Approved Leaves" value={approved} icon={CheckCircle2} tone="green" />
      </div>

      {/* Attendance & Leave Balance row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Attendance */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Attendance Records</h3>
            <Link
              to="/employee/attendance"
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Full History <ArrowRight size={13} />
            </Link>
          </div>

          {recentAttendance.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 py-6 text-center">No attendance records found yet.</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">
                      {formatDate(a.date)}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                      {a.checkIn && a.checkOut
                        ? `${a.checkIn} - ${a.checkOut} (${a.workingHours || "Complete"})`
                        : a.checkIn
                        ? `Checked In at ${a.checkIn}`
                        : a.remarks || "No time logged"}
                    </p>
                  </div>
                  <Badge>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Balance breakdown */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Leave Balances</h3>
          <div className="space-y-3.5">
            {(employee?.leaveBalance || []).map((b) => {
              const lt = leaveTypeMap.get(b.leaveTypeId);
              const remaining = b.allocated - b.used;
              const pct = b.allocated > 0 ? Math.min(100, (b.used / b.allocated) * 100) : 0;
              return (
                <div key={b.leaveTypeId}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">{lt?.name || "—"}</span>
                    <span className="font-medium text-gray-500 dark:text-slate-400">
                      {remaining} of {b.allocated} left
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {rejected > 0 && (
            <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <XCircle size={14} /> {rejected} rejected request(s) on file
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
