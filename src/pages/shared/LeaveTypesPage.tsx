import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import { TextField, SelectField, TextAreaField } from "../../components/forms/FormField";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import * as leaveService from "../../services/leaveService";
import * as activityService from "../../services/activityService";
import type { LeaveType } from "../../types";

interface FormValues {
  name: string;
  description: string;
  maxDays: string;
  status: "Active" | "Inactive";
}

const EMPTY: FormValues = { name: "", description: "", maxDays: "", status: "Active" };

export default function LeaveTypesPage() {
  const { user } = useAuth();
  const typesQ = useAsync(leaveService.getLeaveTypes, []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<LeaveType | null>(null);

  function openCreate() {
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(lt: LeaveType) {
    setEditing(lt);
    setValues({ name: lt.name, description: lt.description, maxDays: String(lt.maxDays), status: lt.status });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Leave type name is required";
    const duplicate = (typesQ.data || []).some(
      (lt) => lt.id !== editing?.id && lt.name.trim().toLowerCase() === values.name.trim().toLowerCase()
    );
    if (duplicate) next.name = "A leave type with this name already exists";
    const maxDaysNum = Number(values.maxDays);
    if (!values.maxDays || isNaN(maxDaysNum) || maxDaysNum <= 0) next.maxDays = "Enter a valid number of days";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = { name: values.name.trim(), description: values.description, maxDays: Number(values.maxDays), status: values.status };
    try {
      if (editing) {
        await leaveService.updateLeaveType(editing.id, payload);
        toast.success("Leave type updated successfully");
      } else {
        await leaveService.createLeaveType(payload);
        toast.success("Leave type created successfully");
      }
      await activityService.logActivity(
        user!.id,
        user!.name,
        editing ? "Leave Type Updated" : "Leave Type Created",
        `${user!.name} ${editing ? "updated" : "created"} the ${values.name} leave type`
      );
      setFormOpen(false);
      typesQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await leaveService.deleteLeaveType(deleting.id);
      toast.success("Leave type deleted successfully");
      setDeleting(null);
      typesQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to delete leave type");
    }
  }

  const columns: Column<LeaveType>[] = [
    { header: "Name", accessor: (lt) => <span className="font-semibold text-gray-900 dark:text-white">{lt.name}</span> },
    { header: "Description", accessor: (lt) => <span className="text-gray-500 dark:text-slate-400">{lt.description || "—"}</span> },
    { header: "Max Days / Year", accessor: (lt) => <span className="font-mono text-gray-800 dark:text-slate-200">{lt.maxDays} days</span> },
    { header: "Status", accessor: (lt) => <Badge>{lt.status}</Badge> },
    {
      header: "Actions",
      className: "text-right",
      accessor: (lt) => (
        <div className="flex items-center justify-end gap-1">
          <button className="btn-ghost !px-2 !py-1 text-xs text-primary-600 dark:text-primary-400" title="Edit" onClick={() => openEdit(lt)}>
            <Pencil size={15} />
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete"
            onClick={() => setDeleting(lt)}
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
        title="Leave Types Configuration"
        subtitle={`${(typesQ.data || []).length} leave policies configured`}
        actions={
          <button className="btn-primary text-xs" onClick={openCreate}>
            <Plus size={15} /> Add Leave Type
          </button>
        }
      />

      <div className="card p-2">
        {typesQ.loading ? (
          <LoadingState label="Loading leave types..." />
        ) : typesQ.error ? (
          <ErrorState message={typesQ.error} onRetry={typesQ.refetch} />
        ) : (
          <DataTable columns={columns} rows={typesQ.data || []} keyFn={(lt) => lt.id} />
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Leave Type" : "Add Leave Type"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Name"
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={errors.name}
          />
          <TextAreaField
            label="Description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
          <TextField
            label="Maximum Days / Year"
            type="number"
            min={1}
            required
            value={values.maxDays}
            onChange={(e) => setValues((v) => ({ ...v, maxDays: e.target.value }))}
            error={errors.maxDays}
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
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Leave Type"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Leave Type"
        message={`Are you sure you want to delete ${deleting?.name}? Existing leave requests of this type will keep referencing it.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
