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
import { CustomerCard } from "./components/customer-card";
import { LocationCard } from "./components/location-card";
import { ActionsCard } from "./components/actions-card";
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

const STATUS_ACCENT: Record<string, string> = {
  COMPLETED: "bg-emerald-500",
  PENDING_CONFIRMATION: "bg-amber-500",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  CANCELLED: "bg-red-500",
  DRAFT: "bg-zinc-300",
};

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

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 rounded-none">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 rounded-none">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/sales/transactions")}
            className="h-9 w-9 rounded-none border-border bg-card hover:bg-muted text-foreground transition-all"
            aria-label="Back to transactions">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sales
              </span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-xs font-semibold text-foreground font-mono">
                {transaction.number}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground flex items-center gap-2">
              Order {transaction.number}
              <button
                type="button"
                onClick={handleCopyNumber}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
                aria-label="Copy transaction number">
                {copiedNumber ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/60 p-1.5 border border-border rounded-none">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-background hover:shadow-sm font-medium rounded-none"
            onClick={() => handleGenerateDocument("invoice")}
            disabled={isGeneratingInvoice}>
            {isGeneratingInvoice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            Invoice
          </Button>
          <Separator orientation="vertical" className="h-4 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-background hover:shadow-sm font-medium rounded-none"
            onClick={() => handleGenerateDocument("receipt")}
            disabled={isGeneratingReceipt}>
            {isGeneratingReceipt ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            Receipt
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-none">
        <Card className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">
            Status
          </span>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                STATUS_ACCENT[transaction.status] || "bg-muted",
              )}
            />
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">
              {transaction.status.replace(/_/g, " ")}
            </span>
          </div>
        </Card>

        <Card className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">
            Payment
          </span>
          <PaymentStatusBadge status={transaction.paymentStatus} />
        </Card>

        <Card className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">
            Paid to date
          </span>
          <span className="text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatCurrency(Number(transaction.totalPaid || 0))}
          </span>
        </Card>

        <Card className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none">
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">
            Order total
          </span>
          <span className="text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatCurrency(Number(transaction.finalTotal))}
          </span>
        </Card>
      </div>

      {/* Main Split Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start rounded-none">
        <div className="lg:col-span-2 space-y-6 rounded-none">
          <Tabs defaultValue="items" className="w-full rounded-none">
            <TabsList className="w-full grid grid-cols-4 bg-muted p-1 border border-border/80 rounded-none h-11">
              <TabsTrigger
                value="items"
                className="text-xs font-semibold uppercase tracking-wider rounded-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Items ({transaction.items?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="text-xs font-semibold uppercase tracking-wider rounded-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="text-xs font-semibold uppercase tracking-wider rounded-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="deliveries"
                className="text-xs font-semibold uppercase tracking-wider rounded-none data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground transition-all">
                Deliveries
              </TabsTrigger>
            </TabsList>

            {/* Items Content */}
            <TabsContent
              value="items"
              className="mt-6 outline-none rounded-none">
              <ItemsTab transaction={transaction} formatCurrency={formatCurrency} />
            </TabsContent>

            {/* Payments Content */}
            <TabsContent
              value="payments"
              className="mt-6 outline-none rounded-none space-y-4">
              <PaymentsTab
                transaction={transaction}
                formatCurrency={formatCurrency}
                getCleanUrl={getCleanUrl}
                onRecordPaymentClick={() => setIsPaymentModalOpen(true)}
                onAddAttachment={handleAddAttachment}
              />
            </TabsContent>

            {/* Documents Content */}
            <TabsContent
              value="documents"
              className="mt-6 outline-none rounded-none space-y-6">
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

            {/* Deliveries Content */}
            <TabsContent
              value="deliveries"
              className="mt-6 outline-none rounded-none space-y-4">
              <DeliveriesTab
                transaction={transaction}
                onManageDeliveriesClick={() => setIsDeliveryModalOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6 rounded-none">
          <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                Order progress
              </h3>
            </div>
            <div className="px-5 py-6">
              <OrderTimeline transaction={transaction} />
            </div>
          </Card>

          <ActionsCard transaction={transaction} onStatusUpdate={handleStatusUpdate} />

          <CustomerCard transaction={transaction} />

          <LocationCard transaction={transaction} />

          {transaction.notes && (
            <Card className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 p-5 rounded-none space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Internal note
              </h4>
              <p className="text-xs font-medium leading-relaxed">
                {transaction.notes}
              </p>
            </Card>
          )}
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
  );
}
