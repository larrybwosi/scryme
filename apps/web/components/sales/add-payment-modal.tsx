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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { PaymentMethod } from '@repo/db/client';
import { addPayment } from '../../app/actions/sales';
import { toast } from 'sonner';
import { Upload, X, FileIcon } from 'lucide-react';

interface AddPaymentModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AddPaymentModal({ transaction, isOpen, onClose }: AddPaymentModalProps) {
  const [amount, setAmount] = useState(transaction ? Number(transaction.finalTotal) - Number(transaction.totalPaid || 0) : 0);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }[]>([]);

  // Simulate file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // NOTE: In a real production environment, you would upload the file to a storage provider
      // like S3, Google Cloud Storage, or Cloudinary and use the returned permanent URL.
      // For this implementation, we are using a placeholder URL to demonstrate the data flow.
      const newAttachment = {
        fileName: file.name,
        fileUrl: `https://storage.example.com/payments/${Date.now()}-${file.name}`,
        mimeType: file.type,
        sizeBytes: file.size,
      };
      setAttachments([...attachments, newAttachment]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      await addPayment(transaction.id, {
        amount,
        method,
        reference,
        notes,
        bankName: method === 'CHEQUE' ? bankName : undefined,
        chequeDate: method === 'CHEQUE' && chequeDate ? new Date(chequeDate) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success('Payment added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment - {transaction?.number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-zinc-500 -mt-2">
            Remaining: {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction?.currencyCode || 'USD' }).format(Number(transaction?.finalTotal || 0) - Number(transaction?.totalPaid || 0))}
          </p>

          {method === 'CHEQUE' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Equity Bank"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chequeDate">Cheque Date</Label>
                <Input
                  id="chequeDate"
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TXN-123456 or Cheque #"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details about this payment..."
              className="h-20"
            />
          </div>

          <div className="grid gap-2">
            <Label>Attachments (Payment Proof)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                className="w-full border-dashed"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Proof
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="text-xs truncate font-medium">{file.fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-red-500"
                      onClick={() => removeAttachment(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || amount <= 0}>
            {isSubmitting ? 'Adding...' : 'Add Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
