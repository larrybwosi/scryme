"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Sparkles,
  Calendar,
  FileText,
  Pencil,
  Check,
  X,
  Notebook,
  DollarSign,
  Loader2,
} from "lucide-react";
import { updateTransactionNotes } from "../../../../actions/sales";
import { toast } from "sonner";

interface PreorderCardProps {
  transaction: any;
  onNotesUpdated?: () => void;
  formatCurrency?: (amount: number) => string;
  onRecordPaymentClick?: () => void;
}

export function PreorderCard({
  transaction,
  onNotesUpdated,
  formatCurrency,
  onRecordPaymentClick,
}: PreorderCardProps) {
  const metadata = transaction?.metadata || {};
  const isPreorder =
    transaction?.status === "PREORDER" || Boolean(metadata?.isCustomOrder);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(transaction?.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateTransactionNotes(transaction.id, notesText);
      toast.success("Transaction notes updated successfully");
      setIsEditingNotes(false);
      if (onNotesUpdated) {
        onNotesUpdated();
      }
    } catch (err) {
      toast.error("Failed to update transaction notes");
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesText(transaction?.notes || "");
    setIsEditingNotes(false);
  };

  const defaultFormat = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: transaction?.currencyCode || "USD",
    }).format(amount);

  const fmt = formatCurrency || defaultFormat;

  const dueDate = metadata.dueDate || (metadata.scheduledAt ? metadata.scheduledAt.split("T")[0] : null);
  const dueTime = metadata.dueTime || null;
  const itemSpecs = metadata.itemSpecs;
  const inscription = metadata.inscription;
  const customizationNotes = metadata.customizationNotes;

  const total = Number(transaction.finalTotal || 0);
  const totalPaid = Number(transaction.totalPaid || 0);
  const remainingBalance =
    metadata.remainingBalance !== undefined
      ? Number(metadata.remainingBalance)
      : Math.max(0, total - totalPaid);

  return (
    <Card className="border border-border/80 bg-card rounded-md shadow-xs overflow-hidden">
      {/* Header matching standard design system */}
      <CardHeader className="bg-muted/40 px-4 py-2.5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            {isPreorder ? "Pre-Order & Custom Details" : "Transaction Notes & Customization"}
          </CardTitle>
          {isPreorder && (
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5">
              Pre-Order
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3.5 space-y-3">
        {/* Scheduled Pickup / Completion */}
        {isPreorder && (dueDate || dueTime) && (
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 text-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Scheduled Completion & Pickup
            </span>
            <p className="font-semibold font-mono text-foreground">
              {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "N/A"}
              {dueTime ? ` at ${dueTime}` : ""}
            </p>
          </div>
        )}

        {/* Specifications & Customizations */}
        {isPreorder && (itemSpecs || inscription || customizationNotes) && (
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 text-xs space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Customization Specifications
            </span>

            <div className="space-y-1.5">
              {itemSpecs && (
                <div>
                  <span className="text-muted-foreground font-medium">Item Specs: </span>
                  <span className="font-semibold text-foreground">{itemSpecs}</span>
                </div>
              )}
              {inscription && (
                <div>
                  <span className="text-muted-foreground font-medium">Inscription / Marking: </span>
                  <span className="font-semibold text-foreground">{inscription}</span>
                </div>
              )}
              {customizationNotes && (
                <div>
                  <span className="text-muted-foreground font-medium block">Design Notes: </span>
                  <p className="mt-0.5 text-foreground leading-relaxed italic">
                    "{customizationNotes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposit & Financial Balance */}
        {isPreorder && (
          <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                Deposit Paid
              </span>
              <span className="text-xs font-semibold font-mono text-foreground">
                {fmt(totalPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                Remaining Balance
              </span>
              <span className="text-xs font-semibold font-mono text-foreground">
                {fmt(remainingBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Record Payment Button */}
        {isPreorder && remainingBalance > 0 && onRecordPaymentClick && (
          <Button
            onClick={onRecordPaymentClick}
            size="sm"
            className="w-full h-8 text-xs font-semibold gap-1.5 rounded-lg shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5" /> Record Payment / Add Deposit
          </Button>
        )}

        {/* General Transaction Notes & Edit Control */}
        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Notebook className="w-3.5 h-3.5 text-muted-foreground" />
              General Notes
            </span>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotesText(transaction?.notes || "");
                  setIsEditingNotes(true);
                }}
                className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1 rounded-md"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2 pt-1">
              <Textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter custom transaction or order notes..."
                rows={3}
                className="text-xs bg-background border-border/80 focus-visible:ring-1 focus-visible:ring-ring rounded-md resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelNotes}
                  disabled={isSavingNotes}
                  className="h-7 px-2.5 text-xs rounded-md border-border"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="h-7 px-2.5 text-xs rounded-md font-semibold"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Save Notes
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-0.5">
              {transaction?.notes ? (
                <p className="text-xs font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">
                  No notes recorded for this transaction yet. Click "Edit" to add internal instructions or customer preferences.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}