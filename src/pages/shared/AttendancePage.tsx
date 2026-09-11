import { useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Eye, Download } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import { TextField, SelectField, TextAreaField } from "../../components/forms/FormField";
import CheckInOutCard from "../../components/attendance/CheckInOutCard";
import EmployeeAttendeeModal from "../../components/attendance/EmployeeAttendeeModal";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import * as attendanceService from "../../services/attendanceService";
import * as activityService from "../../services/activityService";
import type { Attendance, AttendanceStatus, Employee } from "../../types";
import { formatDate, todayISO } from "../../utils/dateUtils";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "On Leave",
  "Holiday",
  "Week Off",
];

interface AttendanceFormValues {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  remarks: string;
}

export default function AttendancePage({ scope }: { scope: "all" | "team" | "self" }) {
  const { user } = useAuth();
  const { employees, departments, loading: lookupsLoading, error: lookupsError } = useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [deleting, setDeleting] = useState<Attendance | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Employee | null>(null);
  const [values, setValues] = useState<AttendanceFormValues>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function emptyForm(): AttendanceFormValues {
    return { employeeId: "", date: todayISO(), checkIn: "", checkOut: "", status: "Present", remarks: "" };
  }

  const canEdit = scope === "all";

  const visibleEmployees = useMemo(() => {
    if (scope === "team") return employees.filter((e) => e.managerId === user?.employeeId);
    if (scope === "self") return employees.filter((e) => e.id === user?.employeeId);
    return employees;
  }, [employees, scope, user]);

  const visibleEmployeeIds = useMemo(() => new Set(visibleEmployees.map((e) => e.id)), [visibleEmployees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (attendanceQ.data || [])
      .filter((a) => visibleEmployeeIds.has(a.employeeId))
      .filter((a) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        const matchesSearch = !q || emp?.fullName.toLowerCase().includes(q) || emp?.employeeId.toLowerCase().includes(q);
        const matchesDate = !dateFilter || a.date === dateFilter;
        const matchesDept = !deptFilter || emp?.departmentId === deptFilter;
        const matchesStatus = !statusFilter || a.status === statusFilter;
        const matchesEmp = !empFilter || a.employeeId === empFilter;
        return matchesSearch && matchesDate && matchesDept && matchesStatus && matchesEmp;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceQ.data, visibleEmployeeIds, employees, search, dateFilter, deptFilter, statusFilter, empFilter]);

  function openCreate() {
    setEditing(null);
    setValues(emptyForm());
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(att: Attendance) {
    setEditing(att);
    setValues({
      employeeId: att.employeeId,
      date: att.date,
      checkIn: att.checkIn || "",
      checkOut: att.checkOut || "",
      status: att.status,
      remarks: att.remarks || "",
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.employeeId) next.employeeId = "Employee is required";
    if (!values.date) next.date = "Date is required";
    else if (values.date > todayISO()) next.date = "Date cannot be in the future";
    if (values.status === "Present" || values.status === "Late" || values.status === "Half Day") {
      if (!values.checkIn) next.checkIn = "Check-in time is required for this status";
      if (!values.checkOut) next.checkOut = "Check-out time is required for this status";
      if (values.checkIn && values.checkOut && values.checkOut <= values.checkIn) {
        next.checkOut = "Check-out must be after check-in";
      }
    }
    const duplicate = (attendanceQ.data || []).some(
      (a) => a.id !== editing?.id && a.employeeId === values.employeeId && a.date === values.date
    );
    if (duplicate) next.date = "An attendance record already exists for this employee on this date";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const emp = employees.find((x) => x.id === values.employeeId);
    const payload = {
      employeeId: values.employeeId,
      date: values.date,
      checkIn: values.checkIn || null,
      checkOut: values.checkOut || null,
      status: values.status,
      remarks: values.remarks,
    };
    try {
      if (editing) {
        await attendanceService.updateAttendance(editing.id, payload);
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Attendance Updated",
          `${user!.name} corrected attendance for ${emp?.fullName} on ${formatDate(values.date)}`,
          editing.id
        );
        toast.success("Attendance updated successfully");
      } else {
        const created = await attendanceService.createAttendance(payload);
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Attendance Added",
          `${user!.name} added attendance for ${emp?.fullName} on ${formatDate(values.date)}`,
          created.id
        );
        toast.success("Attendance added successfully");
      }
      setFormOpen(false);
      attendanceQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await attendanceService.deleteAttendance(deleting.id);
      toast.success("Attendance record deleted");
      setDeleting(null);
      attendanceQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to delete record");
    }
  }

  function exportCSV() {
    const headers = ["Date", "Employee ID", "Employee Name", "Check-In", "Check-Out", "Work Hours", "Status", "Remarks"];
    const rows = filtered.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      return [
        `"${a.date}"`,
        `"${emp?.employeeId || ""}"`,
        `"${emp?.fullName || ""}"`,
        `"${a.checkIn || ""}"`,
        `"${a.checkOut || ""}"`,
        `"${a.workingHours || ""}"`,
        `"${a.status}"`,
        `"${(a.remarks || "").replace(/"/g, '""')}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Records_${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const columns: Column<Attendance>[] = [
    {
      header: "Employee",
      accessor: (a) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        return (
          <div
            className="cursor-pointer group"
            onClick={() => emp && setSelectedAttendee(emp)}
          >
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {emp?.fullName || "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-400">{emp?.employeeId}</p>
          </div>
        );
      },
    },
    { header: "Date", accessor: (a) => <span className="font-medium text-gray-800 dark:text-slate-200">{formatDate(a.date)}</span> },
    { header: "Check-In", accessor: (a) => <span className="font-mono text-emerald-600 dark:text-emerald-400">{a.checkIn || "—"}</span> },
    { header: "Check-Out", accessor: (a) => <span className="font-mono text-blue-600 dark:text-blue-400">{a.checkOut || "—"}</span> },
    { header: "Working Hours", accessor: (a) => <span className="font-mono text-gray-700 dark:text-slate-300">{a.workingHours || "—"}</span> },
    { header: "Status", accessor: (a) => <Badge>{a.status}</Badge> },
    { header: "Remarks", accessor: (a) => <span className="text-gray-500 dark:text-slate-400 truncate max-w-[150px] inline-block">{a.remarks || "—"}</span> },
    {
      header: "Actions",
      className: "text-right",
      accessor: (a: Attendance) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        return (
          <div className="flex items-center justify-end gap-1">
            {emp && (
              <button
                className="btn-ghost !px-2 !py-1 text-xs"
                title="View Attendee Profile"
                onClick={() => setSelectedAttendee(emp)}
              >
                <Eye size={14} />
              </button>
            )}
            {canEdit && (
              <>
                <button className="btn-ghost !px-2 !py-1 text-xs text-primary-600 dark:text-primary-400" title="Edit" onClick={() => openEdit(a)}>
                  <Pencil size={14} />
                </button>
                <button
                  className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete"
                  onClick={() => setDeleting(a)}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const loading = lookupsLoading || attendanceQ.loading;
  const error = lookupsError || attendanceQ.error;

  return (
    <div className="space-y-4">
      <PageHeader
        title={scope === "all" ? "Attendance Directory" : scope === "team" ? "Team Attendance" : "My Attendance"}
        subtitle={`${filtered.length} total attendance logs recorded`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="btn-secondary text-xs">
              <Download size={14} /> Export CSV
            </button>
            {canEdit && (
              <button className="btn-primary text-xs" onClick={openCreate}>
                <Plus size={14} /> Add Attendance Log
              </button>
            )}
          </div>
        }
      />

      {/* Check In / Out Card if Employee or Self view */}
      {scope === "self" && (
        <CheckInOutCard onAttendanceUpdated={attendanceQ.refetch} />
      )}

      {/* Filter Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        {scope !== "self" && (
          <div className="sm:w-56">
            <SearchInput value={search} onChange={setSearch} placeholder="Search employee..." />
          </div>
        )}
        <input
          type="date"
          className="input sm:w-44 text-xs"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {scope === "all" && (
          <select className="input sm:w-48 text-xs" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        {scope === "team" && (
          <select className="input sm:w-48 text-xs" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
            <option value="">All Team Members</option>
            {visibleEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        )}
        <select className="input sm:w-40 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(search || dateFilter || deptFilter || statusFilter || empFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setDeptFilter("");
              setStatusFilter("");
              setEmpFilter("");
            }}
            className="btn-ghost !py-1 text-xs text-primary-600 dark:text-primary-400"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="card p-2">
        {loading ? (
          <LoadingState label="Loading attendance directory..." />
        ) : error ? (
          <ErrorState message={error} onRetry={attendanceQ.refetch} />
        ) : (
          <DataTable columns={columns} rows={filtered} keyFn={(a) => a.id} />
        )}
      </div>

      {/* Edit/Create Modal */}
      {canEdit && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? "Edit Attendance Record" : "Add Attendance Log"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <SelectField
              label="Employee"
              required
              placeholder="Select employee"
              options={employees.map((e: Employee) => ({ label: `${e.fullName} (${e.employeeId})`, value: e.id }))}
              value={values.employeeId}
              onChange={(e) => setValues((v) => ({ ...v, employeeId: e.target.value }))}
              error={errors.employeeId}
              disabled={!!editing}
            />
            <TextField
              label="Date"
              type="date"
              required
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
              error={errors.date}
              disabled={!!editing}
            />
            <SelectField
              label="Status"
              required
              options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as AttendanceStatus }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Check-In"
                type="time"
                value={values.checkIn}
                onChange={(e) => setValues((v) => ({ ...v, checkIn: e.target.value }))}
                error={errors.checkIn}
              />
              <TextField
                label="Check-Out"
                type="time"
                value={values.checkOut}
                onChange={(e) => setValues((v) => ({ ...v, checkOut: e.target.value }))}
                error={errors.checkOut}
              />
            </div>
            <TextAreaField
              label="Remarks / Location"
              value={values.remarks}
              onChange={(e) => setValues((v) => ({ ...v, remarks: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Follow Attendee Profile Modal */}
      <EmployeeAttendeeModal
        open={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        employee={selectedAttendee}
        departments={departments}
        allAttendance={attendanceQ.data || []}
        canEdit={canEdit}
        onRefresh={attendanceQ.refetch}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
