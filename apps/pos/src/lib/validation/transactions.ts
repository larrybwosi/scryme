import { z } from 'zod/v3';
import { FulfillmentType, PaymentMethod, PaymentStatus, TransactionType } from '@/hooks/sales';

export enum TransactionStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
}

export const OrderItemSchema = z.object({
  variantId: z.string().cuid('Invalid variant ID'),
  sellingUnitId: z.string().cuid('Invalid selling unit ID').optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().nonnegative('Price cannot be negative').optional(),
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
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  amount: z.number().positive('Payment amount must be positive'),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
});

export const OrderFulfillmentSchema = z.object({
  type: z.nativeEnum(FulfillmentType, {
    errorMap: () => ({ message: 'Invalid fulfillment type' }),
  }),
  shippingAddressId: z.string().cuid('Invalid shipping address ID').optional(),
  pickupLocationId: z.string().cuid('Invalid pickup location ID').optional(),
  tableNumber: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  memberId: z.string().optional(),
  locationId: z.string().cuid('Invalid location ID'),
  type: z.nativeEnum(TransactionType).refine(type => type !== TransactionType.POS_SALE, {
    message: 'Use the POS sale endpoint for POS transactions',
  }),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  payments: z.array(OrderPaymentSchema).default([]),
  fulfillment: OrderFulfillmentSchema,
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING_CONFIRMATION),
  notes: z.string().optional(),
  shippingFee: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  taxIds: z.array(z.string()).optional(),
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
        z.object(
          {
            productId: z.string({ required_error: 'Product ID is required' }).min(1, 'Product ID cannot be empty'),
            productName: z.string().optional(),
            variantId: z.string({ required_error: 'Variant ID is required' }).min(1, 'Variant ID cannot be empty'),
            variantName: z.string().optional(),
            quantity: z
              .number({
                required_error: 'Quantity is required',
                invalid_type_error: 'Quantity must be a number',
              })
              .int('Quantity must be a whole number')
              .positive('Quantity must be greater than zero'),
            sellingUnitId: z
              .string({ required_error: 'Selling unit ID is required' })
              .min(1, 'Selling unit ID cannot be empty'),
            sellingUnitName: z.string().optional(),
            unitPrice: z.number().optional(),
          },
          { required_error: 'Cart items are required' }
        )
      )
      .min(1, 'At least one cart item is required'),

    locationId: z.string({ required_error: 'Location ID is required' }).min(1, 'Location ID cannot be empty'),
    memberId: z.string().optional(),
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
    paymentMethod: z.nativeEnum(PaymentMethod, {
      required_error: 'Payment method is required',
      invalid_type_error: 'Invalid payment method',
    }),

    // Multi-Tender / Split Payment Breakdown
    payments: z.array(z.object({
      method: z.nativeEnum(PaymentMethod),
      amount: z.number().nonnegative(),
      reference: z.string().optional(), // e.g. M-Pesa Code, Gift Card Code
      meta: z.record(z.any()).optional()
    })).optional(),

    paymentStatus: z.nativeEnum(PaymentStatus, {
      required_error: 'Payment status is required',
      invalid_type_error: 'Invalid payment status',
    }),

    // M-Pesa Specific
    mpesaType: z.nativeEnum(MpesaFlowType).optional().nullable(),
    
    mpesaPhoneNumber: z
      .string()
      .regex(kenyanPhoneRegex, 'Invalid Kenyan Phone Number')
      .transform(val => val.replace(/^\+/, '').replace(/^0/, '254')) // Normalize to 254
      .optional()
      .nullable(),

    forcedImmediateSyncThreshold: z.number().optional(),
    total: z.number().optional(),

    amountReceived: z
      .number({
        invalid_type_error: 'Amount received must be a number',
      })
      .nonnegative('Amount received cannot be negative')
      .optional(),

    change: z
      .number({
        invalid_type_error: 'Change amount must be a number',
      })
      .nonnegative('Change amount cannot be negative')
      .optional(),

    discountAmount: z
      .number({
        invalid_type_error: 'Discount amount must be a number',
      })
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

    enableStockTracking: z.boolean({
      required_error: 'Stock tracking preference is required',
      invalid_type_error: 'Stock tracking must be a boolean',
    }),

    taxIds: z
      .array(z.string().min(1, 'Tax ID cannot be empty'), {
        invalid_type_error: 'Tax IDs must be an array of strings',
      })
      .optional(),

    saleDate: z
      .date({
        required_error: 'Sale date is required',
        invalid_type_error: 'Invalid date format',
      })
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
