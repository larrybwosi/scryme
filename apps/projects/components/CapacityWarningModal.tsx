"use client";

import React from "react";

interface CapacityWarningModalProps {
  isOpen: boolean;
  memberName: string;
  currentAssignedHours: number;
  additionalHours: number;
  totalCapacityHours: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CapacityWarningModal({
  isOpen,
  memberName,
  currentAssignedHours,
  additionalHours,
  totalCapacityHours,
  onConfirm,
  onCancel,
}: CapacityWarningModalProps) {
  if (!isOpen) return null;

  const projectedTotal = currentAssignedHours + additionalHours;
  const projectedPercent = Math.round((projectedTotal / Math.max(1, totalCapacityHours)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-amber-500/30 p-6 shadow-2xl">
        <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/30">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Workload Capacity Warning
            </h3>
            <p className="text-[12px] text-outline">Member allocation limit exceeded</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-4 text-body-sm text-on-surface-variant">
          <p>
            Assigning this task to <strong className="text-on-surface">{memberName}</strong> will increase their scheduled allocation to{" "}
            <strong className="text-amber-400">{projectedTotal}h</strong> against a weekly capacity of{" "}
            <strong className="text-on-surface">{totalCapacityHours}h</strong> ({projectedPercent}% capacity).
          </p>
          <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 flex justify-between items-center text-[12px]">
            <span>Current Hours: <strong>{currentAssignedHours}h</strong></span>
            <span>+ Task: <strong>{additionalHours}h</strong></span>
            <span>Projected: <strong className="text-amber-400">{projectedPercent}%</strong></span>
          </div>
          <p className="text-[11px] text-outline">
            As a manager, you may proceed to override this threshold or cancel to assign to another squad member.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-medium text-body-sm transition-colors shadow-sm"
          >
            Proceed & Assign Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
