import { prisma as db } from "@repo/db";
import {
  Customer,
  CrmRecord,
  Invoice,
  Transaction
} from "@repo/db";

export class CustomerService {
  async runAutomation(organizationId: string, event: string, data: any): Promise<any> {
      // Mock runAutomation to decouple from windmill
      console.log(`Running automation ${event} for org ${organizationId}`);
      return { success: true };
  }

  async getCustomerWithHistory(organizationId: string, customerId: string) {
    return db.customer.findUnique({
      where: { id: customerId },
      include: {
        crmRecords: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        transactions: {
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        addresses: true,
      },
    });
  }

  async updateCustomerProfile(
    organizationId: string,
    customerId: string,
    data: Partial<Customer>,
  ) {
    const updated = await db.customer.update({
      where: { id: customerId },
      data,
    });

    await this.runAutomation(organizationId, "customer.updated", updated);
    return updated;
  }
}

export const customerService = new CustomerService();
