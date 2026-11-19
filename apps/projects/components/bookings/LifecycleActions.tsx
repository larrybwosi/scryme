"use client";

import { Textarea } from "@repo/ui/components/ui/textarea";
import React, { useState } from "react";
import { CheckCircle2, UserPlus, Play, CheckSquare, XCircle, AlertTriangle } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { FOCUS_RING } from "@/lib/navigation";

export type BookingStatus =
  | "REQUESTED"
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NOSHOW";

interface LifecycleActionsProps {
  currentStatus: BookingStatus;
  bookingId: string;
  onTransition: (targetStatus: BookingStatus, reason?: string, overrideConflict?: boolean) => Promise<void>;
  isLoading?: boolean;
}

const statusColorMap: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  REQUESTED: { bg: "bg-status-warning/10", text: "text-status-warning", border: "border-status-warning/20" },
  PENDING: { bg: "bg-status-info/10", text: "text-status-info", border: "border-status-info/20" },
  CONFIRMED: { bg: "bg-status-info/10", text: "text-status-info", border: "border-status-info/20" },
  ASSIGNED: { bg: "bg-status-info/10", text: "text-status-info", border: "border-status-info/20" },
  SCHEDULED: { bg: "bg-status-info/10", text: "text-status-info", border: "border-status-info/20" },
  IN_PROGRESS: { bg: "bg-status-warning/10", text: "text-status-warning", border: "border-status-warning/20" },
  COMPLETED: { bg: "bg-status-success/10", text: "text-status-success", border: "border-status-success/20" },
  CANCELLED: { bg: "bg-status-critical/10", text: "text-status-critical", border: "border-status-critical/20" },
  NOSHOW: { bg: "bg-status-neutral/10", text: "text-status-neutral", border: "border-status-neutral/20" },
};

export function LifecycleActions({
  currentStatus,
  bookingId,
  onTransition,
  isLoading = false,
}: LifecycleActionsProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const nextActionMap: Partial<
    Record<BookingStatus, { next: BookingStatus; label: string; icon: React.ComponentType<{ className?: string }> }>
  > = {
    REQUESTED: { next: "CONFIRMED", label: "Confirm Booking", icon: CheckCircle2 },
    PENDING: { next: "CONFIRMED", label: "Confirm Booking", icon: CheckCircle2 },
    CONFIRMED: { next: "ASSIGNED", label: "Assign Staff", icon: UserPlus },
    ASSIGNED: { next: "IN_PROGRESS", label: "Start Service", icon: Play },
    SCHEDULED: { next: "IN_PROGRESS", label: "Start Service", icon: Play },
    IN_PROGRESS: { next: "COMPLETED", label: "Complete Service", icon: CheckSquare },
  };

  const nextAction = nextActionMap[currentStatus];
  const canCancel = currentStatus !== "COMPLETED" && currentStatus !== "CANCELLED";
  const colors = statusColorMap[currentStatus] || statusColorMap.REQUESTED;
  const NextIcon = nextAction?.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Current Status Pill */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {currentStatus}
      </span>

      {/* Primary Lifecycle Forward Transition */}
      {nextAction && NextIcon && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onTransition(nextAction.next, undefined, true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-surface hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <NextIcon className="w-3.5 h-3.5" />
          {nextAction.label}
        </button>
      )}

      {/* Cancel Option */}
      {canCancel && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setCancelModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-status-critical/20 text-status-critical border border-outline-variant/30 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      )}

      <Dialog
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel booking"
        description="Are you sure you want to cancel this booking? You can add an optional cancellation reason."
        className="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className={`rounded-sm px-3 py-1.5 font-body-sm text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container ${FOCUS_RING}`}
            >
              Go back
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                await onTransition("CANCELLED", cancelReason);
                setCancelModalOpen(false);
              }}
              className={`rounded-sm bg-status-critical px-3 py-1.5 font-headline-sm text-xs font-medium text-surface transition-colors hover:bg-status-critical/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              Confirm cancellation
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 px-5 py-4">
          <p className="flex items-center gap-2 font-body-sm text-xs text-on-surface-variant">
            <AlertTriangle className="h-4 w-4 text-status-critical" aria-hidden />
            This action updates the booking lifecycle.
          </p>
          <Textarea
            className="h-20 w-full resize-none rounded-sm border border-outline-variant bg-surface-container-low p-2.5 text-xs text-on-surface placeholder:text-outline focus-visible:border-primary"
            placeholder="e.g., Customer requested rescheduling, sickness, etc."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
