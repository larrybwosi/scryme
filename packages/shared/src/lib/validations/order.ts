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
  sellingUnitId: z.string().nullish().transform(val => val ?? undefined),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().nonnegative("Price cannot be negative").nullish().transform(val => val ?? undefined),
});

export const OrderPaymentInputSchema = z.object({
  method: z.enum(PaymentMethod).or(z.any()), // Fallback for errorMap issue
  amount: z.number().positive("Payment amount must be positive"),
});

export const OrderFulfillmentInputSchema = z.object({
  type: z.enum(FulfillmentType).or(z.any()), // Fallback for errorMap issue
  shippingAddressId: z.string().nullish().transform(val => val ?? undefined),
  pickupLocationId: z.string().nullish().transform(val => val ?? undefined),
  tableNumber: z.string().nullish().transform(val => val ?? undefined),
});

export const CreateOrderInputSchema = z.object({
  customerId: z.string().nullish().transform(val => val ?? undefined),
  businessAccountId: z.string().nullish().transform(val => val ?? undefined),
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
  fulfillment: OrderFulfillmentInputSchema.nullish().transform(val => val ?? undefined),
  status: z
    .enum(OrderTransactionStatus)
    .default(OrderTransactionStatus.PENDING_CONFIRMATION),
  notes: z.string().nullish().transform(val => val ?? undefined),
  termsAndConditions: z.string().nullish().transform(val => val ?? undefined),
  shippingFee: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  deliveryPartnerId: z.string().nullish().transform(val => val ?? undefined),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().nullish().transform(val => val ?? undefined),
      }),
    )
    .nullish().transform(val => val ?? undefined),
  taxIds: z.array(z.string()).nullish().transform(val => val ?? undefined),
  enableStockTracking: z.boolean().nullish().transform(val => val ?? undefined),
  isWholesale: z.boolean().nullish().transform(val => val ?? undefined),
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
