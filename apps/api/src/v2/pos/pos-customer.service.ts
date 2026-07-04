import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { PosCustomerService as SharedPosCustomerService } from "@repo/shared/services/customer";

@Injectable()
export class PosCustomerService {
  private readonly sharedService: SharedPosCustomerService;

  constructor(private readonly prisma: PrismaService) {
    this.sharedService = new SharedPosCustomerService(this.prisma.client as any);
  }

  async getCustomer(ctx: V2ApiContext, id: string) {
    // We don't have a direct getCustomer in SharedPosCustomerService yet,
    // so we use CustomerService for now or just fetch directly.
    return this.prisma.client.customer.findUnique({
      where: { id, organizationId: ctx.organizationId },
    });
  }

  async searchCustomers(ctx: V2ApiContext, query: any) {
    return this.sharedService.searchPosCustomers(ctx.organizationId, query.q);
  }

  async getCustomersDelta(organizationId: string, since?: string) {
    return this.sharedService.getCustomersDelta(organizationId, since || null);
  }

  async createPosCustomer(organizationId: string, data: any, memberId: string) {
    return this.sharedService.createPosCustomer(organizationId, data, memberId);
  }
}
