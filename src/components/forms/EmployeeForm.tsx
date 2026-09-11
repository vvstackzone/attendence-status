import { useState, type FormEvent } from "react";
import { TextField, SelectField } from "./FormField";
import type { Department, Employee, EmploymentStatus } from "../../types";
import * as employeeService from "../../services/employeeService";

export interface EmployeeFormValues {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  managerId: string | null;
  joiningDate: string;
  employmentStatus: EmploymentStatus;
}

const STATUS_OPTIONS: EmploymentStatus[] = ["Active", "Inactive", "On Notice", "Resigned"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;

export default function EmployeeForm({
  initial,
  departments,
  managers,
  onCancel,
  onSubmit,
  saving,
}: {
  initial: Employee | null;
  departments: Department[];
  managers: Employee[];
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<EmployeeFormValues>({
    employeeId: initial?.employeeId || "",
    fullName: initial?.fullName || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    departmentId: initial?.departmentId || departments[0]?.id || "",
    designation: initial?.designation || "",
    managerId: initial?.managerId || "",
    joiningDate: initial?.joiningDate || new Date().toISOString().slice(0, 10),
    employmentStatus: initial?.employmentStatus || "Active",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);

  function set<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function validate(): Promise<boolean> {
    const next: Record<string, string> = {};
    if (!values.employeeId.trim()) next.employeeId = "Employee ID is required";
    if (!values.fullName.trim()) next.fullName = "Full name is required";
    if (!values.email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(values.email)) next.email = "Enter a valid email address";
    if (!values.phone.trim()) next.phone = "Phone number is required";
    else if (!PHONE_RE.test(values.phone)) next.phone = "Enter a valid phone number";
    if (!values.departmentId) next.departmentId = "Department is required";
    if (!values.designation.trim()) next.designation = "Designation is required";
    if (!values.joiningDate) next.joiningDate = "Joining date is required";
    else if (values.joiningDate > new Date().toISOString().slice(0, 10)) {
      next.joiningDate = "Joining date cannot be in the future";
    }

    if (Object.keys(next).length === 0) {
      setChecking(true);
      try {
        const [idTaken, emailTaken] = await Promise.all([
          employeeService.isEmployeeIdTaken(values.employeeId.trim(), initial?.id),
          employeeService.isEmailTaken(values.email.trim(), initial?.id),
        ]);
        if (idTaken) next.employeeId = "This Employee ID is already in use";
        if (emailTaken) next.email = "This email is already registered";
      } finally {
        setChecking(false);
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await validate();
    if (!ok) return;
    onSubmit({ ...values, managerId: values.managerId || null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Employee ID"
          required
          placeholder="EMP008"
          value={values.employeeId}
          onChange={(e) => set("employeeId", e.target.value)}
          error={errors.employeeId}
        />
        <TextField
          label="Full Name"
          required
          placeholder="Jane Doe"
          value={values.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          error={errors.fullName}
        />
        <TextField
          label="Email"
          type="email"
          required
          placeholder="jane.doe@company.com"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Phone"
          required
          placeholder="9840011234"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
        />
        <SelectField
          label="Department"
          required
          options={departments.map((d) => ({ label: d.name, value: d.id }))}
          value={values.departmentId}
          onChange={(e) => set("departmentId", e.target.value)}
          error={errors.departmentId}
        />
        <TextField
          label="Designation"
          required
          placeholder="Software Engineer"
          value={values.designation}
          onChange={(e) => set("designation", e.target.value)}
          error={errors.designation}
        />
        <SelectField
          label="Reporting Manager"
          placeholder="No manager"
          options={managers.map((m) => ({ label: `${m.fullName} (${m.employeeId})`, value: m.id }))}
          value={values.managerId || ""}
          onChange={(e) => set("managerId", e.target.value)}
        />
        <TextField
          label="Joining Date"
          type="date"
          required
          value={values.joiningDate}
          onChange={(e) => set("joiningDate", e.target.value)}
          error={errors.joiningDate}
        />
        <SelectField
          label="Employment Status"
          required
          options={STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
          value={values.employmentStatus}
          onChange={(e) => set("employmentStatus", e.target.value as EmploymentStatus)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving || checking}>
          {saving || checking ? "Saving..." : initial ? "Save Changes" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}
