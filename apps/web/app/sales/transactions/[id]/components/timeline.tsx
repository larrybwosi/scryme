"use client";

import React from "react";
import { format } from "date-fns";
import {
  FileEdit,
  ShoppingCart,
  CheckCircle2,
  Package,
  PackageCheck,
  XCircle,
  Calendar,
  Send,
  Check,
  AlertTriangle,
  Play,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";

interface OrderTimelineProps {
  transaction: any;
}

interface TimelineStage {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

// 1. POS_SALE (Over-the-counter timeline)
const POS_TIMELINE_STAGES: TimelineStage[] = [
  { key: "DRAFT", label: "Draft", icon: FileEdit, description: "Sale draft created." },
  { key: "COMPLETED", label: "Completed & Paid", icon: CheckCircle2, description: "Payment received and goods handed over." },
];

// 2. QUOTE
const QUOTE_TIMELINE_STAGES: TimelineStage[] = [
  { key: "DRAFT", label: "Draft", icon: FileEdit, description: "Quote drafted." },
  { key: "QUOTE_SENT", label: "Sent", icon: Send, description: "Quote sent to customer." },
  { key: "QUOTE_ACCEPTED", label: "Accepted", icon: Check, description: "Quote accepted by customer." },
];

// 3. SERVICE_BOOKING
const SERVICE_TIMELINE_STAGES: TimelineStage[] = [
  { key: "DRAFT", label: "Draft", icon: FileEdit, description: "Booking initiated." },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, description: "Appointment confirmed and scheduled." },
  { key: "COMPLETED", label: "Completed", icon: PackageCheck, description: "Service performed successfully." },
];

// 4. Default: SALES_ORDER, ONLINE_ORDER, SUBSCRIPTION (Full logistics)
const DEFAULT_TIMELINE_STAGES: TimelineStage[] = [
  { key: "DRAFT", label: "Draft", icon: FileEdit, description: "Order created but not yet submitted." },
  { key: "PENDING_CONFIRMATION", label: "Placed", icon: ShoppingCart, description: "Waiting for review and approval." },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, description: "Approved and queued for fulfillment." },
  { key: "PROCESSING", label: "Processing", icon: Package, description: "Being picked, packed, or prepared." },
  { key: "COMPLETED", label: "Delivered", icon: PackageCheck, description: "Delivered and closed out." },
];

function getStagesForType(type: string): TimelineStage[] {
  switch (type) {
    case "POS_SALE":
      return POS_TIMELINE_STAGES;
    case "QUOTE":
      return QUOTE_TIMELINE_STAGES;
    case "SERVICE_BOOKING":
      return SERVICE_TIMELINE_STAGES;
    default:
      return DEFAULT_TIMELINE_STAGES;
  }
}

function getStageTimestamp(transaction: any, key: string): string | null {
  const history = transaction?.statusHistory;
  if (Array.isArray(history)) {
    const entry = history.find((h: any) => h.status === key);
    const value = entry?.createdAt || entry?.timestamp;
    if (value) return value;
  }

  const fieldsByStage: Record<string, string[]> = {
    DRAFT: ["createdAt"],
    PENDING_CONFIRMATION: ["placedAt", "submittedAt", "createdAt"],
    CONFIRMED: ["confirmedAt"],
    PROCESSING: ["processingAt", "processedAt"],
    COMPLETED: ["completedAt", "deliveredAt"],
    CANCELLED: ["cancelledAt", "canceledAt"],
    QUOTE_SENT: ["updatedAt"],
    QUOTE_ACCEPTED: ["confirmedAt", "updatedAt"],
  };

  for (const field of fieldsByStage[key] || []) {
    if (transaction?.[field]) return transaction[field];
  }
  return null;
}

export function OrderTimeline({ transaction }: OrderTimelineProps) {
  const currentStatus = transaction.status;
  const transactionType = transaction.type;
  const isCancelled = currentStatus === "CANCELLED";
  const isFailed = currentStatus === "FAILED";

  const stages = getStagesForType(transactionType);
  const statusOrder = stages.map(s => s.key);
  const currentIndex = statusOrder.indexOf(currentStatus);
  const lastIndex = stages.length - 1;

  if (isCancelled || isFailed) {
    const errorAt = getStageTimestamp(transaction, isCancelled ? "CANCELLED" : "FAILED");
    const label = isCancelled ? "Order cancelled" : "Order failed";
    const description = isCancelled
      ? "This order will not continue through fulfillment."
      : "The transaction has failed or been declined.";
    return (
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 shrink-0 rounded-none bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="pt-1">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
          {errorAt && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono mt-2">
              <Calendar className="w-3 h-3" />
              {format(new Date(errorAt), "MMM d, yyyy 'at' hh:mm a")}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {stages.map((stage, idx) => {
        // A stage is complete if current status is further down the line,
        // or if we have reached the exact status (including terminal COMPLETED stage)
        const isComplete =
          idx < currentIndex ||
          (currentIndex !== -1 && idx <= currentIndex && (currentStatus === stage.key || currentStatus === "COMPLETED"));
        const isCurrent = idx === currentIndex && currentStatus !== "COMPLETED" && currentStatus === stage.key;

        // Custom check for QUOTE_SENT / QUOTE_ACCEPTED / COMPLETED fallbacks if index is -1
        const isReached = isComplete || isCurrent || (currentIndex === -1 && getStageTimestamp(transaction, stage.key) !== null);
        const isLast = idx === lastIndex;
        const Icon = stage.icon;
        const timestamp = isReached ? getStageTimestamp(transaction, stage.key) : null;

        return (
          <div key={stage.key} className="flex gap-3.5">
            {/* Rail: icon + connecting line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 shrink-0 rounded-none flex items-center justify-center border-2 transition-colors duration-300 bg-card",
                  isComplete && "bg-emerald-600 border-emerald-600 text-white",
                  isCurrent && "border-zinc-900 dark:border-zinc-100 ring-4 ring-muted text-foreground",
                  !isComplete && !isCurrent && "border-border text-muted-foreground/40",
                )}
              >
                <Icon
                  className={cn("w-4 h-4", isCurrent && "animate-pulse")}
                  strokeWidth={2.25}
                />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-[2px] flex-1 my-1 transition-colors duration-500",
                    isComplete ? "bg-emerald-600" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("flex-1 min-w-0", !isLast && "pb-7")}>
              <div className="flex items-center justify-between gap-2 pt-1.5">
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isComplete && "text-emerald-600 dark:text-emerald-400",
                    isCurrent && "text-foreground",
                    !isComplete && !isCurrent && "text-muted-foreground/50",
                  )}
                >
                  {stage.label}
                </span>
                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 rounded-none border-zinc-900 dark:border-zinc-100 text-foreground shrink-0"
                  >
                    Active
                  </Badge>
                )}
              </div>

              <p
                className={cn(
                  "text-[11px] mt-1 leading-relaxed",
                  isReached ? "text-muted-foreground" : "text-muted-foreground/40",
                )}
              >
                {stage.description}
              </p>

              {timestamp ? (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono mt-1.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(timestamp), "MMM d, yyyy 'at' hh:mm a")}
                </span>
              ) : (
                !isReached && (
                  <span className="text-[10px] text-muted-foreground/40 uppercase font-semibold tracking-wider mt-1.5 block">
                    Pending
                  </span>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
