import { z } from "zod";

export const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum([
    "manufacturer",
    "distributor",
    "wholesaler",
    "service_provider",
  ]),
  contact: z.object({
    primaryContact: z.string().min(1, "Primary contact is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
  }),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  businessInfo: z.object({
    taxId: z.string().optional(),
    registrationNumber: z.string().optional(),
    currency: z.string().optional(),
    paymentTerms: z.string().optional(),
    paymentTermsDays: z.coerce.number().int().optional(),
  }),
  categories: z.union([z.string(), z.array(z.string())]).optional(),
  customBadges: z.union([z.string(), z.array(z.string())]).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
