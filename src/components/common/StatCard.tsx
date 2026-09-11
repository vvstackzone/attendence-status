import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "green" | "red" | "amber" | "purple";
  suffix?: string;
}

const TONE_CLASSES: Record<string, string> = {
  primary: "bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400 dark:border dark:border-primary-800/40",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border dark:border-emerald-800/40",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 dark:border dark:border-rose-800/40",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 dark:border dark:border-amber-800/40",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400 dark:border dark:border-violet-800/40",
};

export default function StatCard({ label, value, icon: Icon, tone = "primary", suffix }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-4 sm:p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${TONE_CLASSES[tone]}`}>
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
          {suffix && <span className="ml-1 text-xs sm:text-sm font-normal text-gray-400 dark:text-slate-500">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
