import { AutomationService } from "../../../../../automation/automation.service";
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
  forwardRef,
  Optional,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { VoucherStatus } from "@repo/db";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import { OpenPanelService } from "@/common/openpanel/openpanel.service";

@Injectable()
export class ProcessSaleUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => InvoiceUseCase))
    private readonly invoiceUseCase: InvoiceUseCase,
    private readonly inventoryMovementService: InventoryMovementService,
    @Optional() private readonly openPanelService?: OpenPanelService,
    @Optional()
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService?: AutomationService,
  ) {}

  async execute(ctx: any, dto: any) {
    const { organizationId: orgId, memberId: mId, locationId: locId } = ctx;
    if (!mId || !locId) {
      throw new UnauthorizedException("Member session required for POS sales");
    }

    // Validation: At least one product item or service item must be present
    const productItems = dto.items || dto.cartItems || [];
    const hasProducts = productItems.length > 0;
    const hasServices = dto.serviceItems && dto.serviceItems.length > 0;

    if (!hasProducts && !hasServices) {
      throw new BadRequestException(
        "At least one product item or service item is required to process a sale"
      );
    }

    const paymentsList = dto.payments && dto.payments.length > 0
      ? dto.payments
      : dto.paymentMethod
      ? [{ method: dto.paymentMethod, amount: dto.total || dto.amountReceived || 0 }]
      : [];

    const { transaction, total } = await this.prisma.client.$transaction(
      async (tx: any) => {
        let sub = 0;
        let items: any[] = [];
        const serviceItemsToCreate: any[] = [];
        let serviceMap = new Map<string, any>();

        // 1. Process Product Items if present
        if (hasProducts) {
          const variants = await this.getV(tx, productItems, orgId);
          items = this.prepI(productItems, variants);
          sub += items.reduce((s: number, i: any) => s + i.lineTotal, 0);
        }

        // 2. Process Service Items if present
        if (hasServices) {
          const serviceIds = dto.serviceItems.map((si: any) => si.serviceId);
          const services = await tx.service.findMany({
            where: { id: { in: serviceIds }, organizationId: orgId },
            include: { materials: true },
          });

          serviceMap = new Map(services.map((s: any) => [s.id, s]));

          for (const si of dto.serviceItems) {
            const service = serviceMap.get(si.serviceId);
            if (!service) {
              throw new BadRequestException(`Service with ID ${si.serviceId} not found`);
            }

            const unitPrice = si.unitPrice !== undefined ? Number(si.unitPrice) : Number(service.price);
            const lineSubtotal = unitPrice * si.quantity;

            serviceItemsToCreate.push({
              serviceId: service.id,
              bookingId: si.bookingId || undefined,
              serviceName: service.name,
              sku: service.sku,
              quantity: si.quantity,
              unitPrice: unitPrice,
              subtotal: lineSubtotal,
              discountAmount: 0,
              taxAmount: 0,
              lineTotal: lineSubtotal,
              notes: si.notes,
            });
          }

          sub += serviceItemsToCreate.reduce((s: number, si: any) => s + si.lineTotal, 0);
        }

        const cId = await this.getC(
          tx,
          orgId,
          dto.customerPhone,
          dto.customerEmail,
          dto.customerName,
          dto.saveAsCustomer,
          dto.customerId,
        );
        const disc = await this.vDisc(tx, orgId, dto.loyaltyVoucherCode, cId, sub);
        const total = sub - (dto.discountAmount || 0) - disc;

        const isPreorder = dto.status === "PREORDER" || dto.metadata?.isCustomOrder === true || dto.type === "SALES_ORDER";
        const txnStatus = isPreorder ? "PREORDER" : (dto.status || "COMPLETED");
        const txnType = dto.type || (isPreorder ? "SALES_ORDER" : "POS_SALE");
        const totalPaidAmount = paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        const paymentStatus = totalPaidAmount >= total
          ? "PAID"
          : totalPaidAmount > 0
          ? "PARTIALLY_PAID"
          : dto.paymentStatus && ["PENDING", "UNPAID"].includes(dto.paymentStatus)
          ? dto.paymentStatus
          : "UNPAID";

        const t = await tx.transaction.create({
          data: {
            number: `V3-POS-${Date.now()}`,
            type: txnType as any,
            status: txnStatus as any,
            paymentStatus: paymentStatus as any,
            totalPaid: totalPaidAmount,
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
            metadata: dto.metadata || undefined,
            items: hasProducts ? { create: items } : undefined,
            serviceItems: hasServices ? { create: serviceItemsToCreate } : undefined,
            payments: paymentsList.length > 0
              ? {
                  create: paymentsList.map((p: any) => ({
                    method: p.method,
                    status: "COMPLETED",
                    amount: p.amount,
                    referenceNumber: p.reference,
                  })),
                }
              : undefined,
            loyaltyVouchers: dto.loyaltyVoucherCode
              ? { connect: { code: dto.loyaltyVoucherCode } }
              : undefined,
          },
          select: { id: true, number: true, customerId: true },
        });

        // 3. Update stock levels for physical items
        if (hasProducts) {
          await this.stock(tx, orgId, locId, mId, productItems, t.id, t.number);
        }

        // 4. Update booking statuses and consume service materials
        if (hasServices) {
          await this.consumeServiceMaterials(
            tx,
            orgId,
            locId,
            mId,
            dto.serviceItems,
            serviceMap,
            t.id,
            t.number
          );
        }

        return { transaction: t, total, customerId: cId };
      },
    );

    this.openPanelService?.trackEvent("pos.sale.completed", mId, {
      organizationId: orgId,
      locationId: locId,
      total,
      transactionNumber: transaction.number,
      itemsCount: productItems.length + (dto.serviceItems?.length || 0),
    });

    const complianceData = await this.handlePostSale(
      orgId,
      transaction.id,
      transaction.number,
      transaction.customerId || undefined,
    ).catch((err) => {
      console.error("Post-sale compliance handling failed:", err.message);
      return null;
    });

    const isPreorder = dto.status === "PREORDER" || dto.metadata?.isCustomOrder === true;
    if (isPreorder) {
      this.triggerPreorderWorkflow(orgId, {
        transactionId: transaction.id,
        transactionNumber: transaction.number,
        customerId: transaction.customerId || undefined,
        dto,
        total,
      }).catch((err) => {
        console.error("Post-sale preorder workflow trigger failed:", err.message);
      });
    }

    return {
      ...transaction,
      finalTotal: total,
      status: transaction.status,
      complianceData,
    };
  }

  private async getV(tx: any, items: any[], organizationId: string) {
    const ids = items.map((i) => i.variantId);
    const v = await tx.productVariant.findMany({
      where: { id: { in: ids }, product: { organizationId } },
      select: {
        id: true,
        retailPrice: true,
        buyingPrice: true,
        name: true,
        sku: true,
        product: { select: { name: true } },
      },
    });
    if (v.length !== new Set(ids).size)
      throw new BadRequestException("Missing variants");
    return v;
  }

  private prepI(items: any[], variants: any[]) {
    // ⚡ Bolt Optimization: Use a Map for O(1) constant-time variant lookups.
    // This reduces lookup complexity from O(N*M) nested search to O(N+M) mapping.
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    return items.map((i) => {
      const v = variantMap.get(i.variantId)!;
      const defaultPrice = Number(v.retailPrice || 0);
      const p = i.unitPrice !== undefined && i.unitPrice !== null ? Number(i.unitPrice) : defaultPrice;
      return {
        variantId: v.id,
        productName: v.product.name,
        variantName: v.name,
        sku: v.sku || "N/A",
        quantity: i.quantity,
        unitPrice: p,
        listPrice: defaultPrice,
        unitCost: Number(v.buyingPrice || 0),
        subtotal: p * i.quantity,
        lineTotal: p * i.quantity,
      };
    });
  }

  private async getC(
    tx: any,
    orgId: string,
    phone?: string,
    email?: string,
    name?: string,
    saveAsCustomer?: boolean,
    explicitCustomerId?: string,
  ) {
    if (
      explicitCustomerId &&
      explicitCustomerId !== "temp-custom-customer" &&
      !explicitCustomerId.startsWith("temp-")
    ) {
      const existing = await tx.customer.findFirst({
        where: { id: explicitCustomerId, organizationId: orgId },
        select: { id: true },
      });
      if (existing) return existing.id;
    }

    if (!phone && !email && !name) return undefined;

    const orConditions: any[] = [];
    if (phone && phone.trim()) orConditions.push({ phone: phone.trim() });
    if (email && email.trim()) orConditions.push({ email: email.trim() });

    if (orConditions.length > 0) {
      const c = await tx.customer.findFirst({
        where: { organizationId: orgId, OR: orConditions },
        select: { id: true },
      });
      if (c) return c.id;
    }

    if (saveAsCustomer === true || (saveAsCustomer !== false && (phone || email || name))) {
      const customerName = name && name.trim() ? name.trim() : "POS Customer";
      const nc = await tx.customer.create({
        data: {
          organizationId: orgId,
          phone: phone && phone.trim() ? phone.trim() : undefined,
          email: email && email.trim() ? email.trim() : undefined,
          name: customerName,
        },
        select: { id: true },
      });
      return nc.id;
    }

    return undefined;
  }

  private async vDisc(
    tx: any,
    organizationId: string,
    code: string,
    cId: string,
    sub: number,
  ) {
    if (!code || !cId) return 0;
    const v = await tx.loyaltyVoucher.findFirst({
      where: { code, organizationId },
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

  private async consumeServiceMaterials(
    tx: any,
    orgId: string,
    locId: string,
    mId: string,
    serviceItems: any[],
    serviceMap: Map<string, any>,
    tId: string,
    tNo: string,
  ) {
    const bookingUpdates: any[] = [];
    const stockUpdates: any[] = [];
    const movements: any[] = [];
    const consumedMaterialsToCreate: any[] = [];
    const materialQtyMap = new Map<string, number>();

    // ⚡ Bolt Optimization: Batch pre-fetch all matching service bookings to eliminate N+1 database queries.
    // This reduces the query overhead from O(N) sequential requests down to a single constant-time O(1) query.
    const bookingIds = serviceItems
      .map((si) => si.bookingId)
      .filter((id): id is string => !!id);

    let bookingMap = new Map<string, any>();
    if (bookingIds.length > 0) {
      const bookings = await tx.serviceBooking.findMany({
        where: { id: { in: bookingIds }, organizationId: orgId },
        include: { service: { include: { materials: true } } },
      });
      bookingMap = new Map(bookings.map((b: any) => [b.id, b]));
    }

    for (const si of serviceItems) {
      const service = serviceMap.get(si.serviceId)!;

      if (si.bookingId) {
        // Option A: Complete and link existing booking
        const booking = bookingMap.get(si.bookingId);

        if (!booking) {
          throw new BadRequestException(`Booking with ID ${si.bookingId} not found`);
        }
        if (booking.status === "COMPLETED") {
          throw new BadRequestException(`Booking with ID ${si.bookingId} is already completed`);
        }

        // ⚡ Bolt Optimization: Collect booking update promises to parallelize database writes concurrently via Promise.all.
        // This eliminates sequential N+1 blocking DB roundtrips for multi-service sales, reducing delay from O(N) to O(1).
        bookingUpdates.push(
          tx.serviceBooking.update({
            where: { id: booking.id },
            data: {
              status: "COMPLETED",
              actualStartTime: booking.actualStartTime || booking.scheduledStartTime,
              actualEndTime: new Date(),
              transactionId: tId,
            },
          }),
        );

        // ⚡ Bolt Optimization: Consolidate material quantity decrements by variantId in-memory
        // to prevent row-lock contention and transactional deadlocks on duplicate variants.
        const materials = booking.service.materials || [];
        for (const mat of materials) {
          const qty = Number(mat.quantity) * si.quantity;
          materialQtyMap.set(mat.variantId, (materialQtyMap.get(mat.variantId) || 0) + qty);

          movements.push({
            organizationId: orgId,
            memberId: mId,
            variantId: mat.variantId,
            quantity: qty,
            fromLocationId: locId,
            movementType: "ADJUSTMENT_OUT" as const,
            referenceId: booking.id,
            referenceType: "ServiceBooking",
            notes: `Consumed for booking ${booking.id} during sale ${tNo}`,
          });

          consumedMaterialsToCreate.push({
            bookingId: booking.id,
            variantId: mat.variantId,
            quantity: qty,
          });
        }
      } else {
        // Option C: Consume materials directly based on service description (no booking record needed)
        const materials = service.materials || [];
        for (const mat of materials) {
          const qty = Number(mat.quantity) * si.quantity;
          materialQtyMap.set(mat.variantId, (materialQtyMap.get(mat.variantId) || 0) + qty);

          movements.push({
            organizationId: orgId,
            memberId: mId,
            variantId: mat.variantId,
            quantity: qty,
            fromLocationId: locId,
            movementType: "ADJUSTMENT_OUT" as const,
            referenceId: tId,
            referenceType: "Transaction",
            notes: `Consumed for service ${service.name} during sale ${tNo}`,
          });
        }
      }
    }

    for (const [variantId, totalQty] of materialQtyMap.entries()) {
      stockUpdates.push(
        tx.productVariantStock.update({
          where: {
            variantId_locationId: { variantId, locationId: locId },
          },
          data: {
            currentStock: { decrement: totalQty },
            availableStock: { decrement: totalQty },
          },
        })
      );
    }

    if (bookingUpdates.length > 0 || stockUpdates.length > 0) {
      await Promise.all([...bookingUpdates, ...stockUpdates]);
    }

    if (movements.length > 0) {
      for (const movement of movements) {
        await this.inventoryMovementService.recordMovement(tx, movement);
      }
    }

    if (consumedMaterialsToCreate.length > 0) {
      await tx.bookingConsumedMaterial.createMany({
        data: consumedMaterialsToCreate,
      });
    }
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

    if (!invoice) {
      return null;
    }

    const result = await this.invoiceUseCase.finalizeInvoice(orgId, invoice.id);

    return result.complianceData || null;
  }

  private async triggerPreorderWorkflow(orgId: string, params: { transactionId: string; transactionNumber: string; customerId?: string; dto: any; total: number }) {
    if (!this.automationService) return;

    let cust: any = null;
    if (params.customerId) {
      cust = await this.prisma.client.customer.findUnique({
        where: { id: params.customerId },
        select: { name: true, phone: true, email: true },
      });
    }

    const dto = params.dto;
    const metadata = dto.metadata || {};
    const totalPaidAmount = (dto.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    await this.automationService.triggerWorkflow(orgId, {
      key: "preorder_notification",
      payload: {
        transactionId: params.transactionId,
        transactionNumber: params.transactionNumber,
        customerName: cust?.name || dto.customerName || "Valued Customer",
        customerPhone: cust?.phone || dto.customerPhone || "",
        customerEmail: cust?.email || dto.customerEmail || "",
        dueDate: metadata.dueDate,
        dueTime: metadata.dueTime,
        itemSpecs: metadata.itemSpecs,
        inscription: metadata.inscription,
        customizationNotes: metadata.customizationNotes || dto.notes,
        depositAmount: totalPaidAmount,
        remainingBalance: Math.max(0, params.total - totalPaidAmount),
        finalTotal: params.total,
        currency: "KES",
        metadata,
      },
    });
  }
}
