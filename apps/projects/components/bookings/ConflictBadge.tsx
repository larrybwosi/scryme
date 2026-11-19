"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

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
  const isConflictPresent = hasConflict || conflicts.length > 0;

  if (!isConflictPresent) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success border border-status-success/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        No Conflicts
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-warning/10 text-status-warning border border-status-warning/20 w-fit">
        <AlertTriangle className="w-3.5 h-3.5" />
        {conflicts.length} Warning{conflicts.length > 1 ? "s" : ""} (Override Allowed)
      </span>
      {conflicts.length > 0 && (
        <ul className="text-xs text-status-warning/90 space-y-1 pl-1">
          {conflicts.map((c, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-status-warning shrink-0 mt-0.5" />
              <span>{c.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
