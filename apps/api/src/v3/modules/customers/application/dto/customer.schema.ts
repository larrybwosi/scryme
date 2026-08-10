import { z } from "zod";

export const AddressSchema = z.object({
  label: z.string().optional(),
  street1: z.string().min(1, "Street 1 is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

export const RegisterCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  metadata: z.any().optional(),
  address: AddressSchema.optional(),
  company: z.string().optional(),
  customerType: z.string().optional(),
  dateOfBirth: z.string().optional(),
  taxId: z.string().optional(),
});

export const UpdateCustomerSchema = RegisterCustomerSchema.partial().extend({
  location: z.string().optional(),
  metadata: z.any().optional(),
});

export const CreateBusinessAccountSchema = z.object({
  name: z.string().min(1, "Business account name is required"),
  taxId: z.string().optional(),
  defaultLocationId: z.string().optional(),
});

export const CustomerLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
