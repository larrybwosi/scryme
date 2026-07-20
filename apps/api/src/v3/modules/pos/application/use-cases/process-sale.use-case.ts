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

    const { transaction, total } = await this.prisma.client.$transaction(
      async (tx: any) => {
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
          select: { id: true, number: true, customerId: true },
        });

        await this.stock(tx, orgId, locId, mId, dto.items, t.id, t.number);

        return { transaction: t, total, customerId: cId };
      },
    );

    const complianceData = await this.handlePostSale(
      orgId,
      transaction.id,
      transaction.number,
      transaction.customerId || undefined,
    ).catch((err) => {
      console.error("Post-sale compliance handling failed:", err.message);
      return null;
    });

    return {
      ...transaction,
      finalTotal: total,
      status: "COMPLETED",
      complianceData,
    };
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
    // ⚡ Bolt Optimization: Use a Map for O(1) constant-time variant lookups.
    // This reduces lookup complexity from O(N*M) nested search to O(N+M) mapping.
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return items.map((i) => {
      const v = variantMap.get(i.variantId)!;
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

  private async handlePostSale(
    orgId: string,
    tId: string,
    tNo: string,
    cId?: string,
  ) {
    // 1. Handle Loyalty (Async)
    this.loyaltyService
      .calculatePointsForTransaction(tId, orgId)
      .then((p) => {
        if (p > 0 && cId)
          this.loyaltyService.awardPoints(cId, p, orgId, `Points ${tNo}`, tId);
      })
      .catch(() => {});

    // 2. Check for Tax Integration
    const org = await this.prisma.client.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    });

    const isTaxEnabled =
      org?.settings?.taxIntegrationEnabled && org?.settings?.country === "Kenya";

    // 3. Create & Finalize Invoice
    // FinalizeInvoice will handle KRA compliance internally if enabled
    const invoice = await this.invoiceUseCase.createInvoiceFromOrder(
      orgId,
      tId,
    );

    const result = await this.invoiceUseCase.finalizeInvoice(orgId, invoice.id);

    return result.complianceData || null;
  }
}
