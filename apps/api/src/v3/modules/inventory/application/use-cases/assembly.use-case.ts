import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AssemblyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    memberId: string,
    data: {
      name: string;
      variantId: string;
      quantity: number;
      items: { variantId: string; quantity: number; stockBatchId?: string }[];
    }
  ) {
    // 1. Verify target variant ownership
    const targetVariant = await this.prisma.client.productVariant.findFirst({
      where: { id: data.variantId, product: { organizationId } },
    });
    if (!targetVariant) {
      throw new NotFoundException('Target variant not found or does not belong to your organization');
    }

    // 2. Verify component variants ownership
    const componentVariantIds = Array.from(new Set(data.items.map(i => i.variantId)));
    const componentVariantsCount = await this.prisma.client.productVariant.count({
      where: {
        id: { in: componentVariantIds },
        product: { organizationId },
      },
    });
    if (componentVariantsCount !== componentVariantIds.length) {
      throw new BadRequestException('One or more component variants are invalid or do not belong to your organization');
    }

    // 3. Verify stock batches ownership (if provided)
    const batchIds = Array.from(new Set(data.items.map(i => i.stockBatchId).filter((id): id is string => !!id)));
    if (batchIds.length > 0) {
      const batchesCount = await this.prisma.client.stockBatch.count({
        where: {
          id: { in: batchIds },
          organizationId,
        },
      });
      if (batchesCount !== batchIds.length) {
        throw new BadRequestException('One or more stock batches are invalid or do not belong to your organization');
      }
    }

    const assemblyNumber = `ASY-${Date.now()}`;

    return this.prisma.client.assembly.create({
      data: {
        organizationId,
        memberId,
        assemblyNumber,
        name: data.name,
        variantId: data.variantId,
        quantity: data.quantity,
        status: 'PLANNED',
        items: {
          create: data.items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            stockBatchId: item.stockBatchId,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async complete(organizationId: string, memberId: string, assemblyId: string, locationId: string) {
    return this.prisma.client.$transaction(async tx => {
      // 0. Verify location ownership
      const location = await tx.inventoryLocation.findFirst({
        where: { id: locationId, organizationId },
      });

      if (!location) {
        throw new NotFoundException('Location not found or does not belong to your organization');
      }

      const assembly = await tx.assembly.findFirst({
        where: { id: assemblyId, organizationId },
        include: { items: true },
      });

      if (!assembly) {
        throw new NotFoundException('Assembly not found or does not belong to your organization');
      }
      if (assembly.status !== 'PLANNED' && assembly.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Assembly is already completed or cancelled');
      }

      // 1. Deduct components
      for (const item of assembly.items) {
        // If specific batch was selected, deduct from it
        if (item.stockBatchId) {
          await tx.stockBatch.updateMany({
            where: { id: item.stockBatchId, organizationId },
            data: { currentQuantity: { decrement: item.quantity } },
          });
        }

        // Update summary stock
        await tx.productVariantStock.updateMany({
          where: {
            variantId: item.variantId,
            locationId, // Assuming components are in the same location
            organizationId,
          },
          data: {
            currentStock: { decrement: item.quantity },
            availableStock: { decrement: item.quantity },
          },
        });

        // Log movement
        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: item.variantId,
            stockBatchId: item.stockBatchId,
            quantity: item.quantity,
            fromLocationId: locationId,
            toLocationId: null,
            movementType: 'PRODUCTION_OUT',
            memberId,
            referenceId: assemblyId,
            referenceType: 'Assembly',
            notes: `Used in assembly ${assembly.assemblyNumber}`,
          },
        });
      }

      // 2. Create resulting batch
      const producedBatch = await tx.stockBatch.create({
        data: {
          organizationId,
          variantId: assembly.variantId,
          locationId,
          initialQuantity: assembly.quantity,
          currentQuantity: assembly.quantity,
          purchasePrice: 0, // Should be sum of component costs
          receivedDate: new Date(),
          batchNumber: `PRD-${assembly.assemblyNumber}`,
          assemblyId: assembly.id,
        },
      });

      // Update summary stock for result
      const targetVariantRecord = await tx.productVariant.findFirstOrThrow({
        where: { id: assembly.variantId, product: { organizationId } },
        select: { productId: true },
      });

      await tx.productVariantStock.upsert({
        where: {
          variantId_locationId: {
            variantId: assembly.variantId,
            locationId,
          },
        },
        create: {
          organizationId,
          productId: targetVariantRecord.productId,
          variantId: assembly.variantId,
          locationId,
          currentStock: assembly.quantity,
          availableStock: assembly.quantity,
        },
        update: {
          currentStock: { increment: assembly.quantity },
          availableStock: { increment: assembly.quantity },
        },
      });

      // Log movement for result
      await tx.stockMovement.create({
        data: {
          organizationId,
          variantId: assembly.variantId,
          stockBatchId: producedBatch.id,
          quantity: assembly.quantity,
          fromLocationId: null,
          toLocationId: locationId,
          movementType: 'PRODUCTION_IN',
          memberId,
          referenceId: assemblyId,
          referenceType: 'Assembly',
          notes: `Produced from assembly ${assembly.assemblyNumber}`,
        },
      });

      // 3. Update assembly status
      await tx.assembly.updateMany({
        where: { id: assemblyId, organizationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return tx.assembly.findFirst({
        where: { id: assemblyId, organizationId },
      });
    });
  }
}
