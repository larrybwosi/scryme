"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { Separator } from "@repo/ui/components/ui/separator";
import { Card, CardContent, CardHeader } from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { format } from "date-fns";
import {
  Package,
  Truck,
  CreditCard,
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  Download,
  Receipt,
  Building2,
  Calendar,
  Paperclip,
  Plus,
  ExternalLink,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  getTransactionById,
  updateTransactionStatus,
  uploadFileAction,
  addAttachmentToPayment,
  generateDocumentAction,
  generatePublicLinkAction,
} from "../../app/actions/sales";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { AddPaymentModal } from "./add-payment-modal";

interface TransactionDetailsSheetProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
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

export function TransactionDetailsSheet({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailsSheetProps) {
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [isLoadingPublicLink, setIsLoadingPublicLink] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return;
    setIsLoading(true);
    try {
      const data = await getTransactionById(transactionId);
      setTransaction(data);
    } catch (error) {
      toast.error("Failed to fetch transaction details");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (transactionId && isOpen) {
      fetchTransaction();
    }
  }, [transactionId, isOpen, fetchTransaction]);

  const handleStatusUpdate = async (status: string) => {
    if (!transaction) return;
    try {
      await updateTransactionStatus(transaction.id, status as any);
      toast.success(`Status updated to ${status}`);
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleGenerateDocument = async (type: "invoice" | "receipt") => {
    if (!transaction) return;
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
              successfully
            </span>
            <a
              href={cleanDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-muted-foreground underline font-medium hover:text-foreground flex items-center gap-1 mt-0.5 cursor-pointer z-10">
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
      toast.success("Attachment added to payment");
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
    toast.success("Link copied to clipboard!");
  };

  const handleCopyNumber = () => {
    if (!transaction) return;
    navigator.clipboard.writeText(transaction.number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 1500);
  };

  if (!transaction && isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-162.5">
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!transaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-185 p-0 flex flex-col h-full bg-background border-l border-border">
        {/* Status Accent Bar */}
        <div
          className={cn(
            "h-1 w-full shrink-0",
            STATUS_ACCENT[transaction.status] || "bg-muted",
          )}
        />

        {/* Header Block */}
        <div className="p-6 bg-card border-b border-border sticky top-0 z-10 shadow-sm dark:shadow-none">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-mono tracking-tight font-semibold text-foreground tabular-nums">
                  {transaction.number}
                </SheetTitle>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                  aria-label="Copy transaction number">
                  {copiedNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] tracking-wider uppercase bg-accent text-accent-foreground hover:bg-accent rounded border border-border px-1.5 py-0">
                  {transaction.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                Created{" "}
                {format(
                  new Date(transaction.createdAt),
                  "MMM d, yyyy • hh:mm a",
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:bg-background hover:shadow-sm font-medium"
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
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:bg-background hover:shadow-sm font-medium"
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

          {/* Metric Summary Bar */}
          <div className="grid grid-cols-3 gap-4 bg-muted/70 rounded-lg p-3.5 border border-border/60">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                Order Status
              </span>
              <StatusBadge status={transaction.status} />
            </div>
            <div className="space-y-1 border-l border-border/80 pl-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                Payment Status
              </span>
              <PaymentStatusBadge status={transaction.paymentStatus} />
            </div>
            <div className="space-y-0.5 border-l border-border/80 pl-4 text-right">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                Total Gross Amount
              </span>
              <span className="text-lg font-semibold tracking-tight font-mono tabular-nums text-foreground">
                {formatCurrency(transaction.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <ScrollArea className="flex-1 bg-background">
          <div className="p-6 space-y-6">
            {/* Timeline Workflow Component */}
            <Card className="p-5 shadow-sm dark:shadow-none border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                Fulfillment Workflow Line
              </h3>
              <TransactionTimeline currentStatus={transaction.status} />
            </Card>

            {/* Core Tab System */}
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-muted p-1 border border-border/40 rounded-lg">
                <TabsTrigger
                  value="items"
                  className="text-xs font-medium data-[state=active]:shadow-sm">
                  Items ({transaction.items?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-xs font-medium data-[state=active]:shadow-sm">
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="text-xs font-medium data-[state=active]:shadow-sm">
                  Docs ({transaction.attachments?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="text-xs font-medium data-[state=active]:shadow-sm">
                  Details
                </TabsTrigger>
              </TabsList>

              {/* Items Panel */}
              <TabsContent value="items" className="mt-4 outline-none">
                <Card className="overflow-hidden shadow-sm dark:shadow-none border-border py-0 gap-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/70 border-b border-border/80">
                          <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">
                            Product / SKU
                          </th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center w-16">
                            Qty
                          </th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-28">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-28">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium text-foreground/80">
                        {transaction.items?.map((item: any) => (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground">
                                  {item.productName}
                                </span>
                                <span className="text-[11px] font-mono text-muted-foreground font-normal">
                                  {item.variantName
                                    ? `${item.variantName} • `
                                    : ""}
                                  {item.sku}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono tabular-nums text-muted-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-foreground">
                              {formatCurrency(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Reconciliation Summary */}
                  <div className="bg-muted/50 border-t border-border/80 p-4 font-medium text-xs space-y-2.5 w-full ml-auto sm:max-w-[340px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {formatCurrency(transaction.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax Ledger</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {formatCurrency(transaction.taxTotal)}
                      </span>
                    </div>
                    <Separator className="bg-border/60 my-1" />
                    <div className="flex justify-between items-baseline text-foreground">
                      <span className="font-semibold">Grand Total</span>
                      <span className="font-mono tabular-nums text-base font-bold text-foreground tracking-tight">
                        {formatCurrency(transaction.finalTotal)}
                      </span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Documents Panel */}
              <TabsContent
                value="documents"
                className="mt-4 space-y-4 outline-none">
                <div className="space-y-6">
                  {/* Generate Public Link Form Card */}
                  <Card className="p-5 shadow-sm dark:shadow-none border-border space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Generate Secure Public Link
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create an unguessable public link with a customizable
                      expiry period to share with clients.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          Document Type
                        </label>
                        <select
                          id="public-doc-type"
                          className="w-full text-xs bg-background border border-border text-foreground rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="invoice">Invoice</option>
                          <option value="receipt">Receipt</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          Expiry Period
                        </label>
                        <select
                          id="public-doc-expiry"
                          className="w-full text-xs bg-background border border-border text-foreground rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="7">7 Days (Default)</option>
                          <option value="1">1 Day</option>
                          <option value="30">30 Days</option>
                          <option value="0">Never Expires</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm"
                      onClick={async () => {
                        const typeSelect = document.getElementById(
                          "public-doc-type",
                        ) as HTMLSelectElement;
                        const expirySelect = document.getElementById(
                          "public-doc-expiry",
                        ) as HTMLSelectElement;
                        if (!typeSelect || !expirySelect) return;

                        const type = typeSelect.value as "invoice" | "receipt";
                        const daysVal = parseInt(expirySelect.value, 10);
                        const customExpiryDays = daysVal === 0 ? null : daysVal;

                        setIsLoadingPublicLink(true);
                        try {
                          await generatePublicLinkAction(
                            transaction.id,
                            type,
                            customExpiryDays,
                          );
                          toast.success("Public link generated successfully!");
                          fetchTransaction();
                        } catch (err) {
                          toast.error("Failed to generate public link");
                        } finally {
                          setIsLoadingPublicLink(false);
                        }
                      }}
                      disabled={isLoadingPublicLink}>
                      {isLoadingPublicLink ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Generating...
                        </>
                      ) : (
                        "Generate Public Link"
                      )}
                    </Button>
                  </Card>

                  {transaction.attachments?.length > 0 ? (
                    (() => {
                      const sortedAttachments = [
                        ...transaction.attachments,
                      ].sort(
                        (a, b) =>
                          new Date(b.uploadedAt).getTime() -
                          new Date(a.uploadedAt).getTime(),
                      );

                      const groups = sortedAttachments.reduce(
                        (acc: any, att: any) => {
                          const desc = att.description?.toLowerCase() || "";
                          let group = "Others";
                          if (desc.includes("public"))
                            group = "Public Document Links";
                          else if (desc.includes("invoice")) group = "Invoices";
                          else if (desc.includes("receipt")) group = "Receipts";
                          else if (
                            desc.includes("proof") ||
                            desc.includes("delivery")
                          )
                            group = "Delivery & Proofs";

                          if (!acc[group]) acc[group] = [];
                          acc[group].push(att);
                          return acc;
                        },
                        {},
                      );

                      const order = [
                        "Public Document Links",
                        "Invoices",
                        "Receipts",
                        "Delivery & Proofs",
                        "Others",
                      ];

                      return order.map(groupName => {
                        const docs = groups[groupName];
                        if (!docs) return null;

                        return (
                          <Card
                            key={groupName}
                            className="overflow-hidden shadow-sm dark:shadow-none border-border py-0 gap-0">
                            <div className="p-4 border-b border-border bg-muted/50">
                              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground/60" />
                                {groupName} ({docs.length})
                              </h3>
                            </div>
                            <div className="divide-y divide-border">
                              {docs.map((att: any) => {
                                const isPublicLink =
                                  groupName === "Public Document Links";
                                return (
                                  <div
                                    key={att.id}
                                    className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={cn(
                                          "w-10 h-10 rounded-lg flex items-center justify-center",
                                          isPublicLink
                                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                            : "bg-muted border border-border text-muted-foreground/80",
                                        )}>
                                        {att.mimeType === "application/pdf" ? (
                                          <FileText
                                            className={cn(
                                              "w-5 h-5",
                                              isPublicLink
                                                ? "text-emerald-500"
                                                : "text-red-500",
                                            )}
                                          />
                                        ) : att.mimeType.startsWith(
                                            "image/",
                                          ) ? (
                                          <Paperclip className="w-5 h-5 text-blue-500" />
                                        ) : (
                                          <Paperclip className="w-5 h-5" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-1.5">
                                          {isPublicLink ? (
                                            <>
                                              {att.description}
                                              {att.expiresAt ? (
                                                new Date(att.expiresAt) <
                                                new Date() ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[9px] text-red-600 border-red-200 bg-red-50 py-0 px-1 rounded font-normal uppercase">
                                                    Expired
                                                  </Badge>
                                                ) : (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[9px] text-emerald-600 border-emerald-200 bg-emerald-50 py-0 px-1 rounded font-normal uppercase">
                                                    Active • Expir.{" "}
                                                    {format(
                                                      new Date(att.expiresAt),
                                                      "MMM d",
                                                    )}
                                                  </Badge>
                                                )
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] text-blue-600 border-blue-200 bg-blue-50 py-0 px-1 rounded font-normal uppercase">
                                                  Never Expires
                                                </Badge>
                                              )}
                                            </>
                                          ) : (
                                            att.fileName
                                          )}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-muted-foreground font-medium font-mono truncate max-w-[280px]">
                                            {isPublicLink
                                              ? getCleanUrl(
                                                  att.shortUrl || att.fileUrl,
                                                )
                                              : att.description ||
                                                "No description"}
                                          </span>
                                          {!isPublicLink && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-border" />
                                              <span className="text-[10px] text-muted-foreground font-medium">
                                                {format(
                                                  new Date(att.uploadedAt),
                                                  "MMM d, yyyy HH:mm",
                                                )}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isPublicLink && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          onClick={() =>
                                            handleCopyLink(
                                              getCleanUrl(
                                                att.shortUrl || att.fileUrl!,
                                              ),
                                            )
                                          }>
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                        asChild>
                                        <a
                                          href={getCleanUrl(
                                            att.shortUrl || att.fileUrl!,
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer">
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      </Button>
                                      {!isPublicLink && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          asChild>
                                          <a
                                            href={getCleanUrl(
                                              att.shortUrl || att.fileUrl!,
                                            )}
                                            download={att.fileName!}>
                                            <Download className="w-4 h-4" />
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      });
                    })()
                  ) : (
                    <Card className="p-12 text-center space-y-2 shadow-sm dark:shadow-none border-border">
                      <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground/50 mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No documents archived
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Invoices and receipts for orders are automatically
                        stored here.
                      </p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Payments Panel */}
              <TabsContent
                value="payments"
                className="mt-4 space-y-4 outline-none">
                <div className="space-y-3">
                  {transaction.payments?.length > 0 ? (
                    transaction.payments.map((payment: any) => (
                      <Card
                        key={payment.id}
                        className="p-4 shadow-sm dark:shadow-none border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-mono tabular-nums text-sm font-semibold text-foreground block">
                                {formatCurrency(payment.amount)}
                              </span>
                              <span className="text-[11px] text-muted-foreground block font-medium">
                                {payment.method.replace(/_/g, " ")} •{" "}
                                {format(
                                  new Date(payment.createdAt),
                                  "MMM d, yyyy HH:mm",
                                )}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5">
                            {payment.status}
                          </Badge>
                        </div>

                        {/* Cheque Details & Notes */}
                        {(payment.method === "CHEQUE" || payment.notes) && (
                          <div className="bg-muted/50 rounded-lg p-2.5 border border-border text-[11px] space-y-1.5">
                            {payment.method === "CHEQUE" && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[9px] block">
                                    Bank Name
                                  </span>
                                  <span className="text-foreground font-semibold">
                                    {payment.bankName || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[9px] block">
                                    Cheque Date
                                  </span>
                                  <span className="text-foreground font-semibold">
                                    {payment.chequeDate
                                      ? format(
                                          new Date(payment.chequeDate),
                                          "MMM d, yyyy",
                                        )
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            )}
                            {payment.notes && (
                              <div>
                                <span className="text-muted-foreground uppercase font-bold tracking-tighter text-[9px] block">
                                  Payment Notes
                                </span>
                                <p className="text-muted-foreground italic leading-relaxed">
                                  {payment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Attachments Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Attachments
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground gap-1"
                              onClick={() =>
                                document
                                  .getElementById(`payment-att-${payment.id}`)
                                  ?.click()
                              }>
                              <Plus className="w-3 h-3" /> Add Proof
                            </Button>
                            <input
                              id={`payment-att-${payment.id}`}
                              type="file"
                              className="hidden"
                              onChange={e => handleAddAttachment(payment.id, e)}
                            />
                          </div>

                          {payment.attachments?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {payment.attachments.map((att: any) => (
                                <a
                                  key={att.id}
                                  href={getCleanUrl(
                                    att.shortUrl || att.fileUrl,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2 py-1 bg-background border border-border rounded-md text-[10px] font-medium text-foreground hover:bg-muted transition-colors">
                                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                                  <span className="max-w-[100px] truncate">
                                    {att.fileName}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic">
                              No attachments found
                            </p>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed p-8 text-center shadow-none border-border">
                      <p className="text-muted-foreground text-xs font-medium">
                        No financial transactions recorded.
                      </p>
                    </Card>
                  )}

                  {transaction.type !== "POS_SALE" &&
                    transaction.paymentStatus !== "PAID" && (
                      <Button
                        className="w-full gap-2 h-10 text-xs font-semibold border-border text-foreground hover:bg-accent shadow-sm mt-1"
                        variant="outline"
                        onClick={() => setIsPaymentModalOpen(true)}>
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        Register Payment Transaction
                      </Button>
                    )}
                </div>
              </TabsContent>

              {/* Customer & Location Panel */}
              <TabsContent
                value="details"
                className="mt-4 space-y-4 outline-none">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 space-y-3 shadow-sm dark:shadow-none border-border">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5">
                      <User className="w-3 h-3 text-muted-foreground" /> Account Profile
                    </h4>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {transaction.customer?.name || "Anonymous Customer"}
                      </p>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        {transaction.customer?.email ||
                          "No electronic billing mail"}
                      </p>
                      <p className="text-muted-foreground font-mono text-[11px]">
                        {transaction.customer?.phone ||
                          "No active contact record"}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 space-y-3 shadow-sm dark:shadow-none border-border">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" /> Hub &
                      Management
                    </h4>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground" />{" "}
                        {transaction.location?.name}
                      </p>
                      <p className="text-muted-foreground">
                        Corporate Member:{" "}
                        <span className="text-foreground font-medium">
                          {transaction.member?.user?.name}
                        </span>
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Logistics Block */}
                <Card className="p-4 space-y-3.5 shadow-sm dark:shadow-none border-border">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5">
                    <Truck className="w-3 h-3 text-muted-foreground" /> Order
                    Fulfillment Registry
                  </h4>
                  {transaction.fulfillments?.length > 0 ? (
                    <div className="space-y-4">
                      {transaction.fulfillments.map((f: any) => (
                        <div
                          key={f.id}
                          className="flex items-start gap-3 text-xs">
                          <div className="mt-0.5 p-1.5 bg-muted border border-border rounded-lg text-muted-foreground">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">
                                {f.type} Dispatched
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase tracking-wider bg-muted px-1.5 font-semibold text-muted-foreground rounded border-border">
                                {f.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Provider Method: {f.type}{" "}
                              {f.carrier && `via ${f.carrier}`}
                            </p>
                            {f.trackingNumber && (
                              <p className="text-[11px] font-mono text-foreground bg-muted border border-border inline-block px-1.5 py-0.5 rounded mt-1">
                                Tracking Ref: {f.trackingNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No historical logistics/fulfillment updates initialized.
                    </p>
                  )}
                </Card>

                {/* Audit & Manifest Notes */}
                {transaction.notes && (
                  <Card className="bg-amber-500/10 border-amber-500/20 p-4 space-y-1.5 shadow-none text-amber-700 dark:text-amber-400">
                    <h4 className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Internal Operations Memo
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                      {transaction.notes}
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Global Action Footer */}
        <div className="p-4 bg-card/95 backdrop-blur border-t border-border flex items-center gap-3 shadow-md">
          <Button
            variant="outline"
            className="flex-1 h-10 text-xs font-semibold text-red-600 border-border hover:bg-red-500/10 hover:border-red-500/30 dark:hover:bg-red-950/20 transition-colors"
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={["COMPLETED", "CANCELLED"].includes(transaction.status)}>
            Cancel Order
          </Button>

          {transaction.status === "PENDING_CONFIRMATION" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow"
              onClick={() => handleStatusUpdate("CONFIRMED")}>
              Approve Statement
            </Button>
          )}
          {transaction.status === "CONFIRMED" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow"
              onClick={() => handleStatusUpdate("PROCESSING")}>
              Release to Processing
            </Button>
          )}
          {transaction.status === "PROCESSING" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow"
              onClick={() => handleStatusUpdate("COMPLETED")}>
              Mark Dispatch Completed
            </Button>
          )}
        </div>

        <AddPaymentModal
          transaction={transaction}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            fetchTransaction();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function TransactionTimeline({ currentStatus }: { currentStatus: string }) {
  const stages = [
    { key: "DRAFT", label: "Draft" },
    { key: "PENDING_CONFIRMATION", label: "Placed" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PROCESSING", label: "Processing" },
    { key: "READY", label: "Staged" },
    { key: "COMPLETED", label: "Delivered" },
  ];

  const statusOrder = stages.map(s => s.key);
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="relative flex justify-between items-center w-full px-2 pt-2 pb-4">
      {/* Visual Alignment Connector Bar */}
      <div className="absolute top-[15px] left-4 right-4 h-[2px] bg-border z-0" />

      {/* Progress tracking line */}
      <div
        className="absolute top-[15px] left-4 h-[2px] bg-emerald-600 transition-all duration-500 z-0"
        style={{
          width: `${currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 94 : 0}%`,
        }}
      />

      {stages.map((stage, idx) => {
        const isCompleted =
          idx < currentIndex ||
          (currentStatus === "COMPLETED" && idx <= currentIndex);
        const isCurrent = idx === currentIndex;

        return (
          <div
            key={stage.key}
            className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                isCompleted
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : isCurrent
                    ? "bg-background border-primary ring-4 ring-muted shadow-sm"
                    : "bg-background border-border text-muted-foreground/30",
              )}>
              {isCompleted && (
                <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3px]" />
              )}
              {isCurrent && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </div>

            <div className="absolute top-6 flex flex-col items-center min-w-[65px] text-center">
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap",
                  isCompleted
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : isCurrent
                      ? "text-foreground font-bold"
                      : "text-muted-foreground",
                )}>
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    PENDING_CONFIRMATION: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
    CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
    PROCESSING: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
    DRAFT: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded",
        styles[status] || "bg-muted text-muted-foreground border-border",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    UNPAID: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
    PARTIALLY_PAID: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded",
        styles[status] || "bg-muted text-muted-foreground border-border",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
