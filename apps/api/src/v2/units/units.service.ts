import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemUnits() {
    return this.prisma.client.systemUnit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async getOrganizationUnits(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.organizationUnit.findMany({
      where: { organizationId, isActive: true },
      include: { baseSystemUnit: true },
    });
  }

  async createOrganizationUnit(ctx: V2ApiContext, data: any) {
    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, symbol, abbreviation, pluralName, type, category, description, baseSystemUnitId, conversionFactor, conversionOffset } = data;
    return this.prisma.client.organizationUnit.create({
      data: { name, symbol, abbreviation, pluralName, type, category, description, baseSystemUnitId, conversionFactor, conversionOffset, organizationId: ctx.organizationId },
    });
  }

  async updateOrganizationUnit(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    // SECURITY (Sentinel): Explicit field whitelisting to prevent mass assignment.
    const { name, symbol, abbreviation, pluralName, type, category, description, baseSystemUnitId, conversionFactor, conversionOffset, isActive } = data;
    const updateData = Object.fromEntries(Object.entries({ name, symbol, abbreviation, pluralName, type, category, description, baseSystemUnitId, conversionFactor, conversionOffset, isActive }).filter(([_, v]) => v !== undefined));

    // SECURITY (Sentinel): Use updateMany with organizationId for multi-tenant isolation.
    const result = await this.prisma.client.organizationUnit.updateMany({
      where: { id, organizationId },
      data: updateData,
    });

    if (result.count === 0) throw new NotFoundException("Organization unit not found");
    return this.prisma.client.organizationUnit.findFirst({ where: { id, organizationId } });
  }

  async deleteOrganizationUnit(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    // SECURITY (Sentinel): Use updateMany with organizationId for multi-tenant isolation.
    const result = await this.prisma.client.organizationUnit.updateMany({
      where: { id, organizationId },
      data: { isActive: false },
    });

    if (result.count === 0) throw new NotFoundException("Organization unit not found");
    return this.prisma.client.organizationUnit.findFirst({ where: { id, organizationId } });
  }

  async syncUnits(ctx: V2ApiContext, lastSync?: string) {
    const { organizationId } = ctx;
    const since = lastSync ? new Date(lastSync) : new Date(0);

    const [
      systemUnits,
      organizationUnits,
      unitConversions,
      orgUnitConversions,
      productUnitConversions,
    ] = await Promise.all([
      this.prisma.client.systemUnit.findMany({
        where: {
          updatedAt: { gt: since },
        },
      }),
      this.prisma.client.organizationUnit.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
        },
      }),
      this.prisma.client.unitConversion.findMany({
        where: {
          updatedAt: { gt: since },
        },
      }),
      this.prisma.client.orgUnitConversion.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
        },
      }),
      this.prisma.client.productUnitConversion.findMany({
        where: {
          product: { organizationId },
          updatedAt: { gt: since },
        },
      }),
    ]);

    return {
      systemUnits,
      organizationUnits,
      unitConversions,
      orgUnitConversions,
      productUnitConversions,
      lastSync: new Date().toISOString(),
    };
  }
}
