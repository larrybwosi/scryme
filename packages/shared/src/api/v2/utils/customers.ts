import { PrismaClient } from '@repo/db';
import { decrypt } from './encryption';

// --- Types ---

export interface TwentyCrmClientConfig {
  serverUrl: string;
  apiKey: string;
}

interface CreatePosCustomerData {
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
}

// --- Shared Helpers ---

export async function getClientConfig(prisma: PrismaClient, organizationId: string): Promise<TwentyCrmClientConfig> {
  const config = await (prisma as any).twentyCrmConfiguration.findUnique({
    where: { organizationId },
    select: { serverUrl: true, apiKey: true, isActive: true },
  });
  if (!config?.isActive || !config.serverUrl || !config.apiKey) {
    throw new Error('Twenty CRM is not configured or inactive.');
  }
  return { serverUrl: config.serverUrl, apiKey: decrypt(config.apiKey) };
}

export async function ensureLocalCustomerStub(
  prisma: PrismaClient,
  organizationId: string,
  twentyId: string,
  personData: { name: string; email?: string | null; phone?: string | null; company?: string | null }
): Promise<string> {
  // Check if mapping already exists
  const mapping = await (prisma as any).externalMapping.findFirst({
    where: {
      organizationId,
      provider: 'TWENTY_CRM',
      entityType: 'CUSTOMER',
      externalId: twentyId,
    },
  });

  if (mapping?.internalId) {
    const localCustomer = await (prisma as any).customer.findUnique({
      where: { id: mapping.internalId },
    });
    if (localCustomer) {
      return localCustomer.id;
    }
  }

  const localCustomer = await (prisma as any).customer.create({
    data: {
      name: personData.name || 'Unknown Customer',
      email: personData.email ?? null,
      phone: personData.phone ?? null,
      company: personData.company ?? null,
      organizationId,
    },
  });

  // Link mapping
  if (mapping) {
    await (prisma as any).externalMapping.update({
      where: { id: mapping.id },
      data: { internalId: localCustomer.id },
    });
  } else {
    await (prisma as any).externalMapping.create({
      data: {
        organizationId,
        provider: 'TWENTY_CRM',
        entityType: 'CUSTOMER',
        internalId: localCustomer.id,
        externalId: twentyId,
      },
    });
  }

  return localCustomer.id;
}
