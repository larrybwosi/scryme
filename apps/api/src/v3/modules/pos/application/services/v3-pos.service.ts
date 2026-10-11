import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V3ApiContext } from "@repo/shared/api/v3";
import { createMemberToken } from "@repo/shared/api/v3";
import { verifyQRToken, getDocumentUrl } from "@repo/shared/api/v3";
import { getPosProducts } from "@repo/shared/api/v3";
import {
  performDeliveryDispatch,
  performReconciliation,
} from "@repo/shared/api/v3";
import { ZodError } from "zod";
import * as bcrypt from "bcryptjs";
import {
  CheckInSchema,
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
} from "../dto/pos.schema";
import { Decimal } from "decimal.js";
import { RedisService } from "@/redis/redis.service";
import { V3PosCustomerService } from "./v3-pos-customer.service";
import { Prisma, ExpenseStatus, PettyCashTransactionType } from "@repo/db";

@Injectable()
export class V3PosService {
  private readonly logger = new Logger(V3PosService.name);
  private readonly MAX_PIN_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_SECONDS = 900;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly posCustomerService: V3PosCustomerService,
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
      throw error;
    }
  }

  async checkOut(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(CheckInSchema, body);
    const { cardId, pin, locationId: reqLocationId } = validated;
    const locationId = ctx.locationId || reqLocationId;

    if (!locationId) {
      throw new BadRequestException("Location context is required.");
    }

    const member = await this.prisma.client.member.findFirst({
      where: {
        organizationId: ctx.organizationId,
        cardId,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException("Invalid card ID or PIN.");
    }

    const lockoutKey = `pin_lockout:${ctx.organizationId}:${cardId}`;
    const attemptsKey = `pin_attempts:${ctx.organizationId}:${cardId}`;

    const isLockedOut = await this.redis.get(lockoutKey);
    if (isLockedOut) {
      throw new UnauthorizedException(
        "Account is temporarily locked due to multiple failed PIN attempts. Please try again in 15 minutes.",
      );
    }

    if (!member.pinHash) {
      throw new UnauthorizedException("PIN is not set for this staff member.");
    }

    const isPinValid = await bcrypt.compare(pin, member.pinHash);
    if (!isPinValid) {
      const attempts = await this.redis.incr(attemptsKey);
      if (attempts === 1) {
        await this.redis.expire(attemptsKey, this.LOCKOUT_DURATION_SECONDS);
      }

      if (attempts >= this.MAX_PIN_ATTEMPTS) {
        await this.redis.set(lockoutKey, "locked", this.LOCKOUT_DURATION_SECONDS);
        await this.redis.del(attemptsKey);
        throw new UnauthorizedException(
          "Account is locked due to 3 consecutive failed PIN attempts. Please try again in 15 minutes.",
        );
      }

      const remaining = this.MAX_PIN_ATTEMPTS - attempts;
      throw new UnauthorizedException(
        `Invalid PIN. You have ${remaining} attempt(s) remaining before temporary lockout.`,
      );
    }

    await this.redis.del(attemptsKey);

    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: {
        organizationId: ctx.organizationId,
        memberId: member.id,
        checkOutTime: null,
      },
      orderBy: { checkInTime: "desc" },
    });

    let attendanceLogId = activeLog?.id;

    if (!activeLog) {
      const newLog = await this.prisma.client.attendanceLog.create({
        data: {
          organizationId: ctx.organizationId,
          memberId: member.id,
          checkInLocationId: locationId,
          checkInTime: new Date(),

        },
      });
      attendanceLogId = newLog.id;
    }

    const token = await createMemberToken(
      member.id,
      ctx.organizationId,
      attendanceLogId || "",
    );

    return {
      token,
      member: {
        id: member.id,
        name: member.user?.name || "Staff Member",
        email: member.user?.email || "",
        role: member.role,
        cardId: member.cardId,
      },
      attendanceLogId,
    };
  }

  async getAttendanceStatus(ctx: V3ApiContext) {
    if (!ctx.memberId) {
      return { clockedIn: false };
    }

    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: {
        organizationId: ctx.organizationId,
        memberId: ctx.memberId,
        checkOutTime: null,
      },
      orderBy: { checkInTime: "desc" },
    });

    return {
      clockedIn: !!activeLog,
      attendanceLogId: activeLog?.id || null,
      clockInTime: activeLog?.checkInTime || null,
    };
  }

  async recordPayment(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(RecordPaymentSchema, body);
    const targetId = (validated.transactionId || validated.saleId) as string;

    const transaction = await this.prisma.client.transaction.findFirst({
      where: {
        id: targetId,
        organizationId: ctx.organizationId,
      },
      include: { payments: true },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction/Sale not found.");
    }

    const amountDecimal = new Prisma.Decimal(validated.amount);

    const existingTotalPaid = transaction.payments.reduce(
      (sum, p) => (p.status === "PAID" ? sum.plus(p.amount) : sum),
      new Prisma.Decimal(0),
    );

    const newTotalPaid = existingTotalPaid.plus(amountDecimal);
    const finalTotal = transaction.finalTotal;

    let paymentStatus = transaction.paymentStatus;
    if (newTotalPaid.gte(finalTotal)) {
      paymentStatus = "PAID" as any;
    } else if (newTotalPaid.gt(0)) {
      paymentStatus = "PARTIALLY_PAID" as any;
    }

    const payment = await this.prisma.client.payment.create({
      data: {
        transactionId: transaction.id,
        amount: amountDecimal,
        method: validated.method,
        status: "PAID",
        referenceNumber: validated.reference || validated.referenceNumber,
        notes: validated.notes,
        payerPhone: validated.payerPhone,

      },
    });

    let txnStatus = transaction.status;
    if (paymentStatus === "PAID" && transaction.status === "PREORDER") {
      txnStatus = "COMPLETED" as any;
    }

    await this.prisma.client.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus,
        status: txnStatus,
      },
    });

    return {
      success: true,
      payment,
      transactionStatus: txnStatus,
      paymentStatus,
      totalPaid: newTotalPaid.toNumber(),
      remainingBalance: Decimal.max(0, finalTotal.minus(newTotalPaid)).toNumber(),
    };
  }

  async getIncoming(ctx: V3ApiContext, query: any) {
    const { locationId } = ctx;
    if (!locationId) throw new BadRequestException("Location ID required");

    const pendingTransfers = await this.prisma.client.stockTransfer.findMany({
      where: {
        organizationId: ctx.organizationId,
        toLocationId: locationId,
        status: { in: ["APPROVED", "IN_TRANSIT"] },
      },
      include: {
        fromLocation: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    return { transfers: pendingTransfers };
  }

  async scanTransaction(ctx: V3ApiContext, code: string) {
    if (code.startsWith("ey")) {
      const payload = verifyQRToken(code);
      if (!payload || payload.organizationId !== ctx.organizationId) {
        throw new BadRequestException("Invalid or expired QR token.");
      }
      code = payload.transactionId;
    }

    const transaction = await this.prisma.client.transaction.findFirst({
      where: {
        id: code,
        organizationId: ctx.organizationId,
      },
      include: {
        customer: true,
        businessAccount: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
        fulfillments: true,
      },
    });

    if (!transaction) throw new NotFoundException("Transaction not found.");
    return transaction;
  }

  async ablyAuth(ctx: V3ApiContext) {
    return { token: "placeholder_v3_realtime_token" };
  }

  async getInventory(ctx: V3ApiContext, query: any) {
    const { locationId } = ctx;
    if (!locationId) throw new BadRequestException("Location ID required");

    return getPosProducts({
      prisma: this.prisma.client,
      organizationId: ctx.organizationId,
      locationId,
    });
  }

  async adjustStock(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(AdjustStockSchema, body);
    const { productId, variantId, locationId, quantity, reason, notes } = validated;

    return this.prisma.client.$transaction(async (tx) => {
      const stockRecord = await tx.productVariantStock.findFirst({
        where: {
          variantId: variantId || undefined,
          locationId,
          organizationId: ctx.organizationId,
        },
      });

      const previousStock = stockRecord ? Number(stockRecord.availableStock) : 0;
      const newStock = previousStock + quantity;

      if (stockRecord) {
        await tx.productVariantStock.update({
          where: { id: stockRecord.id },
          data: {
            availableStock: { increment: quantity },
            currentStock: { increment: quantity },
          },
        });
      } else {
        if (!variantId) throw new Error("variantId is required to adjust stock");

        await tx.productVariantStock.create({
          data: {
            organization: { connect: { id: ctx.organizationId } },
            product: { connect: { id: productId } },
            variant: { connect: { id: variantId } },
            location: { connect: { id: locationId } },
            availableStock: quantity,
            currentStock: quantity,
          },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          organizationId: ctx.organizationId,
          variantId,
          fromLocationId: quantity < 0 ? locationId : null,
          toLocationId: quantity > 0 ? locationId : null,
          quantity: Math.abs(quantity),
          movementType: reason.toUpperCase(),
          notes,
          memberId: ctx.memberId || undefined,
        },
      });

      return {
        previousStock,
        newStock,
        adjustment: quantity,
        logId: movement.id,
        productId,
        variantId,
        locationId,
      };
    });
  }

  async createCustomer(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(CreateCustomerSchema, body);
    return this.posCustomerService.createPosCustomer(
      ctx.organizationId,
      validated,
      ctx.memberId || "api",
    );
  }

  async dispatchDelivery(ctx: V3ApiContext, transactionId: string, body: any) {
    const validated = this.validate<any>(DispatchDeliverySchema, body);
    return performDeliveryDispatch(
      this.prisma.client,
      {
        organizationId: ctx.organizationId,
        transactionId,
        ...validated,
        memberId: ctx.memberId,
      } as any,
    );
  }

  async reconcileDelivery(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(ReconcileDeliverySchema, body);
    return performReconciliation(
      this.prisma.client,
      {
        organizationId: ctx.organizationId,
        ...validated,
        memberId: ctx.memberId,
      } as any,
    );
  }

  async listStockRequests(ctx: V3ApiContext) {
    const requests = await this.prisma.client.stockRequest.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        fromLocation: true,
        toLocation: true,
        items: { include: { variant: true } },
      },
      orderBy: { requestDate: "desc" },
      take: 50,
    });
    return { data: requests };
  }

  async createStockRequest(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(CreateStockRequestSchema, body);
    const count = await this.prisma.client.stockRequest.count({
      where: { organizationId: ctx.organizationId },
    });
    const requestNumber = `SR-${(count + 1).toString().padStart(5, "0")}`;

    const request = await this.prisma.client.stockRequest.create({
      data: {
        organizationId: ctx.organizationId,
        requestNumber,
        toLocationId: validated.toLocationId || ctx.locationId,
        priority: validated.priority,
        justification: validated.justification,
        requestedById: ctx.memberId || "api",
        items: {
          create: validated.items.map((i: any) => ({
            variantId: i.variantId,
            requestedQuantity: i.requestedQuantity,
            reason: i.reason,
          })),
        },
      } as any,
      include: { items: true },
    });

    return { success: true, data: request };
  }

  async cancelStockRequest(ctx: V3ApiContext, id: string) {
    const result = await this.prisma.client.stockRequest.updateMany({
      where: { id, organizationId: ctx.organizationId, status: "PENDING" },
      data: { status: "CANCELLED" as any },
    });

    if (result.count === 0) {
      throw new NotFoundException("Stock request not found or cannot be cancelled");
    }

    return { success: true };
  }

  async getPricing(ctx: V3ApiContext, lastSync?: string) {
    const priceLists = await this.prisma.client.priceList.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        ...(lastSync ? { updatedAt: { gt: new Date(lastSync) } } : {}),
      },
      include: {
        items: true,
      },
    });
    return { priceLists, timestamp: new Date() };
  }

  async syncShifts(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(ShiftSyncSchema, body);
    return { success: true, shiftId: validated.shift_id };
  }

  async getWaybill(ctx: V3ApiContext, id: string) {
    return { url: getDocumentUrl("waybill", id, ctx.organizationId) };
  }

  async getPackingList(ctx: V3ApiContext, id: string) {
    return { url: getDocumentUrl("packing-list", id, ctx.organizationId) };
  }

  async receivePurchase(ctx: V3ApiContext, id: string, body: any) {
    return { success: true, purchaseId: id };
  }

  async receiveTransfer(ctx: V3ApiContext, id: string, body: any) {
    const result = await this.prisma.client.stockTransfer.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data: { status: "RECEIVED" as any, receivedDate: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException("Stock transfer not found");
    }

    return { success: true, transferId: id };
  }

  async getDrivers(ctx: V3ApiContext) {
    const drivers = await this.prisma.client.member.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        user: { select: { name: true } },
      },
    });

    return drivers.map((d) => ({
      id: d.id,
      member: { name: d.user?.name || "Unknown Driver" },
    }));
  }

  async createStockTransfer(ctx: V3ApiContext, body: any) {
    if (!ctx.memberId) throw new UnauthorizedException("Member required");
    const validated = this.validate<any>(CreateStockTransferSchema, body);

    if (validated.fromLocationId === validated.toLocationId) {
      throw new BadRequestException("Source and destination locations cannot be the same");
    }

    const variantIds = validated.items.map((i: any) => i.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { organizationId: ctx.organizationId },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const itemsToCreate = validated.items.map((item: any) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new BadRequestException(`Variant ${item.variantId} not found`);
      return {
        variantId: item.variantId,
        requestedQuantity: item.quantity,
        unitCost: variant.buyingPrice || 0,
      };
    });

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
            items: { create: itemsToCreate },
          },
        });
        break;
      } catch (error: any) {
        if (error.code === "P2002" && error.meta?.target?.includes("transferNumber")) {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    return { success: true, data: transfer };
  }

  async registerPettyCash(ctx: V3ApiContext, body: any) {
    const { organizationId, memberId, locationId } = ctx;

    if (!memberId) {
      throw new UnauthorizedException(
        "Member authentication required to register petty cash.",
      );
    }

    const validated = this.validate<any>(RegisterPettyCashSchema, body);

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
      amountDecimal.gte(
        new Prisma.Decimal(org.expenseReceiptThreshold.toString()),
      ) &&
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

    return await this.prisma.client.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description: validated.description,
          amount: amountDecimal,
          expenseNumber,
          status,
          memberId: memberId,
          organizationId,
          categoryId: category.id,
          expenseDate: new Date(),
          locationId: locationId || undefined,
          pettyCashFundId: fundId,
          receiptUrl: validated.receiptUrl,
          ...(status === ExpenseStatus.APPROVED
            ? {
                approverId: memberId,
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
            memberId: memberId,
          },
        });
      }

      return expense;
    });
  }

  async getPettyCashFunds(ctx: V3ApiContext) {
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

  async getPettyCashTransactions(ctx: V3ApiContext, limit = 10) {
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

  async registerBarcode(ctx: V3ApiContext, body: any) {
    const validated = this.validate<any>(RegisterBarcodeSchema, body);
    const { variantId, barcode } = validated;

    const variant = await this.prisma.client.productVariant.findFirst({
      where: {
        id: variantId,
        product: { organizationId: ctx.organizationId },
      },
    });

    if (!variant) {
      throw new NotFoundException("Product variant not found");
    }

    const existing = await this.prisma.client.productVariant.findFirst({
      where: {
        barcode,
        product: { organizationId: ctx.organizationId },
        id: { not: variantId },
      },
    });

    if (existing) {
      throw new BadRequestException(
        "Barcode is already in use by another product",
      );
    }

    const updated = await this.prisma.client.productVariant.update({
      where: { id: variantId },
      data: { barcode },
    });

    return updated;
  }
}

export { V3PosService as PosService };
