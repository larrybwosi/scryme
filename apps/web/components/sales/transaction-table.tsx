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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number, currencyCode = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    COMPLETED: "bg-emerald-600",
    PENDING_CONFIRMATION: "bg-amber-500",
    CONFIRMED: "bg-blue-600",
    PROCESSING: "bg-violet-600",
    CANCELLED: "bg-red-500",
    DRAFT: "bg-zinc-400",
  };
  const dot = dotColor[status] ?? dotColor.DRAFT;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-700">
      <span className={cn("h-[6px] w-[6px] shrink-0 rounded-full", dot)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "border-zinc-300 bg-zinc-50 text-zinc-700",
    UNPAID: "border-zinc-300 bg-zinc-50 text-zinc-500",
    PARTIALLY_PAID: "border-zinc-300 bg-zinc-50 text-zinc-600",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded px-1.5 text-[11px] font-medium",
        styles[status] ?? "border-zinc-300 bg-zinc-50 text-zinc-500",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
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
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order, customer, or location…"
              className="h-7 border-zinc-200 bg-white pl-8 text-xs placeholder:text-zinc-400 focus-visible:ring-zinc-400"
            />
          </div>

          {/* Pill filters */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors",
                  activeFilter === f.value
                    ? "bg-zinc-900 text-white ring-zinc-900"
                    : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50",
                )}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px]">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="w-9 border-r border-zinc-200 px-2 py-1.5 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer rounded-sm border-zinc-300 accent-zinc-700"
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Order
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Date
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Customer
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Location
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Amount
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="border-r border-zinc-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Payment
                </th>
                <th className="w-10 px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {""}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-zinc-400">
                      <Inbox className="h-7 w-7" />
                      <p className="text-xs">
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
                        isSelected ? "bg-zinc-100/70" : "hover:bg-zinc-50",
                      )}>
                      {/* Checkbox */}
                      <td className="border-r border-zinc-100 px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(trx.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-zinc-300 accent-zinc-700"
                        />
                      </td>

                      {/* Order */}
                      <td
                        className="cursor-pointer border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap"
                        onClick={() => setViewTransactionId(trx.id)}>
                        <span className="font-mono text-[12.5px] font-medium text-zinc-900 hover:underline">
                          {trx.number}
                        </span>
                        <span className="ml-2 rounded bg-zinc-100 px-1 py-[1px] text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                          {trx.type.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap text-[12px] text-zinc-500">
                        {format(new Date(trx.createdAt), "MMM d, HH:mm")}
                      </td>

                      {/* Customer */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap">
                        <span className="text-[12.5px] font-medium text-zinc-900">
                          {custName}
                        </span>
                        {trx.customer?.email && (
                          <span className="ml-1.5 text-[11px] text-zinc-400">
                            {trx.customer.email}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap text-[12px] text-zinc-500">
                        {trx.location?.name ?? "—"}
                      </td>

                      {/* Amount */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 text-right whitespace-nowrap">
                        <span className="text-[12.5px] font-semibold text-zinc-900">
                          {formatCurrency(trx.finalTotal, trx.currencyCode)}
                        </span>
                        <span className="ml-1.5 text-[11px] text-zinc-400">
                          {trx._count?.items ?? 0} itm
                        </span>
                      </td>

                      {/* Status */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap">
                        <StatusBadge status={trx.status} />
                      </td>

                      {/* Payment */}
                      <td className="border-r border-zinc-100 px-3 py-1.5 whitespace-nowrap">
                        <PaymentStatusBadge status={trx.paymentStatus} />
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-1.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded text-zinc-400 hover:text-zinc-700">
                              <MoreHorizontal className="h-3.5 w-3.5" />
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
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-2">
          <span className="text-[11px] text-zinc-500">
            Showing {filtered.length} of {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded border-zinc-200 text-zinc-500">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            {[1, 2, 3].map(p => (
              <Button
                key={p}
                variant={p === 1 ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-6 w-6 rounded text-[11px]",
                  p === 1
                    ? "bg-zinc-900 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-500",
                )}>
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded border-zinc-200 text-zinc-500">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ── Bulk action bar ──────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-100 px-4 py-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs text-zinc-700">
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {selectedIds.size}
              </span>
              <span>transactions selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-zinc-300 bg-white text-[11px]">
                <Truck className="h-3 w-3" /> Mark dispatched
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-zinc-300 bg-white text-[11px]">
                Change status
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="h-6 w-6 text-zinc-400 hover:text-zinc-700">
                <X className="h-3 w-3" />
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
