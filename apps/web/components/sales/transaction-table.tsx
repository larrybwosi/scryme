"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  Truck,
  FileText,
  Download,
  Search,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { format } from "date-fns";
import { AddPaymentModal } from "./add-payment-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { cn } from "@repo/ui/lib/utils";
import { TransactionDetailsSheet } from "./transaction-details-sheet";
import { ManageDeliveryModal } from "./manage-delivery-modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  number: string;
  createdAt: string;
  type: string;
  customer?: { name: string; email?: string } | null;
  location?: { name: string } | null;
  finalTotal: number;
  totalPaid?: number;
  currencyCode?: string;
  status: string;
  paymentStatus: string;
  _count?: { items?: number };
}

interface TransactionTableProps {
  transactions: Transaction[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All orders", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING_CONFIRMATION" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Cancelled", value: "CANCELLED" },
];

const AVATAR_PALETTES = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-700" },
  { bg: "bg-pink-50", text: "text-pink-700" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

function getAvatarPalette(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

function formatCurrency(value: number, currencyCode = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CustomerAvatar({ name }: { name: string }) {
  const palette = getAvatarPalette(name);
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
        palette.bg,
        palette.text,
      )}>
      {getInitials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; badge: string }> = {
    COMPLETED: {
      dot: "bg-emerald-500",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    PENDING_CONFIRMATION: {
      dot: "bg-amber-500",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    },
    CONFIRMED: {
      dot: "bg-blue-500",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
    },
    PROCESSING: {
      dot: "bg-violet-500",
      badge: "border-violet-200 bg-violet-50 text-violet-700",
    },
    CANCELLED: {
      dot: "bg-red-400",
      badge: "border-red-200 bg-red-50 text-red-700",
    },
    DRAFT: {
      dot: "bg-zinc-400",
      badge: "border-zinc-200 bg-zinc-50 text-zinc-600",
    },
  };
  const c = config[status] ?? config.DRAFT;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", c.badge)}>
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", c.dot)} />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    UNPAID: "border-red-200 bg-red-50 text-red-700",
    PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        config[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function PaymentProgress({
  paid,
  total,
  status,
}: {
  paid: number;
  total: number;
  status: string;
}) {
  const pct = Math.min(100, Math.round(((paid ?? 0) / (total || 1)) * 100));
  const fillColor =
    status === "PAID"
      ? "bg-emerald-500"
      : status === "PARTIALLY_PAID"
        ? "bg-amber-400"
        : "bg-zinc-300";
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          fillColor,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TypeTag({ type }: { type: string }) {
  return (
    <span className="mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 ring-1 ring-inset ring-zinc-200">
      {type.replace(/_/g, " ")}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentTrx, setPaymentTrx] = useState<Transaction | null>(null);
  const [viewTransactionId, setViewTransactionId] = useState<string | null>(
    null,
  );
  const [manageDeliveryTrx, setManageDeliveryTrx] =
    useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const selectAllRef = useRef<HTMLInputElement>(null);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t => {
      const matchStatus = activeFilter === "ALL" || t.status === activeFilter;
      const matchSearch =
        !q ||
        t.number.toLowerCase().includes(q) ||
        (t.customer?.name ?? "").toLowerCase().includes(q) ||
        (t.location?.name ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [transactions, search, activeFilter]);

  // ── Select-all indeterminate state ─────────────────────────────────────────
  useEffect(() => {
    if (!selectAllRef.current) return;
    const visibleIds = filtered.map(t => t.id);
    const allChecked =
      visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    const someChecked = visibleIds.some(id => selectedIds.has(id));
    selectAllRef.current.checked = allChecked;
    selectAllRef.current.indeterminate = !allChecked && someChecked;
  }, [filtered, selectedIds]);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filtered.map(t => t.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-5 py-3.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order, customer, or location…"
              className="h-8 border-zinc-200 bg-zinc-50 pl-8 text-sm placeholder:text-zinc-400 focus-visible:ring-[#34A853]"
            />
          </div>

          {/* Pill filters */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                  activeFilter === f.value
                    ? "bg-[#34A853] text-white ring-[#34A853]"
                    : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50",
                )}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="w-11 px-5 py-3 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-[15px] w-[15px] cursor-pointer rounded border-zinc-300 accent-[#34A853]"
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Order
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Location
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Order status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Payment
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-400">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">
                        No transactions match your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(trx => {
                  const isSelected = selectedIds.has(trx.id);
                  const custName = trx.customer?.name ?? "Walk-in Customer";
                  const canPay =
                    trx.type !== "POS_SALE" && trx.paymentStatus !== "PAID";

                  return (
                    <tr
                      key={trx.id}
                      className={cn(
                        "transition-colors",
                        isSelected ? "bg-emerald-50/40" : "hover:bg-zinc-50/60",
                      )}>
                      {/* Checkbox */}
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(trx.id)}
                          className="h-[15px] w-[15px] cursor-pointer rounded border-zinc-300 accent-[#34A853]"
                        />
                      </td>

                      {/* Order */}
                      <td
                        className="cursor-pointer px-4 py-4"
                        onClick={() => setViewTransactionId(trx.id)}>
                        <span className="block font-semibold text-zinc-900 hover:underline">
                          {trx.number}
                        </span>
                        <span className="block text-[11px] text-zinc-400">
                          {format(
                            new Date(trx.createdAt),
                            "MMM d, yyyy · HH:mm",
                          )}
                        </span>
                        <TypeTag type={trx.type} />
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={custName} />
                          <div>
                            <span className="block font-medium text-zinc-900">
                              {custName}
                            </span>
                            {trx.customer?.email && (
                              <span className="block text-[11px] text-zinc-400">
                                {trx.customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin className="h-3 w-3" />
                          {trx.location?.name ?? "—"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 text-right">
                        <span className="block text-sm font-semibold text-zinc-900">
                          {formatCurrency(trx.finalTotal, trx.currencyCode)}
                        </span>
                        <span className="block text-[11px] text-zinc-400">
                          {trx._count?.items ?? 0} item
                          {(trx._count?.items ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Order status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={trx.status} />
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-4">
                        <div className="flex min-w-[130px] flex-col gap-1.5">
                          <PaymentStatusBadge status={trx.paymentStatus} />
                          <PaymentProgress
                            paid={trx.totalPaid ?? 0}
                            total={trx.finalTotal}
                            status={trx.paymentStatus}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-zinc-400">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setViewTransactionId(trx.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            {canPay && (
                              <DropdownMenuItem
                                onClick={() => setPaymentTrx(trx)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Add
                                payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setManageDeliveryTrx(trx)}>
                              <Truck className="mr-2 h-4 w-4" /> Manage delivery
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/sales/documents/${trx.id}?type=invoice`}
                                download>
                                <FileText className="mr-2 h-4 w-4" /> Generate
                                invoice
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/api/sales/documents/${trx.id}?type=receipt`}
                                download>
                                <Download className="mr-2 h-4 w-4" /> Download
                                receipt
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Cancel order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
          <span className="text-xs text-zinc-400">
            Showing {filtered.length} of {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md border-zinc-200 text-zinc-500">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {[1, 2, 3].map(p => (
              <Button
                key={p}
                variant={p === 1 ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-md text-xs",
                  p === 1
                    ? "bg-[#34A853] hover:bg-[#2d9648]"
                    : "border-zinc-200 text-zinc-500",
                )}>
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-md border-zinc-200 text-zinc-500">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Bulk action bar ──────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-5 py-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-sm text-white">
              <span className="rounded-full bg-[#34A853] px-2 py-0.5 text-xs font-semibold text-white">
                {selectedIds.size}
              </span>
              <span className="text-zinc-300">transactions selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-zinc-700 bg-zinc-800 text-xs text-white hover:bg-zinc-700 hover:text-white">
                <Truck className="h-3.5 w-3.5" /> Mark dispatched
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-zinc-700 bg-zinc-800 text-xs text-white hover:bg-zinc-700 hover:text-white">
                Change status
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AddPaymentModal
        transaction={paymentTrx}
        isOpen={!!paymentTrx}
        onClose={() => setPaymentTrx(null)}
      />
      <TransactionDetailsSheet
        transactionId={viewTransactionId}
        isOpen={!!viewTransactionId}
        onClose={() => setViewTransactionId(null)}
      />
      <ManageDeliveryModal
        transaction={manageDeliveryTrx}
        isOpen={!!manageDeliveryTrx}
        onClose={() => setManageDeliveryTrx(null)}
      />
    </>
  );
}
