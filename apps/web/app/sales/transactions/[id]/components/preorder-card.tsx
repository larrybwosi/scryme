"use client";

import React, { useState } from "react";
import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Separator } from "@repo/ui/components/ui/separator";
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
  Tag,
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
    <Card className="border-amber-500/30 bg-amber-500/5 rounded-none shadow-sm dark:shadow-none overflow-hidden space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-amber-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-widest">
            {isPreorder ? "Pre-Order & Custom Details" : "Transaction Notes & Customization"}
          </h3>
        </div>
        {isPreorder && (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-none px-2 py-0.5">
            Pre-Order
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Scheduled Pickup / Completion */}
        {isPreorder && (dueDate || dueTime) && (
          <div className="space-y-1.5 bg-background/80 p-3.5 border border-amber-500/20 rounded-none">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Scheduled Completion & Pickup
            </span>
            <p className="text-sm font-bold font-mono text-foreground">
              {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "N/A"}
              {dueTime ? ` at ${dueTime}` : ""}
            </p>
          </div>
        )}

        {/* Specifications & Customizations */}
        {isPreorder && (itemSpecs || inscription || customizationNotes) && (
          <div className="space-y-3 bg-background/80 p-3.5 border border-amber-500/20 rounded-none">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Customization Specifications
            </span>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {itemSpecs && (
                <div>
                  <span className="text-muted-foreground font-semibold">Item Specs: </span>
                  <span className="font-medium text-foreground">{itemSpecs}</span>
                </div>
              )}
              {inscription && (
                <div>
                  <span className="text-muted-foreground font-semibold">Inscription / Marking: </span>
                  <span className="font-medium text-foreground">{inscription}</span>
                </div>
              )}
              {customizationNotes && (
                <div>
                  <span className="text-muted-foreground font-semibold">Design Notes: </span>
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
          <div className="grid grid-cols-2 gap-3 bg-background/80 p-3.5 border border-amber-500/20 rounded-none">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">
                Deposit Paid
              </span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {fmt(totalPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">
                Remaining Balance
              </span>
              <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                {fmt(remainingBalance)}
              </span>
            </div>
          </div>
        )}

        {isPreorder && remainingBalance > 0 && onRecordPaymentClick && (
          <Button
            onClick={onRecordPaymentClick}
            className="w-full h-9 text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-none gap-1.5 shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5" /> Record Payment / Add Deposit
          </Button>
        )}

        {/* General Transaction Notes & Edit Control */}
        <div className="space-y-2 bg-background/90 p-3.5 border border-amber-500/30 rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Notebook className="w-3.5 h-3.5" />
              General Transaction Notes
            </span>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotesText(transaction?.notes || "");
                  setIsEditingNotes(true);
                }}
                className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 rounded-none gap-1">
                <Pencil className="w-3 h-3" />
                Edit Notes
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2.5 pt-1">
              <Textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter custom transaction or order notes..."
                rows={3}
                className="text-xs bg-card border-amber-500/40 focus-visible:ring-amber-500 rounded-none resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelNotes}
                  disabled={isSavingNotes}
                  className="h-7 px-2.5 text-xs rounded-none border-border">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="h-7 px-2.5 text-xs rounded-none bg-amber-600 hover:bg-amber-700 text-white font-semibold">
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
                  No notes recorded for this transaction yet. Click "Edit Notes" to add internal instructions or customer preferences.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
