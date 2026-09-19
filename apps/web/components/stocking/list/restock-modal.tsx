"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Loader2, PackagePlus } from "lucide-react";
import { restockVariant } from "@/app/actions/stock-management";
import { uploadFileAction } from "@/app/actions/sales";
import { toast } from "sonner";

export interface RestockItemInfo {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  currentStock: number;
  locationId?: string;
  locationName?: string;
  buyingPrice?: number;
  supplierName?: string;
  requiresExpiryTracking?: boolean;
}

interface LocationOption {
  id: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: RestockItemInfo | null;
  locations: LocationOption[];
  suppliers: SupplierOption[];
  onSuccess?: () => void;
}

export function RestockModal({
  isOpen,
  onClose,
  product,
  locations,
  suppliers,
  onSuccess,
}: RestockModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    product?.locationId || (locations[0]?.id ?? "")
  );
  const [quantity, setQuantity] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [purchasePrice, setPurchasePrice] = useState<string>(
    product?.buyingPrice ? String(product.buyingPrice) : ""
  );
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when product changes or opens
  React.useEffect(() => {
    if (product) {
      setSelectedLocationId(product.locationId || locations[0]?.id || "");
      setPurchasePrice(product.buyingPrice ? String(product.buyingPrice) : "");
    }
  }, [product, locations]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Please enter a valid restock quantity greater than 0");
      return;
    }

    if (!selectedLocationId) {
      toast.error("Please select a target location");
      return;
    }

    const requiresExpiry = product.requiresExpiryTracking ?? true;
    if (requiresExpiry && !expiryDate) {
      toast.error("Expiry date is required for this product.");
      return;
    }

    setIsSubmitting(true);
    try {
      let documentAttachment: any = undefined;

      if (documentFile) {
        const formData = new FormData();
        formData.append("file", documentFile);
        const uploadRes = await uploadFileAction(formData);

        documentAttachment = {
          fileName: uploadRes.fileName,
          fileUrl: uploadRes.fileUrl,
          mimeType: uploadRes.mimeType,
          sizeBytes: uploadRes.sizeBytes,
          description: documentName.trim() || uploadRes.fileName || "Restock document attachment",
        };
      }

      const parsedPrice = purchasePrice ? parseFloat(purchasePrice) : undefined;
      const res = await restockVariant({
        variantId: product.variantId,
        locationId: selectedLocationId,
        quantity: parsedQty,
        supplierId: supplierId === "none" ? undefined : supplierId,
        purchasePrice: parsedPrice,
        batchNumber: batchNumber ? batchNumber : undefined,
        expiryDate: expiryDate ? expiryDate : undefined,
        notes: notes ? notes : undefined,
        documentAttachment,
      });

      if (res.success) {
        toast.success(res.message || "Stock restocked successfully!");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to restock inventory");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while restocking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = `${product.name}${
    product.variantName && product.variantName !== "Default"
      ? ` - ${product.variantName}`
      : ""
  }`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-primary" />
              Restock Product Variant
            </DialogTitle>
            <DialogDescription>
              Increase stock level for <strong className="text-foreground">{displayName}</strong> (SKU: {product.sku}).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Target Location */}
            <div className="grid gap-2">
              <Label htmlFor="location">Target Location *</Label>
              <Select
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Purchase Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Restock Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Unit Cost / Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Internal</SelectItem>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Number & Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
                <Input
                  id="batchNumber"
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiryDate">
                  Expiry Date {(product.requiresExpiryTracking ?? true) ? "*" : "(Optional)"}
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required={product.requiresExpiryTracking ?? true}
                />
              </div>
            </div>

            {/* Document Attachment & Document Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="documentFile">Upload Document (Optional)</Label>
                <Input
                  id="documentFile"
                  type="file"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="documentName">Document Name (Optional)</Label>
                <Input
                  id="documentName"
                  type="text"
                  placeholder="e.g. Supplier Invoice / Delivery Note"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes / Reason (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about this restock..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
