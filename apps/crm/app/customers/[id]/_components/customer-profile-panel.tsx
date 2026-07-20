"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  Edit2,
  ShoppingCart,
  DollarSign,
  FileText,
  User,
  Building2,
  Tag,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerWithRelations } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { CustomerForm } from "../../_components/customer-form";
import useSWR from "swr";
import { getLocations } from "../../../actions/customers";
import { useRouter } from "next/navigation";

interface CustomerProfilePanelProps {
  customer: CustomerWithRelations;
}

function HealthRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "var(--status-success)"
      : score >= 50
        ? "var(--status-warning)"
        : "var(--destructive)";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

export function CustomerProfilePanel({ customer }: CustomerProfilePanelProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { organizationId } = useOrg();

  const { data: locations = [] } = useSWR(["locations-for-select"], () =>
    getLocations(),
  );

  const defaultBranch = locations.find(
    (loc: any) => loc.id === customer.defaultLocationId,
  );

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalRevenue = customer.transactions.reduce(
    (sum, t) => sum + Number(t.finalTotal),
    0,
  );
  const totalOrders = customer.transactions.length;
  const openInvoices = customer.invoices.filter(
    (i) => i.status !== "PAID" && i.status !== "VOID",
  ).length;

  // Calculate Health Score based on order frequency
  // Logic:
  // - More than 5 orders in the last 30 days: 100
  // - More than 2 orders in the last 30 days: 85
  // - More than 1 order in the last 90 days: 60
  // - Otherwise: 40
  // - Deduct 10 points for each open invoice
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const last90Days = new Date();
  last90Days.setDate(last90Days.getDate() - 90);

  const ordersLast30Days = customer.transactions.filter(
    (t) => new Date(t.createdAt) >= last30Days,
  ).length;
  const ordersLast90Days = customer.transactions.filter(
    (t) => new Date(t.createdAt) >= last90Days,
  ).length;

  let baseScore = 40;
  if (ordersLast30Days >= 5) baseScore = 100;
  else if (ordersLast30Days >= 2) baseScore = 85;
  else if (ordersLast90Days >= 1) baseScore = 60;

  const healthScore = Math.max(0, baseScore - openInvoices * 10);

  const defaultAddress =
    customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
  const addressString = defaultAddress
    ? `${defaultAddress.street1}${defaultAddress.street2 ? `, ${defaultAddress.street2}` : ""}, ${defaultAddress.city}, ${defaultAddress.country}`
    : "No address provided";

  const acquisitionChannelLabels: Record<string, string> = {
    MEMBER_CREATED: "Member Created",
    SELF_REGISTERED: "Self Registered",
    IMPORTED: "Imported",
    API_CREATED: "API Created",
    OTHER: "Other",
  };

  const formattedAcquisition =
    acquisitionChannelLabels[customer.creationType || "MEMBER_CREATED"] ||
    "Member Created";
  const timeAgo = formatDistanceToNow(new Date(customer.createdAt), {
    addSuffix: true,
  });

  return (
    <aside className="w-[300px] flex-shrink-0 flex flex-col gap-4">
      {/* Identity Card */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xl">
            {initials}
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Edit2 size={13} className="text-muted-foreground" />
          </button>
        </div>

        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent className="sm:max-w-[440px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Customer</SheetTitle>
            </SheetHeader>
            <CustomerForm
              initialData={{
                id: customer.id,
                name: customer.name,
                email: customer.email || "",
                phone: customer.phone || "",
                company: customer.company || "",
                customerType: customer.customerType || "B2C",
                taxId: customer.taxId || "",
                isActive: customer.isActive,
                deliveryNotes: customer.deliveryNotes || "",
                customId: customer.customId || "",
                creationType: customer.creationType || "MEMBER_CREATED",
                defaultLocationId: customer.defaultLocationId || "",
              }}
              onSuccess={() => {
                setIsEditOpen(false);
                router.refresh();
              }}
            />
          </SheetContent>
        </Sheet>

        <div className="mb-3">
          <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2 flex-wrap">
            {customer.name}
            {customer.customId && (
              <span className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold">
                {customer.customId}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">
              {customer.company || "Private"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <StatusBadge status={customer.isActive ? "Active" : "Inactive"} dot />
          <StatusBadge status={customer.customerType || "B2C"} />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <Mail size={13} className="text-muted-foreground flex-shrink-0" />
            <a
              href={`mailto:${customer.email || ""}`}
              className="text-primary hover:underline truncate"
            >
              {customer.email || "N/A"}
            </a>
          </div>
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <Phone size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{customer.phone || "N/A"}</span>
          </div>
          <div className="flex items-start gap-2.5 text-[12.5px]">
            <MapPin
              size={13}
              className="text-muted-foreground flex-shrink-0 mt-0.5"
            />
            <span className="text-muted-foreground">{addressString}</span>
          </div>
          {defaultBranch && (
            <div className="flex items-center gap-2.5 text-[12.5px]">
              <ExternalLink
                size={13}
                className="text-muted-foreground flex-shrink-0"
              />
              <span className="text-muted-foreground">
                Default Branch:{" "}
                <span className="font-semibold text-foreground">
                  {defaultBranch.name}
                </span>
              </span>
            </div>
          )}
          <div className="flex items-start gap-2.5 text-[12.5px] border-t border-border/60 pt-2.5 mt-2">
            <Clock
              size={13}
              className="text-muted-foreground flex-shrink-0 mt-0.5"
            />
            <div className="text-[12px]">
              <div className="text-muted-foreground">
                Acquired:{" "}
                <span className="font-semibold text-foreground">
                  {formattedAcquisition}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Registered {timeAgo}
              </div>
            </div>
          </div>
          {customer.deliveryNotes && (
            <div className="text-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 rounded-lg p-2.5 mt-2.5">
              <span className="font-semibold block mb-0.5">
                Delivery Notes:
              </span>
              <span className="text-muted-foreground line-clamp-3">
                {customer.deliveryNotes}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {customer.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={11} className="text-muted-foreground" />
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customer.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10.5px] font-medium bg-accent text-accent-foreground border border-border px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Stats
        </h3>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign size={13} className="text-primary" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">
                Total Revenue
              </span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-status-info/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={13} className="text-status-info" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">
                Total Orders
              </span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">
              {totalOrders}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-status-warning/10 flex items-center justify-center flex-shrink-0">
                <FileText size={13} className="text-status-warning" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">
                Open Invoices
              </span>
            </div>
            <span
              className={cn(
                "text-[13px] font-bold flex-shrink-0",
                openInvoices > 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {openInvoices}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Star size={13} className="text-amber-500" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">
                Loyalty Points
              </span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">
              {customer.loyaltyPoints.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Account Health
        </h3>
        <div className="flex items-center gap-4">
          <HealthRing score={healthScore} />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              {healthScore >= 80
                ? "Excellent"
                : healthScore >= 65
                  ? "Good"
                  : healthScore >= 50
                    ? "Fair"
                    : "At Risk"}
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Score out of 100
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-medium text-foreground">
              {healthScore >= 80
                ? "High"
                : healthScore >= 50
                  ? "Medium"
                  : "Low"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Payment Risk</span>
            <span
              className={cn(
                "font-medium",
                openInvoices > 0
                  ? "text-status-warning"
                  : "text-status-success",
              )}
            >
              {openInvoices > 0 ? "Moderate" : "Low"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
