"use client";

import React from "react";
import { format } from "date-fns";
import { CreditCard, Plus, Paperclip, AlertCircle } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";

interface PaymentsTabProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
  getCleanUrl: (url: string | null | undefined) => string;
  onRecordPaymentClick: () => void;
  onAddAttachment: (paymentId: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function PaymentsTab({
  transaction,
  formatCurrency,
  getCleanUrl,
  onRecordPaymentClick,
  onAddAttachment,
}: PaymentsTabProps) {
  // Allow payments for anything except instant POS_SALE payments which are completed or quotes if they aren't finalized.
  // Actually, the user says "make the page capable of other operations such as the delivery options and payments for the correct transaction type."
  // POS_SALE is over-the-counter and instantly completed, so no "Record payment" button is shown.
  const canRecordPayment = transaction.type !== "POS_SALE" && transaction.paymentStatus !== "PAID";

  return (
    <div className="space-y-4 rounded-none">
      <div className="flex items-center justify-between border-b border-border pb-3 rounded-none">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          Payments
        </h3>
        {canRecordPayment && (
          <Button
            size="sm"
            className="gap-1.5 h-8 text-[11px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm rounded-none"
            onClick={onRecordPaymentClick}
          >
            <Plus className="w-3.5 h-3.5" /> Record payment
          </Button>
        )}
      </div>

      {transaction.payments && transaction.payments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 rounded-none">
          {transaction.payments.map((payment: any) => (
            <Card
              key={payment.id}
              className="p-5 border-border bg-card rounded-none shadow-sm dark:shadow-none space-y-4"
            >
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
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 text-[10px] font-bold uppercase tracking-widest rounded-none px-2.5 py-1"
                >
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
                    }
                  >
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
                        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-none text-xs font-medium text-foreground hover:bg-muted hover:border-muted-foreground transition-all"
                      >
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
    </div>
  );
}
