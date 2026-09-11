import { useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Check, X, Ban } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import DataTable, { type Column } from "../../components/tables/DataTable";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Badge from "../../components/common/Badge";
import { LoadingState, ErrorState } from "../../components/common/States";
import { SelectField, TextAreaField, TextField } from "../../components/forms/FormField";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import { useAuth } from "../../hooks/useAuth";
import * as leaveService from "../../services/leaveService";
import * as activityService from "../../services/activityService";
import type { LeaveRequest, LeaveStatus } from "../../types";
import { daysBetweenInclusive, formatDate, todayISO } from "../../utils/dateUtils";

const STATUS_OPTIONS: LeaveStatus[] = ["Pending", "Approved", "Rejected", "Cancelled"];

export default function LeaveRequestsPage({ scope }: { scope: "all" | "team" | "self" }) {
  const { user } = useAuth();
  const { employees, leaveTypes, leaveTypeMap, loading: lookupsLoading, error: lookupsError } = useLookups();
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{ req: LeaveRequest; action: "Approved" | "Rejected" } | null>(null);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);

  const visibleEmployeeIds = useMemo(() => {
    if (scope === "team") return new Set(employees.filter((e) => e.managerId === user?.employeeId).map((e) => e.id));
    if (scope === "self") return new Set([user?.employeeId]);
    return new Set(employees.map((e) => e.id));
  }, [employees, scope, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (requestsQ.data || [])
      .filter((r) => visibleEmployeeIds.has(r.employeeId))
      .filter((r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        const matchesSearch = !q || emp?.fullName.toLowerCase().includes(q);
        const matchesStatus = !statusFilter || r.status === statusFilter;
        const matchesType = !typeFilter || r.leaveTypeId === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  }, [requestsQ.data, visibleEmployeeIds, employees, search, statusFilter, typeFilter]);

  async function handleReview(comment: string) {
    if (!reviewing) return;
    const { req, action } = reviewing;
    const emp = employees.find((e) => e.id === req.employeeId);
    if (!emp) return;

    if (action === "Rejected" && !comment.trim()) {
      toast.error("A rejection reason is required");
      return;
    }

    try {
      await leaveService.reviewLeaveRequest(req.id, action, user!.employeeId || user!.id, comment);
      if (action === "Approved") {
        await leaveService.adjustLeaveBalance(emp, req.leaveTypeId, req.numberOfDays);
      }
      await activityService.logActivity(
        user!.id,
        user!.name,
        `Leave ${action}`,
        `${user!.name} ${action.toLowerCase()} ${emp.fullName}'s ${leaveTypeMap.get(req.leaveTypeId)?.name || "leave"} request`,
        req.id
      );
      toast.success(`Leave request ${action.toLowerCase()}`);
      setReviewing(null);
      requestsQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to update request");
    }
  }

  async function handleCancel() {
    if (!cancelling) return;
    try {
      await leaveService.cancelLeaveRequest(cancelling.id);
      toast.success("Leave request cancelled");
      setCancelling(null);
      requestsQ.refetch();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to cancel request");
    }
  }

  const canReview = scope === "all" || scope === "team";

  const columns: Column<LeaveRequest>[] = [
    ...(scope !== "self"
      ? [
          {
            header: "Employee",
            accessor: (r: LeaveRequest) => (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {employees.find((e) => e.id === r.employeeId)?.fullName || "—"}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-400">
                  {employees.find((e) => e.id === r.employeeId)?.employeeId}
                </p>
              </div>
            ),
          } as Column<LeaveRequest>,
        ]
      : []),
    { header: "Leave Type", accessor: (r) => <span className="font-medium text-gray-800 dark:text-slate-200">{leaveTypeMap.get(r.leaveTypeId)?.name || "—"}</span> },
    { header: "Dates", accessor: (r) => <span className="text-gray-700 dark:text-slate-300">{`${formatDate(r.startDate)} – ${formatDate(r.endDate)}`}</span> },
    { header: "Days", accessor: (r) => <span className="font-mono text-gray-800 dark:text-slate-200">{r.numberOfDays}d</span> },
    { header: "Reason", accessor: (r) => <span className="text-gray-500 dark:text-slate-400 max-w-[180px] truncate inline-block">{r.reason}</span> },
    { header: "Applied", accessor: (r) => <span className="text-gray-500 dark:text-slate-400">{formatDate(r.appliedDate)}</span> },
    { header: "Status", accessor: (r) => <Badge>{r.status}</Badge> },
    {
      header: "Actions",
      className: "text-right",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          {canReview && r.status === "Pending" && (
            <>
              <button
                className="btn-ghost !px-2 !py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                title="Approve"
                onClick={() => setReviewing({ req: r, action: "Approved" })}
              >
                <Check size={16} />
              </button>
              <button
                className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                title="Reject"
                onClick={() => setReviewing({ req: r, action: "Rejected" })}
              >
                <X size={16} />
              </button>
            </>
          )}
          {scope === "self" && r.employeeId === user?.employeeId && r.status === "Pending" && (
            <button
              className="btn-ghost !px-2 !py-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Cancel"
              onClick={() => setCancelling(r)}
            >
              <Ban size={15} /> Cancel
            </button>
          )}
          {!canReview && !(scope === "self" && r.status === "Pending") && (
            <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
          )}
        </div>
      ),
    },
  ];

  const loading = lookupsLoading || requestsQ.loading;
  const error = lookupsError || requestsQ.error;

  return (
    <div className="space-y-4">
      <PageHeader
        title={scope === "self" ? "My Leave Requests" : scope === "team" ? "Team Leave Requests" : "Leave Requests"}
        subtitle={`${filtered.length} request(s)`}
        actions={
          scope === "self" ? (
            <button className="btn-primary text-xs" onClick={() => setApplyOpen(true)}>
              <Plus size={15} /> Apply for Leave
            </button>
          ) : undefined
        }
      />

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        {scope !== "self" && (
          <div className="sm:w-56">
            <SearchInput value={search} onChange={setSearch} placeholder="Search employee..." />
          </div>
        )}
        <select className="input sm:w-44 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="input sm:w-48 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Leave Types</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-2">
        {loading ? (
          <LoadingState label="Loading leave requests..." />
        ) : error ? (
          <ErrorState message={error} onRetry={requestsQ.refetch} />
        ) : (
          <DataTable columns={columns} rows={filtered} keyFn={(r) => r.id} />
        )}
      </div>

      {scope === "self" && (
        <ApplyLeaveModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onApplied={() => {
            setApplyOpen(false);
            requestsQ.refetch();
          }}
          existingRequests={requestsQ.data || []}
        />
      )}

      <ReviewModal
        item={reviewing}
        onCancel={() => setReviewing(null)}
        onConfirm={handleReview}
        employeeName={reviewing ? employees.find((e) => e.id === reviewing.req.employeeId)?.fullName || "" : ""}
      />

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this pending leave request?"
        confirmLabel="Cancel Request"
        onConfirm={handleCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}

function ReviewModal({
  item,
  onCancel,
  onConfirm,
  employeeName,
}: {
  item: { req: LeaveRequest; action: "Approved" | "Rejected" } | null;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
  employeeName: string;
}) {
  const [comment, setComment] = useState("");

  if (!item) return null;
  const { req, action } = item;

  return (
    <Modal
      open={!!item}
      onClose={onCancel}
      title={`${action === "Approved" ? "Approve" : "Reject"} Leave Request`}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={action === "Approved" ? "btn-primary" : "btn-danger"}
            onClick={() => onConfirm(comment)}
          >
            Confirm {action === "Approved" ? "Approval" : "Rejection"}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-gray-600 dark:text-slate-300">
          {employeeName} — {req.numberOfDays} day(s) from {formatDate(req.startDate)} to {formatDate(req.endDate)}
        </p>
        <TextAreaField
          label={action === "Rejected" ? "Rejection Reason" : "Comment (optional)"}
          required={action === "Rejected"}
          placeholder={action === "Rejected" ? "Explain why this request is being rejected" : "Add a note"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function ApplyLeaveModal({
  open,
  onClose,
  onApplied,
  existingRequests,
}: {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
  existingRequests: LeaveRequest[];
}) {
  const { user } = useAuth();
  const { employees, leaveTypes } = useLookups();
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const employee = employees.find((e) => e.id === user?.employeeId);
  const days = leaveTypeId && startDate && endDate ? daysBetweenInclusive(startDate, endDate) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    const leaveType = leaveTypes.find((lt) => lt.id === leaveTypeId);
    if (!leaveType) {
      setErrors(["Please select a leave type"]);
      return;
    }
    if (!reason.trim()) {
      setErrors(["Reason for leave is required"]);
      return;
    }
    const result = leaveService.validateLeaveRequest(employee, leaveType, startDate, endDate, existingRequests);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setSubmitting(true);
    try {
      await leaveService.applyLeave({
        employeeId: employee.id,
        leaveTypeId,
        startDate,
        endDate,
        numberOfDays: result.numberOfDays,
        reason: reason.trim(),
      });
      await activityService.logActivity(
        user!.id,
        user!.name,
        "Leave Applied",
        `${employee.fullName} applied for ${leaveType.name}`,
        null
      );
      toast.success("Leave request submitted successfully");
      setLeaveTypeId("");
      setReason("");
      onApplied();
    } catch (err: any) {
      toast.error(err.friendlyMessage || err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Leave Type"
          required
          placeholder="Select leave type"
          options={leaveTypes.map((lt) => {
            const balance = employee?.leaveBalance.find((b) => b.leaveTypeId === lt.id);
            const remaining = balance ? balance.allocated - balance.used : lt.maxDays;
            return { label: `${lt.name} (${remaining} left)`, value: lt.id };
          })}
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="End Date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {days > 0 && <p className="text-xs text-gray-500 dark:text-slate-400">Total duration: {days} day(s)</p>}
        <TextAreaField
          label="Reason"
          required
          placeholder="Briefly describe the reason for leave"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {errors.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
