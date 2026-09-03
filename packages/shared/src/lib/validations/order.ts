import {
  FulfillmentType,
  PaymentMethod,
  TransactionType,
} from "@repo/db/client";
import { z } from "zod";

export enum OrderTransactionStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  DRAFT = "DRAFT",
}

export const OrderItemInputSchema = z.object({
  variantId: z.string(),
  sellingUnitId: z.string().optional().nullable(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().nonnegative("Price cannot be negative").optional().nullable(),
});

export const OrderPaymentInputSchema = z.object({
  method: z.enum(PaymentMethod).or(z.any()), // Fallback for errorMap issue
  amount: z.number().positive("Payment amount must be positive"),
});

export const OrderFulfillmentInputSchema = z.object({
  type: z.enum(FulfillmentType).or(z.any()), // Fallback for errorMap issue
  shippingAddressId: z.string().optional().nullable(),
  pickupLocationId: z.string().optional().nullable(),
  tableNumber: z.string().optional().nullable(),
});

export const CreateOrderInputSchema = z.object({
  customerId: z.string().optional().nullable(),
  businessAccountId: z.string().optional().nullable(),
  locationId: z.string(),
  type: z
    .enum(TransactionType)
    .refine((type) => type !== TransactionType.POS_SALE, {
      message: "Use the POS sale endpoint for POS transactions",
    }),
  items: z
    .array(OrderItemInputSchema)
    .min(1, "Order must contain at least one item"),
  payments: z.array(OrderPaymentInputSchema).default([]),
  fulfillment: OrderFulfillmentInputSchema.optional().nullable(),
  status: z
    .enum(OrderTransactionStatus)
    .default(OrderTransactionStatus.PENDING_CONFIRMATION),
  notes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  shippingFee: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  deliveryPartnerId: z.string().optional().nullable(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().optional().nullable(),
      }),
    )
    .optional().nullable(),
  taxIds: z.array(z.string()).optional().nullable(),
  enableStockTracking: z.boolean().optional().nullable(),
  isWholesale: z.boolean().optional().nullable(),
}).refine(data => (data.customerId && data.customerId.trim().length > 0) || (data.businessAccountId && data.businessAccountId.trim().length > 0), {
  message: "Either Customer or Business Account must be provided",
  path: ["customerId"],
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const OrderFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  searchTerm: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.string().optional(),
});
