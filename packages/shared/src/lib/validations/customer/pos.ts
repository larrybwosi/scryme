import { z } from "zod";

// Schema for the search term to ensure safety
export const searchSchema = z.string().min(1).trim();

// Schema for creating a new customer with structured address data
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .min(3, "Phone number is too short")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  // Optional structured address object
  address: z
    .object({
      street1: z.string().min(1, "Street is required"),
      street2: z.string().optional(),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default("Kenya"), // Default or required based on your needs
    })
    .optional(),
});

export type CreatePosCustomerData = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  company?: string;
  avatar?: string;
  gender?: string;
  customerType?: string;
  dateOfBirth?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
  loyaltyTierId?: string;
  deliveryNotes?: string;
  pinnedLocation?: any;
  tags?: string[];
  isBusiness?: boolean;
  taxId?: string;
  medicalHistory?: string;
  allergies?: string;
  chronicConditions?: string;
  insuranceProvider?: string;
  policyNumber?: string;
};

// Input validation schema
export const deltaSyncSchema = z.object({
  lastSync: z.string().datetime().optional().nullable(), // ISO String
});
