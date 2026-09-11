import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox, Loader2, ServerCrash } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 dark:text-slate-500">
      <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
      <p className="text-xs sm:text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/70 dark:text-rose-400">
        <ServerCrash size={24} />
      </div>
      <p className="max-w-sm text-xs sm:text-sm text-gray-600 dark:text-slate-300">{message}</p>
      {onRetry && (
        <button className="btn-secondary text-xs" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon size={26} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</p>
        {message && <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-slate-400">{message}</p>}
      </div>
      {action}
    </div>
  );
}
