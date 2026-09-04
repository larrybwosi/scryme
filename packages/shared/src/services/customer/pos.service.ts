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

    const { address, ...restOfData } = rawData;

    const response = await customerService.saveCustomer(
      organizationId,
      memberId || "",
      {
        ...restOfData,
        ...address,
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
      company: response.data.customer.company,
      customerType: response.data.customer.customerType,
      dateOfBirth: response.data.customer.dateOfBirth,
      isActive: response.data.customer.isActive,
      deliveryNotes: response.data.customer.deliveryNotes,
      pinnedLocation: response.data.customer.pinnedLocation,
      tags: response.data.customer.tags,
      medicalHistory: response.data.customer.crmRecord?.data?.medicalHistory || response.data.customer.medicalHistory,
      allergies: response.data.customer.crmRecord?.data?.allergies || response.data.customer.allergies,
      chronicConditions: response.data.customer.crmRecord?.data?.chronicConditions || response.data.customer.chronicConditions,
      insuranceProvider: response.data.customer.crmRecord?.data?.insuranceProvider || response.data.customer.insuranceProvider,
      policyNumber: response.data.customer.crmRecord?.data?.policyNumber || response.data.customer.policyNumber,
    };
  }
}
