"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Label } from "@repo/ui/components/ui/label";
import { toast } from "sonner";
import { getBatchesForDelivery, linkBatchToFulfillmentItem } from "@/app/actions/sales";
import { Loader2, PackageCheck } from "lucide-react";

interface BatchLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fulfillmentItem: {
    id: string;
    transactionItem?: {
      description?: string;
    };
    batchId?: string | null;
    stockBatchId?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function BatchLinkDialog({
  open,
  onOpenChange,
  fulfillmentItem,
  onSuccess,
}: BatchLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState<Array<{ id: string; batchNumber: string; recipe?: { name: string } }>>([]);
  const [stockBatches, setStockBatches] = useState<Array<{ id: string; batchNumber: string | null; variant?: { name: string; product?: { name: string } } }>>([]);

  const [selectedType, setSelectedType] = useState<"batch" | "stockBatch">("batch");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      getBatchesForDelivery()
        .then((res) => {
          if (res.success) {
            setBatches(res.batches || []);
            setStockBatches(res.stockBatches || []);
          }
        })
        .finally(() => setLoading(false));

      if (fulfillmentItem?.batchId) {
        setSelectedType("batch");
        setSelectedBatchId(fulfillmentItem.batchId);
      } else if (fulfillmentItem?.stockBatchId) {
        setSelectedType("stockBatch");
        setSelectedBatchId(fulfillmentItem.stockBatchId);
      } else {
        setSelectedBatchId("");
      }
    }
  }, [open, fulfillmentItem]);

  const handleSave = async () => {
    if (!fulfillmentItem) return;
    setSubmitting(true);
    try {
      const bId = selectedType === "batch" ? selectedBatchId : null;
      const sbId = selectedType === "stockBatch" ? selectedBatchId : null;

      const res = await linkBatchToFulfillmentItem(fulfillmentItem.id, bId, sbId);
      if (res.success) {
        toast.success("Batch successfully linked to delivery item");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to link batch");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" /> Link Production / Stock Batch
          </DialogTitle>
          <DialogDescription>
            Trace delivery items directly to production output or inventory stock batch numbers.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Item Description</Label>
              <p className="text-sm font-medium mt-0.5">
                {fulfillmentItem?.transactionItem?.description || "Delivery Line Item"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Batch Source Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedType === "batch" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedType("batch");
                    setSelectedBatchId("");
                  }}
                >
                  Bakery / Production Batch
                </Button>
                <Button
                  type="button"
                  variant={selectedType === "stockBatch" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedType("stockBatch");
                    setSelectedBatchId("");
                  }}
                >
                  Inventory Stock Batch
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Batch Number</Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedType === "batch" ? (
                    batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batchNumber} ({b.recipe?.name || "Recipe"})
                      </SelectItem>
                    ))
                  ) : (
                    stockBatches.map((sb) => (
                      <SelectItem key={sb.id} value={sb.id}>
                        {sb.batchNumber || `Batch #${sb.id.slice(-6)}`} (
                        {sb.variant?.product?.name || sb.variant?.name || "Product"})
                      </SelectItem>
                    ))
                  )}
                  {(selectedType === "batch" ? batches.length : stockBatches.length) === 0 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No available batches found.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || loading}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Batch Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
