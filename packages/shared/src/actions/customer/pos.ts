import 'server-only';
import { PosCustomerService } from '../../services/customer/pos.service';
import { CreatePosCustomerData } from '../../lib/validations/customer/pos';
import { PrismaClient } from '@repo/db';

export function createPosCustomerActions(prisma: PrismaClient) {
  const service = new PosCustomerService(prisma);

  return {
    async getCustomersDelta(organizationId: string, lastSync: string | null) {
      return service.getCustomersDelta(organizationId, lastSync);
    },

    async searchPosCustomers(organizationId: string, rawSearchTerm: string) {
      return service.searchPosCustomers(organizationId, rawSearchTerm);
    },

    async createPosCustomer(organizationId: string, rawData: CreatePosCustomerData, memberId?: string) {
      return service.createPosCustomer(organizationId, rawData, memberId);
    }
  };
}
