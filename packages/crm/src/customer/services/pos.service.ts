import 'server-only';
import { PrismaClient, type Customer } from '@repo/db';

export interface CreatePosCustomerData {
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

export class PosCustomerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Returns all customers updated after `lastSync`.
   */
  async getCustomersDelta(
    organizationId: string,
    lastSync: string | null
  ): Promise<{ data: any[]; nextSyncToken: string }> {
    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId,
        ...(lastSync ? { updatedAt: { gt: new Date(lastSync) } } : {}),
      },
    });

    const mappedData = customers.map((c: Customer) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints,
    }));

    return {
      data: mappedData,
      nextSyncToken: new Date().toISOString(),
    };
  }

  /**
   * Full-text search across customers.
   */
  async searchPosCustomers(organizationId: string, searchTerm: string): Promise<any[]> {
    if (!searchTerm?.trim()) return [];

    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    return customers.map((c: Customer) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints,
    }));
  }

  /**
   * Creates a new customer.
   */
  async createPosCustomer(
    organizationId: string,
    rawData: CreatePosCustomerData,
    memberId?: string
  ): Promise<any> {
    if (!rawData.name?.trim()) throw new Error('Customer name is required.');

    const { CustomerService } = await import('./customer.service');
    const customerService = new CustomerService(this.prisma);

    const response = await customerService.saveCustomer(
      organizationId,
      memberId || '',
      {
        name: rawData.name,
        email: rawData.email,
        phone: rawData.phone,
        ...rawData.address,
        notes: rawData.notes,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create customer');
    }

    return {
      id: response.data.customer.id,
      name: response.data.customer.name,
      email: response.data.customer.email,
      phone: response.data.customer.phone,
      loyaltyPoints: response.data.customer.loyaltyPoints,
    };
  }
}
