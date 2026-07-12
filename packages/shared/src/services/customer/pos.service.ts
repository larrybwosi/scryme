import "server-only";
import { PrismaClient } from "@repo/db";

import { CreatePosCustomerData } from "../../lib/validations/customer/pos";

export class PosCustomerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Returns all customers updated after `lastSync`.
   */
  async getCustomersDelta(
    organizationId: string,
    lastSync: string | null,
  ): Promise<{ data: any[]; nextSyncToken: string }> {
    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId,
        ...(lastSync ? { updatedAt: { gt: new Date(lastSync) } } : {}),
      },
      /**
       * ⚡ Bolt: Performance Optimization
       * Use targeted select to fetch only essential fields for POS sync.
       * Reduces database I/O and payload size by avoiding heavy JSON/metadata fields.
       */
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        updatedAt: true,
        customerType: true,
        company: true,
      },
    });

    const mappedData = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints,
      updatedAt: c.updatedAt,
      customerType: c.customerType,
      company: c.company,
    }));

    return {
      data: mappedData,
      nextSyncToken: new Date().toISOString(),
    };
  }

  /**
   * Full-text search across customers.
   */
  async searchPosCustomers(
    organizationId: string,
    searchTerm: string,
  ): Promise<any[]> {
    if (!searchTerm?.trim()) return [];

    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 20,
      /**
       * ⚡ Bolt: Performance Optimization
       * Use targeted select to fetch only essential fields for POS search results.
       * Reduces database I/O and payload size by avoiding heavy JSON/metadata fields.
       */
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        updatedAt: true,
        customerType: true,
        company: true,
      },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      loyaltyPoints: c.loyaltyPoints,
      updatedAt: c.updatedAt,
      customerType: c.customerType,
      company: c.company,
    }));
  }

  /**
   * Creates a new customer.
   */
  async createPosCustomer(
    organizationId: string,
    rawData: CreatePosCustomerData,
    memberId?: string,
  ): Promise<any> {
    if (!rawData.name?.trim()) throw new Error("Customer name is required.");

    const { CustomerService } = await import("./customer.service");
    const customerService = new CustomerService(this.prisma);

    const response = await customerService.saveCustomer(
      organizationId,
      memberId || "",
      {
        name: rawData.name,
        email: rawData.email,
        phone: rawData.phone,
        ...rawData.address,
        notes: rawData.notes,
      },
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create customer");
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
