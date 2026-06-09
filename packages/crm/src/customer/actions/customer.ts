import { PrismaClient } from "@repo/db";
import 'server-only';
import { CustomerService } from '../services/customer.service';

export function createCustomerActions(prisma: PrismaClient) {
  const service = new CustomerService(prisma);

  return {
    async getCustomers(organizationId: string, searchParams?: any) {
      return service.getCustomers(organizationId, searchParams);
    },

    async getCustomerById(organizationId: string, customerId: string) {
      return service.getCustomerById(organizationId, customerId);
    },

    async saveCustomer(organizationId: string, memberId: string, formData: any) {
      return service.saveCustomer(organizationId, memberId, formData);
    },

    async deleteCustomer(organizationId: string, userId: string, customerId: string) {
      return service.deleteCustomer(organizationId, userId, customerId);
    }
  };
}
