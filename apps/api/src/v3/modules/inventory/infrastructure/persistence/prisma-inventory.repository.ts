import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IInventoryRepository } from "../../domain/repositories/inventory-repository.interface";
import { InventoryItem } from "../../domain/entities/inventory-item.entity";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(
    organizationId: string,
    pagination?: PaginationQueryDto,
  ): Promise<InventoryItem[]> {
    const items = await this.prisma.client.productVariantStock.findMany({
      where: { organizationId },
      take: pagination?.limit,
      skip: pagination?.offset,
      select: {
        id: true,
        variantId: true,
        locationId: true,
        availableStock: true,
        organizationId: true,
        lastUpdated: true,
      },
    });
    return items.map(
      (i) =>
        new InventoryItem(
          i.id,
          i.variantId,
          i.locationId,
          i.availableStock.toNumber(),
          i.organizationId,
          i.lastUpdated,
        ),
    );
  }

  async findByLocation(
    organizationId: string,
    locationId: string,
    pagination?: PaginationQueryDto,
  ): Promise<InventoryItem[]> {
    const items = await this.prisma.client.productVariantStock.findMany({
      where: { organizationId, locationId },
      take: pagination?.limit,
      skip: pagination?.offset,
      select: {
        id: true,
        variantId: true,
        locationId: true,
        availableStock: true,
        organizationId: true,
        lastUpdated: true,
      },
    });
    return items.map(
      (i) =>
        new InventoryItem(
          i.id,
          i.variantId,
          i.locationId,
          i.availableStock.toNumber(),
          i.organizationId,
          i.lastUpdated,
        ),
    );
  }

  async updateQuantity(id: string, delta: number): Promise<InventoryItem> {
    const i = await this.prisma.client.productVariantStock.update({
      where: { id },
      data: {
        availableStock: { increment: delta },
        currentStock: { increment: delta },
      },
    });
    return new InventoryItem(
      i.id,
      i.variantId,
      i.locationId,
      i.availableStock.toNumber(),
      i.organizationId,
      i.lastUpdated,
    );
  }
}
