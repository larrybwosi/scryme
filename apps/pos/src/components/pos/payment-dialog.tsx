import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogTitle } from '@repo/ui/components/ui/dialog';
import {
  CreditCard,
  Smartphone,
  ReceiptText,
  ShieldCheck,
  Loader2,
  Crown,
  Star,
  Zap,
  Gift,
  Plus,
  Trash2,
  AlertCircle,
  Minus,
  Banknote,
  Wallet,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Tag,
  Clock,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFormattedCurrency } from '@/lib/utils';
import { getCurrentPhoneConfig } from '@/lib/phone.config';
import { CartItem, Customer, Order, OrderType } from '@/types';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Label } from '@repo/ui/components/ui/label';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Input } from '@repo/ui/components/ui/input';
import { usePosStore } from '@/store/store';
import { PaymentMethod, PaymentStatus, useProcessSale } from '@/hooks/sales';
import { useAuthStore } from '@/store/pos-auth-store';
import { MpesaFlowType, ProcessSaleInput, ProcessSaleInputSchema } from '@/lib/validation/transactions';
import { useMpesaSearch, useMpesaClaim, useMpesaVerifySafaricom } from '@/hooks/mpesa';
import { cn } from '@/lib/utils';
import { shiftService } from '@/lib/shift-service';
import { emit } from '@tauri-apps/api/event';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useCashDrawer } from '@/hooks/use-cash-drawer';
import { useGiftCard } from '@/hooks/use-gift-card';
import { sendOrderToKitchen } from '@/lib/kds';
import posthog from 'posthog-js';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  customer: Customer | null;
  orderType: OrderType;
  tableNumber?: string;
  onPaymentComplete: (order: Order) => void;
}

interface AddedPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  meta?: any;
}

type MpesaMode = 'STK' | 'PAYBILL' | 'BUY_GOODS' | 'QR' | 'SEARCH';
type MpesaStatus = 'IDLE' | 'WAITING' | 'SUCCESS' | 'FAILED';
type PaymentTab = 'CASH' | 'MOBILE_PAYMENT' | 'CREDIT_CARD' | 'GIFT_CARD' | 'INSURANCE';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const normalizePhoneNumber = (phone: string, config: { countryCode: string }): string => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith(config.countryCode)) return cleaned;
  if (cleaned.startsWith('254')) return `+${cleaned}`;
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) return `${config.countryCode}${cleaned.substring(1)}`;
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) return `${config.countryCode}${cleaned}`;
  return cleaned;
};

const generateMpesaQrCodeData = (
  organizationName: string,
  paybillNumber: string,
  tillNumber: string,
  accountRef: string,
  amount: number
): string => {
  const businessNumber = paybillNumber || tillNumber;
  const type = paybillNumber ? 'Paybill' : 'Till';
  if (!businessNumber) return `ERROR*NO_MPESA_ID*0*0*0`;
  return `M-PESA-PAYMENT|${type.toUpperCase()}|${businessNumber}|${accountRef}|${amount.toFixed(2)}|${organizationName}`;
};

const PAYMENT_METHODS: { id: PaymentTab; label: string; icon: React.ReactNode }[] = [
  { id: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  { id: 'MOBILE_PAYMENT', label: 'M-Pesa', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'CREDIT_CARD', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'GIFT_CARD', label: 'Gift Card', icon: <Gift className="w-4 h-4" /> },
  { id: 'INSURANCE', label: 'Insurance', icon: <ShieldCheck className="w-4 h-4" /> },
];

const CASH_PRESETS = [50, 100, 200, 500, 1000];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const CustomerBadge = memo(({ customer }: { customer: Customer | null }) => {
  if (!customer) return null;
  const tierLevel = customer.loyaltyPoints || 0;

  if (tierLevel >= 1000) {
    return (
      <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950 border-0 shadow-sm">
        <Crown className="w-3 h-3 mr-1" /> VIP
      </Badge>
    );
  }
  if (tierLevel >= 500) {
    return (
      <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-sm">
        <Star className="w-3 h-3 mr-1" /> Gold
      </Badge>
    );
  }
  if (tierLevel >= 100) {
    return (
      <Badge className="bg-gradient-to-r from-sky-400 to-blue-500 text-white border-0 shadow-sm">
        <Zap className="w-3 h-3 mr-1" /> Silver
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs">
      Regular
    </Badge>
  );
});
CustomerBadge.displayName = 'CustomerBadge';

const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
  const icons: Record<string, React.ReactNode> = {
    [PaymentMethod.CASH]: <Banknote className="w-4 h-4" />,
    [PaymentMethod.MPESA]: <Smartphone className="w-4 h-4" />,
    [PaymentMethod.CREDIT]: <CreditCard className="w-4 h-4" />,
    [PaymentMethod.GIFT_CARD]: <Gift className="w-4 h-4" />,
    [PaymentMethod.INSURANCE]: <ShieldCheck className="w-4 h-4" />,
  };
  return <>{icons[method] ?? <Wallet className="w-4 h-4" />}</>;
};

interface ProgressBarProps {
  paid: number;
  total: number;
}

const PaymentProgress = ({ paid, total }: ProgressBarProps) => {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const isComplete = pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="h-2 w-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full transition-colors', isComplete ? 'bg-emerald-500' : 'bg-primary')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct.toFixed(0)}% paid</span>
        {isComplete && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Complete
          </span>
        )}
      </div>
    </div>
  );
};

interface MpesaStatusBannerProps {
  status: MpesaStatus;
  phone: string;
  onRetry?: () => void;
}

const MpesaStatusBanner = ({ status, phone, onRetry }: MpesaStatusBannerProps) => {
  if (status === 'IDLE') {
    return <p className="text-xs text-muted-foreground">STK Push will prompt the customer to enter their PIN.</p>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        {status === 'WAITING' && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <div>
              <p className="font-semibold">Awaiting PIN entry</p>
              <p className="text-xs opacity-80">Prompt sent to {phone}</p>
            </div>
          </div>
        )}
        {status === 'SUCCESS' && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Payment Confirmed!</p>
              <p className="text-xs opacity-80">M-Pesa transaction received</p>
            </div>
          </div>
        )}
        {status === 'FAILED' && (
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Payment Failed</p>
              <p className="text-xs opacity-80">Cancelled or timed out</p>
            </div>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs shrink-0">
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const PaymentModal = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  customer,
  orderType,
  tableNumber,
  onPaymentComplete,
}: PaymentModalProps) => {
  const [selectedTab, setSelectedTab] = useState<PaymentTab>('CASH');
  const [currentPayments, setCurrentPayments] = useState<AddedPayment[]>([]);
  const [amountInput, setAmountInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [editableDiscount, setEditableDiscount] = useState<number>(discount);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Gift Card
  const [giftCardCode, setGiftCardCode] = useState('');
  const { validateGiftCard, isLoading: isValidatingGC } = useGiftCard();

  // Insurance
  const [insuranceProvider, setInsuranceProvider] = useState((customer as any)?.insuranceProvider || '');
  const [policyNumber, setPolicyNumber] = useState((customer as any)?.policyNumber || '');

  // M-Pesa
  const [mpesaMode, setMpesaMode] = useState<MpesaMode>('STK');
  const [mpesaSearchQuery, setMpesaSearchQuery] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState(customer?.phone || '');
  const [mpesaWaiting, setMpesaWaiting] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>('IDLE');
  const [detectedPayment, setDetectedPayment] = useState<any>(null);

  const { mutateAsync: createSale, isPending: isProcessing } = useProcessSale();
  const { data: unclaimedPayments, isLoading: isSearchingMpesa } = useMpesaSearch(mpesaSearchQuery);
  const { mutateAsync: claimMpesaPayment, isPending: isClaimingMpesa } = useMpesaClaim();
  const { mutateAsync: verifyWithSafaricom, isPending: isVerifyingSafaricom } = useMpesaVerifySafaricom();

  const { openPhysicalDrawer } = useCashDrawer();
  const [activeShift, setActiveShift] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      shiftService.getShiftStatus().then(setActiveShift).catch(console.error);
    }
  }, [isOpen]);

  const currentMember = useAuthStore(state => state.currentMember);
  const settings = usePosStore(state => state.settings);
  const saveUnpaidOrder = usePosStore(state => state.saveUnpaidOrder);
  const deductStockForOrderItems = usePosStore(state => state.deductStockForOrderItems);
  const autoPrintConfig = settings.autoPrintConfig;
  const locationId = useAuthStore(state => state.currentLocation?.id);
  const taxRate = settings?.taxRate;

  const organizationName = settings?.businessName || 'My Business';
  const paybillNumber = settings?.paybillNumber || '';
  const tillNumber = settings?.tillNumber || '';

  const formatCurrency = useFormattedCurrency();
  const PHONE_CONFIG = getCurrentPhoneConfig();

  // ── IDs ──
  const orderId = useMemo(() => (isOpen ? uuidv4() : ''), [isOpen]);
  const saleNumber = useMemo(() => (isOpen ? `SALE-${Date.now().toString().slice(-6)}` : ''), [isOpen]);
  const cleanAccountRef = useMemo(() => (isOpen ? Date.now().toString().slice(-6) : ''), [isOpen]);
  const paybillAccountNo = useMemo(() => cleanAccountRef, [cleanAccountRef]);
  const fullSaleNumber = saleNumber;

  // ── Sync discount prop ──
  useEffect(() => {
    setEditableDiscount(discount);
  }, [discount]);

  // ── Calculations ──
  const { totalPayable, priceBeforeTax, calculatedTax } = useMemo(() => {
    const total = Math.max(0, subtotal - editableDiscount);
    const rate = Number(taxRate) || 0;
    const taxableAmount = total / (1 + rate);
    const taxAmount = total - taxableAmount;
    return { totalPayable: total, priceBeforeTax: taxableAmount, calculatedTax: taxAmount };
  }, [subtotal, editableDiscount, taxRate]);

  const totalPaid = useMemo(() => currentPayments.reduce((sum, p) => sum + p.amount, 0), [currentPayments]);
  const remainingBalance = useMemo(() => Math.max(0, totalPayable - totalPaid), [totalPayable, totalPaid]);
  const changeDue = useMemo(() => Math.max(0, totalPaid - totalPayable), [totalPayable, totalPaid]);
  const isFullyPaid = remainingBalance <= 0.01;

  // ── Auto-fill amount input ──
  useEffect(() => {
    if (remainingBalance > 0 && selectedTab !== 'GIFT_CARD') {
      setAmountInput(remainingBalance.toFixed(2));
    } else if (remainingBalance === 0) {
      setAmountInput('');
    }
  }, [remainingBalance, selectedTab, isOpen]);

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen) {
      setCurrentPayments([]);
      setMpesaStatus('IDLE');
      setDetectedPayment(null);
      setGiftCardCode('');
      setValidationErrors([]);
      setNotes('');
      setSelectedTab('CASH');
    }
  }, [isOpen]);

  // ── QR data ──
  const mpesaQrData = useMemo(
    () => generateMpesaQrCodeData(organizationName, paybillNumber, tillNumber, paybillAccountNo, remainingBalance),
    [organizationName, paybillNumber, tillNumber, paybillAccountNo, remainingBalance]
  );

  // ── Emit display updates ──
  useEffect(() => {
    if (!isOpen) return;
    if (selectedTab === 'MOBILE_PAYMENT' && (mpesaMode === 'QR' || mpesaMode === 'PAYBILL')) {
      emit('payment-update', {
        type: 'MPESA_QR',
        amount: remainingBalance,
        qrData: mpesaQrData,
        paybill: paybillNumber,
        tillNo: tillNumber,
        accountRef: paybillAccountNo,
        mode: mpesaMode,
      });
    } else if (selectedTab === 'MOBILE_PAYMENT' && mpesaMode === 'STK') {
      emit('payment-update', { type: 'MPESA_STK', amount: remainingBalance, phoneNumber: mpesaPhone });
    } else {
      emit('payment-update', { type: 'GENERIC_TOTAL', amount: remainingBalance, totalPaid, change: changeDue });
    }
  }, [
    isOpen,
    selectedTab,
    mpesaMode,
    mpesaQrData,
    remainingBalance,
    paybillNumber,
    tillNumber,
    paybillAccountNo,
    totalPaid,
    changeDue,
    mpesaPhone,
  ]);

  // ── Realtime listener ──
  const paymentChannel = useRealtimeStore(state => state.paymentChannel);
  const subscribe = useRealtimeStore(state => state.subscribe);


  // ── Payment helpers ──
  const addPayment = useCallback((payment: Omit<AddedPayment, 'id'>) => {
    setCurrentPayments(prev => [...prev, { ...payment, id: uuidv4() }]);
    setAmountInput('');
    setValidationErrors([]);
  }, []);

  const handlePaymentMatch = useCallback(
    (data: any) => {
      setDetectedPayment(data);
      setMpesaStatus('SUCCESS');
      setMpesaWaiting(false);
      setTimeout(() => {
        addPayment({
          method: PaymentMethod.MPESA,
          amount: data.amount,
          reference: data.receipt,
          meta: {
            mpesaType: mpesaMode === 'STK' ? MpesaFlowType.STK_PUSH : MpesaFlowType.PAYBILL_MANUAL,
            mpesaPhoneNumber: data.phone || mpesaPhone,
            ...data,
          },
        });
        setDetectedPayment(null);
        setMpesaStatus('IDLE');
      }, 1500);
    },
    [addPayment, mpesaMode, mpesaPhone]
  );

  useEffect(() => {
    if (!isOpen || selectedTab !== 'MOBILE_PAYMENT' || !paymentChannel) return;

    const handleUnclaimed = (data: any) => {
      if ((mpesaMode === 'PAYBILL' || mpesaMode === 'QR') && data.accountRef) {
        if (data.accountRef.toUpperCase() === paybillAccountNo.toUpperCase()) handlePaymentMatch(data);
      }
      if (mpesaMode === 'BUY_GOODS' && Math.abs(Number(data.amount) - remainingBalance) < 1.0) {
        handlePaymentMatch(data);
      }
    };

    const handleUpdate = (txData: any) => {
      if (txData.transactionId === fullSaleNumber || txData.data?.accountRef === paybillAccountNo) {
        const isSuccess = txData.status === 'COMPLETED' || txData.status === 'SUCCESS';
        if (isSuccess) {
          handlePaymentMatch(txData.data || txData);
        } else if (txData.status === 'FAILED' || txData.status === 'CANCELLED') {
          setMpesaStatus('FAILED');
          setMpesaWaiting(false);
        }
      }
    };

    const unsubUnclaimed = subscribe(paymentChannel, 'payment-unclaimed', handleUnclaimed);
    const unsubUpdate = subscribe(paymentChannel, 'payment-update', handleUpdate);

    return () => {
      unsubUnclaimed();
      unsubUpdate();
    };
  }, [
    isOpen,
    selectedTab,
    mpesaMode,
    subscribe,
    paymentChannel,
    fullSaleNumber,
    paybillAccountNo,
    remainingBalance,
    handlePaymentMatch,
  ]);

  const removePayment = useCallback((id: string) => {
    setCurrentPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Handlers ──
  const handleAddCash = () => {
    if (settings.enforceShiftForCashPayments && !activeShift && import.meta.env.MODE !== 'standalone') {
        toast.error('No Active Shift', {
            description: 'You must open a shift before processing cash payments.',
        });
        return;
    }

    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;
    addPayment({ method: PaymentMethod.CASH, amount });
  };

  const handleAddCard = () => {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;
    addPayment({ method: PaymentMethod.CREDIT, amount, reference: 'Terminal' });
  };

  const handleAddInsurance = () => {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;
    addPayment({
      method: PaymentMethod.INSURANCE,
      amount,
      reference: insuranceProvider,
      meta: { insuranceProvider, policyNumber },
    });
  };

  const handleGiftCardScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardCode) return;
    const card = await validateGiftCard(giftCardCode);
    if (card) {
      const amountToDeduct = Math.min(card.balance, remainingBalance);
      addPayment({
        method: PaymentMethod.GIFT_CARD,
        amount: amountToDeduct,
        reference: card.code,
        meta: { giftCardId: card.code, balanceBefore: card.balance, balanceAfter: card.balance - amountToDeduct },
      });
      setGiftCardCode('');
      toast.success(`Redeemed ${formatCurrency(amountToDeduct)} from Gift Card`);
    }
  };


  const handleMpesaStkTrigger = async () => {
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;
    const payload: ProcessSaleInput = {
      cartItems: [],
      ...getCommonPayloadFields(),
      paymentMethod: PaymentMethod.MPESA,
      paymentStatus: PaymentStatus.PENDING,
      amountReceived: amount,
      change: 0,
      mpesaType: MpesaFlowType.STK_PUSH,
      mpesaPhoneNumber: normalizePhoneNumber(mpesaPhone, PHONE_CONFIG),
      payments: [
        {
          method: PaymentMethod.MPESA,
          amount: amount,
          meta: {
            mpesaType: MpesaFlowType.STK_PUSH,
            mpesaPhoneNumber: normalizePhoneNumber(mpesaPhone, PHONE_CONFIG),
          },
        },
      ],
    };
    try {
      await createSale(payload);
      setMpesaStatus('WAITING');
      setMpesaWaiting(true);
    } catch (err: any) {
      setValidationErrors([err?.message || 'Failed to trigger STK Push. Please retry.']);
    }
  };

  const getCommonPayloadFields = (): any => {
    let finalNotes = notes;
    const { metadata } = usePosStore.getState().currentOrder;
    if (metadata?.guestsCount || metadata?.createdAt || tableNumber) {
      const parts = [];
      if (tableNumber) parts.push(`Table ${tableNumber}`);
      if (metadata?.guestsCount) parts.push(`${metadata.guestsCount} Guests`);
      if (metadata?.createdAt) {
        const diffMins = Math.floor((Date.now() - metadata.createdAt) / 60000);
        let durationStr = `${diffMins}m`;
        if (diffMins >= 60) {
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          durationStr = `${hours}h ${mins}m`;
        }
        parts.push(`Duration: ${durationStr}`);
      }
      
      const extraInfo = parts.join(' | ');
      if (finalNotes) {
        finalNotes = `${finalNotes}\n${extraInfo}`;
      } else {
        finalNotes = extraInfo;
      }
    }

    return {
      cartItems: cartItems.map(item => ({
        productId: item.productId || '',
        productName: item.productName || 'Unknown Product',
        variantId: item.variantId || '',
        variantName: item.variantName || '',
        quantity: item.quantity,
        sellingUnitId: item.selectedUnit?.unitId || '',
        sellingUnitName: item.selectedUnit?.unitName || '',
        unitPrice: item.price,
      })),
      locationId,
      saleNumber: fullSaleNumber,
      accountRef: paybillAccountNo,
      isWholesale: false,
      customerId: customer?.id && customer.id !== 'temp-id' ? customer.id : null,
      enableStockTracking: true,
      notes: finalNotes,
      discountAmount: editableDiscount,
      cashierName: currentMember?.name || 'Staff',
      // Pharmacy fields
      prescriptionId: (usePosStore.getState().currentOrder as any).prescriptionId,
      doctorName: (usePosStore.getState().currentOrder as any).doctorName,
    };
  };

  const handleCompleteSale = async () => {
    let primaryMethod = PaymentMethod.SPLIT;
    if (currentPayments.length === 1) primaryMethod = currentPayments[0].method;
    else if (currentPayments.length === 0 && totalPayable === 0) primaryMethod = PaymentMethod.CASH;

    const payload: any = {
      ...getCommonPayloadFields(),
      paymentMethod: primaryMethod,
      paymentStatus: PaymentStatus.COMPLETED,
      amountReceived: totalPaid,
      change: changeDue,
      payments: currentPayments.map(p => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        meta: p.meta,
      })),
    };

    const result = ProcessSaleInputSchema.safeParse(payload);
    if (!result.success) {
      setValidationErrors(result.error.errors.map(e => e.message));
      return;
    }

    try {
      const queuedSale: any = await createSale(result.data);
      const completedOrder: Order = {
        id: queuedSale?.id || orderId,
        orderNumber: queuedSale?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        items: cartItems,
        customer,
        subtotal: priceBeforeTax,
        discount: editableDiscount,
        tax: calculatedTax,
        total: totalPayable,
        orderType,
        tableNumber,
        datetime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        notes,
        status: 'completed',
        paymentMethod: primaryMethod,
        saleNumber: fullSaleNumber,
        amountPaid: totalPaid,
        change: changeDue,
      };
      if (currentPayments.some(p => p.method === PaymentMethod.CASH) && autoPrintConfig.openCashDrawer) {
        openPhysicalDrawer();
      }
      emit('payment-update', { type: 'CLEAR_COMPLETED' });
      posthog.capture('sale_completed', {
        total: totalPayable,
        subtotal: priceBeforeTax,
        tax: calculatedTax,
        discount: editableDiscount,
        payment_method: primaryMethod,
        items_count: cartItems.length,
        order_type: orderType,
        has_customer: !!customer,
        table_number: tableNumber,
      });

      // Deduct local stock immediately on sale
      deductStockForOrderItems(cartItems);

      if (settings.enableKdsSystem) {
        sendOrderToKitchen(completedOrder);
      }

      onPaymentComplete(completedOrder);
      onClose();
    } catch (err: any) {
      setValidationErrors([err?.message || 'Error completing sale. Please try again.']);
    }
  };

  // ── Render ──
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open && (isProcessing || mpesaWaiting)) return;
        onClose();
      }}
    >
      <DialogContent className="p-0 gap-0 sm:max-w-[940px] max-h-[96vh] overflow-hidden rounded-none border-border/60 shadow-2xl">
        {/* STK Waiting Overlay */}
        <AnimatePresence>
          {mpesaWaiting && mpesaMode === 'STK' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center rounded-none"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="space-y-6 max-w-sm"
              >
                <div className="mx-auto w-24 h-24 relative">
                  <div className="absolute inset-0 bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 animate-spin"
                    style={{ animationDuration: '2s' }}
                  >
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-green-500"
                      strokeDasharray="220"
                      strokeDashoffset="60"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">Check Customer's Phone</h3>
                  <p className="text-muted-foreground text-sm">
                    STK push sent to <span className="font-semibold text-foreground">{mpesaPhone}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Waiting for PIN confirmation…</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setMpesaWaiting(false)} className="gap-2">
                  <XCircle className="w-4 h-4" /> Cancel Waiting
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-none">Checkout</DialogTitle>
              {customer ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-muted-foreground">{customer.name}</span>
                  <CustomerBadge customer={customer} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Walk-in customer</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Due</p>
            <p className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(totalPayable)}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="grid grid-cols-12 overflow-hidden" style={{ height: 580 }}>
          {/* ──────── LEFT PANEL ──────── */}
          <div className="col-span-7 border-r flex flex-col overflow-hidden">
            {/* Discount strip */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-muted/10 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                <span>Discount</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setEditableDiscount(v => Math.max(0, v - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  className="h-8 w-24 text-center font-semibold text-sm no-spinners"
                  value={editableDiscount}
                  onChange={e => setEditableDiscount(Math.min(parseFloat(e.target.value) || 0, subtotal))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setEditableDiscount(v => Math.min(v + 1, subtotal))}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Payment method tabs */}
            <div className="flex gap-1 p-3 border-b bg-background">
              {PAYMENT_METHODS.filter(m => import.meta.env.MODE !== 'standalone' || m.id === 'CASH').map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedTab(method.id);
                    setValidationErrors([]);
                  }}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-2.5 px-2 text-xs font-medium transition-all duration-150',
                    selectedTab === method.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {method.icon}
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* ─ CASH ─ */}
                  {selectedTab === 'CASH' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Amount Tendered
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                            KSh
                          </span>
                          <Input
                            type="number"
                            value={amountInput}
                            onChange={e => setAmountInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCash()}
                            className="pl-12 text-xl font-bold h-14 no-spinners"
                            placeholder={remainingBalance.toFixed(2)}
                            autoFocus
                          />
                        </div>
                      </div>
                      {/* Quick amounts */}
                      <div className="grid grid-cols-3 gap-2">
                        {CASH_PRESETS.map(val => (
                          <Button
                            key={val}
                            variant="outline"
                            className={cn(
                              'h-11 text-sm font-semibold transition-all',
                              parseFloat(amountInput) === val && 'border-primary bg-primary/5 text-primary'
                            )}
                            onClick={() => setAmountInput(val.toString())}
                          >
                            {val.toLocaleString()}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          className={cn(
                            'h-11 text-sm font-semibold col-span-1 transition-all',
                            parseFloat(amountInput) === remainingBalance && 'border-primary bg-primary/5 text-primary'
                          )}
                          onClick={() => setAmountInput(remainingBalance.toFixed(2))}
                        >
                          Exact
                        </Button>
                      </div>
                      <Button
                        className="w-full h-12 text-sm font-semibold gap-2"
                        onClick={handleAddCash}
                        disabled={!amountInput || parseFloat(amountInput) <= 0}
                      >
                        <Plus className="w-4 h-4" /> Add Cash Payment
                      </Button>
                      {changeDue > 0 && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
                          <span className="text-amber-700 dark:text-amber-400 font-medium">Change Due</span>
                          <span className="font-bold text-amber-600 dark:text-amber-300 text-base">
                            {formatCurrency(changeDue)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─ M-PESA ─ */}
                  {selectedTab === 'MOBILE_PAYMENT' && (
                    <div className="space-y-4">
                      {/* Mode toggle */}
                      <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-muted">
                        {(['STK', 'QR', 'PAYBILL', 'BUY_GOODS', 'SEARCH'] as MpesaMode[]).map(mode => (
                          <button
                            key={mode}
                            onClick={() => {
                              setMpesaMode(mode);
                              setDetectedPayment(null);
                              setMpesaStatus('IDLE');
                            }}
                            className={cn(
                              'py-1.5 rounded-lg text-xs font-semibold transition-all',
                              mpesaMode === mode
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {mode === 'SEARCH' ? 'MANUAL' : mode.replace('_', ' ')}
                          </button>
                        ))}
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                            KSh
                          </span>
                          <Input
                            type="number"
                            value={amountInput}
                            onChange={e => setAmountInput(e.target.value)}
                            placeholder={remainingBalance.toFixed(2)}
                            className="pl-12 text-lg font-bold h-12 no-spinners"
                          />
                        </div>
                      </div>

                      {/* STK mode */}
                      {mpesaMode === 'STK' && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                              Phone Number
                            </Label>
                            <Input
                              value={mpesaPhone}
                              onChange={e => setMpesaPhone(e.target.value)}
                              placeholder="07XX XXX XXX"
                              className="h-11 font-mono"
                            />
                          </div>
                          <Button
                            className="w-full h-12 font-semibold gap-2"
                            onClick={handleMpesaStkTrigger}
                            disabled={mpesaStatus === 'WAITING' || !mpesaPhone || !amountInput}
                          >
                            {mpesaStatus === 'WAITING' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-4 h-4" /> Send STK Push
                              </>
                            )}
                          </Button>
                          <MpesaStatusBanner
                            status={mpesaStatus}
                            phone={mpesaPhone}
                            onRetry={() => setMpesaStatus('IDLE')}
                          />
                        </div>
                      )}

                      {/* QR / Paybill */}
                      {(mpesaMode === 'QR' || mpesaMode === 'PAYBILL') && (
                        <div className="flex flex-col items-center gap-4 p-5 bg-muted/20 rounded-none border">
                          {mpesaMode === 'QR' && (
                            <div className="bg-white p-3 shadow-sm">
                              <QRCodeSVG value={mpesaQrData} size={128} />
                            </div>
                          )}
                          <div className="text-center space-y-3 w-full">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-background border text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Paybill</p>
                                <p className="font-mono font-bold text-base">{paybillNumber || '–'}</p>
                              </div>
                              <div className="p-3 bg-background border text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Account</p>
                                <p className="font-mono font-bold text-base text-primary">{paybillAccountNo}</p>
                              </div>
                            </div>
                          </div>
                          {!detectedPayment && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Waiting for payment…
                            </p>
                          )}
                        </div>
                      )}

                      {/* Buy Goods */}
                      {mpesaMode === 'BUY_GOODS' && (
                        <div className="p-4 bg-muted/20 rounded-none border text-center space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">Till Number</p>
                          <p className="font-mono font-bold text-2xl">{tillNumber || '–'}</p>
                          {!detectedPayment && (
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Awaiting exact amount…
                            </p>
                          )}
                        </div>
                      )}

                      {/* Manual Search */}
                      {mpesaMode === 'SEARCH' && (
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={mpesaSearchQuery}
                              onChange={e => setMpesaSearchQuery(e.target.value)}
                              placeholder="Code, Phone or Name..."
                              className="pl-9 h-11"
                            />
                          </div>

                          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                            {isSearchingMpesa ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : unclaimedPayments?.length ? (
                              unclaimedPayments.map((payment: any) => (
                                <div
                                  key={payment.id}
                                  className="p-3 border bg-background hover:border-primary/50 transition-colors flex items-center justify-between group"
                                >
                                  <div>
                                    <p className="text-sm font-bold">{payment.transId}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {payment.msisdn} • {formatCurrency(payment.amount)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground opacity-70">
                                      {new Date(payment.transTime).toLocaleString()}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() => {
                                      handlePaymentMatch({
                                        receipt: payment.transId,
                                        amount: Number(payment.amount),
                                        phone: payment.msisdn,
                                      });
                                    }}
                                  >
                                    Link
                                  </Button>
                                </div>
                              ))
                            ) : mpesaSearchQuery.length >= 3 ? (
                              <div className="text-center py-8 border border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground">No matching payments found</p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="mt-1 h-auto py-0"
                                  disabled={isVerifyingSafaricom}
                                  onClick={async () => {
                                    if (!useAuthStore.getState().currentLocation?.organizationId) return;
                                    await verifyWithSafaricom({
                                      organizationId: useAuthStore.getState().currentLocation!.organizationId!,
                                      transactionCode: mpesaSearchQuery,
                                    });
                                  }}
                                >
                                  Request Safaricom verification?
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground text-xs">
                                Enter at least 3 characters to search
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─ CARD ─ */}
                  {selectedTab === 'CREDIT_CARD' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Swipe Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                            KSh
                          </span>
                          <Input
                            type="number"
                            value={amountInput}
                            onChange={e => setAmountInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCard()}
                            className="pl-12 text-xl font-bold h-14 no-spinners"
                            placeholder={remainingBalance.toFixed(2)}
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 bg-muted/30 border border-dashed">
                        <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Process the card on your external terminal first, then record the amount here to complete the
                          sale.
                        </p>
                      </div>
                      <Button
                        className="w-full h-12 font-semibold gap-2"
                        onClick={handleAddCard}
                        disabled={!amountInput || parseFloat(amountInput) <= 0}
                      >
                        <Plus className="w-4 h-4" /> Record Card Payment
                      </Button>
                    </div>
                  )}

                  {/* ─ INSURANCE ─ */}
                  {selectedTab === 'INSURANCE' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">Provider</Label>
                          <Input
                            value={insuranceProvider}
                            onChange={e => setInsuranceProvider(e.target.value)}
                            placeholder="e.g. Aetna"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase text-muted-foreground">Policy #</Label>
                          <Input
                            value={policyNumber}
                            onChange={e => setPolicyNumber(e.target.value)}
                            placeholder="ID Number"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Co-pay Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                            KSh
                          </span>
                          <Input
                            type="number"
                            value={amountInput}
                            onChange={e => setAmountInput(e.target.value)}
                            className="pl-12 text-xl font-bold h-14 no-spinners"
                            placeholder={remainingBalance.toFixed(2)}
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full h-12 font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleAddInsurance}
                        disabled={!amountInput || parseFloat(amountInput) <= 0 || !insuranceProvider}
                      >
                        <ShieldCheck className="w-4 h-4" /> Record Insurance Claim
                      </Button>
                    </div>
                  )}

                  {/* ─ GIFT CARD ─ */}
                  {selectedTab === 'GIFT_CARD' && (
                    <div className="space-y-4">
                      <form onSubmit={handleGiftCardScan} className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Scan or Enter Code
                        </Label>
                        <Input
                          value={giftCardCode}
                          onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                          placeholder="GIFT-XXXX-XXXX"
                          autoFocus
                          className="font-mono text-lg h-14 tracking-widest text-center uppercase"
                        />
                        <Button
                          type="submit"
                          className="w-full h-12 font-semibold gap-2"
                          disabled={!giftCardCode || isValidatingGC}
                        >
                          {isValidatingGC ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Validating…
                            </>
                          ) : (
                            <>
                              <Gift className="w-4 h-4" /> Redeem Gift Card
                            </>
                          )}
                        </Button>
                      </form>
                      <p className="text-xs text-muted-foreground text-center">
                        Available balance will be applied automatically towards the remaining total.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ──────── RIGHT PANEL ──────── */}
          <div className="col-span-5 flex flex-col bg-muted/5">
            <div className="px-5 pt-5 pb-3 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-muted-foreground" /> Payment Summary
                </h3>
                {currentPayments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {currentPayments.length} {currentPayments.length === 1 ? 'method' : 'methods'}
                  </Badge>
                )}
              </div>
              <PaymentProgress paid={totalPaid} total={totalPayable} />
            </div>

            {/* Payment list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              <AnimatePresence>
                {currentPayments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full py-12 text-center"
                  >
                    <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center mb-3">
                      <Wallet className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No payments added yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Select a method on the left</p>
                  </motion.div>
                ) : (
                  currentPayments.map(p => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="flex items-center gap-3 p-3 bg-background border shadow-sm group"
                    >
                      <div className="w-9 h-9 bg-primary/8 flex items-center justify-center text-primary shrink-0">
                        <PaymentMethodIcon method={p.method} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{p.method.replace('_', ' ')}</p>
                        {p.reference && <p className="text-xs text-muted-foreground truncate">{p.reference}</p>}
                      </div>
                      <span className="font-bold text-sm tabular-nums">{formatCurrency(p.amount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                        onClick={() => removePayment(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer totals + actions */}
            <div className="px-5 pb-5 pt-3 border-t space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {editableDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span className="tabular-nums">− {formatCurrency(editableDiscount)}</span>
                  </div>
                )}
                {calculatedTax > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatCurrency(calculatedTax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold pt-1 border-t">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(totalPayable)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Paid</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                {remainingBalance > 0.01 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="tabular-nums font-bold text-primary">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
                {changeDue > 0 && (
                  <div className="flex justify-between items-center p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-amber-700 dark:text-amber-400 font-medium text-sm">Change Due</span>
                    <span className="tabular-nums font-bold text-amber-600 dark:text-amber-300">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                )}
              </div>

              <Input
                placeholder="Add sale note (optional)…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />

              {validationErrors.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs ml-1">{validationErrors[0]}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="flex gap-3 w-full">
                {settings.allowSaveUnpaidOrders && import.meta.env.MODE !== 'standalone' && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 font-semibold text-sm gap-2"
                    onClick={() => {
                      saveUnpaidOrder(editableDiscount);
                      if (settings.enableKdsSystem) {
                        const tempOrder = {
                          id: orderId,
                          orderNumber: fullSaleNumber,
                          items: cartItems,
                          tableNumber: tableNumber,
                          notes: notes,
                          customerName: customer?.name || '',
                          orderType: orderType
                        };
                        sendOrderToKitchen(tempOrder);
                        toast.success(tableNumber ? `Order sent to kitchen for Table ${tableNumber}` : 'Order sent to kitchen');
                      } else {
                        toast.success(tableNumber ? `Order saved to Table ${tableNumber}` : 'Order saved as pending');
                      }
                      onClose();
                    }}
                    disabled={isProcessing}
                  >
                    <Clock className="w-4 h-4" /> {settings.enableKdsSystem ? 'Send to Kitchen' : 'Pay Later'}
                  </Button>
                )}

                <Button
                  size="lg"
                  className={cn(
                    'flex-[2] h-12 font-semibold text-sm gap-2 transition-all',
                    isFullyPaid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                      : 'opacity-60 cursor-not-allowed'
                  )}
                  disabled={!isFullyPaid || isProcessing}
                  onClick={handleCompleteSale}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                    </>
                  ) : changeDue > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Complete · Give {formatCurrency(changeDue)} Change
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Complete Sale <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
