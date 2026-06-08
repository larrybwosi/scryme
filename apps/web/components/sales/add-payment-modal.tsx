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
import { PaymentMethod } from '@repo/db/client';
import { addPayment } from '../../app/actions/sales';
import { toast } from 'sonner';

interface AddPaymentModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AddPaymentModal({ transaction, isOpen, onClose }: AddPaymentModalProps) {
  const [amount, setAmount] = useState(transaction?.finalTotal - (transaction?.totalPaid || 0));
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!transaction) return;
    setIsSubmitting(true);
    try {
      await addPayment(transaction.id, {
        amount,
        method,
        reference,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment - {transaction?.number}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <p className="text-xs text-zinc-500">
              Remaining: {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction?.currencyCode || 'USD' }).format(transaction?.finalTotal - (transaction?.totalPaid || 0))}
            </p>
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
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TXN-123456"
            />
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
