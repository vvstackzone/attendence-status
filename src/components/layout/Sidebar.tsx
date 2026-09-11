import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarClock,
  FileBarChart,
  History,
  UserCircle,
  ClipboardList,
  X,
  Sun,
  Moon,
} from "lucide-react";
import type { Role } from "../../types";
import { useTheme } from "../../hooks/useTheme";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Employees", to: "/admin/employees", icon: Users },
    { label: "Departments", to: "/admin/departments", icon: Building2 },
    { label: "Attendance", to: "/admin/attendance", icon: CalendarCheck },
    { label: "Leave Requests", to: "/admin/leaves", icon: CalendarClock },
    { label: "Leave Types", to: "/admin/leave-types", icon: ClipboardList },
    { label: "Reports", to: "/admin/reports", icon: FileBarChart },
    { label: "Activity History", to: "/admin/activity", icon: History },
  ],
  hr: [
    { label: "Dashboard", to: "/hr/dashboard", icon: LayoutDashboard },
    { label: "Employees", to: "/hr/employees", icon: Users },
    { label: "Attendance", to: "/hr/attendance", icon: CalendarCheck },
    { label: "Leave Requests", to: "/hr/leaves", icon: CalendarClock },
    { label: "Leave Types", to: "/hr/leave-types", icon: ClipboardList },
    { label: "Reports", to: "/hr/reports", icon: FileBarChart },
  ],
  manager: [
    { label: "Dashboard", to: "/manager/dashboard", icon: LayoutDashboard },
    { label: "My Team", to: "/manager/team", icon: Users },
    { label: "Team Attendance", to: "/manager/attendance", icon: CalendarCheck },
    { label: "Team Leaves", to: "/manager/leaves", icon: CalendarClock },
  ],
  employee: [
    { label: "Dashboard", to: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Attendance", to: "/employee/attendance", icon: CalendarCheck },
    { label: "My Leaves", to: "/employee/leaves", icon: CalendarClock },
    { label: "My Profile", to: "/employee/profile", icon: UserCircle },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  hr: "HR Specialist",
  manager: "Manager",
  employee: "Employee",
};

export default function Sidebar({
  role,
  mobileOpen,
  onCloseMobile,
}: {
  role: Role;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const items = NAV[role];
  const { resolvedTheme, toggleTheme } = useTheme();

  const content = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand header */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-bold text-white shadow-md shadow-primary-500/20">
            L&amp;A
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              LeaveTrack
              <span className="rounded-full bg-primary-100 px-1.5 py-0.2 text-[10px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                PRO
              </span>
            </p>
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">
              {ROLE_LABEL[role]}
            </p>
          </div>
          <button
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Navigation Menu
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer info & mobile quick theme switcher */}
      <div className="border-t border-gray-100 p-4 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        >
          <span className="flex items-center gap-2">
            {resolvedTheme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-500" />}
            {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
          <span className="text-[10px] uppercase text-gray-400">Switch</span>
        </button>

        <div className="rounded-xl bg-primary-50/60 p-3 text-center dark:bg-primary-950/30">
          <p className="text-xs font-bold text-primary-800 dark:text-primary-300">Leave &amp; Attendance</p>
          <p className="text-[10px] text-primary-600/80 dark:text-primary-400/80">Enterprise Management v2.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200/90 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900 md:flex">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-2xl transition-colors dark:bg-slate-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
