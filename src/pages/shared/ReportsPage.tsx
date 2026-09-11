import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import DataTable, { type Column } from "../../components/tables/DataTable";
import { LoadingState, ErrorState } from "../../components/common/States";
import { useLookups } from "../../hooks/useLookups";
import { useAsync } from "../../hooks/useAsync";
import * as attendanceService from "../../services/attendanceService";
import * as leaveService from "../../services/leaveService";
import type { Employee } from "../../types";
import { todayISO } from "../../utils/dateUtils";

type Tab = "attendance" | "leave";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("attendance");
  const { employees, departments, leaveTypes, leaveTypeMap, loading: lookupsLoading, error: lookupsError } =
    useLookups();
  const attendanceQ = useAsync(attendanceService.getAttendance, []);
  const requestsQ = useAsync(leaveService.getLeaveRequests, []);

  const [deptFilter, setDeptFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const scopedEmployees = useMemo(
    () => employees.filter((e) => !deptFilter || e.departmentId === deptFilter),
    [employees, deptFilter]
  );

  const attendanceReport = useMemo(() => {
    const records = (attendanceQ.data || []).filter((a) => {
      const matchesDate = (!fromDate || a.date >= fromDate) && (!toDate || a.date <= toDate);
      return matchesDate;
    });
    return scopedEmployees
      .filter((e) => !empFilter || e.id === empFilter)
      .map((emp) => {
        const empRecords = records.filter((a) => a.employeeId === emp.id);
        const total = empRecords.filter((a) => a.status !== "Week Off" && a.status !== "Holiday").length;
        const present = empRecords.filter((a) => a.status === "Present" || a.status === "Late").length;
        const absent = empRecords.filter((a) => a.status === "Absent").length;
        const half = empRecords.filter((a) => a.status === "Half Day").length;
        const leave = empRecords.filter((a) => a.status === "On Leave").length;
        const pct = total > 0 ? (((present + half * 0.5) / total) * 100).toFixed(1) : "0.0";
        return { emp, total, present, absent, half, leave, pct };
      });
  }, [scopedEmployees, attendanceQ.data, fromDate, toDate, empFilter]);

  const leaveReport = useMemo(() => {
    const requests = (requestsQ.data || []).filter((r) => {
      const matchesType = !typeFilter || r.leaveTypeId === typeFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesDate = (!fromDate || r.startDate >= fromDate) && (!toDate || r.endDate <= toDate);
      return matchesType && matchesStatus && matchesDate;
    });
    const rows: { emp: Employee; leaveTypeName: string; allocated: number; used: number; remaining: number; pending: number }[] = [];
    scopedEmployees
      .filter((e) => !empFilter || e.id === empFilter)
      .forEach((emp) => {
        emp.leaveBalance
          .filter((b) => !typeFilter || b.leaveTypeId === typeFilter)
          .forEach((b) => {
            const lt = leaveTypeMap.get(b.leaveTypeId);
            if (!lt) return;
            const pending = requests.filter(
              (r) => r.employeeId === emp.id && r.leaveTypeId === b.leaveTypeId && r.status === "Pending"
            ).length;
            rows.push({
              emp,
              leaveTypeName: lt.name,
              allocated: b.allocated,
              used: b.used,
              remaining: b.allocated - b.used,
              pending,
            });
          });
      });
    return rows;
  }, [scopedEmployees, requestsQ.data, typeFilter, statusFilter, fromDate, toDate, leaveTypeMap]);

  function exportReportCSV() {
    if (tab === "attendance") {
      const headers = ["Employee ID", "Employee Name", "Total Days", "Present", "Absent", "Half Days", "Leave Days", "Attendance %"];
      const rows = attendanceReport.map((r) => [
        `"${r.emp.employeeId}"`,
        `"${r.emp.fullName}"`,
        r.total,
        r.present,
        r.absent,
        r.half,
        r.leave,
        `"${r.pct}%"`,
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const a = document.createElement("a");
      a.href = encodeURI(csv);
      a.download = `Attendance_Report_${todayISO()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const headers = ["Employee ID", "Employee Name", "Leave Type", "Allocated", "Used", "Remaining", "Pending"];
      const rows = leaveReport.map((r) => [
        `"${r.emp.employeeId}"`,
        `"${r.emp.fullName}"`,
        `"${r.leaveTypeName}"`,
        r.allocated,
        r.used,
        r.remaining,
        r.pending,
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const a = document.createElement("a");
      a.href = encodeURI(csv);
      a.download = `Leave_Report_${todayISO()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  const attColumns: Column<(typeof attendanceReport)[number]>[] = [
    {
      header: "Employee",
      accessor: (r) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{r.emp.fullName}</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">{r.emp.employeeId}</p>
        </div>
      ),
    },
    { header: "Total Working Days", accessor: (r) => <span className="font-mono text-gray-700 dark:text-slate-300">{r.total}</span> },
    { header: "Present Days", accessor: (r) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{r.present}</span> },
    { header: "Absent Days", accessor: (r) => <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">{r.absent}</span> },
    { header: "Half Days", accessor: (r) => <span className="font-mono text-blue-600 dark:text-blue-400">{r.half}</span> },
    { header: "Leave Days", accessor: (r) => <span className="font-mono text-purple-600 dark:text-purple-400">{r.leave}</span> },
    { header: "Attendance %", accessor: (r) => <span className="font-bold text-gray-900 dark:text-white">{r.pct}%</span> },
  ];

  const leaveColumns: Column<(typeof leaveReport)[number]>[] = [
    {
      header: "Employee",
      accessor: (r) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{r.emp.fullName}</p>
          <p className="text-xs text-gray-400 dark:text-slate-400">{r.emp.employeeId}</p>
        </div>
      ),
    },
    { header: "Leave Type", accessor: (r) => <span className="font-medium text-gray-800 dark:text-slate-200">{r.leaveTypeName}</span> },
    { header: "Allocated", accessor: (r) => <span className="font-mono text-gray-700 dark:text-slate-300">{r.allocated}</span> },
    { header: "Used", accessor: (r) => <span className="font-mono text-rose-600 dark:text-rose-400">{r.used}</span> },
    { header: "Remaining", accessor: (r) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{r.remaining}</span> },
    { header: "Pending Requests", accessor: (r) => <span className="font-mono text-amber-600 dark:text-amber-400">{r.pending}</span> },
  ];

  const loading = lookupsLoading || (tab === "attendance" ? attendanceQ.loading : requestsQ.loading);
  const error = lookupsError || (tab === "attendance" ? attendanceQ.error : requestsQ.error);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics &amp; Reports"
        subtitle="Organizational attendance summary and leave balances"
        actions={
          <button onClick={exportReportCSV} className="btn-secondary text-xs">
            <Download size={14} /> Export Report CSV
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`btn text-xs ${tab === "attendance" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("attendance")}
        >
          Attendance Summary Report
        </button>
        <button
          className={`btn text-xs ${tab === "leave" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("leave")}
        >
          Leave Balances Report
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <select className="input sm:w-48 text-xs" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select className="input sm:w-48 text-xs" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
          <option value="">All Employees</option>
          {scopedEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}
            </option>
          ))}
        </select>
        {tab === "leave" && (
          <>
            <select className="input sm:w-44 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Leave Types</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
            <select className="input sm:w-40 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </>
        )}
        <div className="flex items-center gap-2">
          <input type="date" className="input text-xs sm:w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" className="input text-xs sm:w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      <div className="card p-2">
        {loading ? (
          <LoadingState label="Building reports..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : tab === "attendance" ? (
          <DataTable columns={attColumns} rows={attendanceReport} keyFn={(r) => r.emp.id} />
        ) : (
          <DataTable columns={leaveColumns} rows={leaveReport} keyFn={(r) => `${r.emp.id}-${r.leaveTypeName}`} />
        )}
      </div>
    </div>
  );
}
