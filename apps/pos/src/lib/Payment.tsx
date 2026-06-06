'use client';

import { useEffect, createContext } from 'react';
import { toast } from 'sonner';
import { useRealtimeStore } from '@/store/realtimeStore';

interface PaymentNotificationContextType {
  lastPayment: any;
}

const PaymentNotificationContext = createContext<PaymentNotificationContextType | null>(null);

export function PaymentNotificationProvider({
  children,
  organizationId,
}: {
  children: React.ReactNode;
  organizationId: string;
}) {
  const subscribe = useRealtimeStore(state => state.subscribe);

  useEffect(() => {
    if (!organizationId) return;

    const channelName = `organization:${organizationId}:payments`;

    // 2. Handle Matched Payments (STK Success or C2B Matched)
    const onPaymentUpdate = (dataUpdate: any) => {
      const { transactionId, status, data } = dataUpdate;
      console.log('[Payment] Update received:', { transactionId, status, data });

      if (status === 'COMPLETED' || status === 'PAID') {
        toast.success(`Payment Received: KES ${data.amount || ''}`, {
          description: `Receipt: ${data.receipt}. transaction updated.`,
          duration: 5000,
        });

        // Optional: Refresh data or Redirect
        // router.refresh();
      } else if (status === 'FAILED') {
        toast.error('Payment Failed', {
          description: data.description,
        });
      }
    };

    // 3. Handle Unclaimed Payments (Buy Goods / Typo in Paybill)
    const onUnclaimed = (data: any) => {
      const { amount, phone, accountRef, receipt } = data;

      // This creates a "Manual Action" toast for the Cashier
      toast.info('Unclaimed Payment Received', {
        description: `KES ${amount} from ${phone}. Ref: ${accountRef || 'N/A'}. Click to assign.`,
        action: {
          label: 'Assign',
          onClick: () => {
            // Logic to open a modal to assign this receipt to the current cart
            console.log('Open manual assignment modal for', receipt);
          },
        },
        duration: Infinity, // Keep it open until acknowledged
      });
    };

    const unsubUpdate = subscribe(channelName, 'payment-update', onPaymentUpdate);
    const unsubUnclaimed = subscribe(channelName, 'payment-unclaimed', onUnclaimed);

    // Cleanup
    return () => {
      unsubUpdate();
      unsubUnclaimed();
    };
  }, [organizationId, subscribe]);

  return (
    <PaymentNotificationContext.Provider value={{ lastPayment: null }}>{children}</PaymentNotificationContext.Provider>
  );
}
