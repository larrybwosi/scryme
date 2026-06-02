import { z } from "zod";
import { TransactionStatus } from "@repo/db";

export const CreateOrderSchema = z.object({
  customerId: z.string().optional(),
  businessAccountId: z.string().optional(),
  locationId: z.string(),
  type: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().optional(),
      sellingUnitId: z.string().optional(),
    })
  ),
  payments: z.array(z.any()).default([]),
  fulfillment: z.object({
    type: z.string(),
    pickupLocationId: z.string().optional(),
    shippingAddressId: z.string().optional(),
  }).optional(),
  shippingFee: z.number().optional(),
  discountAmount: z.number().optional(),
  taxIds: z.array(z.string()).optional(),
  enableStockTracking: z.boolean().optional(),
  isWholesale: z.boolean().optional(),
});

export const OrderFilterSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  searchTerm: z.string().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.string().optional(),
});
