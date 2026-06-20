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
} from "lucide-react";
import {
  getTransactionById,
  updateTransactionStatus,
  uploadFileAction,
  addAttachmentToPayment,
  generateDocumentAction,
} from "../../app/actions/sales";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { AddPaymentModal } from "./add-payment-modal";

interface TransactionDetailsSheetProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
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
      await generateDocumentAction(transaction.id, type);
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully`,
      );
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

  if (!transaction && isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-[650px]">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-900 border-t-transparent" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!transaction) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[720px] p-0 flex flex-col h-full bg-zinc-50 border-l border-zinc-200">
        {/* Header Block */}
        <div className="p-6 bg-white border-b border-zinc-200 sticky top-0 z-10 shadow-sm shadow-zinc-100/40">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <SheetTitle className="text-xl font-mono tracking-tight font-semibold text-zinc-900">
                  {transaction.number}
                </SheetTitle>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] tracking-wider uppercase bg-zinc-100 text-zinc-700 hover:bg-zinc-100 rounded border border-zinc-200/60 px-1.5 py-0">
                  {transaction.type}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Created{" "}
                {format(
                  new Date(transaction.createdAt),
                  "MMM d, yyyy • hh:mm a",
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-zinc-600 border-zinc-200 hover:bg-zinc-50 font-medium"
                onClick={() => handleGenerateDocument("invoice")}
                disabled={isGeneratingInvoice}>
                {isGeneratingInvoice ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                )}
                Gen Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-zinc-600 border-zinc-200 hover:bg-zinc-50 font-medium"
                onClick={() => handleGenerateDocument("receipt")}
                disabled={isGeneratingReceipt}>
                {isGeneratingReceipt ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                )}
                Gen Receipt
              </Button>
            </div>
          </div>

          {/* Metric Summary Bar */}
          <div className="grid grid-cols-3 gap-4 bg-zinc-50/70 rounded-lg p-3.5 border border-zinc-200/60">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                Order Status
              </span>
              <StatusBadge status={transaction.status} />
            </div>
            <div className="space-y-1 border-l border-zinc-200/80 pl-4">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                Payment Status
              </span>
              <PaymentStatusBadge status={transaction.paymentStatus} />
            </div>
            <div className="space-y-0.5 border-l border-zinc-200/80 pl-4 text-right">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">
                Total Gross Amount
              </span>
              <span className="text-lg font-semibold tracking-tight font-mono text-zinc-900">
                {formatCurrency(transaction.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <ScrollArea className="flex-1 bg-zinc-50">
          <div className="p-6 space-y-6">
            {/* Timeline Workflow Component */}
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm shadow-zinc-100/50">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Fulfillment Workflow Line
              </h3>
              <TransactionTimeline currentStatus={transaction.status} />
            </div>

            {/* Core Tab System */}
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-zinc-200/60 p-1 border border-zinc-200/40 rounded-lg">
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
                <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm shadow-zinc-100/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/70 border-b border-zinc-200/80">
                          <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider">
                            Product / SKU
                          </th>
                          <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-center w-16">
                            Qty
                          </th>
                          <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-right w-28">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-right w-28">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                        {transaction.items?.map((item: any) => (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-zinc-900">
                                  {item.productName}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400 font-normal">
                                  {item.variantName
                                    ? `${item.variantName} • `
                                    : ""}
                                  {item.sku}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-zinc-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-zinc-600">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-zinc-900">
                              {formatCurrency(item.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Reconciliation Summary */}
                  <div className="bg-zinc-50/50 border-t border-zinc-200/80 p-4 font-medium text-xs space-y-2.5 w-full ml-auto sm:max-w-[340px]">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal</span>
                      <span className="font-mono text-zinc-700">
                        {formatCurrency(transaction.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Tax Ledger</span>
                      <span className="font-mono text-zinc-700">
                        {formatCurrency(transaction.taxTotal)}
                      </span>
                    </div>
                    <Separator className="bg-zinc-200/60 my-1" />
                    <div className="flex justify-between items-baseline text-zinc-900">
                      <span className="font-semibold">Grand Total</span>
                      <span className="font-mono text-base font-bold text-zinc-950 tracking-tight">
                        {formatCurrency(transaction.finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Documents Panel */}
              <TabsContent
                value="documents"
                className="mt-4 space-y-4 outline-none">
                <div className="space-y-6">
                  {transaction.attachments?.length > 0 ? (
                    (() => {
                      const sortedAttachments = [...transaction.attachments].sort(
                        (a, b) =>
                          new Date(b.uploadedAt).getTime() -
                          new Date(a.uploadedAt).getTime(),
                      );

                      const groups = sortedAttachments.reduce(
                        (acc: any, att: any) => {
                          const desc = att.description?.toLowerCase() || "";
                          let group = "Others";
                          if (desc.includes("invoice")) group = "Invoices";
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
                        "Invoices",
                        "Receipts",
                        "Delivery & Proofs",
                        "Others",
                      ];

                      return order.map(groupName => {
                        const docs = groups[groupName];
                        if (!docs) return null;

                        return (
                          <div
                            key={groupName}
                            className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm shadow-zinc-100/50">
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                {groupName} ({docs.length})
                              </h3>
                            </div>
                            <div className="divide-y divide-zinc-100">
                              {docs.map((att: any) => (
                                <div
                                  key={att.id}
                                  className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400">
                                      {att.mimeType === "application/pdf" ? (
                                        <FileText className="w-5 h-5 text-red-500" />
                                      ) : att.mimeType.startsWith("image/") ? (
                                        <Paperclip className="w-5 h-5 text-blue-500" />
                                      ) : (
                                        <Paperclip className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-zinc-900">
                                        {att.fileName}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                          {att.description || "No description"}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                          {format(
                                            new Date(att.uploadedAt),
                                            "MMM d, yyyy HH:mm",
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
                                      asChild>
                                      <a
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
                                      asChild>
                                      <a
                                        href={att.fileUrl}
                                        download={att.fileName}>
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-300 mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500">
                        No documents archived
                      </p>
                      <p className="text-xs text-zinc-400">
                        Invoices and receipts for orders are automatically
                        stored here.
                      </p>
                    </div>
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
                      <div
                        key={payment.id}
                        className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm shadow-zinc-100/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm">
                              <CreditCard className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-mono text-sm font-semibold text-zinc-900 block">
                                {formatCurrency(payment.amount)}
                              </span>
                              <span className="text-[11px] text-zinc-400 block font-medium">
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
                            className="bg-emerald-50/60 text-emerald-700 border-emerald-200 text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5">
                            {payment.status}
                          </Badge>
                        </div>

                        {/* Cheque Details & Notes */}
                        {(payment.method === "CHEQUE" || payment.notes) && (
                          <div className="bg-zinc-50/50 rounded-lg p-2.5 border border-zinc-100 text-[11px] space-y-1.5">
                            {payment.method === "CHEQUE" && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-zinc-400 uppercase font-bold tracking-tighter text-[9px] block">
                                    Bank Name
                                  </span>
                                  <span className="text-zinc-700 font-semibold">
                                    {payment.bankName || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-zinc-400 uppercase font-bold tracking-tighter text-[9px] block">
                                    Cheque Date
                                  </span>
                                  <span className="text-zinc-700 font-semibold">
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
                                <span className="text-zinc-400 uppercase font-bold tracking-tighter text-[9px] block">
                                  Payment Notes
                                </span>
                                <p className="text-zinc-600 italic leading-relaxed">
                                  {payment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Attachments Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Attachments
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 gap-1"
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
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded-md text-[10px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                                  <Paperclip className="w-3 h-3 text-zinc-400" />
                                  <span className="max-w-[100px] truncate">
                                    {att.fileName}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-zinc-400 italic">
                              No attachments found
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                      <p className="text-zinc-400 text-xs font-medium">
                        No financial transactions recorded.
                      </p>
                    </div>
                  )}

                  {transaction.type !== "POS_SALE" &&
                    transaction.paymentStatus !== "PAID" && (
                      <Button
                        className="w-full gap-2 h-10 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm mt-1"
                        variant="outline"
                        onClick={() => setIsPaymentModalOpen(true)}>
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
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
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-4 space-y-3 shadow-sm shadow-zinc-100/50">
                    <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
                      <User className="w-3 h-3 text-zinc-400" /> Account Profile
                    </h4>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-zinc-900">
                        {transaction.customer?.name || "Anonymous Customer"}
                      </p>
                      <p className="text-zinc-500 font-mono text-[11px]">
                        {transaction.customer?.email ||
                          "No electronic billing mail"}
                      </p>
                      <p className="text-zinc-500 font-mono text-[11px]">
                        {transaction.customer?.phone ||
                          "No active contact record"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200/80 rounded-xl p-4 space-y-3 shadow-sm shadow-zinc-100/50">
                    <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
                      <MapPin className="w-3 h-3 text-zinc-400" /> Hub &
                      Management
                    </h4>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-zinc-900 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-zinc-400" />{" "}
                        {transaction.location?.name}
                      </p>
                      <p className="text-zinc-500">
                        Corporate Member:{" "}
                        <span className="text-zinc-700 font-medium">
                          {transaction.member?.user?.name}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logistics Block */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-4 space-y-3.5 shadow-sm shadow-zinc-100/50">
                  <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
                    <Truck className="w-3 h-3 text-zinc-400" /> Order
                    Fulfillment Registry
                  </h4>
                  {transaction.fulfillments?.length > 0 ? (
                    <div className="space-y-4">
                      {transaction.fulfillments.map((f: any) => (
                        <div
                          key={f.id}
                          className="flex items-start gap-3 text-xs">
                          <div className="mt-0.5 p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-900">
                                {f.type} Dispatched
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase tracking-wider bg-zinc-50 px-1.5 font-semibold text-zinc-600 rounded">
                                {f.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              Provider Method: {f.type}{" "}
                              {f.carrier && `via ${f.carrier}`}
                            </p>
                            {f.trackingNumber && (
                              <p className="text-[11px] font-mono text-zinc-900 bg-zinc-50 border border-zinc-100 inline-block px-1.5 py-0.5 rounded mt-1">
                                Tracking Ref: {f.trackingNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      No historical logistics/fulfillment updates initialized.
                    </p>
                  )}
                </div>

                {/* Audit & Manifest Notes */}
                {transaction.notes && (
                  <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                      Internal Operations Memo
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                      {transaction.notes}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Global Action Footer */}
        <div className="p-4 bg-white border-t border-zinc-200 flex items-center gap-3 shadow-md shadow-zinc-900/10">
          <Button
            variant="outline"
            className="flex-1 h-10 text-xs font-semibold text-red-600 border-zinc-200 hover:bg-red-50/50 hover:border-red-200 hover:text-red-700 transition-colors"
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={["COMPLETED", "CANCELLED"].includes(transaction.status)}>
            Cancel Order
          </Button>

          {transaction.status === "PENDING_CONFIRMATION" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow"
              onClick={() => handleStatusUpdate("CONFIRMED")}>
              Approve Statement
            </Button>
          )}
          {transaction.status === "CONFIRMED" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow"
              onClick={() => handleStatusUpdate("PROCESSING")}>
              Release to Processing
            </Button>
          )}
          {transaction.status === "PROCESSING" && (
            <Button
              className="flex-1 h-10 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow"
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
      <div className="absolute top-[15px] left-4 right-4 h-[2px] bg-zinc-100 z-0" />

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
                    ? "bg-white border-zinc-900 ring-4 ring-zinc-100 shadow-sm"
                    : "bg-white border-zinc-200 text-zinc-300",
              )}>
              {isCompleted && (
                <CheckCircle2 className="w-2.5 h-2.5 text-white stroke-[3px]" />
              )}
              {isCurrent && (
                <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
              )}
            </div>

            <div className="absolute top-6 flex flex-col items-center min-w-[65px] text-center">
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap",
                  isCompleted
                    ? "text-emerald-700 font-bold"
                    : isCurrent
                      ? "text-zinc-900 font-bold"
                      : "text-zinc-400",
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
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    PENDING_CONFIRMATION: "bg-amber-50 text-amber-700 border-amber-200/60",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200/60",
    PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    CANCELLED: "bg-red-50 text-red-700 border-red-200/60",
    DRAFT: "bg-zinc-50 text-zinc-600 border-zinc-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded",
        styles[status] || "bg-zinc-50 text-zinc-600 border-zinc-200",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    UNPAID: "bg-red-50 text-red-700 border-red-200/60",
    PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200/60",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded",
        styles[status] || "bg-zinc-50 text-zinc-600 border-zinc-200",
      )}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
