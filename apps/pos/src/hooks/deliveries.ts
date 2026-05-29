import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

// API call function using invoke
export const dispatchOrder = async (transactionId: string, payload: any) => {
  // Convert date to ISO string for the API if present
  const formattedPayload = {
    ...payload,
    estimatedTime: payload.estimatedTime ? payload.estimatedTime.toISOString() : undefined,
  };

  const response = await invoke('dispatch_order_command', {
    transactionId,
    payload: formattedPayload,
  });
  return response;
};

interface UseDispatchOrderMutationOptions {
  transactionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useDispatchOrderMutation({ transactionId, onSuccess, onError }: UseDispatchOrderMutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: any) => dispatchOrder(transactionId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Order Dispatched', {
        description: 'The delivery record has been created successfully.',
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Dispatch error:', error);
      toast.error('Error', {
        description: error.response?.data?.message || 'Could not dispatch order. Please try again.',
      });
      onError?.(error);
    },
  });
}

interface UseReconcileDeliveryMutationOptions {
  fulfillmentId: string | null;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useReconcileDeliveryMutation({
  fulfillmentId,
  onSuccess,
  onError,
}: UseReconcileDeliveryMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!fulfillmentId) {
        throw new Error('No fulfillment ID provided');
      }

      // Note: For file upload, we need to handle this differently with Tauri
      // For now, we'll use a simpler approach - the reconcile command expects file_path
      // We'll need to use Tauri's file dialog to get the file path first
      // This is a temporary workaround - ideally the dialog should be handled before calling this
      const notes = formData.get('notes') as string | null;
      const filePath = formData.get('filePath') as string | null; // This should be set by the calling code

      return await invoke('reconcile_delivery_command', {
        fulfillmentId,
        filePath,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Delivery reconciled successfully');
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Reconciliation error:', error);
      toast.error(error.response?.data?.error || 'Reconciliation failed');
      onError?.(error);
    },
  });
}
