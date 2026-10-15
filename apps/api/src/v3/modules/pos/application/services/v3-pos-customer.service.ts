import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V3ApiContext } from "@repo/shared/api/v3";
import { PosCustomerService as SharedPosCustomerService } from "@repo/shared/services/customer";

@Injectable()
export class V3PosCustomerService {
  private readonly sharedService: SharedPosCustomerService;

  constructor(private readonly prisma: PrismaService) {
    this.sharedService = new SharedPosCustomerService(this.prisma.client as any);
  }

  async getCustomer(ctx: V3ApiContext, id: string) {
    return this.prisma.client.customer.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
  }

  async searchCustomers(ctx: V3ApiContext, query: any) {
    return this.sharedService.searchPosCustomers(ctx.organizationId, query.q);
  }

  async getCustomersDelta(organizationId: string, since?: string) {
    return this.sharedService.getCustomersDelta(organizationId, since || null);
  }

  async createPosCustomer(organizationId: string, data: any, memberId: string) {
    return this.sharedService.createPosCustomer(organizationId, data, memberId);
  }
}

export { V3PosCustomerService as PosCustomerService };
