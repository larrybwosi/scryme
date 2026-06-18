'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Upload,
  X,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useMpesaSearch } from '@/hooks/mpesa';
import { PaymentMethod } from '@/hooks/sales';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { getCurrentPhoneConfig } from '@/lib/phone.config';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { usePosStore } from '@/store/store';

type MpesaMode = 'STK' | 'PAYBILL' | 'BUY_GOODS' | 'QR' | 'SEARCH';
type MpesaStatus = 'IDLE' | 'WAITING' | 'SUCCESS' | 'FAILED';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

const normalizePhoneNumber = (phone: string, config: { countryCode: string }): string => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith(config.countryCode)) return cleaned;
  if (cleaned.startsWith('254')) return `+${cleaned}`;
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) return `${config.countryCode}${cleaned.substring(1)}`;
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) return `${config.countryCode}${cleaned}`;
  return cleaned;
};

export function PaymentDialog({ open, onOpenChange, transactionId }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const formatCurrency = useFormattedCurrency();
  const PHONE_CONFIG = getCurrentPhoneConfig();
  const settings = usePosStore(state => state.settings);

  // Form State
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // M-Pesa State
  const [mpesaMode, setMpesaMode] = useState<MpesaMode>('STK');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('IDLE');
  const [mpesaSearchQuery, setMpesaSearchQuery] = useState('');
  const [mpesaWaiting, setMpesaWaiting] = useState(false);

  const { data: unclaimedPayments, isLoading: isSearchingMpesa } = useMpesaSearch(mpesaSearchQuery);

  const paymentChannel = useRealtimeStore(state => state.paymentChannel);
  const subscribe = useRealtimeStore(state => state.subscribe);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setMethod(PaymentMethod.CASH);
      setAmount('');
      setReference('');
      setNotes('');
      setFilePath(null);
      setFilePreview(null);
      setMpesaStatus('IDLE');
      setMpesaMode('STK');
      setMpesaWaiting(false);

      // Auto-fill phone if available in transactions?
      // (For now just use empty or last known)
    }
  }, [open]);

  // Handle M-Pesa Realtime Updates
  useEffect(() => {
    if (!open || method !== PaymentMethod.MPESA || !paymentChannel) return;

    const handleUpdate = (txData: any) => {
      // Logic for matching transaction status
      if (txData.status === 'COMPLETED' || txData.status === 'SUCCESS') {
        setMpesaStatus('SUCCESS');
        setReference(txData.data?.receipt || txData.receipt || '');
        setMpesaWaiting(false);
        toast.success('M-Pesa payment received');
      } else if (txData.status === 'FAILED' || txData.status === 'CANCELLED') {
        setMpesaStatus('FAILED');
        setMpesaWaiting(false);
      }
    };

    const unsubUpdate = subscribe(paymentChannel, 'payment-update', handleUpdate);
    return () => unsubUpdate();
  }, [open, method, paymentChannel, subscribe]);

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await invoke('record_payment_command', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onOpenChange(false);
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => toast.error('Failed to record payment', { description: error.toString() }),
  });

  const handleFileUpload = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
    });

    if (selected && typeof selected === 'string') {
        setFilePath(selected);
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const contents = await readFile(selected);
        const blob = new Blob([contents]);
        setFilePreview(URL.createObjectURL(blob));
    }
  };

  const handleMpesaStkPush = async () => {
    if (!amount || !mpesaPhone) return;
    setMpesaStatus('WAITING');
    setMpesaWaiting(true);

    try {
      await invoke('initiate_mpesa_payment_command', {
        phoneNumber: normalizePhoneNumber(mpesaPhone, PHONE_CONFIG),
        amount: parseFloat(amount),
        saleNumber: transactionId || 'UNKNOWN'
      });
      toast.info('STK Push sent to customer');
    } catch (err: any) {
      setMpesaStatus('FAILED');
      setMpesaWaiting(false);
      toast.error('Failed to initiate M-Pesa', { description: err.toString() });
    }
  };

  const submitPayment = () => {
    if (!transactionId || !amount) return;
    paymentMutation.mutate({
      transactionId,
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      filePath: filePath || undefined,
    });
  };

  const paybillNumber = settings?.paybillNumber || '';
  const tillNumber = settings?.tillNumber || '';
  const organizationName = settings?.businessName || 'My Business';
  const paybillAccountNo = transactionId?.slice(-6) || 'ORDER';

  const mpesaQrData = useMemo(() => {
    const businessNumber = paybillNumber || tillNumber;
    const type = paybillNumber ? 'Paybill' : 'Till';
    return `M-PESA-PAYMENT|${type.toUpperCase()}|${businessNumber}|${paybillAccountNo}|${parseFloat(amount) || 0}|${organizationName}`;
  }, [paybillNumber, tillNumber, paybillAccountNo, amount, organizationName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Add a payment for transaction {transactionId}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Method Selection */}
          <div className="flex border-b">
            {[
              { id: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
              { id: PaymentMethod.MPESA, label: 'M-Pesa', icon: Smartphone },
              { id: PaymentMethod.CREDIT, label: 'Card', icon: CreditCard },
              { id: PaymentMethod.BANK_TRANSFER, label: 'Bank', icon: ShieldCheck },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex-1 py-4 flex flex-col items-center gap-1 transition-colors border-b-2",
                  method === m.id ? "border-primary bg-primary/5 text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <m.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {/* Amount and Ref */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">KSh</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-12 font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference (Optional)</Label>
                <Input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. TX123456"
                />
              </div>
            </div>

            {/* Method Specific Content */}
            <AnimatePresence mode="wait">
              {method === PaymentMethod.MPESA && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 p-4 bg-muted/30 rounded-lg border border-dashed"
                >
                  <div className="flex gap-2 p-1 bg-muted rounded-md mb-4">
                    {['STK', 'QR', 'SEARCH'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setMpesaMode(mode as MpesaMode)}
                        className={cn(
                          "flex-1 py-1 text-xs font-semibold rounded transition-all",
                          mpesaMode === mode ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {mpesaMode === 'STK' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase">Customer Phone</Label>
                        <Input
                          value={mpesaPhone}
                          onChange={e => setMpesaPhone(e.target.value)}
                          placeholder="07XX XXX XXX"
                        />
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={handleMpesaStkPush}
                        disabled={!mpesaPhone || !amount || mpesaWaiting}
                      >
                        {mpesaWaiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                        Send STK Push
                      </Button>
                      {mpesaStatus !== 'IDLE' && (
                        <div className={cn(
                          "p-3 rounded-md text-sm flex items-center gap-2",
                          mpesaStatus === 'WAITING' && "bg-amber-50 text-amber-700 border border-amber-200",
                          mpesaStatus === 'SUCCESS' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          mpesaStatus === 'FAILED' && "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {mpesaStatus === 'WAITING' && <Loader2 className="w-4 h-4 animate-spin" />}
                          {mpesaStatus === 'SUCCESS' && <CheckCircle2 className="w-4 h-4" />}
                          {mpesaStatus === 'FAILED' && <XCircle className="w-4 h-4" />}
                          <span className="font-medium">
                            {mpesaStatus === 'WAITING' && "Waiting for customer PIN..."}
                            {mpesaStatus === 'SUCCESS' && "Payment Confirmed!"}
                            {mpesaStatus === 'FAILED' && "Payment Failed or Timed Out"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {mpesaMode === 'QR' && (
                    <div className="flex flex-col items-center gap-4 py-2">
                       <div className="bg-white p-2 rounded shadow-sm">
                        <QRCodeSVG value={mpesaQrData} size={150} />
                      </div>
                      <div className="text-center text-xs space-y-1">
                        <p className="font-bold">Scan to Pay</p>
                        <p className="text-muted-foreground">Account: {paybillAccountNo}</p>
                      </div>
                    </div>
                  )}

                  {mpesaMode === 'SEARCH' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search M-Pesa code or phone..."
                          className="pl-8"
                          value={mpesaSearchQuery}
                          onChange={e => setMpesaSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                        {isSearchingMpesa ? (
                          <div className="py-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                        ) : unclaimedPayments?.length ? (
                          unclaimedPayments.map((p: any) => (
                            <div key={p.id} className="p-2 border rounded flex justify-between items-center bg-background">
                              <div className="text-xs">
                                <p className="font-bold">{p.transId}</p>
                                <p className="text-muted-foreground">{p.msisdn} • {formatCurrency(p.amount)}</p>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                                setReference(p.transId);
                                setAmount(p.amount.toString());
                                toast.success('Payment linked');
                              }}>Link</Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-xs text-muted-foreground py-4">No payments found</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Proof of Payment / Attachment */}
            <div className="space-y-3">
                <Label>Proof of Payment Attachment (Optional)</Label>
                {!filePreview ? (
                    <div
                        onClick={handleFileUpload}
                        className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload bank slip or cheque</p>
                    </div>
                ) : (
                    <div className="relative rounded-lg border overflow-hidden">
                        <img src={filePreview} alt="Proof" className="w-full h-32 object-cover" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                            onClick={() => { setFilePath(null); setFilePreview(null); }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes about this payment..."
                className="resize-none h-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submitPayment}
            disabled={paymentMutation.isPending || !amount}
            className="min-w-[140px]"
          >
            {paymentMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
