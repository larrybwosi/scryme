import { PrismaClient } from "@repo/db";
import 'server-only';
import { PosCustomerService } from '../services/pos.service';
import { CreateCustomerData } from '../validations/pos';

export function createPosCustomerActions(prisma: PrismaClient) {
  const service = new PosCustomerService(prisma);

  return {
    async getCustomersDelta(organizationId: string, lastSync: string | null) {
      return service.getCustomersDelta(organizationId, lastSync);
    },

    async searchPosCustomers(organizationId: string, rawSearchTerm: string) {
      return service.searchPosCustomers(organizationId, rawSearchTerm);
    },

    async createPosCustomer(organizationId: string, rawData: CreateCustomerData, memberId?: string) {
      return service.createPosCustomer(organizationId, rawData, memberId);
    }
  };
}
