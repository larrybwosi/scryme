import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { V2ApiContext } from '@repo/shared/server';
import { PosCustomerService as CrmPosCustomerService } from '@repo/crm/server';

@Injectable()
export class PosCustomerService {
  private posCustomerService: CrmPosCustomerService;

  constructor(private readonly prisma: PrismaService) {
    this.posCustomerService = new CrmPosCustomerService(this.prisma.client);
  }

  async getCustomer(ctx: V2ApiContext, id: string) {
    return this.posCustomerService.searchPosCustomers(ctx.organizationId, id);
  }

  async searchCustomers(ctx: V2ApiContext, query: any) {
    return this.posCustomerService.searchPosCustomers(ctx.organizationId, query.q);
  }

  async getCustomersDelta(organizationId: string, since?: string) {
    return this.posCustomerService.getCustomersDelta(organizationId, since || null);
  }

  async createPosCustomer(organizationId: string, data: any, memberId: string) {
    return this.posCustomerService.createPosCustomer(organizationId, data, memberId);
  }
}
