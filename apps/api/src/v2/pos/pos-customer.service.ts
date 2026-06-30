import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { PosCustomerService as SharedPosCustomerService } from "@repo/shared/services/customer";

@Injectable()
export class PosCustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomer(ctx: V2ApiContext, id: string) {
    // Proxy logic
    return null;
  }

  async searchCustomers(ctx: V2ApiContext, query: any) {
    // Proxy logic
    return [];
  }

  async getCustomersDelta(organizationId: string, since?: string) {
    return [];
  }

  async createPosCustomer(organizationId: string, data: any, memberId: string) {
    return { id: "stub" };
  }
}
