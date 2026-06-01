'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

interface PaymentForm {
  amount: string;
  method: PaymentMethod | '';
  reference: string;
  notes: string;
}

export function PaymentDialog({ open, onOpenChange, transactionId }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: '',
    method: '',
    reference: '',
    notes: '',
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await invoke('record_payment_command', { payload: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
      toast.success('Payment recorded successfully');
      setPaymentForm({ amount: '', method: '', reference: '', notes: '' });
    },
    onError: () => toast.error('Failed to record payment'),
  });

  const submitPayment = () => {
    if (!transactionId) return;
    paymentMutation.mutate({
      transactionId,
      ...paymentForm,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Add a payment for transaction.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Method</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(val: PaymentMethod) => setPaymentForm(p => ({ ...p, method: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea
              value={paymentForm.notes}
              onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submitPayment} disabled={paymentMutation.isPending || !paymentForm.amount}>
            {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
