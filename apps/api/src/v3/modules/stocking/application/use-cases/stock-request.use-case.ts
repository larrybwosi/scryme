import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PaginationQueryDto, paginate } from "@/v3/common/utils/pagination";
import {
  StockRequestStatus,
  StockTransferStatus,
  PurchaseStatus,
} from "@repo/db";
import {
  FulfillFromTransferDto,
  FulfillFromPurchaseDto,
} from "../dto/stock-request-fulfillment.dto";

@Injectable()
export class StockRequestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, pagination: PaginationQueryDto) {
    return paginate(
      this.prisma.client.stockRequest,
      pagination,
      { organizationId },
      { requestDate: "desc" },
      {
        select: {
          id: true,
          requestNumber: true,
          requestDate: true,
          status: true,
          priority: true,
          totalEstimatedCost: true,
          toLocation: { select: { id: true, name: true } },
          fromLocation: { select: { id: true, name: true } },
          requestedBy: {
            select: {
              id: true,
              user: { select: { id: true, name: true } },
            },
          },
          _count: { select: { items: true } },
        },
      },
    );
  }

  async findOne(organizationId: string, requestId: string) {
    // SECURITY (Sentinel): Using findFirst instead of findUnique because
    // StockRequest lacks a composite unique index on [id, organizationId].
    const request = await this.prisma.client.stockRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: { include: { user: true } },
        approvedBy: { include: { user: true } },
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
        transfers: true,
        purchases: true,
      },
    });

    if (!request) throw new NotFoundException("Stock request not found");
    return request;
  }

  async approve(organizationId: string, memberId: string, requestId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockRequest lacks a composite unique index on [id, organizationId].
      const request = await tx.stockRequest.findFirst({
        where: { id: requestId, organizationId },
      });

      if (!request) throw new NotFoundException("Stock request not found");
      if (request.status !== StockRequestStatus.PENDING) {
        throw new BadRequestException("Request is not in pending status");
      }

      return tx.stockRequest.update({
        where: { id: requestId },
        data: {
          status: StockRequestStatus.APPROVED,
          approvedById: memberId,
          approvalDate: new Date(),
        },
      });
    });
  }

  async fulfillFromTransfer(
    organizationId: string,
    memberId: string,
    requestId: string,
    dto: FulfillFromTransferDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockRequest lacks a composite unique index on [id, organizationId].
      const request = await tx.stockRequest.findFirst({
        where: { id: requestId, organizationId },
        include: { items: true },
      });

      if (!request) throw new NotFoundException("Stock request not found");
      if (
        request.status !== StockRequestStatus.APPROVED &&
        request.status !== StockRequestStatus.PARTIALLY_FULFILLED
      ) {
        throw new BadRequestException(
          "Request must be approved before fulfillment",
        );
      }

      const transferNumber = `TR-REQ-${request.requestNumber}-${Date.now()}`;

      // ⚡ Bolt Optimization: Pre-index request.items by variantId to eliminate O(N * M) nested lookup inside the loop.
      const requestItemsMap = new Map(
        request.items.map((ri) => [ri.variantId, ri]),
      );

      // Create Stock Transfer
      const transfer = await tx.stockTransfer.create({
        data: {
          organizationId,
          stockRequestId: requestId,
          transferNumber,
          fromLocationId: dto.fromLocationId,
          toLocationId: request.toLocationId,
          status: StockTransferStatus.PENDING_APPROVAL,
          notes:
            dto.notes || `Fulfillment for Request ${request.requestNumber}`,
          requestedById: memberId,
          items: {
            create: dto.items.map((item) => {
              const reqItem = requestItemsMap.get(item.variantId);
              if (!reqItem)
                throw new BadRequestException(
                  `Variant ${item.variantId} not in original request`,
                );

              return {
                variantId: item.variantId,
                requestedQuantity: item.requestedQuantity,
                unitCost: reqItem.unitCostAtRequest,
              };
            }),
          },
        },
      });

      // Update allocated quantities
      for (const item of dto.items) {
        await tx.stockRequestItem.updateMany({
          where: { stockRequestId: requestId, variantId: item.variantId },
          data: {
            allocatedQuantity: { increment: item.requestedQuantity },
          },
        });
      }

      return transfer;
    });
  }

  async fulfillFromPurchase(
    organizationId: string,
    memberId: string,
    requestId: string,
    dto: FulfillFromPurchaseDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      // SECURITY (Sentinel): Using findFirst instead of findUnique because
      // StockRequest lacks a composite unique index on [id, organizationId].
      const request = await tx.stockRequest.findFirst({
        where: { id: requestId, organizationId },
        include: { items: true },
      });

      if (!request) throw new NotFoundException("Stock request not found");
      if (
        request.status !== StockRequestStatus.APPROVED &&
        request.status !== StockRequestStatus.PARTIALLY_FULFILLED
      ) {
        throw new BadRequestException(
          "Request must be approved before fulfillment",
        );
      }

      const purchaseNumber = `PO-REQ-${request.requestNumber}-${Date.now()}`;

      let subTotal = 0;
      for (const item of dto.items) {
        subTotal += Number(item.orderedQuantity) * Number(item.unitCost);
      }

      // Create Purchase Order
      const purchase = await tx.purchase.create({
        data: {
          organizationId,
          stockRequestId: requestId,
          supplierId: dto.supplierId,
          purchaseNumber,
          orderDate: new Date(),
          currency: "KES",
          subTotal,
          totalAmount: subTotal,
          status: PurchaseStatus.ORDERED,
          notes:
            dto.notes || `Fulfillment for Request ${request.requestNumber}`,
          memberId: memberId,
          items: {
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              orderedQuantity: item.orderedQuantity,
              unitCost: item.unitCost,
              totalCost: Number(item.orderedQuantity) * Number(item.unitCost),
            })),
          },
        },
      });

      // Update allocated quantities
      for (const item of dto.items) {
        await tx.stockRequestItem.updateMany({
          where: { stockRequestId: requestId, variantId: item.variantId },
          data: {
            allocatedQuantity: { increment: item.orderedQuantity },
          },
        });
      }

      return purchase;
    });
  }
}
