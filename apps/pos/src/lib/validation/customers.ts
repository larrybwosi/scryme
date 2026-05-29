import { z } from 'zod';

export enum AddressType {
  BILLING = "BILLING",
  SHIPPING = "SHIPPING",
  BOTH = "BOTH"
}

// --- Address Schema ---
export const AddressFormSchema = z.object({
  id: z.cuid().optional(),
  label: z.string().optional(), // e.g., "Home", "Office"
  type: z.enum(AddressType).optional().default(AddressType.BOTH),

  // Required Fields
  street1: z.string().min(1, 'Street address is required.'),
  city: z.string().min(1, 'City is required.'),
  country: z.string().min(1, 'Country is required.'),

  // Optional Fields
  street2: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),

  // Coordinates (Prisma Decimal usually accepts number or string in JS)
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  isDefault: z.boolean().optional().default(false),
});
export const CustomerFormSchema = z
  .object({
    // Core Fields
    id: z.cuid().optional(),
    name: z.string().min(1, 'Customer name cannot be empty.'),
    email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
    phone: z.string().optional().nullable(),

    notes: z.string().optional(),
    company: z.string().optional(),
    avatar: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),

    // Additional Details
    gender: z.string().optional(),
    customerType: z.string().optional(),
    dateOfBirth: z.string().optional(),
    loyaltyPoints: z.coerce.number().int().optional().default(0),

    // System & Relational Fields
    isActive: z.boolean().optional().default(true),
    loyaltyTierId: z.cuid().optional(),

    // Delivery & Meta
    deliveryNotes: z.string().optional(),
    pinnedLocation: z.any().optional(),
    tags: z.array(z.string()).optional(),
    addresses: z.array(AddressFormSchema).optional(),

    // --- NEW FIELDS ---
    isBusiness: z.boolean().optional().default(false), // Trigger for Business Account creation
    taxId: z.string().optional(), // Maps to BusinessAccount.taxId

    // Pharmacy features
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    insuranceProvider: z.string().optional(),
    policyNumber: z.string().optional(),
  })
  .strict();


export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;
export type AddressFormValues = z.infer<typeof AddressFormSchema>;

export const LoyaltyAdjustmentSchema = z.object({
  customerId: z.cuid("Invalid customer ID."),
  pointsChange: z.coerce // Coerce input string/number to number
    .number({ error: "Points change must be a number." })
    .int("Points must be a whole number.")
    .refine((val) => val !== 0, "Points change cannot be zero."),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
});

