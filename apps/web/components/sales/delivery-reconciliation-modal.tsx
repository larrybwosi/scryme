'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  ClipboardCheck,
  ShieldCheck,
  FileUp,
  X,
  FileText
} from 'lucide-react';
import { reconcileFulfillment } from '../../app/actions/sales';
import { toast } from 'sonner';
import { cn } from "@repo/ui/lib/utils";

interface DeliveryReconciliationModalProps {
  fulfillmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryReconciliationModal({
  fulfillmentId,
  isOpen,
  onClose,
  onSuccess
}: DeliveryReconciliationModalProps) {
  const [otp, setOtp] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dnFile, setDnFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    return await response.json();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const attachments = [];

      if (dnFile) {
        const result = await uploadFile(dnFile);
        attachments.push({
          fileName: dnFile.name,
          fileUrl: result.data?.url || result.url || result.publicUrl,
          mimeType: dnFile.type,
          sizeBytes: dnFile.size,
          description: "Signed Delivery Note (Manual Upload)",
        });
      }

      if (invoiceFile) {
        const result = await uploadFile(invoiceFile);
        attachments.push({
          fileName: invoiceFile.name,
          fileUrl: result.data?.url || result.url || result.publicUrl,
          mimeType: invoiceFile.type,
          sizeBytes: invoiceFile.size,
          description: "Signed Invoice (Manual Upload)",
        });
      }

      await reconcileFulfillment(fulfillmentId, {
        otp,
        receivedBy,
        notes,
        attachments
      });

      toast.success("Delivery successfully reconciled and proof attached");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to reconcile delivery");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
             <ClipboardCheck className="w-5 h-5 text-emerald-600" />
             <DialogTitle>Complete Delivery Proof</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="otp" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Customer Verification Code (OTP)
            </Label>
            <Input
              id="otp"
              placeholder="6-digit code from customer email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="font-mono text-center text-lg tracking-widest h-12"
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="receivedBy" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Received By</Label>
              <Input
              id="receivedBy"
              placeholder="Name of recipient"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              />
          </div>

          <div className="space-y-3">
             <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Proof Documents (Physical Scans/Photos)</Label>

             <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <input
                        type="file"
                        id="dn-upload"
                        className="hidden"
                        onChange={(e) => setDnFile(e.target.files?.[0] || null)}
                    />
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full h-24 flex-col gap-2 border-dashed border-2",
                            dnFile && "border-emerald-500 bg-emerald-50 text-emerald-700"
                        )}
                        asChild
                    >
                        <label htmlFor="dn-upload" className="cursor-pointer">
                            {dnFile ? <FileText className="w-6 h-6" /> : <FileUp className="w-6 h-6 text-zinc-400" />}
                            <span className="text-[10px] font-medium">{dnFile ? dnFile.name.slice(0, 15) + '...' : 'Signed Delivery Note'}</span>
                        </label>
                    </Button>
                    {dnFile && <button onClick={() => setDnFile(null)} className="absolute -top-2 -right-2 p-1 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors"><X className="w-3 h-3" /></button>}
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="invoice-upload"
                        className="hidden"
                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    />
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full h-24 flex-col gap-2 border-dashed border-2",
                            invoiceFile && "border-emerald-500 bg-emerald-50 text-emerald-700"
                        )}
                        asChild
                    >
                        <label htmlFor="invoice-upload" className="cursor-pointer">
                            {invoiceFile ? <FileText className="w-6 h-6" /> : <FileUp className="w-6 h-6 text-zinc-400" />}
                            <span className="text-[10px] font-medium">{invoiceFile ? invoiceFile.name.slice(0, 15) + '...' : 'Signed Invoice'}</span>
                        </label>
                    </Button>
                    {invoiceFile && <button onClick={() => setInvoiceFile(null)} className="absolute -top-2 -right-2 p-1 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors"><X className="w-3 h-3" /></button>}
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any discrepancies or delivery remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="bg-zinc-50/50 -mx-6 -mb-6 p-6 border-t">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !otp || !receivedBy}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
          >
            {isSubmitting ? 'Processing...' : 'Verify & Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
