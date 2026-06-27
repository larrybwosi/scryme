import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { VoucherStatus } from "@repo/db";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";

@Injectable()
export class ProcessSaleUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => InvoiceUseCase))
    private readonly invoiceUseCase: InvoiceUseCase,
  ) {}

  async execute(ctx: any, dto: any) {
    const { organizationId: orgId, memberId: mId, locationId: locId } = ctx;
    if (!mId || !locId) {
      throw new UnauthorizedException("Member session required for POS sales");
    }

    return await this.prisma.client.$transaction(async (tx: any) => {
      const variants = await this.getV(tx, dto.items);
      const items = this.prepI(dto.items, variants, orgId);
      const sub = items.reduce((s: number, i: any) => s + i.lineTotal, 0);
      const cId = await this.getC(tx, orgId, dto.customerPhone);
      const disc = await this.vDisc(tx, dto.loyaltyVoucherCode, cId, sub);
      const total = sub - (dto.discountAmount || 0) - disc;

      const t = await tx.transaction.create({
        data: {
          number: `V3-POS-${Date.now()}`,
          type: "POS_SALE",
          status: "COMPLETED",
          paymentStatus: "PAID",
          organizationId: orgId,
          memberId: mId,
          locationId: locId,
          customerId: cId,
          subtotal: sub,
          discountTotal: dto.discountAmount || 0,
          taxTotal: 0,
          finalTotal: total,
          baseCurrencyTotal: total,
          currencyCode: "KES",
          notes: dto.notes,
          items: { create: items },
          loyaltyVouchers: dto.loyaltyVoucherCode
            ? { connect: { code: dto.loyaltyVoucherCode } }
            : undefined,
        },
        select: { id: true, number: true },
      });

      await this.stock(tx, orgId, locId, mId, dto.items, t.id, t.number);
      this.done(orgId, t.id, t.number, cId);
      return { ...t, finalTotal: total, status: "COMPLETED" };
    });
  }

  private async getV(tx: any, items: any[]) {
    const ids = items.map((i) => i.variantId);
    const v = await tx.productVariant.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        retailPrice: true,
        buyingPrice: true,
        name: true,
        sku: true,
        product: { select: { name: true } },
      },
    });
    if (v.length !== ids.length)
      throw new BadRequestException("Missing variants");
    return v;
  }

  private prepI(items: any[], variants: any[], organizationId: string) {
    return items.map((i) => {
      const v = variants.find((v) => v.id === i.variantId)!;
      const p = Number(v.retailPrice || 0);
      return {
        variantId: v.id,
        productName: v.product.name,
        variantName: v.name,
        sku: v.sku || "N/A",
        quantity: i.quantity,
        unitPrice: p,
        listPrice: p,
        unitCost: Number(v.buyingPrice || 0),
        subtotal: p * i.quantity,
        lineTotal: p * i.quantity,
        organizationId,
      };
    });
  }

  private async getC(tx: any, orgId: string, phone?: string) {
    if (!phone) return undefined;
    const c = await tx.customer.findFirst({
      where: { organizationId: orgId, phone },
      select: { id: true },
    });
    if (c) return c.id;
    const nc = await tx.customer.create({
      data: { organizationId: orgId, phone, name: "POS Customer" },
      select: { id: true },
    });
    return nc.id;
  }

  private async vDisc(tx: any, code: string, cId: string, sub: number) {
    if (!code || !cId) return 0;
    const v = await tx.loyaltyVoucher.findUnique({
      where: { code },
      include: { reward: true },
    });
    this.valV(v, cId);
    const d = this.calcD(v.reward, sub);
    await tx.loyaltyVoucher.update({
      where: { id: v.id },
      data: { status: VoucherStatus.REDEEMED, redeemedAt: new Date() },
    });
    return d;
  }

  private valV(v: any, cId: string) {
    if (!v) throw new BadRequestException("No voucher");
    if (v.status !== VoucherStatus.ACTIVE)
      throw new BadRequestException("Inactive");
    if (v.customerId !== cId) throw new BadRequestException("Owner mismatch");
  }

  private calcD(r: any, sub: number): number {
    if (!r) return 0;
    const v = Number(r.discountValue || 0);
    if (r.rewardType === "DISCOUNT_FIXED_AMOUNT") return v;
    return r.rewardType === "DISCOUNT_PERCENTAGE" ? (sub * v) / 100 : 0;
  }

  private async stock(
    tx: any,
    orgId: string,
    locId: string,
    mId: string,
    items: any[],
    tId: string,
    tNo: string,
  ) {
    // ⚡ Optimization: Use Promise.all to parallelize stock updates and createMany for movements
    // This reduces sequential DB round-trips from 2N to ~2, significantly speeding up sales with multiple items.

    const stockUpdates = items.map((i) =>
      tx.productVariantStock.update({
        where: {
          variantId_locationId: { variantId: i.variantId, locationId: locId },
        },
        data: {
          currentStock: { decrement: i.quantity },
          availableStock: { decrement: i.quantity },
        },
      }),
    );

    const movements = items.map((i) => ({
      organizationId: orgId,
      variantId: i.variantId,
      toLocationId: locId,
      memberId: mId,
      quantity: i.quantity,
      movementType: "SALE" as const,
      referenceId: tId,
      notes: `Sale ${tNo}`,
    }));

    await Promise.all([
      ...stockUpdates,
      tx.stockMovement.createMany({ data: movements }),
    ]);
  }

  private done(orgId: string, tId: string, tNo: string, cId?: string) {
    this.loyaltyService
      .calculatePointsForTransaction(tId)
      .then((p) => {
        if (p > 0 && cId)
          this.loyaltyService.awardPoints(cId, p, orgId, `Points ${tNo}`, tId);
      })
      .catch(() => {});
    this.invoiceUseCase.createInvoiceFromOrder(orgId, tId).catch(() => {});
  }
}
