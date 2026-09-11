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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50/70 via-slate-50 to-gray-100 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Theme toggle floating button */}
      <button
        onClick={toggleTheme}
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        title="Toggle dark/light theme"
      >
        {resolvedTheme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 md:grid md:grid-cols-2">
        {/* Left panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-10 text-white md:flex">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-md">
              <CalendarCheck size={26} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug">
              LeaveTrack
              <br />
              Enterprise Management
            </h1>
            <p className="mt-3 text-sm text-primary-100/90 leading-relaxed">
              Unified platform for live check-in / check-out tracking, leave approvals, employee directory, and real-time attendee monitoring.
            </p>
          </div>
          <ul className="space-y-2.5 text-xs text-primary-100/80 border-t border-white/10 pt-4">
            <li className="flex items-center gap-2">✓ Live Check-In / Check-Out with instant duration timer</li>
            <li className="flex items-center gap-2">✓ Real-time HR &amp; Manager Attendee Follow feed</li>
            <li className="flex items-center gap-2">✓ Role-based permissions (Admin, HR, Manager, Employee)</li>
            <li className="flex items-center gap-2">✓ Full Dark Mode &amp; Mobile Responsive Experience</li>
          </ul>
        </div>

        {/* Right panel */}
        <div className="p-6 sm:p-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in to your account</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
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

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-2.5 font-semibold text-sm">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Demo account selector chips */}
          <div className="mt-6 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              Quick Demo Login Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-xs transition-all hover:border-primary-400 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:bg-primary-950/40"
                >
                  <span className="block font-bold text-gray-900 dark:text-white">{acc.role}</span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-400 truncate block">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
