import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";
import { useAsync } from "../../hooks/useAsync";
import * as activityService from "../../services/activityService";
import { formatDateTime, relativeTime } from "../../utils/dateUtils";
import { History } from "lucide-react";

export default function ActivityHistoryPage() {
  const activitiesQ = useAsync(activityService.getActivities, []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (activitiesQ.data || [])
      .filter(
        (a) => !q || a.description.toLowerCase().includes(q) || a.userName.toLowerCase().includes(q) || a.action.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activitiesQ.data, search]);

  return (
    <div className="space-y-4">
      <PageHeader title="System Activity &amp; Audit Logs" subtitle="Comprehensive timeline of attendance, check-ins, leaves, and management actions" />

      <div className="card p-3.5 sm:w-80">
        <SearchInput value={search} onChange={setSearch} placeholder="Search activity, user or action..." />
      </div>

      <div className="card p-6">
        {activitiesQ.loading ? (
          <LoadingState label="Loading system activity logs..." />
        ) : activitiesQ.error ? (
          <ErrorState message={activitiesQ.error} onRetry={activitiesQ.refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No activity recorded yet" />
        ) : (
          <ol className="relative space-y-6 border-l-2 border-primary-100 dark:border-slate-800 pl-6 ml-2">
            {filtered.map((a) => (
              <li key={a.id} className="relative group">
                <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary-600 shadow-sm dark:border-slate-900 dark:bg-primary-500" />
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-colors hover:bg-gray-50 dark:border-slate-800/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {a.action}
                    </p>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-slate-400" title={formatDateTime(a.timestamp)}>
                      {relativeTime(a.timestamp)} • {formatDateTime(a.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{a.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
