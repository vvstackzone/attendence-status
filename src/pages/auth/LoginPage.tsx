import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { CalendarCheck, Loader2, Sun, Moon } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@company.com", password: "admin123" },
  { role: "HR", email: "hr@company.com", password: "hr123" },
  { role: "Manager", email: "manager@company.com", password: "manager123" },
  { role: "Employee", email: "employee@company.com", password: "employee123" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.friendlyMessage || err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50/70 via-slate-50 to-gray-100 px-3 py-6 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-4">
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:right-5 sm:top-5"
        title="Toggle dark/light theme"
      >
        {resolvedTheme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 md:grid md:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-5 text-white sm:p-7 md:p-8 lg:p-10">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-md backdrop-blur-sm sm:mb-6 sm:h-12 sm:w-12">
              <CalendarCheck size={24} className="sm:size-[26px]" />
            </div>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              LeaveTrack
              <br />
              Enterprise Management
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-100/90">
              Unified platform for live check-in / check-out tracking, leave approvals, employee directory, and real-time attendee monitoring.
            </p>
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-4 text-xs text-primary-100/80 sm:text-xs">
            <li className="flex items-center gap-2">✓ Live Check-In / Check-Out with instant duration timer</li>
            <li className="flex items-center gap-2">✓ Real-time HR &amp; Manager Attendee Follow feed</li>
            <li className="flex items-center gap-2">✓ Role-based permissions (Admin, HR, Manager, Employee)</li>
            <li className="flex items-center gap-2">✓ Full Dark Mode &amp; Mobile Responsive Experience</li>
          </ul>
        </div>

        <div className="p-4 sm:p-6 lg:p-10">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[2rem]">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 text-sm font-semibold sm:!py-2.5">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              Quick Demo Login Accounts
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-xs transition-all hover:border-primary-400 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:bg-primary-950/40"
                >
                  <span className="block font-bold text-gray-900 dark:text-white">{acc.role}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-gray-400 dark:text-slate-400">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

