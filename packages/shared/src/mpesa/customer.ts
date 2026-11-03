import { db, CustomerCreationType } from '@repo/db';
import { emitCustomerCreated } from '../services/automation';

/**
 * Normalizes a Kenyan phone number into standard E.164 format (e.g. 254712345678).
 * Handles inputs starting with "+254", "254", "07...", "01...", "7...", "1...".
 */
export function normalizeKenyanPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (!digitsOnly) return null;

  if (digitsOnly.startsWith('254') && (digitsOnly.length === 12)) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith('0') && (digitsOnly.length === 10)) {
    return `254${digitsOnly.substring(1)}`;
  }
  if ((digitsOnly.startsWith('7') || digitsOnly.startsWith('1')) && (digitsOnly.length === 9)) {
    return `254${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Generates search variants for a normalized phone number (e.g. '254712345678', '+254712345678', '0712345678').
 */
export function getPhoneSearchVariants(normalizedPhone: string): string[] {
  const variants = new Set<string>();
  variants.add(normalizedPhone);
  variants.add(`+${normalizedPhone}`);
  if (normalizedPhone.startsWith('254') && normalizedPhone.length === 12) {
    variants.add(`0${normalizedPhone.substring(3)}`);
  }
  return Array.from(variants);
}

export interface ResolveCustomerInput {
  organizationId: string;
  phone?: string | null;
  name?: string | null;
}

/**
 * Finds an existing customer or creates a new one from M-Pesa payment information.
 * - Idempotently links without modifying existing customer profile data.
 * - Sets creationType to API_CREATED for newly created customers.
 * - Dispatches emitCustomerCreated automation event.
 */
export async function findOrCreateCustomerFromMpesa(
  tx: any,
  input: ResolveCustomerInput
) {
  const { organizationId, phone, name } = input;
  const normalizedPhone = normalizeKenyanPhone(phone);

  if (!normalizedPhone && !name) {
    return null;
  }

  // 1. If phone is present, search by phone variations
  if (normalizedPhone) {
    const phoneVariants = getPhoneSearchVariants(normalizedPhone);
    const existingByPhone = await tx.customer.findFirst({
      where: {
        organizationId,
        phone: { in: phoneVariants },
      },
    });

    if (existingByPhone) {
      return existingByPhone;
    }
  }

  // 2. Fallback name construction
  const customerName = name?.trim() || (normalizedPhone ? `Customer ${normalizedPhone}` : 'M-Pesa Customer');

  // 3. Create new customer
  const newCustomer = await tx.customer.create({
    data: {
      organizationId,
      name: customerName,
      phone: normalizedPhone || phone || null,
      creationType: CustomerCreationType.API_CREATED,
      isActive: true,
    },
  });

  // 4. Asynchronously notify automation / CRM
  if (newCustomer?.id) {
    await emitCustomerCreated(organizationId, {
      customerId: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email || undefined,
    }).catch((err) => {
      console.warn(`[findOrCreateCustomerFromMpesa] emitCustomerCreated warning for ${newCustomer.id}:`, err);
    });
  }

  return newCustomer;
}
