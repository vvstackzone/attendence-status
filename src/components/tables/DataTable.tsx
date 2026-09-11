import type { ReactNode } from "react";
import { EmptyState } from "../common/States";

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, rows, keyFn, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title="No records found" message={emptyMessage || "Try adjusting your search or filters."} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-200/90 bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            {columns.map((col) => (
              <th key={col.header} className={`whitespace-nowrap px-4 py-3 font-semibold ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/70">
          {rows.map((row) => (
            <tr key={keyFn(row)} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/50">
              {columns.map((col) => (
                <td key={col.header} className={`whitespace-nowrap px-4 py-3 text-gray-700 dark:text-slate-300 ${col.className || ""}`}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
