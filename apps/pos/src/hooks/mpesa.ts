import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from '@/store/pos-auth-store';
import { toast } from 'sonner';

export interface UnclaimedPayment {
  id: string;
  transId: string;
  transTime: string;
  amount: number;
  msisdn: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  billRefNumber?: string;
}

export const useMpesaSearch = (query: string) => {
  const { currentLocation } = useAuthStore();
  const organizationId = currentLocation?.organizationId;

  return useQuery({
    queryKey: ['mpesa-unclaimed', organizationId, query],
    queryFn: async () => {
      if (!organizationId || query.length < 3) return [];
      const response = await invoke<UnclaimedPayment[]>('authenticated_api_request', {
        method: 'GET',
        path: `api/v2/payments/mpesa/search-unclaimed?q=${encodeURIComponent(query)}`,
      });
      return response;
    },
    enabled: !!organizationId && query.length >= 3,
  });
};

export const useMpesaClaim = () => {
  const queryClient = useQueryClient();
  const { currentMember } = useAuthStore();
  const memberId = currentMember?.id;

  return useMutation({
    mutationFn: async (params: {
      unclaimedPaymentId: string;
      transactionId: string;
    }) => {
      const response = await invoke<any>('authenticated_api_request', {
        method: 'POST',
        path: 'api/v2/payments/mpesa/claim',
        body: {
          ...params,
          memberId,
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mpesa-unclaimed'] });
      toast.success('Payment claimed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to claim payment', {
        description: error || 'Unknown error',
      });
    },
  });
};

export const useMpesaVerifySafaricom = () => {
  const { currentMember } = useAuthStore();
  const memberId = currentMember?.id;

  return useMutation({
    mutationFn: async (params: { transactionCode: string }) => {
      const response = await invoke<any>('authenticated_api_request', {
        method: 'POST',
        path: 'api/v2/payments/mpesa/verify-safaricom',
        body: {
          ...params,
          memberId,
        },
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast.success('Transaction verified in our system');
      } else {
        toast.info('Verification request sent to Safaricom', {
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast.error('Safaricom verification failed', {
        description: error || 'Unknown error',
      });
    },
  });
};
