import { useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import { TextField, SelectField, TextAreaField } from "../../components/forms/FormField";
import { useLookups } from "../../hooks/useLookups";
import { useAuth } from "../../hooks/useAuth";
import * as departmentService from "../../services/departmentService";
import * as activityService from "../../services/activityService";
import type { Department } from "../../types";

interface DeptFormValues {
  name: string;
  headId: string;
  description: string;
  status: "Active" | "Inactive";
}

const EMPTY: DeptFormValues = { name: "", headId: "", description: "", status: "Active" };

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { departments, employees, loading, error, refetchAll } = useLookups();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [values, setValues] = useState<DeptFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return departments.filter((d) => !q || d.name.toLowerCase().includes(q));
  }, [departments, search]);

  function employeeCount(deptId: string) {
    return employees.filter((e) => e.departmentId === deptId).length;
  }

  function openCreate() {
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setValues({
      name: dept.name,
      headId: dept.headId || "",
      description: dept.description,
      status: dept.status,
    });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Department name is required";
    const duplicate = departments.some(
      (d) => d.id !== editing?.id && d.name.trim().toLowerCase() === values.name.trim().toLowerCase()
    );
    if (duplicate) next.name = "A department with this name already exists";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = { ...values, headId: values.headId || null };
    try {
      if (editing) {
        await departmentService.updateDepartment(editing.id, payload);
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Department Updated",
          `${user!.name} updated the ${values.name} department`,
          editing.id
        );
        toast.success("Department updated successfully");
      } else {
        const created = await departmentService.createDepartment(payload);
        await activityService.logActivity(
          user!.id,
          user!.name,
          "Department Created",
          `${user!.name} created a new department: ${values.name}`,
          created.id
        );
        toast.success("Department created successfully");
      }
      setFormOpen(false);
      refetchAll();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    if (employeeCount(deleting.id) > 0) {
      toast.error("Cannot delete a department that still has employees assigned");
      setDeleting(null);
      return;
    }
    try {
      await departmentService.deleteDepartment(deleting.id);
      await activityService.logActivity(
        user!.id,
        user!.name,
        "Department Deleted",
        `${user!.name} deleted the ${deleting.name} department`,
        deleting.id
      );
      toast.success("Department deleted successfully");
      setDeleting(null);
      refetchAll();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to delete department");
    }
  }

  const columns: Column<Department>[] = [
    { header: "Department", accessor: (d) => <span className="font-semibold text-gray-900 dark:text-white">{d.name}</span> },
    {
      header: "Head",
      accessor: (d) => <span className="text-gray-700 dark:text-slate-300">{employees.find((e) => e.id === d.headId)?.fullName || "—"}</span>,
    },
    { header: "Employees", accessor: (d) => <span className="font-mono text-gray-700 dark:text-slate-300">{employeeCount(d.id)} members</span> },
    { header: "Description", accessor: (d) => <span className="text-gray-500 dark:text-slate-400">{d.description || "—"}</span> },
    { header: "Status", accessor: (d) => <Badge>{d.status}</Badge> },
    {
      header: "Actions",
      className: "text-right",
      accessor: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1 text-xs text-primary-600 dark:text-primary-400" title="Edit" onClick={() => openEdit(d)}>
            <Pencil size={15} />
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete"
            onClick={() => setDeleting(d)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments"
        subtitle={`${filtered.length} of ${departments.length} departments`}
        actions={
          <button className="btn-primary text-xs" onClick={openCreate}>
            <Plus size={15} /> Add Department
          </button>
        }
      />

      <div className="card p-3.5 sm:w-80">
        <SearchInput value={search} onChange={setSearch} placeholder="Search departments..." />
      </div>

      <div className="card p-2">
        {loading ? (
          <LoadingState label="Loading departments..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetchAll} />
        ) : (
          <DataTable columns={columns} rows={filtered} keyFn={(d) => d.id} />
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Department Name"
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={errors.name}
          />
          <SelectField
            label="Department Head"
            placeholder="Not assigned"
            options={employees.map((e) => ({ label: e.fullName, value: e.id }))}
            value={values.headId}
            onChange={(e) => setValues((v) => ({ ...v, headId: e.target.value }))}
          />
          <TextAreaField
            label="Description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
          <SelectField
            label="Status"
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as "Active" | "Inactive" }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Department"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Department"
        message={`Are you sure you want to delete ${deleting?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
