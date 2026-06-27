import { PaymentMethod, PaymentStatus, Prisma } from '@repo/db/client';
import { z } from 'zod';

const kenyanPhoneRegex = /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(?:4[0-1]))[0-9]{6})$/;

export enum MpesaFlowType {
  STK_PUSH = 'STK_PUSH',
  PAYBILL_MANUAL = 'PAYBILL_MANUAL',
  TILL_MANUAL = 'TILL_MANUAL',
}

const PaymentSplitSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Payment amount must be positive'),
  mpesaPhoneNumber: z
    .string()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan Phone Number')
    .transform((val) => val.replace(/^\+/, '').replace(/^0/, '254'))
    .optional()
    .nullable(),
  mpesaFlowType: z.nativeEnum(MpesaFlowType).optional().default(MpesaFlowType.STK_PUSH),
  amountReceived: z.number().nonnegative().optional(),
  change: z.number().nonnegative().optional(),
  reference: z.string().optional(),
});

export const ProcessSaleInputSchema = z.object({
    cartItems: z
      .array(
        z.object({
            productId: z.string().optional().nullable(),
            variantId: z.string().min(1, 'Variant ID cannot be empty'),
            quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be greater than zero'),
            sellingUnitId: z.string().optional().nullable(),
        })
      )
      .min(1, 'At least one cart item is required'),
    locationId: z.string().min(1, 'Location ID cannot be empty'),
    saleNumber: z.string().optional().nullable(),
    isWholesale: z.boolean().optional().default(false),
    customerId: z.string().optional().nullable(),
    businessAccountId: z.string().optional().nullable(),
    payments: z.array(PaymentSplitSchema).min(1, 'At least one payment method is required'),
    mpesaPhoneNumber: z
      .string()
      .regex(kenyanPhoneRegex, 'Invalid Kenyan Phone Number')
      .transform(val => val.replace(/^\+/, '').replace(/^0/, '254'))
      .optional()
      .nullable(),
    amountReceived: z.number().nonnegative('Amount received cannot be negative').optional(),
    change: z.number().nonnegative('Change amount cannot be negative').optional(),
    discountAmount: z.number().nonnegative('Discount amount cannot be negative').default(0).nullable(),
    cashDrawerId: z.string().optional().nullable(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
    mpesaType: z.nativeEnum(MpesaFlowType).optional().nullable(),
    enableStockTracking: z.boolean(),
    taxIntegrationEnabled: z.boolean().optional(),
    forceTaxOverride: z.boolean().optional(),
    country: z.string().optional(),
    taxIds: z.array(z.string().min(1, 'Tax ID cannot be empty')).optional(),
    voucherCode: z.string().optional().nullable(),
    pointsToRedeem: z.number().nonnegative().optional().default(0),
    saleDate: z.date().max(new Date(), 'Sale date cannot be in the future').optional(),
});

export type ProcessSaleInput = z.infer<typeof ProcessSaleInputSchema>;
export type TransactionWithDetails = any;
export type ProcessSaleResult = {
    success: boolean;
    message: string;
    transactionId?: string;
    data?: any;
    error?: any;
};
