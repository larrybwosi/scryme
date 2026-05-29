import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupplierService } from '@repo/suppliers/server';

@Injectable()
export class GetSupplierLeadTimeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, supplierId?: string) {
    // Lead time is time between Purchase Order (created) and Stock Batch (receivedDate)
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

@Injectable()
export class GetWasteAnalysisUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, options: { startDate?: Date; endDate?: Date }) {
    const movements = await this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
        movementType: 'ADJUSTMENT_OUT',
        movementDate: {
          gte: options.startDate,
          lte: options.endDate,
        },
        adjustment: {
          reason: {
            in: ['DAMAGED', 'EXPIRED', 'LOST', 'STOLEN', 'QUALITY_REJECTION'],
          },
        },
      },
      include: {
        adjustment: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    // Grouping by reason
    const analysis = movements.reduce((acc, m) => {
      const reason = m.adjustment?.reason || 'OTHER';
      if (!acc[reason]) acc[reason] = { count: 0, totalQuantity: 0, totalValue: 0 };

      acc[reason].count++;
      acc[reason].totalQuantity += Number(m.quantity);
      // Value calculation would ideally use the batch purchase price
      return acc;
    }, {} as any);

    return analysis;
  }
}
