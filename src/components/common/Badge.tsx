import type { ReactNode } from "react";

const TONE_CLASSES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800/50",
  red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-800/50",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-800/50",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-800/50",
  gray: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80 dark:bg-violet-950/70 dark:text-violet-300 dark:ring-violet-800/50",
};

// Central mapping so every status word in the app renders a consistent color.
const STATUS_TONE: Record<string, keyof typeof TONE_CLASSES> = {
  Present: "green",
  Approved: "green",
  Active: "green",
  "Checked In": "green",
  Absent: "red",
  Rejected: "red",
  "Not Checked In": "red",
  "On Notice": "amber",
  "Half Day": "amber",
  Late: "amber",
  Pending: "amber",
  "On Leave": "blue",
  "Work From Home": "blue",
  "Checked Out": "blue",
  Cancelled: "gray",
  Inactive: "gray",
  Resigned: "gray",
  "Week Off": "gray",
  Holiday: "purple",
};

export default function Badge({ children, tone }: { children: ReactNode; tone?: keyof typeof TONE_CLASSES }) {
  const label = typeof children === "string" ? children : "";
  const resolvedTone = tone || STATUS_TONE[label] || "gray";
  return <span className={`badge ${TONE_CLASSES[resolvedTone]}`}>{children}</span>;
}
