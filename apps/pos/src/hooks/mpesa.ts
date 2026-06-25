import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
  const { currentLocation, apiUrl } = useAuthStore();
  const organizationId = currentLocation?.organizationId;

  return useQuery({
    queryKey: ['mpesa-unclaimed', organizationId, query],
    queryFn: async () => {
      if (!organizationId || query.length < 3) return [];
      const response = await axios.get(
        `${apiUrl}/api/v2/payments/mpesa/search-unclaimed`,
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
  const { currentMember, apiUrl } = useAuthStore();
  const memberId = currentMember?.id;

  return useMutation({
    mutationFn: async (params: {
      unclaimedPaymentId: string;
      transactionId: string;
    }) => {
      const response = await axios.post(
        `${apiUrl}/api/v2/payments/mpesa/claim`,
        {
          ...params,
          memberId,
        },
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
  const { apiUrl, currentMember } = useAuthStore();
  const memberId = currentMember?.id;

  return useMutation({
    mutationFn: async (params: { transactionCode: string }) => {
      const response = await axios.post(
        `${apiUrl}/api/v2/payments/mpesa/verify-safaricom`,
        {
          ...params,
          memberId,
        },
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
