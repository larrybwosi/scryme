import { Test, TestingModule } from "@nestjs/testing";
import { ProcessSaleUseCase } from "./process-sale.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/windmill/server", () => ({
  emitLoyaltyPointsAwarded: vi.fn().mockResolvedValue({}),
  emitLoyaltyVoucherCreated: vi.fn().mockResolvedValue({}),
  emitPaymentCompleted: vi.fn().mockResolvedValue({}),
}));

describe("ProcessSaleUseCase", () => {
  let useCase: ProcessSaleUseCase;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        productVariant: { findMany: vi.fn() },
        customer: { findFirst: vi.fn(), create: vi.fn() },
        transaction: { create: vi.fn() },
        productVariantStock: { update: vi.fn() },
        stockMovement: { createMany: vi.fn() },
        loyaltyVoucher: { findUnique: vi.fn(), update: vi.fn() },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessSaleUseCase,
        { provide: PrismaService, useValue: prisma },
        {
          provide: LoyaltyService,
          useValue: {
            calculatePointsForTransaction: vi.fn().mockResolvedValue(0),
          },
        },
        {
          provide: InvoiceUseCase,
          useValue: { createInvoiceFromOrder: vi.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    useCase = module.get<ProcessSaleUseCase>(ProcessSaleUseCase);
  });

  it("should process a sale and update stock in parallel", async () => {
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

    await useCase.execute(ctx, dto);

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

  it("should throw error if variants are missing", async () => {
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
});
