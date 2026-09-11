// Generates db.json with realistic, internally-consistent seed data.
const fs = require("fs");
const path = require("path");

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }
function isoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function workingHours(inT, outT) {
  const [ih, im] = inT.split(":").map(Number);
  const [oh, om] = outT.split(":").map(Number);
  let mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${pad(m)}m`;
}

const today = new Date("2026-09-10T00:00:00");

const departments = [
  { id: "dep1", name: "Development", headId: "emp002", description: "Product engineering and software development", status: "Active" },
  { id: "dep2", name: "Human Resources", headId: "emp006", description: "People operations, hiring and employee relations", status: "Active" },
  { id: "dep3", name: "Finance", headId: "emp005", description: "Accounts, payroll and financial planning", status: "Active" },
  { id: "dep4", name: "Marketing", headId: "emp003", description: "Brand, content and product marketing", status: "Active" },
  { id: "dep5", name: "Sales", headId: "emp004", description: "Business development and client accounts", status: "Active" },
  { id: "dep6", name: "Operations", headId: null, description: "Facilities, admin and internal operations", status: "Active" },
  { id: "dep7", name: "Support", headId: null, description: "Customer success and technical support", status: "Active" },
];

const leaveTypes = [
  { id: "lt1", name: "Casual Leave", description: "Short planned leave for personal matters", maxDays: 12, status: "Active" },
  { id: "lt2", name: "Sick Leave", description: "Leave due to illness or medical needs", maxDays: 10, status: "Active" },
  { id: "lt3", name: "Annual Leave", description: "Yearly planned vacation leave", maxDays: 15, status: "Active" },
  { id: "lt4", name: "Earned Leave", description: "Leave earned through service tenure", maxDays: 10, status: "Active" },
  { id: "lt5", name: "Emergency Leave", description: "Unplanned leave for urgent situations", maxDays: 5, status: "Active" },
  { id: "lt6", name: "Work From Home", description: "Remote working day", maxDays: 10, status: "Active" },
  { id: "lt7", name: "Unpaid Leave", description: "Leave without pay beyond allocated balance", maxDays: 30, status: "Active" },
];

function balances(overrides = {}) {
  const base = { lt1: 5, lt2: 2, lt3: 6, lt4: 3, lt5: 0, lt6: 2, lt7: 0 };
  const used = { ...base, ...overrides };
  const alloc = { lt1: 12, lt2: 10, lt3: 15, lt4: 10, lt5: 5, lt6: 10, lt7: 30 };
  return Object.keys(alloc).map((ltId) => ({ leaveTypeId: ltId, allocated: alloc[ltId], used: used[ltId] }));
}

const employees = [
  {
    id: "emp001", employeeId: "EMP001", fullName: "Arun Kumar", email: "arun.kumar@company.com",
    phone: "9840011223", departmentId: "dep1", designation: "Software Engineer", managerId: "emp002",
    joiningDate: "2023-06-12", employmentStatus: "Active", leaveBalance: balances({ lt1: 5, lt2: 2 }),
    createdDate: "2023-06-12",
  },
  {
    id: "emp002", employeeId: "EMP002", fullName: "Priya Sharma", email: "priya.sharma@company.com",
    phone: "9840011224", departmentId: "dep1", designation: "Engineering Manager", managerId: null,
    joiningDate: "2021-02-01", employmentStatus: "Active", leaveBalance: balances({ lt1: 3, lt3: 4 }),
    createdDate: "2021-02-01",
  },
  {
    id: "emp003", employeeId: "EMP003", fullName: "Karthik Raj", email: "karthik.raj@company.com",
    phone: "9840011225", departmentId: "dep4", designation: "Marketing Executive", managerId: "emp002",
    joiningDate: "2022-11-20", employmentStatus: "Active", leaveBalance: balances({ lt2: 4 }),
    createdDate: "2022-11-20",
  },
  {
    id: "emp004", employeeId: "EMP004", fullName: "Divya Menon", email: "divya.menon@company.com",
    phone: "9840011226", departmentId: "dep5", designation: "Sales Associate", managerId: "emp002",
    joiningDate: "2024-01-15", employmentStatus: "Active", leaveBalance: balances({ lt1: 2, lt6: 5 }),
    createdDate: "2024-01-15",
  },
  {
    id: "emp005", employeeId: "EMP005", fullName: "Ramesh Iyer", email: "ramesh.iyer@company.com",
    phone: "9840011227", departmentId: "dep3", designation: "Financial Analyst", managerId: "emp002",
    joiningDate: "2020-08-03", employmentStatus: "Active", leaveBalance: balances({ lt3: 8 }),
    createdDate: "2020-08-03",
  },
  {
    id: "emp006", employeeId: "EMP006", fullName: "Sneha Reddy", email: "sneha.reddy@company.com",
    phone: "9840011228", departmentId: "dep2", designation: "HR Executive", managerId: null,
    joiningDate: "2022-04-18", employmentStatus: "Active", leaveBalance: balances({}),
    createdDate: "2022-04-18",
  },
  {
    id: "emp007", employeeId: "EMP007", fullName: "Vignesh Pillai", email: "vignesh.pillai@company.com",
    phone: "9840011229", departmentId: "dep7", designation: "Support Engineer", managerId: "emp002",
    joiningDate: "2024-07-09", employmentStatus: "On Notice", leaveBalance: balances({ lt2: 6 }),
    createdDate: "2024-07-09",
  },
];

const users = [
  { id: "u1", email: "admin@company.com", password: "admin123", role: "admin", name: "System Admin" },
  { id: "u2", email: "hr@company.com", password: "hr123", role: "hr", name: "Sneha Reddy", employeeId: "emp006" },
  { id: "u3", email: "manager@company.com", password: "manager123", role: "manager", name: "Priya Sharma", employeeId: "emp002" },
  { id: "u4", email: "employee@company.com", password: "employee123", role: "employee", name: "Arun Kumar", employeeId: "emp001" },
  { id: "u5", email: "karthik.raj@company.com", password: "employee123", role: "employee", name: "Karthik Raj", employeeId: "emp003" },
  { id: "u6", email: "divya.menon@company.com", password: "employee123", role: "employee", name: "Divya Menon", employeeId: "emp004" },
];

// Attendance: last 14 calendar days for each employee (skip weekends as Week Off unless overridden)
const attendance = [];
let attId = 1;
const patterns = {
  emp001: ["09:10-18:05", "09:05-18:00", "09:40-18:00-Late", "ABSENT", "09:00-17:50", "09:15-18:10", null, null, "09:05-18:00", "09:00-13:00-Half", "09:10-18:00", "LEAVE", "LEAVE", "09:00-18:00"],
  emp002: ["09:00-19:00", "09:00-18:30", "09:00-18:45", "09:00-18:20", "09:00-18:15", "09:00-18:40", null, null, "09:00-18:30", "09:00-18:25", "09:00-18:10", "09:00-18:35", "09:00-18:20", "09:00-18:00"],
  emp003: ["09:20-18:10", "09:15-18:00", "ABSENT", "09:10-18:05", "09:00-18:00", "09:30-18:15-Late", null, null, "09:00-18:00", "09:10-18:00", "09:00-18:00", "09:00-18:00", "09:15-18:05", "09:00-18:00"],
  emp004: ["09:00-18:00", "09:00-18:00", "09:00-18:00", "09:05-18:00", "LEAVE", "LEAVE", null, null, "09:00-18:00", "09:00-18:00", "09:10-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00"],
  emp005: ["09:00-17:30-Half", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", null, null, "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "ABSENT", "09:00-18:00"],
  emp006: ["09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", null, null, "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00", "09:00-18:00"],
  emp007: ["09:30-18:00-Late", "09:00-18:00", "ABSENT", "ABSENT", "09:00-18:00", "09:00-18:00", null, null, "09:00-18:00", "09:00-18:00", "09:30-18:00-Late", "09:00-18:00", "09:00-18:00", "09:00-18:00"],
};

for (let i = 13; i >= 0; i--) {
  const date = addDays(today, -i);
  const dow = date.getDay();
  const dateStr = isoDate(date);
  for (const emp of employees) {
    const pattern = patterns[emp.id];
    const entry = pattern[13 - i];
    let status, checkIn = null, checkOut = null, hours = null, remarks = "";
    if (dow === 0 || dow === 6) {
      status = "Week Off"; remarks = "Weekend";
    } else if (entry === null) {
      status = "Week Off"; remarks = "Weekend";
    } else if (entry === "ABSENT") {
      status = "Absent"; remarks = "No check-in recorded";
    } else if (entry === "LEAVE") {
      status = "On Leave"; remarks = "Approved leave";
    } else {
      const isHalf = entry.includes("-Half");
      const isLate = entry.includes("-Late");
      const clean = entry.replace("-Half", "").replace("-Late", "");
      const [inT, outT] = clean.split("-");
      checkIn = inT; checkOut = outT; hours = workingHours(inT, outT);
      status = isHalf ? "Half Day" : isLate ? "Late" : "Present";
      remarks = isLate ? "Arrived after 9:30 AM" : isHalf ? "Left early - half day" : "";
    }
    attendance.push({
      id: `att${attId++}`, employeeId: emp.id, date: dateStr,
      checkIn, checkOut, workingHours: hours, status, remarks,
    });
  }
}

const leaveRequests = [
  { id: "lr1", employeeId: "emp001", leaveTypeId: "lt1", startDate: isoDate(addDays(today, 2)), endDate: isoDate(addDays(today, 4)), numberOfDays: 3, reason: "Personal work", appliedDate: isoDate(addDays(today, -1)), status: "Pending", reviewedBy: null, reviewDate: null, reviewComment: null },
  { id: "lr2", employeeId: "emp003", leaveTypeId: "lt2", startDate: isoDate(addDays(today, -6)), endDate: isoDate(addDays(today, -6)), numberOfDays: 1, reason: "Fever and cold", appliedDate: isoDate(addDays(today, -7)), status: "Approved", reviewedBy: "emp002", reviewDate: isoDate(addDays(today, -7)), reviewComment: "Get well soon" },
  { id: "lr3", employeeId: "emp004", leaveTypeId: "lt1", startDate: isoDate(addDays(today, -9)), endDate: isoDate(addDays(today, -8)), numberOfDays: 2, reason: "Family function", appliedDate: isoDate(addDays(today, -11)), status: "Approved", reviewedBy: "emp002", reviewDate: isoDate(addDays(today, -10)), reviewComment: "Approved" },
  { id: "lr4", employeeId: "emp007", leaveTypeId: "lt5", startDate: isoDate(addDays(today, -3)), endDate: isoDate(addDays(today, -2)), numberOfDays: 2, reason: "Family emergency", appliedDate: isoDate(addDays(today, -3)), status: "Rejected", reviewedBy: "emp002", reviewDate: isoDate(addDays(today, -3)), reviewComment: "Team workload is high during these dates" },
  { id: "lr5", employeeId: "emp005", leaveTypeId: "lt3", startDate: isoDate(addDays(today, 10)), endDate: isoDate(addDays(today, 14)), numberOfDays: 5, reason: "Annual family trip", appliedDate: isoDate(addDays(today, -2)), status: "Pending", reviewedBy: null, reviewDate: null, reviewComment: null },
  { id: "lr6", employeeId: "emp001", leaveTypeId: "lt6", startDate: isoDate(addDays(today, -20)), endDate: isoDate(addDays(today, -20)), numberOfDays: 1, reason: "Home internet setup", appliedDate: isoDate(addDays(today, -21)), status: "Cancelled", reviewedBy: null, reviewDate: null, reviewComment: null },
];

const activities = [
  { id: "act1", userId: "emp001", userName: "Arun Kumar", action: "Leave Applied", description: "Arun Kumar applied for Casual Leave", relatedRecord: "lr1", timestamp: new Date(addDays(today, -1)).toISOString() },
  { id: "act2", userId: "emp002", userName: "Priya Sharma", action: "Leave Approved", description: "Priya Sharma approved Karthik Raj's Sick Leave request", relatedRecord: "lr2", timestamp: new Date(addDays(today, -7)).toISOString() },
  { id: "act3", userId: "u2", userName: "Sneha Reddy", action: "Attendance Updated", description: "Sneha Reddy corrected attendance for Ramesh Iyer", relatedRecord: "att1", timestamp: new Date(addDays(today, -1)).toISOString() },
  { id: "act4", userId: "u1", userName: "System Admin", action: "Employee Created", description: "System Admin created a new employee record for Vignesh Pillai", relatedRecord: "emp007", timestamp: new Date("2024-07-09").toISOString() },
  { id: "act5", userId: "emp002", userName: "Priya Sharma", action: "Leave Rejected", description: "Priya Sharma rejected Vignesh Pillai's Emergency Leave request", relatedRecord: "lr4", timestamp: new Date(addDays(today, -3)).toISOString() },
];

const db = { users, employees, departments, attendance, leaveTypes, leaveRequests, activities };
fs.writeFileSync(path.join(__dirname, "..", "db.json"), JSON.stringify(db, null, 2));
console.log("db.json generated with", attendance.length, "attendance records");
