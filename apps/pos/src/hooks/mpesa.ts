import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ENDPOINT } from '@/lib/axios';
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
      const response = await axios.get(
        `${API_ENDPOINT}/api/v2/payments/mpesa/search-unclaimed`,
        {
          params: { q: query },
        },
      );
      return response.data as UnclaimedPayment[];
    },
    enabled: !!organizationId && query.length >= 3,
  });
};

export const useMpesaClaim = () => {
  const queryClient = useQueryClient();
  const { currentMember } = useAuthStore();

  return useMutation({
    mutationFn: async (params: {
      unclaimedPaymentId: string;
      transactionId: string;
    }) => {
      const response = await axios.post(
        `${API_ENDPOINT}/api/v2/payments/mpesa/claim`,
        params,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mpesa-unclaimed'] });
      toast.success('Payment claimed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to claim payment', {
        description: error?.response?.data?.message || error.message,
      });
    },
  });
};

export const useMpesaVerifySafaricom = () => {
  return useMutation({
    mutationFn: async (params: { transactionCode: string }) => {
      const response = await axios.post(
        `${API_ENDPOINT}/api/v2/payments/mpesa/verify-safaricom`,
        params,
      );
      return response.data;
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
        description: error?.response?.data?.message || error.message,
      });
    },
  });
};
