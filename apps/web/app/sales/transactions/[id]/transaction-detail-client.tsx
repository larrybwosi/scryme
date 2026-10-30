"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Card } from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Clock,
  FileText,
  Loader2,
  Receipt,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  CircleDot,
  Wallet,
  BadgeDollarSign,
} from "lucide-react";
import {
  getTransactionById,
  updateTransactionStatus,
  uploadFileAction,
  addAttachmentToPayment,
  generateDocumentAction,
  generatePublicLinkAction,
} from "../../../actions/sales";
import { toast } from "sonner";
import { AddPaymentModal } from "@/components/sales/add-payment-modal";
import { ManageDeliveryModal } from "@/components/sales/manage-delivery-modal";

import { PaymentStatusBadge } from "./components/payment-status-badge";
import { OrderTimeline } from "./components/timeline";
import { OverviewTab } from "./components/overview-tab";
import { ItemsTab } from "./components/items-tab";
import { PaymentsTab } from "./components/payments-tab";
import { DocumentsTab } from "./components/documents-tab";
import { DeliveriesTab } from "./components/deliveries-tab";
import { cn } from "@repo/ui/lib/utils";

interface TransactionDetailClientProps {
  transaction: any;
  invoiceConfigUpdatedAt?: string;
  receiptConfigUpdatedAt?: string;
  organization?: any;
}

/** Status -> dot color + soft pill colors (tuned for light mode, with dark fallbacks). */
const STATUS_STYLES: Record<
  string,
  { dot: string; pill: string }
> = {
  COMPLETED: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  PENDING_CONFIRMATION: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  },
  CONFIRMED: {
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20",
  },
  PROCESSING: {
    dot: "bg-indigo-500",
    pill: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20",
  },
  CANCELLED: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20",
  },
  DRAFT: {
    dot: "bg-zinc-400",
    pill: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-400/20",
  },
};

const DEFAULT_STATUS_STYLE = {
  dot: "bg-muted-foreground",
  pill: "bg-muted text-muted-foreground ring-border",
};

/**
 * Underline-style tab trigger. The active tab gets a green line beneath it.
 * `-mb-px` lets the 2px line sit on top of the list's bottom border.
 */
const TAB_TRIGGER_CLASS = cn(
  "relative -mb-px h-11 flex-none rounded-none border-0 border-b-2 border-transparent",
  "bg-transparent px-4 text-sm font-medium text-muted-foreground shadow-none transition-colors",
  "hover:text-foreground hover:border-border",
  "focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-0",
  "data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent",
  "data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none",
  "dark:data-[state=active]:border-emerald-500 dark:data-[state=active]:bg-transparent",
);

const CARD_CLASS =
  "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-border dark:bg-card dark:shadow-none";

const METRIC_LABEL_CLASS =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground";

function getCleanUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);

      if (
        parsed.hostname.endsWith("scryme.tech") ||
        process.env.NODE_ENV === "production"
      ) {
        parsed.port = "";
      }

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

export function TransactionDetailClient({
  transaction: initialTransaction,
}: TransactionDetailClientProps) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<any>(initialTransaction);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isLoadingPublicLink, setIsLoadingPublicLink] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [publicLinkType, setPublicLinkType] = useState<"invoice" | "receipt">(
    "invoice",
  );
  const [publicLinkExpiry, setPublicLinkExpiry] = useState("7");

  const fetchTransaction = useCallback(async () => {
    try {
      const data = await getTransactionById(initialTransaction.id);
      setTransaction(data);
    } catch (error) {
      toast.error("Failed to refresh transaction details");
    }
  }, [initialTransaction.id]);

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateTransactionStatus(transaction.id, status as any);
      toast.success(
        `Status updated to ${status.replace(/_/g, " ").toLowerCase()}`,
      );
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleGenerateDocument = async (type: "invoice" | "receipt") => {
    if (type === "invoice") setIsGeneratingInvoice(true);
    else setIsGeneratingReceipt(true);

    try {
      const result = await generateDocumentAction(transaction.id, type);
      const downloadUrl = result?.shortUrl || result?.fileUrl;
      const cleanDownloadUrl = getCleanUrl(downloadUrl);

      if (cleanDownloadUrl) {
        toast.success(
          <div className="flex flex-col gap-1 text-xs text-left pointer-events-auto">
            <span className="font-semibold text-foreground">
              {type.charAt(0).toUpperCase() + type.slice(1)} generated
            </span>
            <a
              href={cleanDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline font-medium hover:text-foreground flex items-center gap-1 mt-0.5 cursor-pointer z-10">
              Open document <ExternalLink className="w-3 h-3 inline" />
            </a>
          </div>,
          { duration: 15000 },
        );
      } else {
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} generated`,
          { duration: 15000 },
        );
      }
      fetchTransaction();
    } catch (error) {
      toast.error(`Failed to generate ${type}`);
    } finally {
      if (type === "invoice") setIsGeneratingInvoice(false);
      else setIsGeneratingReceipt(false);
    }
  };

  const handleAddAttachment = async (
    paymentId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResult = await uploadFileAction(formData);

      await addAttachmentToPayment(paymentId, {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
      });
      toast.success("Attachment added");
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to add attachment");
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: transaction?.currencyCode || "USD",
    }).format(amount);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(transaction.number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 1500);
  };

  const handleCreatePublicLink = async () => {
    const daysVal = parseInt(publicLinkExpiry, 10);
    const customExpiryDays = daysVal === 0 ? null : daysVal;

    setIsLoadingPublicLink(true);
    try {
      await generatePublicLinkAction(
        transaction.id,
        publicLinkType,
        customExpiryDays,
      );
      toast.success("Link created");
      fetchTransaction();
    } catch (err) {
      toast.error("Failed to create link");
    } finally {
      setIsLoadingPublicLink(false);
    }
  };

  const statusStyle =
    STATUS_STYLES[transaction.status] || DEFAULT_STATUS_STYLE;

  const tabs: { value: string; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "items", label: `Items (${transaction.items?.length || 0})` },
    { value: "payments", label: "Payments" },
    { value: "documents", label: "Documents" },
    { value: "deliveries", label: "Deliveries" },
  ];

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-transparent">
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/sales/transactions")}
              className="h-9 w-9 rounded-lg border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-border dark:bg-card dark:text-foreground"
              aria-label="Back to transactions">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                <span>Sales</span>
                <span className="text-slate-300 dark:text-muted-foreground/40">
                  /
                </span>
                <span className="font-mono text-slate-700 dark:text-foreground">
                  {transaction.number}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="flex items-center gap-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground">
                  Order {transaction.number}
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-muted"
                    aria-label="Copy transaction number">
                    {copiedNumber ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                    statusStyle.pill,
                  )}>
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dot)}
                  />
                  {transaction.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-border dark:bg-card">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-md px-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-foreground dark:hover:bg-emerald-500/10"
              onClick={() => handleGenerateDocument("invoice")}
              disabled={isGeneratingInvoice}>
              {isGeneratingInvoice ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              Invoice
            </Button>
            <Separator orientation="vertical" className="h-4 bg-slate-200" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-md px-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-foreground dark:hover:bg-emerald-500/10"
              onClick={() => handleGenerateDocument("receipt")}
              disabled={isGeneratingReceipt}>
              {isGeneratingReceipt ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Receipt className="h-3.5 w-3.5" />
              )}
              Receipt
            </Button>
          </div>
        </div>

        {/* Metric summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className={cn(CARD_CLASS, "gap-0 p-5")}>
            <div className="mb-3 flex items-center justify-between">
              <span className={METRIC_LABEL_CLASS}>Status</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-muted">
                <CircleDot className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statusStyle.dot)}
              />
              <span className="text-sm font-semibold capitalize text-slate-900 dark:text-foreground">
                {transaction.status.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          </Card>

          <Card className={cn(CARD_CLASS, "gap-0 p-5")}>
            <div className="mb-3 flex items-center justify-between">
              <span className={METRIC_LABEL_CLASS}>Payment</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-muted">
                <Wallet className="h-3.5 w-3.5" />
              </span>
            </div>
            <PaymentStatusBadge status={transaction.paymentStatus} />
          </Card>

          <Card className={cn(CARD_CLASS, "gap-0 p-5")}>
            <div className="mb-2 flex items-center justify-between">
              <span className={METRIC_LABEL_CLASS}>Paid to date</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                <Check className="h-3.5 w-3.5" />
              </span>
            </div>
            <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatCurrency(Number(transaction.totalPaid || 0))}
            </span>
          </Card>

          <Card className={cn(CARD_CLASS, "gap-0 p-5")}>
            <div className="mb-2 flex items-center justify-between">
              <span className={METRIC_LABEL_CLASS}>Order total</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-muted">
                <BadgeDollarSign className="h-3.5 w-3.5" />
              </span>
            </div>
            <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-foreground">
              {formatCurrency(Number(transaction.finalTotal))}
            </span>
          </Card>
        </div>

        {/* Main split content */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full gap-0">
              {/* Underline tab bar: green line under the active item */}
              <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-slate-200 bg-transparent p-0 dark:border-border">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={TAB_TRIGGER_CLASS}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-6 outline-none">
                <OverviewTab
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  onStatusUpdate={handleStatusUpdate}
                  onRecordPaymentClick={() => setIsPaymentModalOpen(true)}
                  onNotesUpdated={fetchTransaction}
                  onTabChange={setActiveTab}
                />
              </TabsContent>

              <TabsContent value="items" className="mt-6 outline-none">
                <ItemsTab
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                />
              </TabsContent>

              <TabsContent
                value="payments"
                className="mt-6 space-y-4 outline-none">
                <PaymentsTab
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  getCleanUrl={getCleanUrl}
                  onRecordPaymentClick={() => setIsPaymentModalOpen(true)}
                  onAddAttachment={handleAddAttachment}
                />
              </TabsContent>

              <TabsContent
                value="documents"
                className="mt-6 space-y-6 outline-none">
                <DocumentsTab
                  transaction={transaction}
                  publicLinkType={publicLinkType}
                  setPublicLinkType={setPublicLinkType}
                  publicLinkExpiry={publicLinkExpiry}
                  setPublicLinkExpiry={setPublicLinkExpiry}
                  isLoadingPublicLink={isLoadingPublicLink}
                  onCreatePublicLink={handleCreatePublicLink}
                  onCopyLink={handleCopyLink}
                  getCleanUrl={getCleanUrl}
                />
              </TabsContent>

              <TabsContent
                value="deliveries"
                className="mt-6 space-y-4 outline-none">
                <DeliveriesTab
                  transaction={transaction}
                  onManageDeliveriesClick={() => setIsDeliveryModalOpen(true)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column: order timeline */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className={cn(CARD_CLASS, "gap-0 overflow-hidden p-0")}>
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-border dark:bg-muted">
                <Clock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-foreground">
                  Order progress
                </h3>
              </div>
              <div className="px-5 py-6">
                <OrderTimeline transaction={transaction} />
              </div>
            </Card>
          </div>
        </div>

        <AddPaymentModal
          transaction={transaction}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            fetchTransaction();
          }}
        />

        <ManageDeliveryModal
          transaction={transaction}
          isOpen={isDeliveryModalOpen}
          onClose={() => {
            setIsDeliveryModalOpen(false);
            fetchTransaction();
          }}
        />
      </div>
    </div>
  );
}