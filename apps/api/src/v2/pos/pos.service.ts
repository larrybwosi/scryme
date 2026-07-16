import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { type V2ApiContext } from "@repo/shared/api/v2";
import { ably } from "@repo/shared/ably";
import { createMemberToken } from "@repo/shared/api/v2";
import {
  verifyQRToken,
  getDocumentUrl,
} from "@repo/shared/api/v2";
import {
  getPosProducts,
  getPosProductsDelta,
} from "@repo/shared/api/v2";
import {
  performDeliveryDispatch,
  performReconciliation,
} from "@repo/shared/api/v2";
import { ZodError } from "zod";
import * as bcrypt from "bcryptjs";
import {
  CheckInSchema,
  CheckOutSchema,
  AdjustStockSchema,
  CreateCustomerSchema,
  DispatchDeliverySchema,
  ReconcileDeliverySchema,
  CreateStockRequestSchema,
  CreateStockTransferSchema,
  RecordPaymentSchema,
  ShiftSyncSchema,
  RegisterPettyCashSchema,
  RegisterBarcodeSchema,
} from "./pos.schema";
import { Decimal } from "decimal.js";
import { RedisService } from "@/redis/redis.service";
import { InventoryService } from "../inventory/inventory.service";
import { PosCustomerService } from "./pos-customer.service";
import { Prisma, ExpenseStatus, PettyCashTransactionType } from "@repo/db";

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);
  private readonly MAX_PIN_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_SECONDS = 900;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly inventoryService: InventoryService,
    private readonly posCustomerService: PosCustomerService,
  ) {}

  private validate<T>(schema: any, data: any): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Validation failed",
          errors: error.flatten().fieldErrors,
        });
      }
      throw new BadRequestException("Invalid request data");
    }
  }

  async checkIn(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(CheckInSchema, body);
    const { cardId, pin } = validated;
    const locationId = validated.locationId || ctx.locationId;

    if (!locationId) {
      throw new BadRequestException("Location ID is required");
    }

    const organizationId = ctx.organizationId;
    const rateLimitKey = `pin_attempts:${organizationId}:${cardId}`;
    const currentAttempts = (await this.redis.get<number>(rateLimitKey)) || 0;

    if (currentAttempts >= this.MAX_PIN_ATTEMPTS) {
      const ttl = await this.redis.ttl(rateLimitKey);
      const minutesLeft = Math.ceil(ttl / 60);
      throw new BadRequestException(
        `Account locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    const member = await this.prisma.client.member.findFirst({
      where: { cardId, organizationId },
      select: {
        id: true,
        pinHash: true,
        role: true,
        isCheckedIn: true,
        currentAttendanceLogId: true,
        organizationId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    if (!member || !member.pinHash) {
      throw new UnauthorizedException("Invalid credentials or PIN not set.");
    }

    const isPinValid = await bcrypt.compare(pin, member.pinHash);
    if (!isPinValid) {
      const newCount = await this.redis.incr(rateLimitKey);
      if (newCount === 1)
        await this.redis.expire(rateLimitKey, this.LOCKOUT_DURATION_SECONDS);
      throw new UnauthorizedException(
        `Invalid PIN. ${this.MAX_PIN_ATTEMPTS - newCount} attempts remaining.`,
      );
    }

    await this.redis.del(rateLimitKey);

    const safeClientMember = {
      id: member.id,
      role: member.role,
      user: member.user,
    };

    if (member.isCheckedIn && member.currentAttendanceLogId) {
      const token = await createMemberToken(
        member.id,
        organizationId,
        member.currentAttendanceLogId,
      );
      return { member: safeClientMember, token, restoredSession: true };
    }

    const attendanceLog = await this.prisma.client.attendanceLog.create({
      data: {
        memberId: member.id,
        organizationId: organizationId,
        checkInTime: new Date(),
        checkInLocationId: locationId,
        notes: ctx.deviceId
          ? `Checked in via device: ${ctx.deviceId}`
          : undefined,
      },
      select: { id: true },
    });

    await this.prisma.client.member.update({
      where: { id: member.id },
      data: {
        isCheckedIn: true,
        currentCheckInLocationId: locationId,
        currentAttendanceLogId: attendanceLog.id,
      },
    });

    const token = await createMemberToken(
      member.id,
      organizationId,
      attendanceLog.id,
    );

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: member.id,
        action: "POS_CHECK_IN",
        resourceType: "ATTENDANCE_LOG",
        resourceId: attendanceLog.id,
        approved: true,
        metadata: { locationId, restoredSession: false },
      },
    });

    return { member: safeClientMember, token, restoredSession: false };
  }

  async checkOut(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(CheckOutSchema, body);
    const { locationId } = validated;
    if (!ctx.memberId)
      throw new UnauthorizedException("Member authentication required.");

    const memberId = ctx.memberId;

    await this.prisma.client.$transaction(async tx => {
      const member = await tx.member.findUnique({ where: { id: memberId } });
      if (!member || !member.isCheckedIn || !member.currentAttendanceLogId) {
        throw new BadRequestException("Member is not checked in.");
      }

      const attendanceLog = await tx.attendanceLog.findUnique({
        where: { id: member.currentAttendanceLogId },
      });
      if (!attendanceLog || attendanceLog.checkOutTime)
        throw new BadRequestException("Active attendance log not found.");

      const checkOutTime = new Date();
      const durationMs =
        checkOutTime.getTime() - attendanceLog.checkInTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      await tx.attendanceLog.update({
        where: { id: attendanceLog.id },
        data: { checkOutTime, checkOutLocationId: locationId, durationMinutes },
      });

      await tx.member.update({
        where: { id: memberId },
        data: {
          isCheckedIn: false,
          currentCheckInLocationId: null,
          currentAttendanceLogId: null,
        },
      });

      await tx.actionAuditLog.create({
        data: {
          organizationId: ctx.organizationId,
          memberId: memberId,
          action: "POS_CHECK_OUT",
          resourceType: "ATTENDANCE_LOG",
          resourceId: member.currentAttendanceLogId,
          approved: true,
          metadata: { locationId },
        },
      });
    });

    return { message: "Check-out successful." };
  }

  async listLocations(ctx: V2ApiContext) {
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        locationType: true,
        address: true,
        isDefault: true,
      },
      orderBy: { name: "asc" },
    });
    return { locations };
  }

  async getProducts(ctx: V2ApiContext, query: any) {
    const locationId = ctx.locationId || query.locationId;
    if (!locationId) throw new BadRequestException("Location ID is required.");

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const search = query.search || "";
    const categoryId = query.categoryId || "all";
    const lastSync = query.lastSync;

    const result = lastSync
      ? await getPosProductsDelta({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          lastSync,
          page,
          limit,
        })
      : await getPosProducts({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          page,
          limit,
          search,
          categoryId,
        });

    return {
      success: true,
      data: {
        products: (result as any).products,
        pagination: (result as any).pagination,
      },
      meta: {
        syncTimestamp:
          (result as any).syncTimestamp ||
          (result as any).timestamp ||
          new Date().toISOString(),
      },
    };
  }

  async getIncoming(ctx: V2ApiContext, query: any) {
    const locationId = ctx.locationId || query.locationId;
    if (!locationId) throw new BadRequestException("Location ID is required.");

    const [openPurchases, incomingTransfers] = await Promise.all([
      this.prisma.client.purchase.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] },
        },
        // ⚡ Bolt: Use select instead of include to reduce database payload size and serialization overhead.
        select: {
          id: true,
          purchaseNumber: true,
          orderDate: true,
          status: true,
          supplier: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              variantId: true,
              orderedQuantity: true,
              receivedQuantity: true,
              rejectedQuantity: true,
              invoicedQuantity: true,
              unitCost: true,
              taxAmount: true,
              totalCost: true,
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.client.stockTransfer.findMany({
        where: {
          organizationId: ctx.organizationId,
          toLocationId: locationId,
          status: { in: ["SHIPPED", "IN_TRANSIT"] as any },
        },
        // ⚡ Bolt: Use select instead of include to reduce database payload size and serialization overhead.
        select: {
          id: true,
          transferNumber: true,
          requestedDate: true,
          status: true,
          fromLocation: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              variantId: true,
              requestedQuantity: true,
              shippedQuantity: true,
              receivedQuantity: true,
              unitCost: true,
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const shipments = [
      ...openPurchases.map(po => ({
        id: po.id,
        type: "PURCHASE_ORDER",
        referenceNumber: po.purchaseNumber,
        source: po.supplier?.name || "Unknown Supplier",
        date: po.orderDate,
        status: po.status,
        itemCount: po.items.length,
        items: po.items.map(i => ({
          ...i,
          variant: {
            id: i.variant.id,
            name: i.variant.name,
            sku: i.variant.sku,
          },
        })),
        receiveApiUrl: `/api/purchases/${po.id}/receive`,
      })),
      ...incomingTransfers.map(trf => ({
        id: trf.id,
        type: "STOCK_TRANSFER",
        referenceNumber: trf.transferNumber,
        source: (trf as any).fromLocation?.name || "Unknown Location",
        date: trf.requestedDate,
        status: trf.status,
        itemCount: trf.items.length,
        items: trf.items.map(i => ({
          ...i,
          variant: {
            id: i.variant.id,
            name: i.variant.name,
            sku: i.variant.sku,
          },
        })),
        receiveApiUrl: `/api/transfers/${trf.id}/receive`,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { data: shipments };
  }

  async scanTransaction(ctx: V2ApiContext, code: string) {
    const payload = verifyQRToken(code);
    if (!payload || payload.organizationId !== ctx.organizationId)
      throw new BadRequestException("Invalid or expired QR code");

    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id: payload.transactionId, organizationId: ctx.organizationId },
      /**
       * ⚡ Bolt: Performance Optimization
       * Using targeted select instead of include to fetch only required fields.
       * This removes the unused 'payments' join and reduces the database I/O
       * and network payload for 'customer' and 'items'.
       */
      select: {
        id: true,
        number: true,
        status: true,
        finalTotal: true,
        paymentStatus: true,
        createdAt: true,
        customer: { select: { name: true } },
        items: {
          select: {
            productName: true,
            sku: true,
            quantity: true,
            lineTotal: true,
          },
        },
      },
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    return {
      id: transaction.id,
      number: transaction.number,
      status: transaction.status,
      total: transaction.finalTotal,
      paymentStatus: transaction.paymentStatus,
      customerName: transaction.customer?.name || "Guest",
      itemCount: transaction.items.length,
      items: transaction.items.map(i => ({
        name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        total: i.lineTotal,
      })),
      createdAt: transaction.createdAt,
      invoiceUrl: getDocumentUrl("invoice", transaction.id, ctx.organizationId),
      waybillUrl: getDocumentUrl("waybill", transaction.id, ctx.organizationId),
    };
  }

  async ablyAuth(ctx: V2ApiContext) {
    if (!ctx.memberId || !ctx.organizationId)
      throw new UnauthorizedException("Missing context");

    const { organizationId, memberId } = ctx;
    const paymentChannel = `organization:${organizationId}:payments`;
    const notificationChannel = `organization:${organizationId}:notifications`;
    const organizationChannel = `organization:${organizationId}:*`;

    const provider = process.env.REALTIME_PROVIDER || "ably";

    let tokenRequest: any;

    if (provider === "ably") {
      tokenRequest = await ably.auth.requestToken({
        clientId: memberId,
        capability: JSON.stringify({
          "order-*": ["subscribe", "publish"],
          "cashier-notifications": ["subscribe"],
          "channel:*": ["subscribe", "publish", "history"],
          "session:*": ["subscribe", "publish", "history"],
          "system:*": ["subscribe", "publish", "history"],
          "presence:*": ["subscribe", "publish", "history", "presence"],
          "store:*": ["subscribe", "publish", "history", "presence"],
          [paymentChannel]: ["subscribe"],
          [notificationChannel]: ["subscribe"],
          [organizationChannel]: [
            "subscribe",
            "publish",
            "history",
            "presence",
          ],
        }),
        ttl: 3600 * 1000,
        timestamp: Date.now(),
      });
    } else {
      tokenRequest = {
        token: "socketio-placeholder-token",
        clientId: memberId,
      };
    }

    return {
      tokenRequest,
      provider,
      metadata: { organizationId, paymentChannel },
    };
  }

  async getInventory(ctx: V2ApiContext, query: any) {
    return this.inventoryService.getInventory(ctx, query);
  }

  async adjustStock(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(AdjustStockSchema, body);
    const result = await this.inventoryService.adjustStockAndPublish({
      organizationId: ctx.organizationId,
      ...validated,
      userId: ctx.userId || "system",
    });

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId || null,
        action: "ADJUST_STOCK",
        resourceType: "INVENTORY",
        resourceId: validated.variantId || validated.productId,
        approved: true,
        metadata: {
          ...validated,
          previousStock: result.previousStock,
          newStock: result.newStock,
        },
      },
    });

    return result;
  }

  async sync(ctx: V2ApiContext, query: any) {
    const { lastSync } = query;
    const locationId = ctx.locationId || query.locationId;

    if (!locationId) throw new BadRequestException("Location ID is required.");

    const [products, customers, categories] = await Promise.all([
      this.getProducts(ctx, { ...query, locationId }),
      this.getCustomersDelta(ctx, lastSync),
      this.prisma.client.category.findMany({
        where: { organizationId: ctx.organizationId },
        select: { id: true, name: true, description: true },
      }),
    ]);

    return {
      products,
      customers,
      categories,
      timestamp: new Date(),
    };
  }

  async getTransactions(ctx: V2ApiContext, query: any) {
    const { organizationId, memberId, locationId } = ctx;
    const { status, type, customerId, startDate, endDate } = query;

    const where: any = { organizationId };

    // Contextual filtering
    if (locationId) where.locationId = locationId;
    if (memberId && !ctx.permissions.includes("*")) {
      where.memberId = memberId;
    }

    if (status) where.status = status;
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      this.prisma.client.transaction.count({ where }),
      this.prisma.client.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        // ⚡ Bolt: Use select instead of include to reduce payload size and speed up serialization.
        // All fields required for the response shaping below are explicitly selected.
        select: {
          id: true,
          number: true,
          finalTotal: true,
          createdAt: true,
          paymentStatus: true,
          customer: { select: { name: true, email: true } },
          payments: { select: { amount: true } },
          fulfillments: { select: { id: true } },
          items: {
            select: {
              id: true,
              productName: true,
              variantId: true,
              sku: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              variant: { select: { productId: true } },
            },
          },
        },
      }),
    ]);

    const formattedTransactions = transactions.map(t => {
      const paidAmount = (t as any).payments
        .reduce((sum: Decimal, p: any) => sum.plus(p.amount), new Decimal(0))
        .toNumber();
      const status =
        (t as any).fulfillments?.length > 0
          ? "dispatched"
          : t.paymentStatus.toLowerCase();

      return {
        id: t.id,
        number: t.number,
        customer: (t as any).customer?.name || "Guest",
        email: (t as any).customer?.email || "",
        totalAmount: t.finalTotal.toNumber(),
        paidAmount,
        date: t.createdAt.toISOString(),
        status,
        fulfillmentId: (t as any).fulfillments?.[0]?.id || null,
        invoiceLink: getDocumentUrl("invoice", t.id, ctx.organizationId),
        items: (t as any).items.map((i: any) => ({
          id: i.id,
          productId: i.variant.productId,
          productName: i.productName,
          variantId: i.variantId,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toNumber(),
          totalPrice: i.lineTotal.toNumber(),
        })),
      };
    });

    if (query.page || query.limit) {
      return {
        data: formattedTransactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return formattedTransactions;
  }

  async getCustomersDelta(ctx: V2ApiContext, lastSync?: string) {
    const result = await this.posCustomerService.getCustomersDelta(
      ctx.organizationId,
      lastSync,
    );
    return result;
  }

  async createCustomer(ctx: V2ApiContext, body: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const validated = this.validate<any>(CreateCustomerSchema, body);
    return this.posCustomerService.createPosCustomer(
      ctx.organizationId,
      validated,
      ctx.memberId,
    );
  }

  async dispatchDelivery(ctx: V2ApiContext, transactionId: string, body: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const validated = this.validate<any>(DispatchDeliverySchema, body);
    const result = await performDeliveryDispatch(this.prisma.client, {
      transactionId,
      organizationId: ctx.organizationId,
      memberId: ctx.memberId,
      ...validated,
    });

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId,
        action: "DISPATCH_DELIVERY",
        resourceType: "TRANSACTION",
        resourceId: transactionId,
        approved: true,
        metadata: validated,
      },
    });

    return result;
  }

  async reconcileDelivery(ctx: V2ApiContext, body: any, _file?: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const validated = this.validate<any>(ReconcileDeliverySchema, body);
    const result = await performReconciliation(this.prisma.client, {
      fulfilmentId: validated.fulfilmentId,
      organizationId: ctx.organizationId,
      reconciledBy: ctx.memberId,
      outcome: validated.outcome === "SUCCESS" ? "DELIVERED" : "FAILED",
      proofUrl: validated.proofImage,
      receivedBy: validated.receivedBy,
      failureReason: validated.failureReason,
    });

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId,
        action: "RECONCILE_DELIVERY",
        resourceType: "FULFILMENT",
        resourceId: validated.fulfilmentId,
        approved: true,
        metadata: validated,
      },
    });

    return result;
  }

  async listStockRequests(ctx: V2ApiContext) {
    const locationId = ctx.locationId;
    if (!locationId) throw new BadRequestException("Location ID required");

    const requests = await this.prisma.client.stockRequest.findMany({
      where: {
        organizationId: ctx.organizationId,
        OR: [{ fromLocationId: locationId }, { toLocationId: locationId }],
      },
      // ⚡ Bolt: Use select instead of include to reduce database payload size and serialization overhead.
      select: {
        id: true,
        requestNumber: true,
        status: true,
        priority: true,
        requestDate: true,
        justification: true,
        totalEstimatedCost: true,
        fromLocation: { select: { id: true, name: true } },
        toLocation: { select: { id: true, name: true } },
        requestedBy: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        items: {
          select: {
            id: true,
            variantId: true,
            requestedQuantity: true,
            reason: true,
            unitCostAtRequest: true,
            allocatedQuantity: true,
            fulfilledQuantity: true,
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { requestDate: "desc" },
    });

    return { data: requests };
  }

  async createStockRequest(ctx: V2ApiContext, body: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const locationId = ctx.locationId;
    if (!locationId) throw new BadRequestException("Location ID required");

    const validated = this.validate<any>(CreateStockRequestSchema, body);

    const variantIds = validated.items.map((i: any) => i.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { organizationId: ctx.organizationId },
      },
    });

    let totalEstimatedCost = new Decimal(0);
    const itemsToCreate = validated.items.map((item: any) => {
      const variant = variants.find(v => v.id === item.variantId);
      if (!variant)
        throw new BadRequestException(`Variant ${item.variantId} not found`);
      const itemCost = new Decimal(
        variant.buyingPrice ? Number(variant.buyingPrice) : 0,
      ).times(item.requestedQuantity);
      totalEstimatedCost = totalEstimatedCost.plus(itemCost);
      return {
        variantId: item.variantId,
        requestedQuantity: item.requestedQuantity,
        reason: item.reason,
        unitCostAtRequest: variant.buyingPrice || 0,
      };
    });

    // Concurrency-safe request number generation with retries
    let request: any;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const lastRequest = await this.prisma.client.stockRequest.findFirst({
          where: { organizationId: ctx.organizationId },
          orderBy: { requestDate: "desc" },
          select: { requestNumber: true },
        });

        const lastNumber = lastRequest?.requestNumber
          ? parseInt(lastRequest.requestNumber.replace("SR-", ""), 10)
          : 0;
        const requestNumber = `SR-${(lastNumber + 1).toString().padStart(5, "0")}`;

        request = await this.prisma.client.stockRequest.create({
          data: {
            organizationId: ctx.organizationId,
            requestNumber,
            fromLocationId: locationId,
            toLocationId: validated.toLocationId,
            priority: validated.priority,
            justification: validated.justification,
            requestedById: ctx.memberId,
            totalEstimatedCost,
            items: { create: itemsToCreate },
          },
        });
        break; // Success
      } catch (error) {
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("requestNumber")
        ) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new InternalServerErrorException(
              "Failed to generate a unique stock request number after multiple attempts.",
            );
          }
          continue; // Retry
        }
        throw error;
      }
    }

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId,
        action: "CREATE_STOCK_REQUEST",
        resourceType: "STOCK_REQUEST",
        resourceId: request.id,
        approved: true,
        metadata: {
          priority: validated.priority,
          itemCount: itemsToCreate.length,
        },
      },
    });

    return { success: true, data: request };
  }

  async cancelStockRequest(ctx: V2ApiContext, id: string) {
    const isAdmin = ctx.permissions.includes("*");
    if (!ctx.memberId && !isAdmin)
      throw new UnauthorizedException("Member required");

    const request = await this.prisma.client.stockRequest.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!request) throw new NotFoundException("Stock request not found");

    // Authorization check: Only the requesting location can cancel
    if (request.fromLocationId !== ctx.locationId && !isAdmin) {
      throw new UnauthorizedException(
        "You do not have permission to cancel this stock request",
      );
    }

    if (request.status !== "PENDING")
      throw new BadRequestException("Only pending requests can be cancelled");

    await this.prisma.client.stockRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId || null,
        action: "CANCEL_STOCK_REQUEST",
        resourceType: "STOCK_REQUEST",
        resourceId: id,
        approved: true,
      },
    });

    return { success: true };
  }

  async recordPayment(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(RecordPaymentSchema, body);
    const {
      transactionId,
      amount,
      method,
      referenceNumber: reference,
      payerPhone,
    } = validated;

    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id: transactionId, organizationId: ctx.organizationId },
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    const payment = await this.prisma.client.payment.create({
      data: {
        organizationId: ctx.organizationId,
        transactionId,
        amount: new Decimal(amount),
        method,
        referenceNumber: reference,
        payerPhone,
        status: "PAID" as any,
        processedAt: new Date(),
      },
    });

    // Update transaction payment status if necessary
    const allPayments = await this.prisma.client.payment.findMany({
      where: { transactionId },
    });

    const totalPaid = allPayments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Decimal(0),
    );

    if (totalPaid.gte(transaction.finalTotal)) {
      await this.prisma.client.transaction.update({
        where: { id: transactionId },
        data: { paymentStatus: "PAID" },
      });
    } else if (totalPaid.gt(0)) {
      await this.prisma.client.transaction.update({
        where: { id: transactionId },
        data: { paymentStatus: "PARTIALLY_PAID" },
      });
    }

    return payment;
  }

  async getPricing(ctx: V2ApiContext, lastSync?: string) {
    const lastSyncDate = lastSync ? new Date(lastSync) : undefined;

    const where: Prisma.PriceListWhereInput = {
      organizationId: ctx.organizationId,
      isActive: true,
    };

    if (lastSyncDate) {
      where.updatedAt = { gt: lastSyncDate };
    }

    const priceLists = await this.prisma.client.priceList.findMany({
      where,
      // ⚡ Bolt: Use select instead of include to fetch only essential scalar fields and relations.
      // This reduces database payload size and serialization overhead.
      select: {
        id: true,
        code: true,
        priority: true,
        isGlobal: true,
        isActive: true,
        validFrom: true,
        validTo: true,
        updatedAt: true,
        items: {
          where: lastSyncDate ? { updatedAt: { gt: lastSyncDate } } : undefined,
          select: {
            id: true,
            priceListId: true,
            variantId: true,
            sellingUnitId: true,
            minQuantity: true,
            price: true,
            updatedAt: true,
          },
        },
        customers: { select: { id: true } },
        businessAccounts: { select: { id: true } },
      },
    });

    const items = priceLists.flatMap(pl =>
      pl.items.map(item => ({
        id: item.id,
        priceListId: item.priceListId,
        variantId: item.variantId,
        sellingUnitId: item.sellingUnitId,
        minQuantity: item.minQuantity,
        price: item.price.toString(),
        updatedAt: item.updatedAt,
      })),
    );

    const lists = priceLists.map(pl => ({
      id: pl.id,
      code: pl.code,
      priority: pl.priority,
      isGlobal: pl.isGlobal,
      isActive: pl.isActive,
      validFrom: pl.validFrom,
      validTo: pl.validTo,
      updatedAt: pl.updatedAt,
    }));

    const customerAllocations: Record<string, string[]> = {};
    priceLists.forEach(pl => {
      (pl as any).customers.forEach((cust: any) => {
        if (!customerAllocations[cust.id]) {
          customerAllocations[cust.id] = [];
        }
        customerAllocations[cust.id].push(pl.id);
      });
      (pl as any).businessAccounts.forEach((ba: any) => {
        if (!customerAllocations[ba.id]) {
          customerAllocations[ba.id] = [];
        }
        customerAllocations[ba.id].push(pl.id);
      });
    });

    return {
      success: true,
      data: {
        metadata: {
          syncedAt: new Date().toISOString(),
          isDelta: !!lastSync,
        },
        data: {
          lists,
          items,
          customerAllocations,
          deletedItemIds: [], // Would need a soft-delete mechanism to track this properly
        },
      },
    };
  }

  async syncShifts(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(ShiftSyncSchema, body);

    // In a real implementation, you might want to save this to an Actual Shifts table
    // For now, we'll just log it and audit it.
    this.logger.log(
      `Syncing shift ${validated.shift_id} for location ${validated.location_id}`,
    );

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId || null,
        action: "SHIFT_SYNC",
        resourceType: "SHIFT",
        resourceId: validated.shift_id,
        approved: true,
        metadata: validated,
      },
    });

    return { success: true };
  }

  async getWaybill(ctx: V2ApiContext, id: string) {
    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!transaction) throw new NotFoundException("Transaction not found");

    return {
      url: getDocumentUrl("waybill", id, ctx.organizationId),
    };
  }

  async receivePurchase(ctx: V2ApiContext, id: string, body: any) {
    // This would typically involve updating purchase order status and inventory
    this.logger.log(`Receiving purchase ${id} for location ${ctx.locationId}`);
    return { success: true };
  }

  async receiveTransfer(ctx: V2ApiContext, id: string, body: any) {
    // This would typically involve updating stock transfer status and inventory
    this.logger.log(`Receiving transfer ${id} for location ${ctx.locationId}`);
    return { success: true };
  }

  async getDrivers(ctx: V2ApiContext) {
    const drivers = await this.prisma.client.member.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        // Assuming drivers have a specific role or tag, or just return all active members for now
        // adjust based on actual schema if needed
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return drivers.map(d => ({
      id: d.id,
      member: {
        name: d.user?.name || "Unknown Driver",
      },
    }));
  }

  async createStockTransfer(ctx: V2ApiContext, body: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const validated = this.validate<any>(CreateStockTransferSchema, body);

    // Concurrency-safe transfer number generation
    let transfer: any;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const lastTransfer = await this.prisma.client.stockTransfer.findFirst({
          where: { organizationId: ctx.organizationId },
          orderBy: { requestedDate: "desc" },
          select: { transferNumber: true },
        });

        const lastNumber = lastTransfer?.transferNumber
          ? parseInt(lastTransfer.transferNumber.replace("ST-", ""), 10)
          : 0;
        const transferNumber = `ST-${(lastNumber + 1).toString().padStart(5, "0")}`;

        transfer = await this.prisma.client.stockTransfer.create({
          data: {
            organizationId: ctx.organizationId,
            transferNumber,
            fromLocationId: validated.fromLocationId,
            toLocationId: validated.toLocationId,
            requestedById: ctx.memberId,
            status: "PENDING_APPROVAL",
            notes: validated.notes,
            items: {
              create: validated.items.map((item: any) => ({
                variantId: item.variantId,
                requestedQuantity: item.quantity,
              })),
            },
          },
        });
        break;
      } catch (error) {
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("transferNumber")
        ) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId,
        action: "CREATE_STOCK_TRANSFER",
        resourceType: "STOCK_TRANSFER",
        resourceId: transfer.id,
        approved: true,
        metadata: {
          fromLocationId: validated.fromLocationId,
          toLocationId: validated.toLocationId,
          itemCount: validated.items.length,
        },
      },
    });

    return { success: true, data: transfer };
  }

  async registerPettyCash(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(RegisterPettyCashSchema, body);
    const { organizationId, memberId, locationId } = ctx;

    // 1. Ensure "Petty Cash" category exists
    let category = await this.prisma.client.expenseCategory.findFirst({
      where: {
        organizationId,
        name: { equals: "Petty Cash", mode: "insensitive" },
      },
    });

    if (!category) {
      category = await this.prisma.client.expenseCategory.create({
        data: {
          name: "Petty Cash",
          organizationId,
          isActive: true,
        },
      });
    }

    // 2. Identify the petty cash fund
    let fundId = validated.pettyCashFundId;
    if (!fundId) {
      let fund = null;
      if (locationId) {
        fund = await this.prisma.client.pettyCashFund.findFirst({
          where: { organizationId, locationId, isActive: true },
        });
      }

      if (!fund) {
        fund = await this.prisma.client.pettyCashFund.findFirst({
          where: { organizationId, isActive: true },
        });
      }
      fundId = fund?.id;
    }

    if (!fundId) {
      throw new NotFoundException("No active petty cash fund found.");
    }

    // 3. Determine status and create expense
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        expenseApprovalThreshold: true,
        expenseReceiptThreshold: true,
        pettyCashAutoApproveThreshold: true,
      },
    });

    if (!org) throw new NotFoundException("Organization not found");

    const amountDecimal = new Prisma.Decimal(validated.amount);

    if (
      org.expenseReceiptThreshold &&
      amountDecimal.gte(new Prisma.Decimal(org.expenseReceiptThreshold.toString())) &&
      !validated.receiptUrl
    ) {
      throw new BadRequestException(
        `Receipt is required for expenses above ${org.expenseReceiptThreshold}`,
      );
    }

    let status: ExpenseStatus = ExpenseStatus.APPROVED;
    if (org.pettyCashAutoApproveThreshold) {
      if (
        amountDecimal.gt(
          new Prisma.Decimal(org.pettyCashAutoApproveThreshold.toString()),
        )
      ) {
        status = ExpenseStatus.PENDING;
      }
    } else if (
      org.expenseApprovalThreshold &&
      amountDecimal.gte(
        new Prisma.Decimal(org.expenseApprovalThreshold.toString()),
      )
    ) {
      status = ExpenseStatus.PENDING;
    }

    const count = await this.prisma.client.expense.count({
      where: { organizationId },
    });
    const expenseNumber = `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;

    return await this.prisma.client.$transaction(async tx => {
      const expense = await tx.expense.create({
        data: {
          description: validated.description,
          amount: amountDecimal,
          expenseNumber,
          status,
          memberId: memberId || "system",
          organizationId,
          categoryId: category.id,
          expenseDate: new Date(),
          locationId: locationId || undefined,
          pettyCashFundId: fundId,
          receiptUrl: validated.receiptUrl,
          ...(status === ExpenseStatus.APPROVED
            ? {
                approverId: memberId || "system",
                approvalDate: new Date(),
              }
            : {}),
        } as any,
      });

      if (status === ExpenseStatus.APPROVED) {
        const fund = await tx.pettyCashFund.findFirst({
          where: { id: fundId, organizationId },
        });
        if (!fund) throw new NotFoundException("Petty cash fund not found");
        if (fund.amount.lessThan(amountDecimal))
          throw new BadRequestException("Insufficient funds in petty cash");

        await tx.pettyCashFund.update({
          where: { id: fundId },
          data: { amount: { decrement: amountDecimal } },
        });

        await tx.pettyCashTransaction.create({
          data: {
            fundId,
            type: PettyCashTransactionType.EXPENSE,
            amount: amountDecimal,
            description: validated.description,
            memberId: memberId || "system",
          },
        });
      }

      return expense;
    });
  }

  async getPettyCashFunds(ctx: V2ApiContext) {
    const { organizationId, locationId } = ctx;

    let funds = [];
    if (locationId) {
      funds = await this.prisma.client.pettyCashFund.findMany({
        where: { organizationId, locationId, isActive: true },
      });
    }

    if (funds.length === 0) {
      funds = await this.prisma.client.pettyCashFund.findMany({
        where: { organizationId, isActive: true },
      });
    }

    return funds;
  }

  async getPettyCashTransactions(ctx: V2ApiContext, limit = 10) {
    const { organizationId, locationId } = ctx;

    const where: any = {
      fund: { organizationId },
    };

    if (locationId) {
      where.fund.locationId = locationId;
    }

    return this.prisma.client.pettyCashTransaction.findMany({
      where,
      include: {
        member: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async registerBarcode(ctx: V2ApiContext, body: any) {
    const validated = this.validate<any>(RegisterBarcodeSchema, body);
    const { variantId, barcode } = validated;

    // Check if variant exists and belongs to the organization
    const variant = await this.prisma.client.productVariant.findFirst({
      where: {
        id: variantId,
        product: { organizationId: ctx.organizationId },
      },
    });

    if (!variant) {
      throw new NotFoundException("Product variant not found");
    }

    // Check if barcode is already used by another variant in the same organization
    const existing = await this.prisma.client.productVariant.findFirst({
      where: {
        barcode,
        product: { organizationId: ctx.organizationId },
        id: { not: variantId },
      },
    });

    if (existing) {
      throw new BadRequestException("Barcode is already in use by another product");
    }

    const updated = await this.prisma.client.productVariant.update({
      where: { id: variantId },
      data: { barcode },
    });

    await this.prisma.client.actionAuditLog.create({
      data: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId || null,
        action: "REGISTER_BARCODE",
        resourceType: "PRODUCT_VARIANT",
        resourceId: variantId,
        approved: true,
        metadata: { barcode },
      },
    });

    return updated;
  }
}
