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
      const assembly = await tx.assembly.findUnique({
        where: { id: assemblyId, organizationId },
        include: { items: true },
      });

      if (!assembly) throw new NotFoundException('Assembly not found');
      if (assembly.status !== 'PLANNED' && assembly.status !== 'IN_PROGRESS') {
        throw new BadRequestException('Assembly is already completed or cancelled');
      }

      // 1. Deduct components
      for (const item of assembly.items) {
        // If specific batch was selected, deduct from it
        if (item.stockBatchId) {
          await tx.stockBatch.update({
            where: { id: item.stockBatchId },
            data: { currentQuantity: { decrement: item.quantity } },
          });
        }

        // Update summary stock
        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId, // Assuming components are in the same location
            },
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
      await tx.productVariantStock.upsert({
        where: {
          variantId_locationId: {
            variantId: assembly.variantId,
            locationId,
          },
        },
        create: {
          organizationId,
          productId: (await tx.productVariant.findUnique({ where: { id: assembly.variantId } }))!.productId,
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
      return tx.assembly.update({
        where: { id: assemblyId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });
  }
}
