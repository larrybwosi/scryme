import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { type V2ApiContext } from '../../api/v2/types';

@Injectable()
export class SupplierService {
  constructor(@Inject('PRISMA_SERVICE') private readonly prisma: any) {}

  async getSuppliers(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.supplier.findMany({
      where: { organizationId },
      include: {
        documents: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSupplier(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const supplier = await this.prisma.client.supplier.findFirst({
      where: { id, organizationId },
      include: {
        documents: true,
        products: {
          include: {
            product: true,
            variant: true,
          },
        },
        priceHistory: {
          take: 10,
          orderBy: { effectiveDate: 'desc' },
          include: { variant: true },
        },
        performances: {
          take: 5,
          orderBy: { periodEnd: 'desc' },
        },
        qualityIncidents: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async createSupplierDocument(ctx: V2ApiContext, supplierId: string, data: any) {
    const { organizationId } = ctx;

    // Verify supplier belongs to organization
    const supplier = await this.prisma.client.supplier.findFirst({
      where: { id: supplierId, organizationId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    // Whitelist data to prevent mass assignment
    const { name, documentType, fileUrl, expiryDate, status } = data;

    return this.prisma.client.supplierDocument.create({
      data: {
        name,
        documentType,
        fileUrl,
        expiryDate,
        status,
        supplierId,
        organizationId,
      },
    });
  }

  async createQualityIncident(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // Whitelist data to prevent mass assignment
    const { title, description, severity, status, batchId, stockBatchId, supplierId } = data;

    // Verify foreign keys belong to organization
    if (supplierId) {
      const supplier = await this.prisma.client.supplier.findFirst({
        where: { id: supplierId, organizationId },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');
    }

    if (batchId) {
      const batch = await this.prisma.client.batch.findFirst({
        where: { id: batchId, organizationId },
      });
      if (!batch) throw new NotFoundException('Batch not found');
    }

    if (stockBatchId) {
      const stockBatch = await this.prisma.client.stockBatch.findFirst({
        where: { id: stockBatchId, organizationId },
      });
      if (!stockBatch) throw new NotFoundException('Stock batch not found');
    }

    const count = await this.prisma.client.qualityIncident.count({
      where: { organizationId },
    });
    const incidentNumber = `INC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    return await this.prisma.client.$transaction(async (tx: any) => {
      const incident = await tx.qualityIncident.create({
        data: {
          title,
          description,
          severity,
          status,
          batchId,
          stockBatchId,
          supplierId,
          incidentNumber,
          organizationId,
          reportedById: ctx.memberId!,
        },
      });

      if (supplierId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const performance = await tx.supplierPerformance.findFirst({
          where: {
            supplierId: supplierId,
            periodStart: { lte: now },
            periodEnd: { gte: now },
          },
        });

        if (performance) {
          const newRejectedItems = performance.rejectedItems + 1;
          const newQualityScore = Math.max(0, 100 - newRejectedItems * 5);

          await tx.supplierPerformance.update({
            where: { id: performance.id },
            data: {
              rejectedItems: newRejectedItems,
              qualityScore: newQualityScore,
              calculatedAt: new Date(),
            },
          });
        } else {
          await tx.supplierPerformance.create({
            data: {
              supplierId: supplierId,
              organizationId,
              periodStart: startOfMonth,
              periodEnd: endOfMonth,
              rejectedItems: 1,
              qualityScore: 95,
              totalOrders: 0,
              calculatedAt: new Date(),
            },
          });
        }
      }

      return incident;
    });
  }

  async getQualityIncidents(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;

    // Whitelist query parameters to prevent filter injection
    const { status, severity, supplierId, batchId, stockBatchId, take, skip } = query;

    return this.prisma.client.qualityIncident.findMany({
      where: {
        organizationId,
        status,
        severity,
        supplierId,
        batchId,
        stockBatchId,
      },
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
      include: {
        batch: true,
        stockBatch: {
          include: { variant: true },
        },
        supplier: true,
        reportedBy: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async initiateRecall(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    const { title, description, supplierId, stockBatchId } = data;

    // Verify foreign keys belong to organization
    if (supplierId) {
      const supplier = await this.prisma.client.supplier.findFirst({
        where: { id: supplierId, organizationId },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');
    }

    if (stockBatchId) {
      const stockBatch = await this.prisma.client.stockBatch.findFirst({
        where: { id: stockBatchId, organizationId },
      });
      if (!stockBatch) throw new NotFoundException('Stock batch not found');
    }

    const count = await this.prisma.client.recall.count({ where: { organizationId } });
    const recallNumber = `REC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    return await this.prisma.client.$transaction(async (tx: any) => {
      const recall = await tx.recall.create({
        data: {
          recallNumber,
          title,
          description,
          supplierId,
          stockBatchId,
          organizationId,
        },
      });

      if (stockBatchId) {
        await tx.stockBatch.update({
          where: { id: stockBatchId },
          data: { isRecalled: true, recallId: recall.id },
        });

        const affectedConsumptions = await tx.batchIngredientConsumption.findMany({
          where: { stockBatchId },
        });

        const affectedBatchIds = affectedConsumptions.map((c: any) => c.batchId);

        if (affectedBatchIds.length > 0) {
          await tx.batch.updateMany({
            where: { id: { in: affectedBatchIds } },
            data: { isRecalled: true, recallId: recall.id },
          });

          await tx.stockBatch.updateMany({
            where: { productionBatchId: { in: affectedBatchIds } },
            data: { isRecalled: true, recallId: recall.id },
          });
        }
      }

      return recall;
    });
  }

  async getRecalls(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.recall.findMany({
      where: { organizationId },
      include: {
        supplier: true,
        _count: {
          select: { stockBatches: true, productionBatches: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecallImpact(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const recall = await this.prisma.client.recall.findFirst({
      where: { id, organizationId },
      include: {
        stockBatches: {
          include: { variant: { include: { product: true } }, location: true },
        },
        productionBatches: {
          include: { recipe: true },
        },
      },
    });
    if (!recall) throw new NotFoundException('Recall not found');
    return recall;
  }

  async getSupplierLeadTime(organizationId: string, supplierId?: string) {
    const performanceData = await this.prisma.client.supplierPerformance.findMany({
      where: {
        organizationId,
        ...(supplierId && { supplierId }),
      },
      include: {
        supplier: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        periodEnd: 'desc',
      },
      take: 12,
    });

    return performanceData;
  }
}
