import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, CalendarClock, Clock } from "lucide-react";
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

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { employees, departments, loading: lookupsLoading, error: lookupsError } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const today = todayISO();
  const team = useMemo(() => employees.filter((e) => e.managerId === user?.employeeId), [employees, user]);
  const teamIds = useMemo(() => new Set(team.map((e) => e.id)), [team]);

  const stats = useMemo(() => {
    const todayRecords = (attendanceQ.data || []).filter((a) => a.date === today && teamIds.has(a.employeeId));
    const present = todayRecords.filter((a) => a.status === "Present" || a.status === "Late").length;
    const late = todayRecords.filter((a) => a.status === "Late").length;
    const absent = team.length - present - todayRecords.filter((a) => a.status === "On Leave").length;
    const onLeave = todayRecords.filter((a) => a.status === "On Leave").length;
    const pending = (requestsQ.data || []).filter((r) => r.status === "Pending" && teamIds.has(r.employeeId)).length;
    return { present, late, absent: Math.max(0, absent), onLeave, pending };
  }, [attendanceQ.data, requestsQ.data, team, teamIds, today]);

  const loading = lookupsLoading || attendanceQ.loading || requestsQ.loading;
  const error = lookupsError || attendanceQ.error || requestsQ.error;

  function handleRefresh() {
    attendanceQ.refetch();
    requestsQ.refetch();
  }

  if (loading) return <LoadingState label="Loading manager workspace..." />;
  if (error) return <ErrorState message={error} onRetry={handleRefresh} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Team Hub • ${user?.name || "Manager"}`}
        subtitle={`Today's team attendance & check-ins for ${formatDate(today)}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/manager/leaves" className="btn-primary text-xs">
              <CalendarClock size={14} /> Team Leave Requests ({stats.pending})
            </Link>
          </div>
        }
      />

      {/* Manager Self Check-In / Check-Out Widget */}
      <CheckInOutCard onAttendanceUpdated={handleRefresh} />

      {/* Team KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Direct Reports / Team Size" value={team.length} icon={Users} tone="primary" />
        <StatCard label="Present in Team Today" value={stats.present} icon={UserCheck} tone="green" />
        <StatCard label="Late Team Arrivals" value={stats.late} icon={Clock} tone="amber" />
        <StatCard label="Team Members on Leave" value={stats.onLeave} icon={CalendarClock} tone="purple" />
      </div>

      {/* Live Team Attendees Tracker */}
      <LiveAttendeesTracker
        employees={team}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        scope="team"
        canEdit={false}
        onRefresh={handleRefresh}
        title="My Team's Live Check-In & Check-Out Attendee List"
      />
    </div>
  );
}
