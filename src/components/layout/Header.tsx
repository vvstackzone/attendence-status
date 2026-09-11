import { useState } from "react";
import { Menu, LogOut, ChevronDown, Sun, Moon, Laptop } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export default function Header({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200/90 bg-white/95 px-4 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Mobile menu trigger */}
      <button
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Page Title */}
      <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{title}</h1>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Dark/Light mode toggle button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 dark:hover:text-white"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-[11px] capitalize leading-tight text-gray-400 dark:text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown size={15} className="text-gray-400 dark:text-slate-400" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-gray-100 px-3 py-2 dark:border-slate-800 sm:hidden">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] capitalize text-gray-400">{user?.role} Portal</p>
                </div>

                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Theme Preference
                </div>

                <div className="mb-1 flex gap-1 px-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium ${
                      theme === "light"
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Sun size={13} /> Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium ${
                      theme === "dark"
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Moon size={13} /> Dark
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium ${
                      theme === "system"
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Laptop size={13} /> Auto
                  </button>
                </div>

                <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
