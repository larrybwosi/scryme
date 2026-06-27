import { BatchStatus } from "@/types/bakery";

export const getStatusStyles = (status: BatchStatus) => {
  switch (status) {
    case BatchStatus.PLANNED:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    case BatchStatus.IN_PROGRESS:
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
    case BatchStatus.COMPLETED:
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50";
    case BatchStatus.CANCELLED:
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
  }
};
