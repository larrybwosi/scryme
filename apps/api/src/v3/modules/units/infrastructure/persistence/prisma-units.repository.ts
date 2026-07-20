import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IUnitsRepository } from "../../domain/repositories/units.repository.interface";
import {
  SystemUnit,
  OrganizationUnit,
} from "../../domain/entities/unit.entity";

@Injectable()
export class PrismaUnitsRepository implements IUnitsRepository {
  private cachedSystemUnits: SystemUnit[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async findManySystemUnits(lastSync?: Date): Promise<SystemUnit[]> {
    // ⚡ Bolt: Performance Optimization (In-Memory Cache for System Units)
    // System units are system-wide, static, and highly frequently accessed.
    // Serving them from in-memory cache eliminates redundant database I/O and query overhead.
    if (!this.cachedSystemUnits) {
      const units = await this.prisma.client.systemUnit.findMany();
      this.cachedSystemUnits = units.map(
        u =>
          new SystemUnit(
            u.id,
            u.name,
            u.symbol,
            u.type,
            u.category,
            u.isBaseUnit,
            u.isMetric,
            u.isActive,
            u.createdAt,
            u.updatedAt,
            u.abbreviation,
            u.pluralName,
            u.sortOrder,
            u.description,
          ),
      );
    }

    if (lastSync) {
      // Filter in-memory for delta synchronization requests to bypass any database read
      return this.cachedSystemUnits.filter(u => u.updatedAt > lastSync);
    }

    return this.cachedSystemUnits;
  }

  async findManyOrganizationUnits(
    organizationId: string,
    lastSync?: Date,
  ): Promise<OrganizationUnit[]> {
    const units = await this.prisma.client.organizationUnit.findMany({
      where: {
        organizationId,
        ...(lastSync
          ? {
              updatedAt: {
                gt: lastSync,
              },
            }
          : {}),
      },
    });

    return units.map(
      u =>
        new OrganizationUnit(
          u.id,
          u.organizationId,
          u.name,
          u.symbol,
          u.type,
          u.category,
          u.isActive,
          u.createdAt,
          u.updatedAt,
          u.abbreviation,
          u.pluralName,
          u.description,
          u.baseSystemUnitId,
          u.conversionFactor ? u.conversionFactor.toNumber() : null,
          u.conversionOffset ? u.conversionOffset.toNumber() : null,
        ),
    );
  }
}
