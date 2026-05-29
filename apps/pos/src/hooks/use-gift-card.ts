import { useState } from 'react';
import { toast } from 'sonner';

export interface GiftCard {
  code: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'REDEEMED';
  expiryDate?: string;
}

export const useGiftCard = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Mock API call - in production this would hit your backend
  const validateGiftCard = async (code: string): Promise<GiftCard | null> => {
    setIsLoading(true);
    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock Data Logic
      if (code.startsWith('GC-VALID')) {
        return {
          code: code,
          balance: 5000.0,
          currency: 'KES',
          status: 'ACTIVE',
          expiryDate: '2025-12-31',
        };
      } else if (code.startsWith('GC-SMALL')) {
        return {
          code: code,
          balance: 150.0,
          currency: 'KES',
          status: 'ACTIVE',
        };
      } else if (code.startsWith('GC-EMPTY')) {
        toast.error('Gift card has 0 balance');
        return null;
      } else {
        throw new Error('Invalid Gift Card Code');
      }
    } catch (error) {
      console.error('Gift Card Validation Error', error);
      toast.error('Invalid or Expired Gift Card');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validateGiftCard,
    isLoading,
  };
};
