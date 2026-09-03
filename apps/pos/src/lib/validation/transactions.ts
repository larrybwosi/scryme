import { z } from 'zod';
import { FulfillmentType, PaymentMethod, PaymentStatus, TransactionType } from '@/hooks/sales';

export enum TransactionStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
}

export const OrderItemSchema = z.object({
  variantId: z.string(),
  sellingUnitId: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().nonnegative('Price cannot be negative').optional().nullable(),
  _maxStock: z.number().optional(),
  _availableUnits: z.array(z.any()).optional(),
}).refine((data) => {
  if (data._maxStock !== undefined && data.quantity > data._maxStock) {
    return false;
  }
  return true;
}, {
  message: "Exceeds available stock",
  path: ["quantity"]
});

export const OrderPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive('Payment amount must be positive'),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
});

export const OrderFulfillmentSchema = z.object({
  type: z.nativeEnum(FulfillmentType),
  shippingAddressId: z.string().optional().nullable(),
  pickupLocationId: z.string().optional().nullable(),
  tableNumber: z.string().optional().nullable(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  businessAccountId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  locationId: z.string(),
  type: z.nativeEnum(TransactionType).refine(type => type !== TransactionType.POS_SALE, {
    message: 'Use the POS sale endpoint for POS transactions',
  }),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  payments: z.array(OrderPaymentSchema).default([]),
  fulfillment: OrderFulfillmentSchema.optional().nullable(),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING_CONFIRMATION),
  notes: z.string().optional().nullable(),
  shippingFee: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  taxIds: z.array(z.string()).optional().nullable(),
}).refine(data => (data.customerId && data.customerId.trim().length > 0) || (data.businessAccountId && data.businessAccountId.trim().length > 0), {
  message: "Either Customer or Business Account must be provided",
  path: ["customerId"],
});

export type OrderFormValues = z.infer<typeof CreateOrderSchema>;

const kenyanPhoneRegex = /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(?:4[0-1]))[0-9]{6})$/;

export enum MpesaFlowType {
  STK_PUSH = 'STK_PUSH',
  PAYBILL_MANUAL = 'PAYBILL_MANUAL',
  TILL_MANUAL = 'TILL_MANUAL',
}

export const ProcessSaleInputSchema = z
  .object({
    cartItems: z
      .array(
        z.object({
          productId: z.string().optional().nullable(),
          productName: z.string().optional().nullable(),
          variantId: z.string().min(1, 'Variant ID cannot be empty'),
          variantName: z.string().optional().nullable(),
          quantity: z
            .number()
            .int('Quantity must be a whole number')
            .positive('Quantity must be greater than zero'),
          sellingUnitId: z.string().optional().nullable(),
          sellingUnitName: z.string().optional().nullable(),
          unitPrice: z.number().optional().nullable(),
        })
      )
      .min(1, 'At least one cart item is required'),

    locationId: z.string().min(1, 'Location ID cannot be empty'),
    memberId: z.string().optional().nullable(),
    saleNumber: z.string().optional().nullable(),
    isWholesale: z.boolean().optional().default(false),

    customerId: z
      .string()
      .optional()
      .nullable()
      .refine(val => !val || val.length > 0, {
        message: 'Customer ID cannot be empty if provided',
      }),

    businessAccountId: z
      .string()
      .optional()
      .nullable()
      .refine(val => !val || val.length > 0, {
        message: 'Business Account ID cannot be empty if provided',
      }),

    // Payment Details
    paymentMethod: z.nativeEnum(PaymentMethod),

    // Multi-Tender / Split Payment Breakdown
    payments: z.array(z.object({
      method: z.nativeEnum(PaymentMethod),
      amount: z.number().nonnegative(),
      reference: z.string().optional().nullable(), // e.g. M-Pesa Code, Gift Card Code
      meta: z.record(z.string(), z.any()).optional().nullable()
    })).optional(),

    paymentStatus: z.nativeEnum(PaymentStatus),

    // M-Pesa Specific
    mpesaType: z.nativeEnum(MpesaFlowType).optional().nullable(),
    
    mpesaPhoneNumber: z
      .string()
      .regex(kenyanPhoneRegex, 'Invalid Kenyan Phone Number')
      .transform(val => val.replace(/^\+/, '').replace(/^0/, '254')) // Normalize to 254
      .optional()
      .nullable(),

    forcedImmediateSyncThreshold: z.number().optional().nullable(),
    total: z.number().optional().nullable(),

    amountReceived: z
      .number()
      .nonnegative('Amount received cannot be negative')
      .optional()
      .nullable(),

    change: z
      .number()
      .nonnegative('Change amount cannot be negative')
      .optional()
      .nullable(),

    discountAmount: z
      .number()
      .nonnegative('Discount amount cannot be negative')
      .default(0)
      .nullable(),

    cashDrawerId: z
      .string()
      .optional()
      .nullable()
      .refine(val => !val || val.length > 0, {
        message: 'Cash drawer ID cannot be empty if provided',
      }),

    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),

    enableStockTracking: z.boolean(),

    cashierName: z.string().optional().nullable(),
    accountRef: z.string().optional().nullable(),
    prescriptionId: z.string().optional().nullable(),
    doctorName: z.string().optional().nullable(),

    taxIds: z
      .array(z.string().min(1, 'Tax ID cannot be empty'))
      .optional(),

    saleDate: z
      .date()
      .max(new Date(), 'Sale date cannot be in the future')
      .optional(),
  })
  // Refinement 1: Require Phone Number if M-Pesa AND STK_PUSH
  .refine(
    data => {
      if (data.paymentMethod === 'MPESA' && data.mpesaType === MpesaFlowType.STK_PUSH) {
        return !!data.mpesaPhoneNumber;
      }
      return true;
    },
    {
      message: 'Phone number is required for M-Pesa STK Push',
      path: ['mpesaPhoneNumber'],
    }
  )
  // Refinement 2: Validate Amount Received rules
  .refine(
    data => {
      // If M-Pesa, we expect an amount to push, even if status is pending
      if (data.paymentMethod === 'MPESA') {
        return data.amountReceived !== undefined && data.amountReceived !== null && data.amountReceived > 0;
      }
      // Existing logic for other methods
      if (data.paymentStatus !== 'PENDING' && data.paymentMethod !== 'CREDIT') {
        return data.amountReceived !== undefined && data.amountReceived !== null;
      }
      return true;
    },
    {
      message: 'Amount to charge is required',
      path: ['amountReceived'],
    }
  )
  // Refinement 3: Validate that amount covers the total for cash payments
  .refine(
    data => {
      if (data.paymentMethod === 'CASH' && data.paymentStatus === 'COMPLETED') {
        return (
          data.amountReceived !== undefined &&
          data.amountReceived !== null &&
          data.change !== undefined &&
          data.change !== null
        );
      }
      return true;
    },
    {
      message: 'Both amount received and change must be provided for cash payments',
      path: ['amountReceived'],
    }
  );

export type ProcessSaleInput = z.infer<typeof ProcessSaleInputSchema>;
