"use client";

import { PaymentProgress } from "./payment-progress";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  CreditCard,
  Plus,
  Paperclip,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Banknote,
  Building,
  Info,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";
import { toast } from "sonner";

interface PaymentsTabProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
  getCleanUrl: (url: string | null | undefined) => string;
  onRecordPaymentClick: () => void;
  onAddAttachment: (
    paymentId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
}

export function PaymentsTab({
  transaction,
  formatCurrency,
  getCleanUrl,
  onRecordPaymentClick,
  onAddAttachment,
}: PaymentsTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const canRecordPayment = transaction.paymentStatus !== "PAID";

  return (
    <div className="space-y-4 rounded-none">
      <PaymentProgress
        transaction={transaction}
        formatCurrency={formatCurrency}
        onRecordPaymentClick={onRecordPaymentClick}
      />
      <div className="flex items-center justify-between border-b border-border pb-3 rounded-none">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Payments & Transactions
        </h3>
        {canRecordPayment && (
          <Button
            size="sm"
            className="gap-1.5 h-8 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm rounded-none"
            onClick={onRecordPaymentClick}>
            <Plus className="w-3.5 h-3.5" /> Record payment
          </Button>
        )}
      </div>

      {transaction.payments && transaction.payments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 rounded-none">
          {transaction.payments.map((payment: any) => {
            const isMpesa =
              ["MPESA", "MPESA_C2B", "MOBILE_PAYMENT"].includes(
                payment.method,
              ) ||
              Boolean(payment.gatewayTxnId) ||
              Boolean(payment.payerPhone);

            const mpesaCode = payment.gatewayTxnId || payment.referenceNumber;
            const payerPhone = payment.payerPhone;
            const payerName = payment.payerName;

            return (
              <Card
                key={payment.id}
                className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none space-y-4">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-none bg-muted border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                      {isMpesa ? (
                        <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : payment.method === "CASH" ? (
                        <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-foreground">
                          {formatCurrency(Number(payment.amount))}
                        </span>
                        {isMpesa && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-none px-1.5 py-0.2">
                            M-PESA
                          </Badge>
                        )}
                      </div>
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

                {/* M-Pesa Dedicated Information Box */}
                {isMpesa && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-none space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border-b border-emerald-500/15 pb-2">
                      <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      M-Pesa Transaction Details
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {mpesaCode && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            Receipt / Txn Code
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-foreground bg-background px-2 py-0.5 border border-border rounded-none">
                              {mpesaCode}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  mpesaCode,
                                  "Txn Code",
                                  `code-${payment.id}`,
                                )
                              }
                              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                              title="Copy transaction code">
                              {copiedKey === `code-${payment.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {payerPhone && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            Payer Phone Number
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-xs text-foreground bg-background px-2 py-0.5 border border-border rounded-none">
                              {payerPhone}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  payerPhone,
                                  "Phone Number",
                                  `phone-${payment.id}`,
                                )
                              }
                              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                              title="Copy phone number">
                              {copiedKey === `phone-${payment.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {payerName && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            Payer Name
                          </span>
                          <span className="font-semibold text-xs text-foreground block">
                            {payerName}
                          </span>
                        </div>
                      )}

                      {payment.gatewayAmount && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                            Gateway Amount
                          </span>
                          <span className="font-mono font-semibold text-xs text-foreground">
                            {payment.gatewayCurrencyCode || "KES"}{" "}
                            {Number(payment.gatewayAmount).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {payment.gatewayFee !== null &&
                        payment.gatewayFee !== undefined && (
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                              Gateway Fee
                            </span>
                            <span className="font-mono font-semibold text-xs text-muted-foreground">
                              {payment.gatewayCurrencyCode || "KES"}{" "}
                              {Number(payment.gatewayFee).toFixed(2)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Cash Details (Amount received & Change) */}
                {payment.method === "CASH" &&
                  (payment.amountReceived || payment.change) && (
                    <div className="bg-muted/50 p-3.5 border border-border text-xs grid grid-cols-2 gap-4 rounded-none">
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                          Amount Received
                        </span>
                        <span className="text-foreground font-mono font-semibold text-xs">
                          {formatCurrency(Number(payment.amountReceived || 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">
                          Change Returned
                        </span>
                        <span className="text-foreground font-mono font-semibold text-xs">
                          {formatCurrency(Number(payment.change || 0))}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Cheque details */}
                {payment.method === "CHEQUE" && (
                  <div className="bg-muted p-4 border border-border text-xs space-y-2 rounded-none">
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
                  </div>
                )}

                {/* Payment Notes */}
                {payment.notes && (
                  <div className="bg-muted/70 p-3.5 border border-border rounded-none space-y-1">
                    <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] flex items-center gap-1">
                      <Info className="w-3 h-3 text-muted-foreground" />
                      Payment Notes
                    </span>
                    <p className="text-foreground italic leading-relaxed text-xs whitespace-pre-wrap">
                      {payment.notes}
                    </p>
                  </div>
                )}

                {/* Attachment Section */}
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
                          .getElementById(`payment-att-dedicated-${payment.id}`)
                          ?.click()
                      }>
                      <Plus className="w-3 h-3" /> Upload
                    </Button>
                    <input
                      id={`payment-att-dedicated-${payment.id}`}
                      type="file"
                      className="hidden"
                      onChange={e => onAddAttachment(payment.id, e)}
                    />
                  </div>

                  {payment.attachments && payment.attachments.length > 0 ? (
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
            );
          })}
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
    </div>
  );
}
