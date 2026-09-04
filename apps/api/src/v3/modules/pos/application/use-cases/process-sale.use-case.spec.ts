import { Test, TestingModule } from "@nestjs/testing";
import { ProcessSaleUseCase } from "./process-sale.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/shared/server", () => ({
  emitLoyaltyPointsAwarded: vi.fn().mockResolvedValue({}),
  emitLoyaltyVoucherCreated: vi.fn().mockResolvedValue({}),
  emitPaymentCompleted: vi.fn().mockResolvedValue({}),
}));

describe("ProcessSaleUseCase", () => {
  let useCase: ProcessSaleUseCase;
  let prisma: any;
  let inventoryMovementService: any;
  let invoiceUseCase: any;

  beforeEach(async () => {
    prisma = {
      client: {
        $transaction: vi.fn(cb => cb(prisma.client)),
        productVariant: { findMany: vi.fn() },
        customer: { findFirst: vi.fn(), create: vi.fn() },
        transaction: { create: vi.fn() },
        productVariantStock: { update: vi.fn() },
        stockMovement: { createMany: vi.fn() },
        loyaltyVoucher: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
        organization: { findUnique: vi.fn() },
        service: { findMany: vi.fn() },
        serviceBooking: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        bookingConsumedMaterial: { createMany: vi.fn() },
      },
    };

    inventoryMovementService = {
      recordMovement: vi.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessSaleUseCase,
        { provide: PrismaService, useValue: prisma },
        { provide: InventoryMovementService, useValue: inventoryMovementService },
        {
          provide: LoyaltyService,
          useValue: {
            calculatePointsForTransaction: vi.fn().mockResolvedValue(0),
          },
        },
        {
          provide: InvoiceUseCase,
          useValue: {
            createInvoiceFromOrder: vi.fn(),
            getInvoiceById: vi.fn().mockResolvedValue({ id: "inv1" }),
            handleKRACompliance: vi.fn().mockResolvedValue({}),
            finalizeInvoice: vi.fn().mockResolvedValue({ complianceData: {} }),
          },
        },
      ],
    }).compile();

    useCase = module.get<ProcessSaleUseCase>(ProcessSaleUseCase);
    invoiceUseCase = module.get<InvoiceUseCase>(InvoiceUseCase);
  });

  it("should handle null invoice gracefully when auto generate invoice is disabled", async () => {
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    };
    const dto = {
      items: [{ variantId: "v1", quantity: 1, unitPrice: 10 }],
      payments: [{ method: "CASH", amount: 10 }],
    };

    prisma.client.productVariant.findMany.mockResolvedValue([
      {
        id: "v1",
        retailPrice: 10,
        buyingPrice: 5,
        name: "V1",
        sku: "S1",
        product: { name: "P1" },
      },
    ]);

    prisma.client.transaction.create.mockResolvedValue({
      id: "t1",
      number: "T1",
    });

    prisma.client.organization.findUnique.mockResolvedValue({
      id: "org_1",
      settings: { taxIntegrationEnabled: false },
    });

    invoiceUseCase.createInvoiceFromOrder.mockResolvedValue(null);

    const result = await useCase.execute(ctx, dto);

    expect(result.id).toBe("t1");
    expect(result.complianceData).toBeNull();
    expect(invoiceUseCase.finalizeInvoice).not.toHaveBeenCalled();
  });

  it("should process a sale and update stock in parallel", async () => {
    invoiceUseCase.createInvoiceFromOrder.mockResolvedValue({ id: "inv1" });
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    };
    const dto = {
      items: [
        { variantId: "v1", quantity: 2, unitPrice: 10 },
        { variantId: "v2", quantity: 1, unitPrice: 20 },
      ],
      payments: [{ method: "CASH", amount: 40 }],
    };

    prisma.client.productVariant.findMany.mockResolvedValue([
      {
        id: "v1",
        retailPrice: 10,
        buyingPrice: 5,
        name: "V1",
        sku: "S1",
        product: { name: "P1" },
      },
      {
        id: "v2",
        retailPrice: 20,
        buyingPrice: 10,
        name: "V2",
        sku: "S2",
        product: { name: "P2" },
      },
    ]);

    prisma.client.transaction.create.mockResolvedValue({
      id: "t1",
      number: "T1",
    });

    prisma.client.organization.findUnique.mockResolvedValue({
      id: "org_1",
      settings: { taxIntegrationEnabled: false },
    });

    await useCase.execute(ctx, dto);

    // Verify productVariant lookup was scoped by organizationId
    expect(prisma.client.productVariant.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["v1", "v2"] },
        product: { organizationId: "org_1" },
      },
      select: expect.anything(),
    });

    // Verify stock updates were called for each item
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledTimes(2);
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledWith({
      where: { variantId_locationId: { variantId: "v1", locationId: "loc_1" } },
      data: {
        currentStock: { decrement: 2 },
        availableStock: { decrement: 2 },
      },
    });
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledWith({
      where: { variantId_locationId: { variantId: "v2", locationId: "loc_1" } },
      data: {
        currentStock: { decrement: 1 },
        availableStock: { decrement: 1 },
      },
    });

    // Verify stock movements were created in batch
    expect(prisma.client.stockMovement.createMany).toHaveBeenCalledOnce();
    expect(prisma.client.stockMovement.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ variantId: "v1", quantity: 2 }),
        expect.objectContaining({ variantId: "v2", quantity: 1 }),
      ]),
    });
  });

  it("should throw error if variants are missing or belong to another organization", async () => {
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    };
    const dto = {
      items: [{ variantId: "v1", quantity: 1, unitPrice: 10 }],
      payments: [{ method: "CASH", amount: 10 }],
    };

    prisma.client.productVariant.findMany.mockResolvedValue([]);

    await expect(useCase.execute(ctx, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should support Option C - direct service sale without booking, and consume its materials", async () => {
    invoiceUseCase.createInvoiceFromOrder.mockResolvedValue({ id: "inv1" });
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    };
    const dto = {
      serviceItems: [
        { serviceId: "srv1", quantity: 1, unitPrice: 50 },
      ],
      payments: [{ method: "CASH", amount: 50 }],
    };

    prisma.client.service.findMany.mockResolvedValue([
      {
        id: "srv1",
        name: "Hair Wash",
        sku: "SRV-HW",
        price: 50,
        materials: [
          { variantId: "shampoo_v", quantity: 0.1 },
        ],
      },
    ]);

    prisma.client.transaction.create.mockResolvedValue({
      id: "t2",
      number: "T2",
    });

    prisma.client.organization.findUnique.mockResolvedValue({
      id: "org_1",
      settings: { taxIntegrationEnabled: false },
    });

    const result = await useCase.execute(ctx, dto);

    expect(result.id).toBe("t2");
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledOnce();
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledWith({
      where: { variantId_locationId: { variantId: "shampoo_v", locationId: "loc_1" } },
      data: {
        currentStock: { decrement: 0.1 },
        availableStock: { decrement: 0.1 },
      },
    });

    expect(inventoryMovementService.recordMovement).toHaveBeenCalledOnce();
    expect(inventoryMovementService.recordMovement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variantId: "shampoo_v",
        quantity: 0.1,
        movementType: "ADJUSTMENT_OUT",
        referenceId: "t2",
        referenceType: "Transaction",
      })
    );
  });

  it("should support Option A - complete existing booking, consume booking materials, and update booking details", async () => {
    invoiceUseCase.createInvoiceFromOrder.mockResolvedValue({ id: "inv1" });
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    };
    const dto = {
      serviceItems: [
        { serviceId: "srv1", quantity: 1, bookingId: "bk1" },
      ],
      payments: [{ method: "CASH", amount: 45 }],
    };

    prisma.client.service.findMany.mockResolvedValue([
      {
        id: "srv1",
        name: "Haircut",
        sku: "SRV-HC",
        price: 45,
        materials: [],
      },
    ]);

    prisma.client.serviceBooking.findMany.mockResolvedValue([
      {
        id: "bk1",
        status: "SCHEDULED",
        scheduledStartTime: new Date(),
        service: {
          materials: [
            { variantId: "scissors_v", quantity: 1 },
          ],
        },
      },
    ]);

    prisma.client.transaction.create.mockResolvedValue({
      id: "t3",
      number: "T3",
    });

    prisma.client.organization.findUnique.mockResolvedValue({
      id: "org_1",
      settings: { taxIntegrationEnabled: false },
    });

    const result = await useCase.execute(ctx, dto);

    expect(result.id).toBe("t3");

    // Verify booking was updated to COMPLETED
    expect(prisma.client.serviceBooking.update).toHaveBeenCalledWith({
      where: { id: "bk1" },
      data: expect.objectContaining({
        status: "COMPLETED",
        transactionId: "t3",
      }),
    });

    // Verify stock update for booking materials
    expect(prisma.client.productVariantStock.update).toHaveBeenCalledWith({
      where: { variantId_locationId: { variantId: "scissors_v", locationId: "loc_1" } },
      data: {
        currentStock: { decrement: 1 },
        availableStock: { decrement: 1 },
      },
    });

    // Verify bookingConsumedMaterial is recorded
    expect(prisma.client.bookingConsumedMaterial.createMany).toHaveBeenCalledWith({
      data: [
        {
          bookingId: "bk1",
          variantId: "scissors_v",
          quantity: 1,
        },
      ],
    });
  });
});
