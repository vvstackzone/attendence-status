import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import { useLookups } from "../../hooks/useLookups";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/dateUtils";

export default function ProfilePage() {
  const { user } = useAuth();
  const { employees, departmentMap, leaveTypeMap, loading, error, refetchAll } = useLookups();

  const employee = employees.find((e) => e.id === user?.employeeId);
  const manager = employees.find((e) => e.id === employee?.managerId);

  if (loading) return <LoadingState label="Loading your profile..." />;
  if (error) return <ErrorState message={error} onRetry={refetchAll} />;
  if (!employee) return <ErrorState message="We couldn't find an employee profile linked to your account." />;

  const initials = employee.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <PageHeader title="My Profile" subtitle="Your personal, employment and attendance credentials" />

      <div className="card p-6">
        <div className="flex flex-col items-start gap-4 border-b border-gray-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-xl font-bold text-white shadow-md shadow-primary-500/20">
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{employee.fullName}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              {employee.designation} · {departmentMap.get(employee.departmentId)?.name || "General"}
            </p>
            <div className="mt-1.5">
              <Badge>{employee.employmentStatus}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 pt-6 sm:grid-cols-2">
          <Field label="Employee ID" value={employee.employeeId} />
          <Field label="Email Address" value={employee.email} />
          <Field label="Phone Number" value={employee.phone} />
          <Field label="Department" value={departmentMap.get(employee.departmentId)?.name || "—"} />
          <Field label="Designation" value={employee.designation} />
          <Field label="Reporting Manager" value={manager?.fullName || "—"} />
          <Field label="Date of Joining" value={formatDate(employee.joiningDate)} />
          <Field label="Employment Status" value={employee.employmentStatus} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Leave Balance Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {employee.leaveBalance.map((b) => {
            const lt = leaveTypeMap.get(b.leaveTypeId);
            const remaining = b.allocated - b.used;
            return (
              <div key={b.leaveTypeId} className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{lt?.name || "Leave"}</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">{remaining}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500">of {b.allocated} remaining</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
