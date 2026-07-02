import { z } from 'zod';

// Schema for the search term to ensure safety
export const searchSchema = z.string().min(1).trim();

// Schema for creating a new customer with structured address data
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(3, 'Phone number is too short').optional().or(z.literal('')),
  notes: z.string().optional(),
  // Optional structured address object
  address: z
    .object({
      street1: z.string().min(1, 'Street is required'),
      street2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default('Kenya'), // Default or required based on your needs
    })
    .optional(),
});

export type CreateCustomerData = {
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
};

// Input validation schema
export const deltaSyncSchema = z.object({
  lastSync: z.string().datetime().optional().nullable(), // ISO String
});
