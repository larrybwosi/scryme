import React from "react";
import { cn } from "@repo/ui/lib/utils";

type BadgeVariant =
  | "Active"
  | "Inactive"
  | "VIP"
  | "Lead"
  | "Paid"
  | "Sent"
  | "Draft"
  | "Overdue"
  | "Void"
  | "Delivered"
  | "In Transit"
  | "Pending"
  | "Cancelled"
  | "Failed"
  | "Completed"
  | "Processing"
  | "Refunded"
  | "High"
  | "Medium"
  | "Low"
  | "B2C"
  | "B2B"
  | "Enterprise"
  | "Phone"
  | "Email"
  | "In-Person"
  | "Chat"
  | "Video Call"
  | "Inbound"
  | "Outbound"
  | "POS"
  | "Online"
  | string;

const variantStyles: Record<string, string> = {
  // Customer status
  Active: "bg-status-success/10 text-status-success border-status-success/20",
  Inactive: "bg-muted text-muted-foreground border-border",
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Lead: "bg-blue-50 text-blue-700 border-blue-200",
  // Invoice
  Paid: "bg-status-success/10 text-status-success border-status-success/20",
  Sent: "bg-status-info/10 text-status-info border-status-info/20",
  Draft: "bg-muted text-muted-foreground border-border",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
  Void: "bg-muted text-muted-foreground border-border",
  // Delivery
  Delivered:
    "bg-status-success/10 text-status-success border-status-success/20",
  "In Transit": "bg-status-info/10 text-status-info border-status-info/20",
  Pending: "bg-status-warning/10 text-status-warning border-status-warning/20",
  Cancelled: "bg-muted text-muted-foreground border-border",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
  // Orders
  Completed:
    "bg-status-success/10 text-status-success border-status-success/20",
  Processing: "bg-primary/10 text-primary border-primary/20",
  Refunded: "bg-muted text-muted-foreground border-border",
  // Priority
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-status-warning/10 text-status-warning border-status-warning/20",
  Low: "bg-muted text-muted-foreground border-border",
  // Type
  B2C: "bg-purple-50 text-purple-700 border-purple-200",
  B2B: "bg-blue-50 text-blue-700 border-blue-200",
  Enterprise: "bg-primary/10 text-primary border-primary/20",
  // Channel
  Phone: "bg-green-50 text-green-700 border-green-200",
  Email: "bg-sky-50 text-sky-700 border-sky-200",
  "In-Person": "bg-purple-50 text-purple-700 border-purple-200",
  Chat: "bg-teal-50 text-teal-700 border-teal-200",
  "Video Call": "bg-indigo-50 text-indigo-700 border-indigo-200",
  // Direction
  Inbound: "bg-status-success/10 text-status-success border-status-success/20",
  Outbound: "bg-blue-50 text-blue-700 border-blue-200",
  // Order type
  POS: "bg-orange-50 text-orange-700 border-orange-200",
  Online: "bg-cyan-50 text-cyan-700 border-cyan-200",
  // CRM Status
  customer: "bg-status-success/10 text-status-success border-status-success/20",
  lead: "bg-blue-50 text-blue-700 border-blue-200",
  qualified: "bg-status-info/10 text-status-info border-status-info/20",
  new: "bg-purple-50 text-purple-700 border-purple-200",
};

interface StatusBadgeProps {
  status: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  dot = false,
}: StatusBadgeProps) {
  const normalizedStatus =
    typeof status === "string" ? status.toLowerCase() : status;
  const styles =
    variantStyles[status] ??
    variantStyles[normalizedStatus] ??
    "bg-muted text-muted-foreground border-border";

  const label =
    typeof status === "string"
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium border rounded-md whitespace-nowrap",
        size === "sm"
          ? "text-[10.5px] px-1.5 py-0.5"
          : "text-[11.5px] px-2 py-0.5",
        styles,
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full flex-shrink-0",
            size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
            "bg-current",
          )}
        />
      )}
      {label}
    </span>
  );
}
