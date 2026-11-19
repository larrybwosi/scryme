"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { FOCUS_RING } from "@/lib/navigation";

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
  const projectedTotal = currentAssignedHours + additionalHours;
  const projectedPercent = Math.round(
    (projectedTotal / Math.max(1, totalCapacityHours)) * 100,
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      title="Workload capacity warning"
      description="Member allocation limit exceeded"
      className="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-sm px-3 py-1.5 font-body-sm text-body-sm text-outline transition-colors hover:text-on-surface ${FOCUS_RING}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-sm bg-status-warning px-4 py-1.5 font-headline-sm text-body-sm font-medium text-surface shadow-sm transition-colors hover:bg-status-warning/90 ${FOCUS_RING}`}
          >
            Proceed and assign anyway
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-5 py-4 font-body-sm text-body-sm text-on-surface-variant">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-warning/20 text-status-warning">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <p>
          Assigning this task to{" "}
          <strong className="text-on-surface">{memberName}</strong> will increase
          their scheduled allocation to{" "}
          <strong className="text-status-warning">{projectedTotal}h</strong>{" "}
          against a weekly capacity of{" "}
          <strong className="text-on-surface">{totalCapacityHours}h</strong> (
          {projectedPercent}% capacity).
        </p>
        <div className="flex items-center justify-between gap-2 rounded-sm border border-outline-variant bg-surface-container p-3 text-[12px]">
          <span>
            Current hours: <strong>{currentAssignedHours}h</strong>
          </span>
          <span>
            + Task: <strong>{additionalHours}h</strong>
          </span>
          <span>
            Projected:{" "}
            <strong className="text-status-warning">{projectedPercent}%</strong>
          </span>
        </div>
        <p className="text-[11px] text-outline">
          As a manager, you may proceed to override this threshold or cancel to
          assign another squad member.
        </p>
      </div>
    </Dialog>
  );
}
