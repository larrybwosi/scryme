import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateTransferDto,
  ShipTransferDto,
  ReceiveTransferDto,
} from "../dto/transfer.dto";
import { PaginationQueryDto, paginate } from "@/v3/common/utils/pagination";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import {
  emitStockTransferCreated,
  emitStockTransferShipped,
  emitStockTransferReceived,
} from "@repo/shared/server";
import { MovementType, StockTransferStatus } from "@repo/db";

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

    // SECURITY (Sentinel): Verify that both source and destination locations
    // belong to the authenticated organization.
    const uniqueLocationIds = Array.from(
      new Set([dto.fromLocationId, dto.toLocationId]),
    );
    const validLocationsCount = await this.prisma.client.inventoryLocation.count({
      where: {
        id: { in: uniqueLocationIds },
        organizationId,
      },
    });

    if (validLocationsCount !== uniqueLocationIds.length) {
      throw new BadRequestException("Invalid source or destination location");
    }

    // SECURITY (Sentinel): Verify that all requested variants belong to the
    // authenticated organization (via product relation).
    const variantIds = dto.items.map((i) => i.variantId);
    const validVariantsCount = await this.prisma.client.productVariant.count({
      where: {
        id: { in: variantIds },
        product: { organizationId },
      },
    });

    if (validVariantsCount !== new Set(variantIds).size) {
      throw new BadRequestException("One or more invalid variants requested");
    }

    return this.prisma.client.$transaction(async (tx) => {
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
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              requestedQuantity: item.requestedQuantity,
              unitCost: 0,
            })),
          },
        },
        include: {
          fromLocation: true,
          toLocation: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      });

      // Emit Windmill Event
      await emitStockTransferCreated(organizationId, {
        transferId: transfer.id,
        transferNumber: transfer.transferNumber,
        fromLocation: transfer.fromLocation.name,
        toLocation: transfer.toLocation.name,
        priority: transfer.priority,
        items: transfer.items.map((i) => ({
          variantName: `${i.variant.product.name} ${i.variant.name || ""}`,
          quantity: Number(i.requestedQuantity),
        })),
      }).catch((err) =>
        console.error("[v3 StockTransfer] Failed to emit created event:", err),
      );

      return transfer;
    });
  }

  async approve(organizationId: string, memberId: string, transferId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockTransfer lacks a composite unique index on [id, organizationId].
      const transfer = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: { items: true },
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (transfer.status !== StockTransferStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          "Transfer is not in pending approval status",
        );
      }

      // ⚡ Bolt Optimization: Batch fetch stock records to eliminate N+1 queries.
      const variantIds = transfer.items.map((i) => i.variantId);
      const stocks = await tx.productVariantStock.findMany({
        where: {
          variantId: { in: variantIds },
          locationId: transfer.fromLocationId,
        },
      });

      const stockMap = new Map(stocks.map((s) => [s.variantId, s]));

      // Aggregate requested quantities per variant to handle potential duplicate variant lines correctly.
      const aggregatedRequested = new Map<string, number>();
      for (const item of transfer.items) {
        const current = aggregatedRequested.get(item.variantId) || 0;
        aggregatedRequested.set(
          item.variantId,
          current + Number(item.requestedQuantity),
        );
      }

      // Validate all items before performing any updates.
      for (const [variantId, totalRequested] of aggregatedRequested.entries()) {
        const stock = stockMap.get(variantId);

        if (!stock || Number(stock.availableStock) < totalRequested) {
          throw new BadRequestException(
            `Insufficient available stock for variant ${variantId} at source location`,
          );
        }
      }

      // ⚡ Bolt Optimization: Perform consolidated stock updates per unique variant.
      // Doing this concurrently for each item in transfer.items can lead to concurrent updates
      // on the exact same row (compound key variantId_locationId), which causes database lock contention,
      // bottlenecks, or serialization/deadlock errors in transactions.
      // Aggregating quantities and updating per unique variant ensures exactly one update per unique variant,
      // reducing query roundtrips from O(N) to O(U) where U is unique variants, and eliminating race conditions.
      await Promise.all(
        Array.from(aggregatedRequested.entries()).map(([variantId, totalRequested]) =>
          tx.productVariantStock.update({
            where: {
              variantId_locationId: {
                variantId,
                locationId: transfer.fromLocationId,
              },
            },
            data: {
              reservedStock: { increment: totalRequested },
              availableStock: { decrement: totalRequested },
            },
          }),
        ),
      );

      return tx.stockTransfer.update({
        where: { id: transferId },
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
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockTransfer lacks a composite unique index on [id, organizationId].
      const transfer = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: { items: { include: { variant: true } } },
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (transfer.status !== StockTransferStatus.APPROVED) {
        throw new BadRequestException(
          "Transfer must be approved before shipping",
        );
      }

      // ⚡ Bolt Optimization: Batch fetch all relevant batches to eliminate N+1 queries.
      const variantIds = transfer.items.map((i) => i.variantId);
      // SECURITY (Sentinel): Explicitly scope batch lookups to organizationId.
      const allBatches = await tx.stockBatch.findMany({
        where: {
          organizationId,
          variantId: { in: variantIds },
          locationId: transfer.fromLocationId,
          currentQuantity: { gt: 0 },
        },
        orderBy: { receivedDate: "asc" },
      });

      const batchesByVariant = new Map<string, typeof allBatches>();
      for (const batch of allBatches) {
        const variantBatches = batchesByVariant.get(batch.variantId) || [];
        variantBatches.push(batch);
        batchesByVariant.set(batch.variantId, variantBatches);
      }

      // ⚡ Bolt Optimization: Pre-index transfer items into a Map to avoid O(N*M) nested loop search
      const transferItemsMap = new Map(transfer.items.map((i) => [i.id, i]));

      // ⚡ Bolt Optimization: Consolidate stock updates per unique variantId in-memory.
      // Doing individual `productVariantStock.update` calls inside the loop for each item
      // causes sequential database write roundtrips and row lock contention if multiple items share a variant.
      // Aggregating quantities by unique variantId allows us to perform exactly 1 update per unique variant concurrently via Promise.all.
      const variantStockUpdates = new Map<
        string,
        { totalShipped: number; totalRequested: number }
      >();

      for (const itemDto of dto.items) {
        const item = transferItemsMap.get(itemDto.transferItemId);
        if (!item) {
          throw new NotFoundException(
            `Item ${itemDto.transferItemId} not found`,
          );
        }

        const existing = variantStockUpdates.get(item.variantId);
        if (existing) {
          existing.totalShipped += itemDto.shippedQuantity;
          existing.totalRequested += Number(item.requestedQuantity);
        } else {
          variantStockUpdates.set(item.variantId, {
            totalShipped: itemDto.shippedQuantity,
            totalRequested: Number(item.requestedQuantity),
          });
        }
      }

      // Execute consolidated productVariantStock updates concurrently across unique variants
      await Promise.all(
        Array.from(variantStockUpdates.entries()).map(
          ([variantId, { totalShipped, totalRequested }]) =>
            tx.productVariantStock.update({
              where: {
                variantId_locationId: {
                  variantId,
                  locationId: transfer.fromLocationId,
                },
              },
              data: {
                currentStock: { decrement: totalShipped },
                reservedStock: { decrement: totalRequested },
              },
            }),
        ),
      );

      // Process batch deductions and item updates
      const itemUpdatePromises: Promise<any>[] = [];

      for (const itemDto of dto.items) {
        const item = transferItemsMap.get(itemDto.transferItemId)!;

        let remainingToDeduct = itemDto.shippedQuantity;
        const availableBatches = batchesByVariant.get(item.variantId) || [];
        const batches = itemDto.stockBatchId
          ? availableBatches.filter((b) => b.id === itemDto.stockBatchId)
          : availableBatches;

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;
          const deduction = Math.min(
            Number(batch.currentQuantity),
            remainingToDeduct,
          );

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: { decrement: deduction } },
          });

          // Update local copy to handle multiple lines for the same variant in one shipment correctly
          (batch as any).currentQuantity =
            Number(batch.currentQuantity) - deduction;

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

        itemUpdatePromises.push(
          tx.stockTransferItem.update({
            where: { id: item.id },
            data: {
              shippedQuantity: itemDto.shippedQuantity,
              stockBatchId: itemDto.stockBatchId,
            },
          }),
        );
      }

      // Execute stockTransferItem updates concurrently
      await Promise.all(itemUpdatePromises);

      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
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
      }).catch((err) =>
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
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockTransfer lacks a composite unique index on [id, organizationId].
      const transfer = await tx.stockTransfer.findFirst({
        where: { id: transferId, organizationId },
        include: { items: { include: { variant: true } } },
      });

      if (!transfer) throw new NotFoundException("Transfer not found");
      if (
        transfer.status !== StockTransferStatus.SHIPPED &&
        transfer.status !== StockTransferStatus.IN_TRANSIT
      ) {
        throw new BadRequestException("Transfer is not in a shippable state");
      }

      // ⚡ Bolt Optimization: Pre-index transfer items into a Map to avoid O(N*M) nested loop search
      const transferItemsMap = new Map(transfer.items.map((i) => [i.id, i]));

      // ⚡ Bolt Optimization: Consolidate ProductVariantStock upserts by unique variantId.
      // Running exactly one upsert query per unique variantId prevents database row lock contention,
      // deadlocks, and reduces transactional roundtrips from O(N) down to O(U) unique keys.
      const variantStockUpdates = new Map<
        string,
        {
          productId: string;
          totalQuantity: number;
        }
      >();

      for (const itemDto of dto.items) {
        const item = transferItemsMap.get(itemDto.transferItemId);
        if (!item) {
          throw new NotFoundException(
            `Item ${itemDto.transferItemId} not found`,
          );
        }

        const existingUpdate = variantStockUpdates.get(item.variantId);
        if (existingUpdate) {
          existingUpdate.totalQuantity += itemDto.receivedQuantity;
        } else {
          variantStockUpdates.set(item.variantId, {
            productId: item.variant.productId,
            totalQuantity: itemDto.receivedQuantity,
          });
        }
      }

      // Run upserts concurrently
      await Promise.all(
        Array.from(variantStockUpdates.entries()).map(([variantId, updateInfo]) =>
          tx.productVariantStock.upsert({
            where: {
              variantId_locationId: {
                variantId,
                locationId: transfer.toLocationId,
              },
            },
            update: {
              currentStock: { increment: updateInfo.totalQuantity },
              availableStock: { increment: updateInfo.totalQuantity },
            },
            create: {
              organizationId,
              productId: updateInfo.productId,
              variantId,
              locationId: transfer.toLocationId,
              currentStock: updateInfo.totalQuantity,
              availableStock: updateInfo.totalQuantity,
            },
          }),
        ),
      );

      // ⚡ Bolt Optimization: Create stock batches and update items concurrently using Promise.all.
      // This collapses individual sequential database roundtrips to concurrent operations.
      const itemFulfillments = await Promise.all(
        dto.items.map(async (itemDto) => {
          const item = transferItemsMap.get(itemDto.transferItemId)!;

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

          await tx.stockTransferItem.update({
            where: { id: item.id },
            data: { receivedQuantity: itemDto.receivedQuantity },
          });

          return {
            variantId: item.variantId,
            batchId: newBatch.id,
            quantity: itemDto.receivedQuantity,
          };
        }),
      );

      // ⚡ Bolt Optimization: Record movements now that productVariantStock and stockBatch are fully synchronized.
      // This ensures that the integrity check in InventoryMovementService passes perfectly.
      for (const fulfillment of itemFulfillments) {
        await this.inventoryMovementService.recordMovement(tx, {
          organizationId,
          memberId,
          variantId: fulfillment.variantId,
          stockBatchId: fulfillment.batchId,
          quantity: fulfillment.quantity,
          toLocationId: transfer.toLocationId,
          movementType: MovementType.TRANSFER,
          referenceId: transfer.id,
          referenceType: "StockTransfer",
          notes: `Received via Transfer #${transfer.transferNumber}`,
        });
      }

      const completedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: StockTransferStatus.COMPLETED,
          receivedById: memberId,
          receivedDate: new Date(),
          completedDate: new Date(),
        },
        include: { receivedBy: { include: { user: true } } },
      });

      // Emit Windmill Event
      await emitStockTransferReceived(organizationId, {
        transferId: completedTransfer.id,
        transferNumber: completedTransfer.transferNumber,
        receivedAt: completedTransfer.receivedDate!.toISOString(),
        receivedBy: completedTransfer.receivedBy?.user.name || "Unknown",
      }).catch((err) =>
        console.error("[v3 StockTransfer] Failed to emit received event:", err),
      );

      return completedTransfer;
    });
  }

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return paginate(
      this.prisma.client.stockTransfer,
      pagination,
      { organizationId },
      { requestedDate: "desc" },
      {
        select: {
          id: true,
          transferNumber: true,
          requestedDate: true,
          status: true,
          priority: true,
          fromLocation: { select: { id: true, name: true } },
          toLocation: { select: { id: true, name: true } },
          requestedBy: {
            select: {
              id: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    );
  }

  async findOne(organizationId: string, transferId: string) {
    // SECURITY (Sentinel): Using findFirst instead of findUnique because
    // StockTransfer lacks a composite unique index on [id, organizationId].
    const transfer = await this.prisma.client.stockTransfer.findFirst({
      where: { id: transferId, organizationId },
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: { include: { user: true } },
        approvedBy: { include: { user: true } },
        shippedBy: { include: { user: true } },
        receivedBy: { include: { user: true } },
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
