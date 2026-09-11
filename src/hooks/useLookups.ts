import { useMemo } from "react";
import { useAsync } from "./useAsync";
import { getEmployees } from "../services/employeeService";
import { getDepartments } from "../services/departmentService";
import { getLeaveTypes } from "../services/leaveService";
import type { Department, Employee, LeaveType } from "../types";

export function useLookups() {
  const employeesQ = useAsync(getEmployees, []);
  const departmentsQ = useAsync(getDepartments, []);
  const leaveTypesQ = useAsync(getLeaveTypes, []);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    (employeesQ.data || []).forEach((e) => map.set(e.id, e));
    return map;
  }, [employeesQ.data]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, Department>();
    (departmentsQ.data || []).forEach((d) => map.set(d.id, d));
    return map;
  }, [departmentsQ.data]);

  const leaveTypeMap = useMemo(() => {
    const map = new Map<string, LeaveType>();
    (leaveTypesQ.data || []).forEach((lt) => map.set(lt.id, lt));
    return map;
  }, [leaveTypesQ.data]);

  const loading = employeesQ.loading || departmentsQ.loading || leaveTypesQ.loading;
  const error = employeesQ.error || departmentsQ.error || leaveTypesQ.error;

  function refetchAll() {
    employeesQ.refetch();
    departmentsQ.refetch();
    leaveTypesQ.refetch();
  }

  return {
    employees: employeesQ.data || [],
    departments: departmentsQ.data || [],
    leaveTypes: leaveTypesQ.data || [],
    employeeMap,
    departmentMap,
    leaveTypeMap,
    loading,
    error,
    refetchAll,
    refetchEmployees: employeesQ.refetch,
  };
}
