import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { V2ApiContext } from '@repo/shared/api/v2/types';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemUnits() {
    return this.prisma.client.systemUnit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
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
    const { organizationId } = ctx;
    return this.prisma.client.organizationUnit.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateOrganizationUnit(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.organizationUnit.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteOrganizationUnit(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    // We do a soft delete for consistency
    return this.prisma.client.organizationUnit.update({
      where: { id, organizationId },
      data: { isActive: false },
    });
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
