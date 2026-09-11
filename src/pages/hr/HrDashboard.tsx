import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Percent,
  CalendarClock,
  FileSpreadsheet,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { LoadingState, ErrorState } from "../../components/common/States";
import CheckInOutCard from "../../components/attendance/CheckInOutCard";
import LiveAttendeesTracker from "../../components/attendance/LiveAttendeesTracker";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import * as attendanceService from "../../services/attendanceService";
import * as leaveService from "../../services/leaveService";
import { todayISO, formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../hooks/useAuth";

export default function HrDashboard() {
  const { user } = useAuth();
  const { employees, departments, loading: lookupsLoading, error: lookupsError } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const today = todayISO();

  const stats = useMemo(() => {
    const todayRecords = (attendanceQ.data || []).filter((a) => a.date === today);
    const present = todayRecords.filter((a) => a.status === "Present" || a.status === "Late").length;
    const late = todayRecords.filter((a) => a.status === "Late").length;
    const absent = todayRecords.filter((a) => a.status === "Absent").length;
    const onLeave = todayRecords.filter((a) => a.status === "On Leave").length;
    const countable = todayRecords.filter((a) => a.status !== "Week Off" && a.status !== "Holiday").length;
    const attendancePct = countable > 0 ? ((present / countable) * 100).toFixed(1) : "0.0";
    const pending = (requestsQ.data || []).filter((r) => r.status === "Pending").length;
    const approved = (requestsQ.data || []).filter((r) => r.status === "Approved").length;
    const rejected = (requestsQ.data || []).filter((r) => r.status === "Rejected").length;
    return { present, late, absent, onLeave, attendancePct, pending, approved, rejected };
  }, [attendanceQ.data, requestsQ.data, today]);

  const loading = lookupsLoading || attendanceQ.loading || requestsQ.loading;
  const error = lookupsError || attendanceQ.error || requestsQ.error;

  function handleRefresh() {
    attendanceQ.refetch();
    requestsQ.refetch();
  }

  if (loading) return <LoadingState label="Loading HR management portal..." />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`HR Portal • ${user?.name || "HR Manager"}`}
        subtitle={`Employee attendance & leave operations for ${formatDate(today)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/hr/leaves" className="btn-secondary text-xs">
              <CalendarClock size={14} /> Review Leaves ({stats.pending})
            </Link>
            <Link to="/hr/reports" className="btn-primary text-xs">
              <FileSpreadsheet size={14} /> HR Reports
            </Link>
          </div>
        }
      />

      {/* HR Self Check-In / Check-Out Widget */}
      <CheckInOutCard onAttendanceUpdated={handleRefresh} />

      {/* HR KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Employees" value={employees.length} icon={Users} tone="primary" />
        <StatCard label="Present / Checked In Today" value={stats.present} icon={CalendarCheck} tone="green" />
        <StatCard label="Pending Leave Requests" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Late Arrivals Today" value={stats.late} icon={Clock} tone="amber" />
        <StatCard label="Approved Leaves" value={stats.approved} icon={CheckCircle2} tone="green" />
        <StatCard label="Attendance Percentage" value={stats.attendancePct} suffix="%" icon={Percent} tone="purple" />
      </div>

      {/* HR Live Attendees Feed & Management */}
      <LiveAttendeesTracker
        employees={employees}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        scope="all"
        canEdit={true}
        onRefresh={handleRefresh}
        title="Live Employee Check-In & Check-Out Tracker (HR Feed)"
      />
    </div>
  );
}
