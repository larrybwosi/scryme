import { invoke } from '@tauri-apps/api/core';
import { useRealtimeStore } from '@/store/realtimeStore';

interface InitiateMpesaPaymentParams {
  phoneNumber: string;
  amount: number;
  orderId: string;
}

interface MpesaResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  message?: string;
}

/**
 * Subscribes to realtime channel to listen for M-Pesa payment status updates.
 * @param checkoutRequestId The unique ID for the checkout request to listen for.
 * @param callbacks Object with onSuccess and onFailed callback functions.
 * @returns A function to unsubscribe and clean up the listener.
 */
export function subscribeToMpesaPayment(
  checkoutRequestId: string,
  callbacks: {
    onSuccess?: () => void;
    onFailed?: (message: string) => void;
  }
) {
  const subscribe = useRealtimeStore.getState().subscribe;

  const unsubscribe = subscribe('mpesa-payments', 'payment-status', (data: any) => {
    if (data?.checkoutRequestId === checkoutRequestId) {
      if (data.status === 'SUCCESS' && callbacks.onSuccess) {
        callbacks.onSuccess();
      } else if (data.status === 'FAILED' && callbacks.onFailed) {
        callbacks.onFailed(data.customerMessage || data.responseDescription);
      }
    }
  });

  return unsubscribe;
}

/**
 * Initiates an M-Pesa STK push payment request to your backend.
 */
export async function initiateMpesaPayment({
  phoneNumber,
  amount,
  orderId,
}: InitiateMpesaPaymentParams): Promise<MpesaResponse> {
  try {
    const response = await invoke<MpesaResponse>('initiate_mpesa_payment_command', {
      phoneNumber,
      amount,
      saleNumber: orderId,
    });

    return response;
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    throw error;
  }
}
