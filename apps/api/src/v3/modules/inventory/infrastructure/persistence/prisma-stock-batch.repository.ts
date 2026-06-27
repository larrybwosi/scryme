import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IStockBatchRepository } from "../../domain/repositories/stock-batch-repository.interface";
import { StockBatchEntity } from "../../domain/entities/stock-batch.entity";

@Injectable()
export class PrismaStockBatchRepository implements IStockBatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(batch: any): StockBatchEntity {
    return new StockBatchEntity(
      batch.id,
      batch.variantId,
      batch.batchNumber,
      batch.supplierBatchNumber,
      batch.locationId,
      batch.initialQuantity.toNumber(),
      batch.currentQuantity.toNumber(),
      batch.purchasePrice.toNumber(),
      batch.expiryDate,
      batch.receivedDate,
      batch.organizationId,
      batch.supplierId,
      batch.parentId,
      batch.assemblyId,
      batch.isQuarantined,
      batch.isRecalled,
      batch.createdAt,
      batch.updatedAt,
      batch.children?.map(c => this.mapToEntity(c)),
      batch.supplier
        ? { name: batch.supplier.name, email: batch.supplier.email }
        : undefined,
      batch.variant
        ? { name: batch.variant.name, sku: batch.variant.sku }
        : undefined,
      batch.movements,
    );
  }

  async findById(id: string): Promise<StockBatchEntity | null> {
    const batch = await this.prisma.client.stockBatch.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
    return batch ? this.mapToEntity(batch) : null;
  }

  async findByBatchNumber(
    batchNumber: string,
    organizationId: string,
  ): Promise<StockBatchEntity | null> {
    const batch = await this.prisma.client.stockBatch.findFirst({
      where: { batchNumber, organizationId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
    return batch ? this.mapToEntity(batch) : null;
  }

  async getGenealogy(id: string): Promise<StockBatchEntity | null> {
    // Recursive query for children is handled by Prisma include if we know depth,
    // or we can just fetch top level and user can drill down.
    // For enterprise, we might want a few levels.
    // Optimization: Removed unused 'parent' include to save a join.
    const batch = await this.prisma.client.stockBatch.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });
    return batch ? this.mapToEntity(batch) : null;
  }

  async getTraceability(id: string): Promise<StockBatchEntity | null> {
    const batch = await this.prisma.client.stockBatch.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        movements: {
          include: {
            fromLocation: {
              select: {
                id: true,
                name: true,
              },
            },
            toLocation: {
              select: {
                id: true,
                name: true,
              },
            },
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            movementDate: "desc",
          },
        },
      },
    });
    return batch ? this.mapToEntity(batch) : null;
  }

  async create(data: any): Promise<StockBatchEntity> {
    const batch = await this.prisma.client.stockBatch.create({
      data,
    });
    return this.mapToEntity(batch);
  }

  async update(id: string, data: any): Promise<StockBatchEntity> {
    const batch = await this.prisma.client.stockBatch.update({
      where: { id },
      data,
    });
    return this.mapToEntity(batch);
  }
}
