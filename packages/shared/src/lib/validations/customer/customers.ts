import {
  AddressType,
  CustomerCreationType,
  Address,
  Customer,
  Transaction,
} from "@repo/db/client";
import { z } from "zod";

// --- Address Schema ---
export const AddressFormSchema = z.object({
  id: z.string().cuid().optional(),
  label: z.string().optional(), // e.g., "Home", "Office"
  type: z.nativeEnum(AddressType).optional().default(AddressType.BOTH),

  // Required Fields
  street1: z.string().min(1, "Street address is required."),
  city: z.string().min(1, "City is required."),
  country: z.string().min(1, "Country is required."),

  // Optional Fields
  street2: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),

  // Coordinates
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  isDefault: z.boolean().optional().default(false),
});

export const CustomerFormSchema = z
  .object({
    // Core Fields
    id: z.string().cuid().optional(),
    name: z.string().min(1, "Customer name cannot be empty."),
    email: z
      .string()
      .email("Please enter a valid email address.")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional().nullable(),

    notes: z.string().optional(),
    company: z.string().optional(),
    avatar: z
      .string()
      .url("Please enter a valid URL.")
      .optional()
      .or(z.literal("")),

    // Additional Details
    gender: z.string().optional(),
    customerType: z.string().optional(),
    dateOfBirth: z.string().optional(),
    loyaltyPoints: z.coerce.number().int().optional().default(0),

    // System & Relational Fields
    isActive: z.boolean().optional().default(true),
    loyaltyTierId: z.string().cuid().optional(),
    creationType: z
      .nativeEnum(CustomerCreationType)
      .optional()
      .default(CustomerCreationType.MEMBER_CREATED),

    // Delivery & Meta
    deliveryNotes: z.string().optional(),
    pinnedLocation: z.any().optional(),
    tags: z.array(z.string()).optional(),
    addresses: z.array(AddressFormSchema).optional(),

    // --- NEW FIELDS ---
    isBusiness: z.boolean().optional().default(false), // Trigger for Business Account creation
    taxId: z.string().optional(), // Maps to BusinessAccount.taxId
  })
  .strict();

export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;
export type AddressFormValues = z.infer<typeof AddressFormSchema>;

export const LoyaltyAdjustmentSchema = z.object({
  customerId: z.cuid2("Invalid customer ID."),
  pointsChange: z.coerce
    .number({ message: "Points change must be a number." })
    .int("Points must be a whole number.")
    .refine((val) => val !== 0, { message: "Points change cannot be zero." }),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
});

// Define the return type based on the query structure
export type CustomerWithDetails = Customer & {
  transactions: Pick<
    Transaction,
    "id" | "number" | "createdAt" | "finalTotal" | "status"
  >[];
  addresses: Address[];
  createdBy: {
    user: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
  updatedBy: {
    user: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
};
