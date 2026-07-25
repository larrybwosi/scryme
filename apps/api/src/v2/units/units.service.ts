import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";

@Injectable()
export class UnitsService {
  // ⚡ Bolt: Performance Optimization (In-Memory Cache for System Units)
  // System units are system-wide, static, and highly frequently accessed.
  // Serving them from an in-memory cache eliminates redundant database I/O and query overhead.
  private cachedSystemUnits: any[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async loadSystemUnits() {
    if (!this.cachedSystemUnits) {
      this.cachedSystemUnits = await this.prisma.client.systemUnit.findMany();
    }
    return this.cachedSystemUnits;
  }

  async getSystemUnits() {
    const units = await this.loadSystemUnits();
    return units
      .filter(u => u.isActive)
      .sort((a, b) => {
        const orderA = a.sortOrder ?? 0;
        const orderB = b.sortOrder ?? 0;
        return orderA - orderB;
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

    // Retrieve system units directly from our local in-memory cache to save database I/O
    const cached = await this.loadSystemUnits();
    const systemUnits = cached.filter(u => u.updatedAt > since);

    const [
      organizationUnits,
      unitConversions,
      orgUnitConversions,
      productUnitConversions,
    ] = await Promise.all([
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
