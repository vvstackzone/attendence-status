import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import EmployeeAttendeeModal from "../../components/attendance/EmployeeAttendeeModal";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import * as attendanceService from "../../services/attendanceService";
import type { Employee } from "../../types";
import { formatDate } from "../../utils/dateUtils";

export default function TeamPage() {
  const { user } = useAuth();
  const { employees, departments, departmentMap, loading, error, refetchAll } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const team = useMemo(() => employees.filter((e) => e.managerId === user?.employeeId), [employees, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return team.filter(
      (e) => !q || e.fullName.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q)
    );
  }, [team, search]);

  const columns: Column<Employee>[] = [
    {
      header: "Employee",
      accessor: (e) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{e.fullName}</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">{e.employeeId}</p>
        </div>
      ),
    },
    { header: "Designation", accessor: (e) => e.designation },
    { header: "Department", accessor: (e) => departmentMap.get(e.departmentId)?.name || "—" },
    { header: "Email", accessor: (e) => e.email },
    { header: "Phone", accessor: (e) => e.phone },
    { header: "Joined", accessor: (e) => formatDate(e.joiningDate) },
    { header: "Status", accessor: (e) => <Badge>{e.employmentStatus}</Badge> },
    {
      header: "Action",
      accessor: (e) => (
        <button
          onClick={() => setSelectedEmp(e)}
          className="btn-secondary !py-1 !px-2.5 text-xs font-semibold"
        >
          <Eye size={13} /> View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="My Team" subtitle={`${filtered.length} of ${team.length} team members`} />

      <div className="card p-3.5 sm:w-80">
        <SearchInput value={search} onChange={setSearch} placeholder="Search team member..." />
      </div>

      <div className="card p-2">
        {loading || attendanceQ.loading ? (
          <LoadingState label="Loading your team..." />
        ) : error || attendanceQ.error ? (
          <ErrorState message={error || attendanceQ.error || "Error"} onRetry={refetchAll} />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            keyFn={(e) => e.id}
            emptyMessage="No employees report to you yet."
          />
        )}
      </div>

      <EmployeeAttendeeModal
        open={!!selectedEmp}
        onClose={() => setSelectedEmp(null)}
        employee={selectedEmp}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        canEdit={false}
      />
    </div>
  );
}
