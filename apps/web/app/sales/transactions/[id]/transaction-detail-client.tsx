"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { format } from "date-fns";
import {
  Package,
  Truck,
  CreditCard,
  Clock,
  Calendar,
  User,
  MapPin,
  FileText,
  FileEdit,
  ShoppingCart,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Download,
  Receipt,
  Building2,
  Paperclip,
  Plus,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  getTransactionById,
  updateTransactionStatus,
  uploadFileAction,
  addAttachmentToPayment,
  generateDocumentAction,
  generatePublicLinkAction,
} from "../../../actions/sales";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { AddPaymentModal } from "@/components/sales/add-payment-modal";

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
              <Card className="overflow-hidden border-border bg-card rounded-none shadow-sm dark:shadow-none py-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest">
                          Item
                        </th>
                        <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-center w-20">
                          Qty
                        </th>
                        <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-right w-36">
                          Unit price
                        </th>
                        <th className="px-5 py-4 font-bold text-muted-foreground uppercase tracking-widest text-right w-36">
                          Line total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transaction.items && transaction.items.length > 0 ? (
                        transaction.items.map((item: any) => (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-foreground text-sm">
                                  {item.productName || "Product"}
                                </span>
                                <span className="text-[11px] font-mono text-muted-foreground font-normal">
                                  {item.variantName
                                    ? `${item.variantName} • `
                                    : ""}
                                  {item.sku || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-medium text-muted-foreground text-sm">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-medium text-muted-foreground text-sm">
                              {formatCurrency(Number(item.unitPrice))}
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-foreground text-sm">
                              {formatCurrency(Number(item.lineTotal))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-muted-foreground italic">
                            No items on this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border p-6 bg-muted/20 flex justify-end rounded-none">
                  <div className="w-full sm:max-w-md space-y-3 font-medium text-xs text-foreground">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {formatCurrency(Number(transaction.subtotal))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Tax</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {formatCurrency(Number(transaction.taxTotal || 0))}
                      </span>
                    </div>
                    {Number(transaction.discountTotal) > 0 && (
                      <div className="flex justify-between items-center text-red-500">
                        <span>Discount</span>
                        <span className="font-mono font-bold text-red-500 text-sm">
                          -{formatCurrency(Number(transaction.discountTotal))}
                        </span>
                      </div>
                    )}
                    <Separator className="bg-border my-2" />
                    <div className="flex justify-between items-baseline text-foreground">
                      <span className="font-bold text-sm uppercase tracking-wider">
                        Total
                      </span>
                      <span className="font-mono text-xl font-black text-foreground tracking-tight">
                        {formatCurrency(Number(transaction.finalTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Payments Content */}
            <TabsContent
              value="payments"
              className="mt-6 outline-none rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3 rounded-none">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Payments
                </h3>
                {transaction.type !== "POS_SALE" &&
                  transaction.paymentStatus !== "PAID" && (
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm rounded-none"
                      onClick={() => setIsPaymentModalOpen(true)}>
                      <Plus className="w-3.5 h-3.5" /> Record payment
                    </Button>
                  )}
              </div>

              {transaction.payments && transaction.payments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 rounded-none">
                  {transaction.payments.map((payment: any) => (
                    <Card
                      key={payment.id}
                      className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-none bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-base text-foreground block">
                              {formatCurrency(Number(payment.amount))}
                            </span>
                            <span className="text-xs text-muted-foreground block font-medium">
                              {payment.method.replace(/_/g, " ")} •{" "}
                              {format(
                                new Date(payment.createdAt),
                                "MMM d, yyyy 'at' hh:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-[10px] font-bold uppercase tracking-widest rounded-none px-2.5 py-1">
                          {payment.status}
                        </Badge>
                      </div>

                      {(payment.method === "CHEQUE" || payment.notes) && (
                        <div className="bg-muted p-4 border border-border text-xs space-y-2 rounded-none">
                          {payment.method === "CHEQUE" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                                  Bank
                                </span>
                                <span className="text-foreground font-semibold text-sm">
                                  {payment.bankName || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                                  Cheque date
                                </span>
                                <span className="text-foreground font-semibold text-sm">
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
                              <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                                Note
                              </span>
                              <p className="text-muted-foreground italic leading-relaxed text-sm">
                                {payment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 pt-2 border-t border-border rounded-none">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                            Proof of payment
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground gap-1 border border-transparent hover:border-border rounded-none"
                            onClick={() =>
                              document
                                .getElementById(
                                  `payment-att-dedicated-${payment.id}`,
                                )
                                ?.click()
                            }>
                            <Plus className="w-3 h-3" /> Upload
                          </Button>
                          <input
                            id={`payment-att-dedicated-${payment.id}`}
                            type="file"
                            className="hidden"
                            onChange={e => handleAddAttachment(payment.id, e)}
                          />
                        </div>

                        {payment.attachments &&
                        payment.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {payment.attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={getCleanUrl(att.shortUrl || att.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-none text-xs font-medium text-foreground hover:bg-muted hover:border-muted-foreground transition-all">
                                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="max-w-[150px] truncate font-mono">
                                  {att.fileName}
                                </span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic pt-1">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                            No files uploaded for this payment.
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed p-10 text-center shadow-none border-border rounded-none bg-muted/10 space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    No payments recorded yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This order is unbilled or waiting on reconciliation.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Documents Content */}
            <TabsContent
              value="documents"
              className="mt-6 outline-none rounded-none space-y-6">
              <Card className="p-6 shadow-sm dark:shadow-none border-border bg-card rounded-none space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Share a document link
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a secure public link to this order's invoice or receipt
                  so you can send it directly to the customer.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                      Document
                    </label>
                    <Select
                      value={publicLinkType}
                      onValueChange={v =>
                        setPublicLinkType(v as "invoice" | "receipt")
                      }>
                      <SelectTrigger className="w-full text-xs bg-background border-border text-foreground rounded-none h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                      Expires
                    </label>
                    <Select
                      value={publicLinkExpiry}
                      onValueChange={setPublicLinkExpiry}>
                      <SelectTrigger className="w-full text-xs bg-background border-border text-foreground rounded-none h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="1">In 1 day</SelectItem>
                        <SelectItem value="7">In 7 days</SelectItem>
                        <SelectItem value="30">In 30 days</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-none shadow-sm"
                  onClick={async () => {
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
                  }}
                  disabled={isLoadingPublicLink}>
                  {isLoadingPublicLink ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Creating link...
                    </>
                  ) : (
                    "Create link"
                  )}
                </Button>
              </Card>

              {transaction.attachments && transaction.attachments.length > 0 ? (
                (() => {
                  const sortedAttachments = [...transaction.attachments].sort(
                    (a, b) =>
                      new Date(b.uploadedAt).getTime() -
                      new Date(a.uploadedAt).getTime(),
                  );

                  const groups = sortedAttachments.reduce(
                    (acc: any, att: any) => {
                      const desc = att.description?.toLowerCase() || "";
                      let group = "Other files";
                      if (desc.includes("public")) group = "Shared links";
                      else if (desc.includes("invoice")) group = "Invoices";
                      else if (desc.includes("receipt")) group = "Receipts";
                      else if (
                        desc.includes("proof") ||
                        desc.includes("delivery")
                      )
                        group = "Delivery proof";

                      if (!acc[group]) acc[group] = [];
                      acc[group].push(att);
                      return acc;
                    },
                    {},
                  );

                  const order = [
                    "Shared links",
                    "Invoices",
                    "Receipts",
                    "Delivery proof",
                    "Other files",
                  ];

                  return (
                    <div className="space-y-4 rounded-none">
                      {order.map(groupName => {
                        const docs = groups[groupName];
                        if (!docs) return null;

                        return (
                          <Card
                            key={groupName}
                            className="overflow-hidden border-border bg-card rounded-none shadow-sm dark:shadow-none">
                            <div className="px-4 py-3 bg-muted border-b border-border">
                              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground/60" />
                                {groupName} ({docs.length})
                              </h3>
                            </div>
                            <div className="divide-y divide-border">
                              {docs.map((att: any) => {
                                const isPublicLink =
                                  groupName === "Shared links";
                                return (
                                  <div
                                    key={att.id}
                                    className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={cn(
                                          "w-9 h-9 rounded-none flex items-center justify-center border",
                                          isPublicLink
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                            : "bg-muted border-border text-muted-foreground/80",
                                        )}>
                                        {att.mimeType === "application/pdf" ? (
                                          <FileText
                                            className={cn(
                                              "w-4 h-4",
                                              isPublicLink
                                                ? "text-emerald-500"
                                                : "text-red-500",
                                            )}
                                          />
                                        ) : (
                                          <Paperclip className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-1.5 leading-none">
                                          {isPublicLink ? (
                                            <>
                                              {att.description}
                                              {att.expiresAt ? (
                                                new Date(att.expiresAt) <
                                                new Date() ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[9px] text-red-600 border-red-200 bg-red-50/50 py-0 px-1 rounded-none font-bold uppercase">
                                                    Expired
                                                  </Badge>
                                                ) : (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[9px] text-emerald-600 border-emerald-200 bg-emerald-50/50 py-0 px-1 rounded-none font-bold uppercase">
                                                    Active • Exp.{" "}
                                                    {format(
                                                      new Date(att.expiresAt),
                                                      "MMM d",
                                                    )}
                                                  </Badge>
                                                )
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] text-blue-600 border-blue-200 bg-blue-50/50 py-0 px-1 rounded-none font-bold uppercase">
                                                  Never expires
                                                </Badge>
                                              )}
                                            </>
                                          ) : (
                                            att.fileName
                                          )}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[250px] block">
                                            {isPublicLink
                                              ? getCleanUrl(
                                                  att.shortUrl || att.fileUrl,
                                                )
                                              : att.description ||
                                                "No description"}
                                          </span>
                                          {!isPublicLink && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                              <span className="text-[10px] text-muted-foreground">
                                                {format(
                                                  new Date(att.uploadedAt),
                                                  "MMM d, yyyy",
                                                )}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                                      {isPublicLink && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                          onClick={() =>
                                            handleCopyLink(
                                              getCleanUrl(
                                                att.shortUrl || att.fileUrl!,
                                              ),
                                            )
                                          }
                                          aria-label="Copy document link">
                                          <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                        asChild
                                        aria-label="Open document in new tab">
                                        <a
                                          href={getCleanUrl(
                                            att.shortUrl || att.fileUrl!,
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      </Button>
                                      {!isPublicLink && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                                          asChild
                                          aria-label="Download document file">
                                          <a
                                            href={getCleanUrl(
                                              att.shortUrl || att.fileUrl!,
                                            )}
                                            download={att.fileName!}>
                                            <Download className="w-3.5 h-3.5" />
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
                      })}
                    </div>
                  );
                })()
              ) : (
                <Card className="p-12 text-center space-y-2 border-dashed border-border rounded-none bg-muted/10">
                  <div className="w-12 h-12 rounded-none bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground/50 mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    No documents yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invoices and receipts will show up here once generated.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Deliveries Content */}
            <TabsContent
              value="deliveries"
              className="mt-6 outline-none rounded-none space-y-4">
              <div className="border-b border-border pb-3 rounded-none">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Deliveries
                </h3>
              </div>

              {transaction.fulfillments &&
              transaction.fulfillments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 rounded-none">
                  {transaction.fulfillments.map((f: any) => (
                    <Card
                      key={f.id}
                      className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted border border-border rounded-none text-muted-foreground shadow-inner">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-foreground block">
                              {f.type}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              Carrier:{" "}
                              <strong className="text-foreground">
                                {f.carrier || "Internal courier"}
                              </strong>
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-widest bg-muted border-border text-muted-foreground px-2.5 py-1 rounded-none">
                          {f.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted p-4 border border-border text-xs rounded-none">
                        <div>
                          <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                            Driver
                          </span>
                          <span className="text-foreground font-semibold text-sm">
                            {f.driver?.name || "Not assigned"}
                          </span>
                          {f.driver?.email && (
                            <span className="text-muted-foreground block text-[11px] font-mono mt-0.5">
                              {f.driver.email}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                            Tracking number
                          </span>
                          <span className="text-foreground font-semibold text-sm font-mono block mt-1 bg-background border border-border px-2 py-0.5 w-fit">
                            {f.trackingNumber || "Not assigned"}
                          </span>
                        </div>
                      </div>

                      {f.receivedBy && (
                        <div className="flex items-center gap-2 text-xs border-t border-border pt-3 rounded-none">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-muted-foreground">
                            Received and signed by:{" "}
                            <strong className="text-foreground">
                              {f.receivedBy}
                            </strong>
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center border-dashed border-border bg-muted/10 rounded-none space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    No deliveries scheduled yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This order may be digital, picked up on-site, or waiting to
                    be scheduled.
                  </p>
                </Card>
              )}
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

          <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
            <CardHeader className="bg-muted px-5 py-4 border-b border-border">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                Order actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="text-xs text-muted-foreground leading-relaxed">
                Move this order to the next stage, or cancel it. Only the
                actions available for the current status are shown.
              </div>

              <div className="space-y-2 pt-2">
                {transaction.status === "PENDING_CONFIRMATION" && (
                  <Button
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                    onClick={() => handleStatusUpdate("CONFIRMED")}>
                    Confirm order
                  </Button>
                )}
                {transaction.status === "CONFIRMED" && (
                  <Button
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                    onClick={() => handleStatusUpdate("PROCESSING")}>
                    Start processing
                  </Button>
                )}
                {transaction.status === "PROCESSING" && (
                  <Button
                    className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow"
                    onClick={() => handleStatusUpdate("COMPLETED")}>
                    Mark as delivered
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full h-10 text-xs font-bold uppercase tracking-wider text-red-600 border-border hover:bg-red-500/10 hover:border-red-500/30 dark:hover:bg-red-950/20 rounded-none transition-colors"
                  onClick={() => handleStatusUpdate("CANCELLED")}
                  disabled={["COMPLETED", "CANCELLED"].includes(
                    transaction.status,
                  )}>
                  Cancel order
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
            <CardHeader className="bg-muted px-5 py-4 border-b border-border">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground rounded-none shadow-inner uppercase">
                    {(transaction.customer?.name || "A").substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {transaction.customer?.name || "Anonymous customer"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mt-0.5">
                      Buyer
                    </span>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span
                      className="font-mono text-foreground font-medium truncate max-w-[200px]"
                      title={transaction.customer?.email || "No email"}>
                      {transaction.customer?.email || "No email on file"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <span className="font-mono text-foreground font-medium">
                      {transaction.customer?.phone || "No phone on file"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card rounded-none shadow-sm dark:shadow-none overflow-hidden">
            <CardHeader className="bg-muted px-5 py-4 border-b border-border">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Location & team
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-bold">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{transaction.location?.name || "Head office"}</span>
              </div>
              {transaction.member?.user && (
                <>
                  <Separator className="bg-border my-2" />
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block">
                      Handled by
                    </span>
                    <p className="font-bold text-foreground">
                      {transaction.member.user.name}
                    </p>
                    <p className="font-mono text-[11px]">
                      {transaction.member.user.email}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Order timeline                                                      */
/* ------------------------------------------------------------------ */

const TIMELINE_STAGES = [
  { key: "DRAFT", label: "Draft", icon: FileEdit },
  { key: "PENDING_CONFIRMATION", label: "Placed", icon: ShoppingCart },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "COMPLETED", label: "Delivered", icon: PackageCheck },
] as const;

const TIMELINE_STAGE_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Order created but not yet submitted.",
  PENDING_CONFIRMATION: "Waiting for review and approval.",
  CONFIRMED: "Approved and queued for fulfillment.",
  PROCESSING: "Being picked, packed, or prepared.",
  COMPLETED: "Delivered and closed out.",
};

/**
 * Looks up when a stage was reached. Checks a `statusHistory` array first
 * (expected shape: [{ status, createdAt }]) and falls back to direct
 * timestamp fields on the transaction. Adjust the field names below to
 * match your API once stage timestamps are available.
 */
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
  };

  for (const field of fieldsByStage[key] || []) {
    if (transaction?.[field]) return transaction[field];
  }
  return null;
}

function OrderTimeline({ transaction }: { transaction: any }) {
  const currentStatus = transaction.status;
  const isCancelled = currentStatus === "CANCELLED";
  const statusOrder = TIMELINE_STAGES.map(s => s.key);
  const currentIndex = statusOrder.indexOf(currentStatus as any);
  const lastIndex = TIMELINE_STAGES.length - 1;

  if (isCancelled) {
    const cancelledAt = getStageTimestamp(transaction, "CANCELLED");
    return (
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 shrink-0 rounded-none bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="pt-1">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
            Order cancelled
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            This order will not continue through fulfillment.
          </p>
          {cancelledAt && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono mt-2">
              <Calendar className="w-3 h-3" />
              {format(new Date(cancelledAt), "MMM d, yyyy 'at' hh:mm a")}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {TIMELINE_STAGES.map((stage, idx) => {
        const isComplete =
          idx < currentIndex ||
          (currentStatus === "COMPLETED" && idx <= currentIndex);
        const isCurrent = idx === currentIndex && currentStatus !== "COMPLETED";
        const isFinalComplete =
          currentStatus === "COMPLETED" && idx === lastIndex;
        const isReached = isComplete || isCurrent || isFinalComplete;
        const isLast = idx === lastIndex;
        const Icon = stage.icon;
        const timestamp = isReached
          ? getStageTimestamp(transaction, stage.key)
          : null;

        return (
          <div key={stage.key} className="flex gap-3.5">
            {/* Rail: icon + connecting line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 shrink-0 rounded-none flex items-center justify-center border-2 transition-colors duration-300 bg-card",
                  (isComplete || isFinalComplete) &&
                    "bg-emerald-600 border-emerald-600 text-white",
                  isCurrent &&
                    "border-zinc-900 dark:border-zinc-100 ring-4 ring-muted text-foreground",
                  !isComplete &&
                    !isCurrent &&
                    !isFinalComplete &&
                    "border-border text-muted-foreground/40",
                )}>
                <Icon
                  className={cn("w-4 h-4", isCurrent && "animate-pulse")}
                  strokeWidth={2.25}
                />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-[2px] flex-1 my-1 transition-colors duration-500",
                    isComplete || isFinalComplete
                      ? "bg-emerald-600"
                      : "bg-border",
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
                    (isComplete || isFinalComplete) &&
                      "text-emerald-600 dark:text-emerald-400",
                    isCurrent && "text-foreground",
                    !isComplete &&
                      !isCurrent &&
                      !isFinalComplete &&
                      "text-muted-foreground/50",
                  )}>
                  {stage.label}
                </span>
                {isCurrent && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 rounded-none border-zinc-900 dark:border-zinc-100 text-foreground shrink-0">
                    In progress
                  </Badge>
                )}
              </div>

              <p
                className={cn(
                  "text-[11px] mt-1 leading-relaxed",
                  isReached
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40",
                )}>
                {TIMELINE_STAGE_DESCRIPTIONS[stage.key]}
              </p>

              {timestamp ? (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-mono mt-1.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(timestamp), "MMM d, yyyy 'at' hh:mm a")}
                </span>
              ) : (
                isReached === false && (
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

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
    UNPAID:
      "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
    PARTIALLY_PAID:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-none",
        styles[status] || "bg-muted text-muted-foreground border-border",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
