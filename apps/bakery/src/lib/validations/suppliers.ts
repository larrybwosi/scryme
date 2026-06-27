// --- Zod Schemas (Updated based on Schema & UX) ---

import { z } from "zod";

const RequiredCuidSchema = z
  .string({ error: "ID is required." })
  .cuid({ message: "Invalid ID format." });

// Define base string schema first, then add optional/nullable
const BaseStringSchema = z.string().trim().max(255);
const OptionalStringSchema = BaseStringSchema.optional().nullable();
const OptionalEmailSchema = z.email().max(255).optional().nullable();
const OptionalNumberSchema = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .nullable();

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Supplier name is required").max(100),
  code: z
    .string()
    .min(3, "Supplier code must be at least 3 characters")
    .max(20),
  type: z.enum([
    "manufacturer",
    "distributor",
    "wholesaler",
    "service_provider",
  ]),
  contact: z.object({
    primaryContact: z.string().min(1, "Primary contact is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.email("Invalid email address"),
    website: z.url("Invalid URL").or(z.literal("")),
  }),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  businessInfo: z.object({
    taxId: z
      .string()
      .min(1, "Tax ID is required")
      .refine(
        (val) => {
          // Basic format check for KRA PIN if it looks like one
          if (
            val.length === 11 &&
            /^[A-Z]\d{9}[A-Z]$/.test(val.toUpperCase())
          ) {
            return true;
          }
          return val.length > 0;
        },
        {
          message: "Invalid KRA PIN format (Expected: A123456789B)",
        },
      ),
    registrationNumber: z.string().optional(),
    paymentTerms: z.string().min(1, "Payment terms are required"),
    currency: z.string().optional().nullable(),
  }),
  categories: z.string().optional(),
  customBadges: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high"]),
});

// Schema for updating a supplier. ID is required. All other fields are optional.
export const UpdateSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema,
  name: BaseStringSchema.min(2, {
    message: "Supplier name must be at least 2 characters.",
  })
    .max(255, { message: "Supplier name must be less than 255 characters." })
    .optional(),
  contactName: BaseStringSchema.max(100).optional().nullable(),
  email: OptionalEmailSchema,
  phone: BaseStringSchema.max(30).optional().nullable(),
  address: OptionalStringSchema,
  paymentTerms: BaseStringSchema.max(100).optional().nullable(),
  leadTime: OptionalNumberSchema,
  isActive: z.boolean().optional(),
  customFields: z.record(z.any(), z.any()).optional().nullable(),
});

// Schema for deleting a supplier. ID is required.
export const DeleteSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema,
});

// Types derived from schemas
export type CreateSupplierPayload = z.infer<typeof supplierSchema>;
export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type UpdateSupplierPayload = z.infer<typeof UpdateSupplierPayloadSchema>;
export type DeleteSupplierPayload = z.infer<typeof DeleteSupplierPayloadSchema>;
