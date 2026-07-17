import { z } from "zod";
import { StockRequestPriority } from "@repo/db";

export const CheckInSchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
  locationId: z.string().optional(),
  pin: z.string().min(4, "PIN must be at least 4 digits"),
});

export const CheckOutSchema = z.object({
  locationId: z.string().min(1, "Location ID is required"),
});

export const AdjustStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  locationId: z.string().min(1, "Location ID is required"),
  quantity: z.number(),
  reason: z.enum([
    "sale",
    "restock",
    "damage",
    "theft",
    "correction",
    "return",
    "STOLEN",
    "LOST",
    "DAMAGED",
    "EXPIRED",
    "FOUND",
    "INVENTORY_COUNT",
  ]),
  notes: z.string().optional(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.any().optional().nullable(),
  notes: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  customerType: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  loyaltyPoints: z.coerce.number().int().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  loyaltyTierId: z.string().optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
  pinnedLocation: z.any().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  isBusiness: z.boolean().optional().nullable(),
  taxId: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
});

export const DispatchDeliverySchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const ReconcileDeliverySchema = z.object({
  fulfilmentId: z.string().min(1, "Fulfilment ID is required"),
  outcome: z.enum(["SUCCESS", "PARTIAL", "FAILURE"]),
  proofImage: z.string().optional(),
  receivedBy: z.string().optional(),
  failureReason: z.string().optional(),
});

export const StockRequestItemSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  requestedQuantity: z.number().positive(),
  reason: z.string().optional(),
});

export const CreateStockRequestSchema = z.object({
  toLocationId: z.string().min(1, "Target location ID is required"),
  priority: z
    .nativeEnum(StockRequestPriority)
    .default(StockRequestPriority.MEDIUM),
  justification: z.string().optional(),
  items: z
    .array(StockRequestItemSchema)
    .min(1, "At least one item is required"),
});

export const CreateStockTransferSchema = z.object({
  fromLocationId: z.string().min(1, "From location ID is required"),
  toLocationId: z.string().min(1, "To location ID is required"),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
  notes: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(1),
  reference: z.string().optional(),
  payerPhone: z.string().optional(),
});

export const ShiftSyncSchema = z.object({
  location_id: z.string().min(1),
  shift_id: z.string().min(1),
  opened_at: z.string(),
  closed_at: z.string().optional().nullable(),
  operator_card_id: z.string(),
  operator_pin: z.string(),
  starting_float: z.number(),
  total_cash_sales: z.number(),
  total_cash_drops: z.number(),
  actual_cash_count: z.number().optional().nullable(),
  variance: z.number().optional().nullable(),
  opening_cash_details: z.any().optional(),
  closing_cash_details: z.any().optional(),
  closing_operator_id: z.string().optional().nullable(),
});

export const RegisterPettyCashSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  pettyCashFundId: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export const RegisterBarcodeSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  barcode: z.string().min(1, "Barcode is required"),
});
