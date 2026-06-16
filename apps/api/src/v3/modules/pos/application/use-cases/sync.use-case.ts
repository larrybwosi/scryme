import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  V3ApiContext,
  getPosProducts,
  getPosProductsDelta,
} from "@repo/shared/server";
import { PosCustomerService } from "@/v2/pos/pos-customer.service";

@Injectable()
export class SyncUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posCustomerService: PosCustomerService,
  ) {}

  async execute(ctx: V3ApiContext, query: any) {
    const { lastSync, locationId: queryLocationId } = query;
    const locationId = ctx.locationId || queryLocationId;

    if (!locationId) throw new BadRequestException("Location ID is required.");

    const productsPromise = lastSync
      ? getPosProductsDelta({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          lastSync,
        })
      : getPosProducts({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
        });

    const [products, customers, categories] = await Promise.all([
      productsPromise,
      this.posCustomerService.getCustomersDelta(ctx.organizationId, lastSync),
      this.prisma.client.category.findMany({
        where: { organizationId: ctx.organizationId },
        select: { id: true, name: true, description: true },
      }),
    ]);

    return {
      products,
      customers,
      categories,
      timestamp: new Date(),
    };
  }
}
