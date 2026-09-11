import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../hooks/useAuth";
import { ROUTE_TITLES } from "../../routes/routeTitles";
import { useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const title = ROUTE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 transition-colors dark:bg-slate-950">
      <Sidebar role={user.role} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 transition-colors">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
