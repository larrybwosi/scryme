import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IUnitsRepository } from "../../domain/repositories/units.repository.interface";
import {
  SystemUnit,
  OrganizationUnit,
} from "../../domain/entities/unit.entity";

@Injectable()
export class PrismaUnitsRepository implements IUnitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManySystemUnits(lastSync?: Date): Promise<SystemUnit[]> {
    const units = await this.prisma.client.systemUnit.findMany({
      where: lastSync
        ? {
            updatedAt: {
              gt: lastSync,
            },
          }
        : {},
    });

    return units.map(
      (u) =>
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
      (u) =>
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
