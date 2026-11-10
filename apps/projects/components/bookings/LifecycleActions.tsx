"use client";

import { Textarea } from "@repo/ui/components/ui/textarea";
import React, { useState } from "react";
import { CheckCircle2, UserPlus, Play, CheckSquare, XCircle, AlertTriangle } from "lucide-react";

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
  REQUESTED: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  PENDING: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  CONFIRMED: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  ASSIGNED: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  SCHEDULED: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  IN_PROGRESS: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  CANCELLED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  NOSHOW: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
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
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50"
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
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-rose-500/20 text-rose-400 border border-outline-variant/30 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-on-surface mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Cancel Booking
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Are you sure you want to cancel this booking? Please provide an optional cancellation reason.
            </p>
            <Textarea
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface placeholder:text-outline focus-visible:border-primary resize-none h-20 mb-4"
              placeholder="e.g., Customer requested rescheduling, sickness, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  await onTransition("CANCELLED", cancelReason);
                  setCancelModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
