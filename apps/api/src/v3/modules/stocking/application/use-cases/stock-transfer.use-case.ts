import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {
  CreateTransferDto,
  ShipTransferDto,
  ReceiveTransferDto,
} from "../dto/transfer.dto";
import {PaginationQueryDto, paginate} from "@/v3/common/utils/pagination";
import {InventoryMovementService} from "../../../inventory/application/services/inventory-movement.service";
import {
  emitStockTransferCreated,
  emitStockTransferShipped,
  emitStockTransferReceived,
} from "@repo/windmill/server";
import {MovementType, StockTransferStatus} from "@repo/db";

@Injectable()
export class StockTransferUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async create(
    organizationId: string,
    memberId: string,
    dto: CreateTransferDto,
  ) {
    const transferNumber = `TR-${Date.now()}`;

    return this.prisma.client.$transaction(async tx => {
      const transfer = await tx.stockTransfer.create({
        data: {
          organizationId,
          requestedById: memberId,
          transferNumber,
          fromLocationId: dto.fromLocationId,
          toLocationId: dto.toLocationId,
          status: StockTransferStatus.PENDING_APPROVAL,
          priority: dto.priority,
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              variantId: item.variantId,
              requestedQuantity: item.requestedQuantity,
              unitCost: 0,
            })),
          },
        },
        include: {
          fromLocation: true,
          toLocation: true,
          items: {include: {variant: {include: {product: true}}}},
        },
      });

      // Emit Windmill Event
      await emitStockTransferCreated(organizationId, {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromLocation: transfer.fromLocation.name,
        toLocation: transfer.toLocation.name,
        priority: transfer.priority,
        items: transfer.items.map(i => ({
          variantName: `${i.variant.product.name} ${i.variant.name || ""}`,
          quantity: Number(i.requestedQuantity),
        })),
      }).catch(err =>
        console.error("[v3 StockTransfer] Failed to emit created event:", err),
      );

      return transfer;
    });
  }

  async approve(organizationId: string, memberId: string, transferId: string) {
    return this.prisma.client.$transaction(async tx => {
      const transfer = await tx.stockTransfer.findUnique({
        where: {id: transferId, organizationId},
        include: {items: true},
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (transfer.status !== StockTransferStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          "Transfer is not in pending approval status",
        );
      }

      for (const item of transfer.items) {
        const stock = await tx.productVariantStock.findUnique({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.fromLocationId,
            },
          },
        });

        if (
          !stock ||
          Number(stock.availableStock) < Number(item.requestedQuantity)
        ) {
          throw new BadRequestException(
            `Insufficient available stock for variant ${item.variantId} at source location`,
          );
        }

        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.fromLocationId,
            },
          },
          data: {
            reservedStock: {increment: item.requestedQuantity},
            availableStock: {decrement: item.requestedQuantity},
          },
        });
      }

      return tx.stockTransfer.update({
        where: {id: transferId},
        data: {
          status: StockTransferStatus.APPROVED,
          approvedById: memberId,
        },
      });
    });
  }

  async ship(
    organizationId: string,
    memberId: string,
    transferId: string,
    dto: ShipTransferDto,
  ) {
    return this.prisma.client.$transaction(async tx => {
      const transfer = await tx.stockTransfer.findUnique({
        where: {id: transferId, organizationId},
        include: {items: {include: {variant: true}}},
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (transfer.status !== StockTransferStatus.APPROVED) {
        throw new BadRequestException(
          "Transfer must be approved before shipping",
        );
      }

      for (const itemDto of dto.items) {
        const item = transfer.items.find(i => i.id === itemDto.transferItemId);
        if (!item)
          throw new NotFoundException(
            `Item ${itemDto.transferItemId} not found`,
          );

        await tx.productVariantStock.update({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.fromLocationId,
            },
          },
          data: {
            currentStock: {decrement: itemDto.shippedQuantity},
            reservedStock: {decrement: item.requestedQuantity},
          },
        });

        let remainingToDeduct = itemDto.shippedQuantity;
        const batches = await tx.stockBatch.findMany({
          where: {
            variantId: item.variantId,
            locationId: transfer.fromLocationId,
            currentQuantity: {gt: 0},
            id: itemDto.stockBatchId || undefined,
          },
          orderBy: {receivedDate: "asc"},
        });

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          const deduction = Math.min(
            Number(batch.currentQuantity),
            remainingToDeduct,
          );

          await tx.stockBatch.update({
            where: {id: batch.id},
            data: {currentQuantity: {decrement: deduction}},
          });

          await this.inventoryMovementService.recordMovement(tx, {
            organizationId,
            memberId,
            variantId: item.variantId,
            stockBatchId: batch.id,
            quantity: deduction,
            fromLocationId: transfer.fromLocationId,
            movementType: MovementType.TRANSFER,
            referenceId: transfer.id,
            referenceType: "StockTransfer",
            notes: `Shipped via Transfer #${transfer.transferNumber}`,
          });

          remainingToDeduct -= deduction;
        }

        if (remainingToDeduct > 0) {
          throw new BadRequestException(
            `Insufficient stock in specified batches for ${item.variant.sku}`,
          );
        }

        await tx.stockTransferItem.update({
          where: {id: item.id},
          data: {
            shippedQuantity: itemDto.shippedQuantity,
            stockBatchId: itemDto.stockBatchId,
          },
        });
      }

      const updatedTransfer = await tx.stockTransfer.update({
        where: {id: transferId},
        data: {
          status: StockTransferStatus.SHIPPED,
          shippedById: memberId,
          shippedDate: new Date(),
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
        },
      });

      // Emit Windmill Event
      await emitStockTransferShipped(organizationId, {
        transferId: updatedTransfer.id,
        transferNumber: updatedTransfer.transferNumber,
        shippedAt: updatedTransfer.shippedDate!.toISOString(),
        carrier: updatedTransfer.carrier || undefined,
        trackingNumber: updatedTransfer.trackingNumber || undefined,
      }).catch(err =>
        console.error("[v3 StockTransfer] Failed to emit shipped event:", err),
      );

      return updatedTransfer;
    });
  }

  async receive(
    organizationId: string,
    memberId: string,
    transferId: string,
    dto: ReceiveTransferDto,
  ) {
    return this.prisma.client.$transaction(async tx => {
      const transfer = await tx.stockTransfer.findUnique({
        where: {id: transferId, organizationId},
        include: {items: {include: {variant: true}}},
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (
        transfer.status !== StockTransferStatus.SHIPPED &&
        transfer.status !== StockTransferStatus.IN_TRANSIT
      ) {
        throw new BadRequestException("Transfer is not in a shippable state");
      }

      for (const itemDto of dto.items) {
        const item = transfer.items.find(i => i.id === itemDto.transferItemId);
        if (!item)
          throw new NotFoundException(
            `Item ${itemDto.transferItemId} not found`,
          );

        await tx.productVariantStock.upsert({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: transfer.toLocationId,
            },
          },
          update: {
            currentStock: {increment: itemDto.receivedQuantity},
            availableStock: {increment: itemDto.receivedQuantity},
          },
          create: {
            organizationId,
            productId: item.variant.productId,
            variantId: item.variantId,
            locationId: transfer.toLocationId,
            currentStock: itemDto.receivedQuantity,
            availableStock: itemDto.receivedQuantity,
          },
        });

        const newBatch = await tx.stockBatch.create({
          data: {
            organizationId,
            variantId: item.variantId,
            locationId: transfer.toLocationId,
            initialQuantity: itemDto.receivedQuantity,
            currentQuantity: itemDto.receivedQuantity,
            purchasePrice: item.unitCost,
            receivedDate: new Date(),
            batchNumber: `TR-${transfer.transferNumber}-${item.id.slice(-4)}`,
          },
        });

        await this.inventoryMovementService.recordMovement(tx, {
          organizationId,
          memberId,
          variantId: item.variantId,
          stockBatchId: newBatch.id,
          quantity: itemDto.receivedQuantity,
          toLocationId: transfer.toLocationId,
          movementType: MovementType.TRANSFER,
          referenceId: transfer.id,
          referenceType: "StockTransfer",
          notes: `Received via Transfer #${transfer.transferNumber}`,
        });

        await tx.stockTransferItem.update({
          where: {id: item.id},
          data: {receivedQuantity: itemDto.receivedQuantity},
        });
      }

      const completedTransfer = await tx.stockTransfer.update({
        where: {id: transferId},
        data: {
          status: StockTransferStatus.COMPLETED,
          receivedById: memberId,
          receivedDate: new Date(),
          completedDate: new Date(),
        },
        include: {receivedBy: {include: {user: true}}},
      });

      // Emit Windmill Event
      await emitStockTransferReceived(organizationId, {
        transferId: completedTransfer.id,
        transferNumber: completedTransfer.transferNumber,
        receivedAt: completedTransfer.receivedDate!.toISOString(),
        receivedBy: completedTransfer.receivedBy?.user.name || "Unknown",
      }).catch(err =>
        console.error("[v3 StockTransfer] Failed to emit received event:", err),
      );

      return completedTransfer;
    });
  }

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return paginate(
      this.prisma.client.stockTransfer,
      pagination,
      {organizationId},
      {requestedDate: "desc"},
      {include: {fromLocation: true, toLocation: true, requestedBy: true}},
    );
  }

  async findOne(organizationId: string, transferId: string) {
    const transfer = await this.prisma.client.stockTransfer.findUnique({
      where: {id: transferId, organizationId},
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: {include: {user: true}},
        approvedBy: {include: {user: true}},
        shippedBy: {include: {user: true}},
        receivedBy: {include: {user: true}},
        organization: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
  }
}
