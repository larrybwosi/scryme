import { FulfillmentType, PaymentMethod, TransactionType } from "@repo/db/client";
import { z } from "zod";

export enum OrderTransactionStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  DRAFT = "DRAFT",
}

export const OrderItemInputSchema = z.object({
  variantId: z.string(),
  sellingUnitId: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().nonnegative("Price cannot be negative").optional(),
});

export const OrderPaymentInputSchema = z.object({
  method: z.nativeEnum(PaymentMethod).or(z.any()), // Fallback for errorMap issue
  amount: z.number().positive("Payment amount must be positive"),
});

export const OrderFulfillmentInputSchema = z.object({
  type: z.nativeEnum(FulfillmentType).or(z.any()), // Fallback for errorMap issue
  shippingAddressId: z.string().optional(),
  pickupLocationId: z.string().optional(),
  tableNumber: z.string().optional(),
});

export const CreateOrderInputSchema = z.object({
  customerId: z.string(),
  businessAccountId: z.string().optional(),
  locationId: z.string(),
  type: z
    .nativeEnum(TransactionType)
    .refine((type) => type !== TransactionType.POS_SALE, {
      message: "Use the POS sale endpoint for POS transactions",
    }),
  items: z
    .array(OrderItemInputSchema)
    .min(1, "Order must contain at least one item"),
  payments: z.array(OrderPaymentInputSchema).default([]),
  fulfillment: OrderFulfillmentInputSchema.optional(),
  status: z
    .nativeEnum(OrderTransactionStatus)
    .default(OrderTransactionStatus.PENDING_CONFIRMATION),
  notes: z.string().optional(),
  shippingFee: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  taxIds: z.array(z.string()).optional(),
  enableStockTracking: z.boolean().optional(),
  isWholesale: z.boolean().optional(),
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
