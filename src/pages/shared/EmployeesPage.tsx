import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import EmployeeAttendeeModal from "../../components/attendance/EmployeeAttendeeModal";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import * as employeeService from "../../services/employeeService";
import * as attendanceService from "../../services/attendanceService";
import * as activityService from "../../services/activityService";
import type { Employee, EmploymentStatus } from "../../types";
import { formatDate } from "../../utils/dateUtils";
import EmployeeForm, { type EmployeeFormValues } from "../../components/forms/EmployeeForm";

const STATUS_OPTIONS: EmploymentStatus[] = ["Active", "Inactive", "On Notice", "Resigned"];

export default function EmployeesPage({ canDelete }: { canDelete: boolean }) {
  const { user } = useAuth();
  const { employees, departments, departmentMap, loading, error, refetchAll } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("name-asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [viewingAttendee, setViewingAttendee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = employees.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q);
      const matchesDept = !deptFilter || e.departmentId === deptFilter;
      const matchesStatus = !statusFilter || e.employmentStatus === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.fullName.localeCompare(a.fullName);
        case "newest":
          return b.joiningDate.localeCompare(a.joiningDate);
        case "oldest":
          return a.joiningDate.localeCompare(b.joiningDate);
        default:
          return a.fullName.localeCompare(b.fullName);
      }
    });
    return list;
  }, [employees, search, deptFilter, statusFilter, sort]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    setFormOpen(true);
  }

  async function handleSave(values: EmployeeFormValues) {
    setSaving(true);
    try {
      if (editing) {
        await employeeService.updateEmployee(editing.id, values);
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Employee Updated",
          `${user!.name} updated employee record for ${values.fullName}`,
          editing.id
        );
        toast.success("Employee updated successfully");
      } else {
        const created = await employeeService.createEmployee({
          ...values,
          leaveBalance: [],
          createdDate: new Date().toISOString().slice(0, 10),
        });
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Employee Created",
          `${user!.name} created a new employee ${values.fullName}`,
          created.id
        );
        toast.success("Employee created successfully");
      }
      setFormOpen(false);
      refetchAll();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await employeeService.deleteEmployee(deleting.id);
      await activityService.logActivity(
        user!.id,
        user!.name,
        "Employee Deleted",
        `${user!.name} deleted employee ${deleting.fullName}`,
        deleting.id
      );
      toast.success("Employee deleted successfully");
      setDeleting(null);
      refetchAll();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to delete employee");
    }
  }

  const columns: Column<Employee>[] = [
    {
      header: "Employee",
      accessor: (e) => (
        <div
          className="cursor-pointer group"
          onClick={() => setViewingAttendee(e)}
        >
          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {e.fullName}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-400">{e.employeeId}</p>
        </div>
      ),
    },
    { header: "Email", accessor: (e) => <span className="text-gray-600 dark:text-slate-300">{e.email}</span> },
    { header: "Department", accessor: (e) => <span className="text-gray-700 dark:text-slate-300">{departmentMap.get(e.departmentId)?.name || "—"}</span> },
    { header: "Designation", accessor: (e) => <span className="text-gray-700 dark:text-slate-300">{e.designation}</span> },
    { header: "Joined", accessor: (e) => <span className="text-gray-600 dark:text-slate-400">{formatDate(e.joiningDate)}</span> },
    { header: "Status", accessor: (e) => <Badge>{e.employmentStatus}</Badge> },
    {
      header: "Actions",
      className: "text-right",
      accessor: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            className="btn-ghost !px-2 !py-1 text-xs"
            title="View Attendee Profile"
            onClick={() => setViewingAttendee(e)}
          >
            <Eye size={15} />
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-xs text-primary-600 dark:text-primary-400"
            title="Edit"
            onClick={() => openEdit(e)}
          >
            <Pencil size={15} />
          </button>
          {canDelete && (
            <button
              className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete"
              onClick={() => setDeleting(e)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employees Directory"
        subtitle={`${filtered.length} of ${employees.length} active employee profiles`}
        actions={
          <button className="btn-primary text-xs" onClick={openCreate}>
            <Plus size={15} /> Add Employee
          </button>
        }
      />

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID or email..." />
        </div>
        <select className="input sm:w-48 text-xs" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="input sm:w-40 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input sm:w-44 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="card p-2">
        {loading ? (
          <LoadingState label="Loading employees..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetchAll} />
        ) : (
          <DataTable columns={columns} rows={filtered} keyFn={(e) => e.id} />
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Employee" : "Add Employee"}
        size="lg"
      >
        <EmployeeForm
          initial={editing}
          departments={departments}
          managers={employees.filter((e) => e.id !== editing?.id)}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSave}
          saving={saving}
        />
      </Modal>

      {/* Comprehensive Attendee Profile Modal */}
      <EmployeeAttendeeModal
        open={!!viewingAttendee}
        onClose={() => setViewingAttendee(null)}
        employee={viewingAttendee}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        canEdit={true}
        onRefresh={attendanceQ.refetch}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleting?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
