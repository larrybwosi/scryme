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
  ExternalLink,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";
import { TransactionDetailsSheet } from "./transaction-details-sheet";
import { ManageDeliveryModal } from "./manage-delivery-modal";
import { generateDocumentAction } from "../../app/actions/sales";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  type: string;
  customer?: { name: string; email?: string } | null;
  location?: { name: string } | null;
  finalTotal: number;
  totalPaid?: number;
  currencyCode?: string;
  status: string;
  paymentStatus: string;
  attachments?: any[];
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

function getCleanUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);

      // Remove port if we are on scryme.tech or in production environment
      if (
        parsed.hostname.endsWith("scryme.tech") ||
        process.env.NODE_ENV === "production"
      ) {
        parsed.port = "";
      }

      // If it's localhost or 127.0.0.1 in production, rewrite to public api url
      if (
        process.env.NODE_ENV === "production" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      ) {
        const defaultApiUrl = "https://api.scryme.tech";
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
        const targetUrl = new URL(apiUrl);
        parsed.protocol = targetUrl.protocol;
        parsed.hostname = targetUrl.hostname;
        parsed.port = "";
      }

      return parsed.toString();
    }
  } catch (e) {
    console.error("Failed to parse URL:", url, e);
  }

  return url;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    COMPLETED: "bg-emerald-600 dark:bg-emerald-400",
    PENDING_CONFIRMATION: "bg-amber-500 dark:bg-amber-400",
    CONFIRMED: "bg-blue-600 dark:bg-blue-400",
    PROCESSING: "bg-violet-600 dark:bg-violet-400",
    CANCELLED: "bg-red-500 dark:bg-red-400",
    DRAFT: "bg-zinc-400 dark:bg-zinc-500",
  };
  const dot = dotColor[status] ?? dotColor.DRAFT;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
      <span className={cn("h-[6px] w-[6px] shrink-0 rounded-full", dot)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "border-border bg-muted text-foreground",
    UNPAID: "border-border bg-muted text-muted-foreground",
    PARTIALLY_PAID: "border-border bg-muted text-foreground/70",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded px-1.5 text-[11px] font-medium",
        styles[status] ?? "border-border bg-muted text-muted-foreground",
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
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<string | null>(null);
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

  const handleGenerateDocument = async (
    trxId: string,
    type: "invoice" | "receipt",
  ) => {
    setIsGeneratingDoc(`${trxId}-${type}`);
    try {
      const result = await generateDocumentAction(trxId, type);
      const downloadUrl = result?.shortUrl || result?.fileUrl;
      const cleanDownloadUrl = getCleanUrl(downloadUrl);

      if (cleanDownloadUrl) {
        toast.success(
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-foreground">
              {type.charAt(0).toUpperCase() + type.slice(1)} generated
              successfully
            </span>
            <a
              href={cleanDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline font-medium hover:text-foreground flex items-center gap-1 mt-0.5">
              Click here to download/view{" "}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </div>,
          {
            duration: 15000,
          },
        );
      } else {
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully`,
          {
            duration: 15000,
          },
        );
      }
    } catch (error) {
      toast.error(`Failed to generate ${type}`);
    } finally {
      setIsGeneratingDoc(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-md border border-border bg-card dark:border-zinc-800">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border bg-muted/50 px-4 py-2.5 dark:border-zinc-800">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order, customer, or location…"
              className="h-7 border-border bg-background pl-8 text-xs placeholder:text-muted-foreground focus-visible:ring-ring"
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
                    ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                    : "bg-background text-muted-foreground ring-border hover:bg-accent dark:hover:bg-accent",
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
              <tr className="border-b border-border bg-muted dark:border-zinc-800 dark:bg-zinc-900">
                <th className="w-9 border-r border-border px-2 py-1.5 text-center dark:border-zinc-800">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer rounded-sm border-border accent-foreground dark:border-zinc-600"
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Order
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Date
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Customer
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Location
                </th>
                <th className="border-r border-border px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Amount
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Status
                </th>
                <th className="border-r border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-zinc-800">
                  Payment
                </th>
                <th className="w-10 px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {""}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
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
                        isSelected
                          ? "bg-accent/70 dark:bg-accent/30"
                          : "hover:bg-accent dark:hover:bg-accent/50",
                      )}>
                      {/* Checkbox */}
                      <td className="border-r border-border px-2 py-1.5 text-center dark:border-zinc-800">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(trx.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-border accent-foreground dark:border-zinc-600"
                        />
                      </td>

                      {/* Order */}
                      <td
                        className="cursor-pointer border-r border-border px-3 py-1.5 whitespace-nowrap dark:border-zinc-800"
                        onClick={() => setViewTransactionId(trx.id)}>
                        <span className="font-mono text-[12.5px] font-medium text-foreground hover:underline">
                          {trx.number}
                        </span>
                        <span className="ml-2 rounded bg-muted px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {trx.type.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="border-r border-border px-3 py-1.5 whitespace-nowrap text-[12px] text-muted-foreground dark:border-zinc-800">
                        {format(new Date(trx.createdAt), "MMM d, HH:mm")}
                      </td>

                      {/* Customer */}
                      <td className="border-r border-border px-3 py-1.5 whitespace-nowrap dark:border-zinc-800">
                        <span className="text-[12.5px] font-medium text-foreground">
                          {custName}
                        </span>
                        {trx.customer?.email && (
                          <span className="ml-1.5 text-[11px] text-muted-foreground">
                            {trx.customer.email}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="border-r border-border px-3 py-1.5 whitespace-nowrap text-[12px] text-muted-foreground dark:border-zinc-800">
                        {trx.location?.name ?? "—"}
                      </td>

                      {/* Amount */}
                      <td className="border-r border-border px-3 py-1.5 text-right whitespace-nowrap dark:border-zinc-800">
                        <span className="text-[12.5px] font-semibold text-foreground">
                          {formatCurrency(trx.finalTotal, trx.currencyCode)}
                        </span>
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                          {trx._count?.items ?? 0} itm
                        </span>
                      </td>

                      {/* Status */}
                      <td className="border-r border-border px-3 py-1.5 whitespace-nowrap dark:border-zinc-800">
                        <StatusBadge status={trx.status} />
                      </td>

                      {/* Payment */}
                      <td className="border-r border-border px-3 py-1.5 whitespace-nowrap dark:border-zinc-800">
                        <PaymentStatusBadge status={trx.paymentStatus} />
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-1.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
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
                            {(() => {
                              const invoice = trx.attachments?.find(
                                a =>
                                  a.description === "Invoice" &&
                                  new Date(a.uploadedAt) >=
                                    new Date(trx.updatedAt),
                              );
                              const isGenerating =
                                isGeneratingDoc === `${trx.id}-invoice`;

                              return invoice ? (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={getCleanUrl(
                                      invoice.shortUrl || invoice.fileUrl,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />{" "}
                                    Download invoice
                                  </a>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleGenerateDocument(trx.id, "invoice")
                                  }
                                  disabled={isGenerating}>
                                  {isGenerating ? (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                  ) : (
                                    <FileText className="mr-2 h-4 w-4" />
                                  )}
                                  Generate invoice
                                </DropdownMenuItem>
                              );
                            })()}

                            {(() => {
                              const receipt = trx.attachments?.find(
                                a =>
                                  a.description === "Receipt" &&
                                  new Date(a.uploadedAt) >=
                                    new Date(trx.updatedAt),
                              );
                              const isGenerating =
                                isGeneratingDoc === `${trx.id}-receipt`;

                              return receipt ? (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={getCleanUrl(
                                      receipt.shortUrl || receipt.fileUrl,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />{" "}
                                    Download receipt
                                  </a>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleGenerateDocument(trx.id, "receipt")
                                  }
                                  disabled={isGenerating}>
                                  {isGenerating ? (
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                                  ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                  )}
                                  Generate receipt
                                </DropdownMenuItem>
                              );
                            })()}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950 dark:focus:text-red-300">
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
        <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 dark:border-zinc-800">
          <span className="text-[11px] text-muted-foreground">
            Showing {filtered.length} of {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded border-border text-muted-foreground hover:text-foreground">
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
                    ? "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}>
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded border-border text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ── Bulk action bar ──────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-accent px-4 py-2 animate-in slide-in-from-bottom-2 dark:bg-accent/30 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {selectedIds.size}
              </span>
              <span>transactions selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-border bg-background text-[11px] hover:bg-accent">
                <Truck className="h-3 w-3" /> Mark dispatched
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 border-border bg-background text-[11px] hover:bg-accent">
                Change status
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="h-6 w-6 text-muted-foreground hover:text-foreground">
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
