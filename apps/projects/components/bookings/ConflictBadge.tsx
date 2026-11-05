"use client";

import React from "react";

interface ConflictItem {
  type: string;
  message: string;
  resourceName?: string;
}

interface ConflictBadgeProps {
  conflicts?: ConflictItem[];
  hasConflict?: boolean;
}

export function ConflictBadge({ conflicts = [], hasConflict = false }: ConflictBadgeProps) {
  if (!hasConflict && conflicts.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="material-symbols-outlined text-[14px]">check_circle</span>
        No Conflicts
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
        <span className="material-symbols-outlined text-[14px]">warning</span>
        {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Detected
      </span>
      {conflicts.length > 0 && (
        <ul className="text-xs text-rose-300 space-y-0.5 pl-1">
          {conflicts.map((c, idx) => (
            <li key={idx} className="flex items-start gap-1">
              <span className="text-[10px] text-rose-400 mt-0.5">•</span>
              <span>{c.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
