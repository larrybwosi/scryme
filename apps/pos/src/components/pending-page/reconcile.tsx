'use client';

import { useState } from 'react';
import { useReconcileDeliveryMutation } from '@/hooks/deliveries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fulfillmentId?: string | null;
}

interface ReconcileForm {
  outcome: 'DELIVERED' | 'FAILED';
  receivedBy: string;
  failureReason: string;
  proofImage: File | null;
}

export function ReconciliationDialog({ open, onOpenChange, fulfillmentId }: ReconciliationDialogProps) {
  const [reconcileForm, setReconcileForm] = useState<ReconcileForm>({
    outcome: 'DELIVERED',
    receivedBy: '',
    failureReason: '',
    proofImage: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const reconcileMutation = useReconcileDeliveryMutation({
    fulfillmentId: fulfillmentId || null,
    onSuccess: () => {
      handleClose();
    },
  });

  const handleClose = () => {
    setReconcileForm({ outcome: 'DELIVERED', receivedBy: '', failureReason: '', proofImage: null });
    setImagePreview(null);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return;
      }

      setReconcileForm(p => ({ ...p, proofImage: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReconcileForm(p => ({ ...p, proofImage: null }));
    setImagePreview(null);
  };

  const submitReconciliation = () => {
    if (!fulfillmentId) {
      toast.error('No fulfillment ID found for this transaction');
      return;
    }

    // Validation
    if (reconcileForm.outcome === 'FAILED' && !reconcileForm.failureReason.trim()) {
      toast.error('Please provide a failure reason');
      return;
    }

    const formData = new FormData();
    formData.append('outcome', reconcileForm.outcome);

    if (reconcileForm.outcome === 'DELIVERED' && reconcileForm.receivedBy.trim()) {
      formData.append('receivedBy', reconcileForm.receivedBy);
    }
    if (reconcileForm.outcome === 'FAILED' && reconcileForm.failureReason.trim()) {
      formData.append('failureReason', reconcileForm.failureReason);
    }
    if (reconcileForm.proofImage) {
      formData.append('proofImage', reconcileForm.proofImage);
    }

    reconcileMutation.mutate(formData);
  };

  const isSubmitDisabled =
    reconcileMutation.isPending || (reconcileForm.outcome === 'FAILED' && !reconcileForm.failureReason.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Reconcile Delivery</DialogTitle>
          <DialogDescription className="text-sm">
            Complete the delivery reconciliation for fulfillment{' '}
            <span className="font-mono text-foreground font-medium">{fulfillmentId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Outcome Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Delivery Outcome *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={reconcileForm.outcome === 'DELIVERED' ? 'default' : 'outline'}
                size="lg"
                className={`h-auto py-4 transition-all ${
                  reconcileForm.outcome === 'DELIVERED'
                    ? 'bg-green-600 hover:bg-green-700 border-green-600'
                    : 'hover:border-green-600 hover:text-green-600'
                }`}
                onClick={() =>
                  setReconcileForm(p => ({
                    ...p,
                    outcome: 'DELIVERED',
                    failureReason: '', // Clear failure reason when switching
                  }))
                }
              >
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Delivered</span>
                </div>
              </Button>
              <Button
                type="button"
                variant={reconcileForm.outcome === 'FAILED' ? 'default' : 'outline'}
                size="lg"
                className={`h-auto py-4 transition-all ${
                  reconcileForm.outcome === 'FAILED'
                    ? 'bg-red-600 hover:bg-red-700 border-red-600'
                    : 'hover:border-red-600 hover:text-red-600'
                }`}
                onClick={() =>
                  setReconcileForm(p => ({
                    ...p,
                    outcome: 'FAILED',
                    receivedBy: '', // Clear receivedBy when switching
                  }))
                }
              >
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Failed</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Dynamic Fields based on Outcome */}
          {reconcileForm.outcome === 'DELIVERED' ? (
            <div className="space-y-2">
              <Label htmlFor="receivedBy" className="text-sm font-medium">
                Received By <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="receivedBy"
                placeholder="e.g. John Doe, Front Desk"
                value={reconcileForm.receivedBy}
                onChange={e => setReconcileForm(p => ({ ...p, receivedBy: e.target.value }))}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Name of the person who received the delivery</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="failureReason" className="text-sm font-medium">
                Failure Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="failureReason"
                className="min-h-[100px] resize-none border-red-200 focus-visible:ring-red-500"
                placeholder="Describe why the delivery failed (e.g., Customer not home, Wrong address, Customer refused delivery)"
                value={reconcileForm.failureReason}
                onChange={e => setReconcileForm(p => ({ ...p, failureReason: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">This information will be logged for the delivery record</p>
            </div>
          )}

          {/* Proof of Delivery (File Upload) */}
          <div className="space-y-3">
            <Label htmlFor="proofImage" className="text-sm font-medium">
              Proof of Delivery Image <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>

            {!imagePreview ? (
              <div className="relative">
                <input
                  id="proofImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="proofImage"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs">JPG, PNG or WebP (max 10MB)</p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="relative rounded-lg border overflow-hidden">
                <img src={imagePreview} alt="Proof of delivery preview" className="w-full h-48 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <ImageIcon className="h-3 w-3" />
                    <span className="truncate">{reconcileForm.proofImage?.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={reconcileMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={submitReconciliation}
            disabled={isSubmitDisabled}
            className={
              reconcileForm.outcome === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }
          >
            {reconcileMutation.isPending ? (
              <>
                <span className="animate-pulse">Processing...</span>
              </>
            ) : (
              'Complete Reconciliation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
