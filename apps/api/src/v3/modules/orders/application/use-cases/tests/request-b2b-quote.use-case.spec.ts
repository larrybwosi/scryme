import { Test, TestingModule } from "@nestjs/testing";
import { RequestB2BQuoteUseCase } from "../request-b2b-quote.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { IOrderRepository } from "../../../domain/repositories/order-repository.interface";
import { PricingResolverService } from "../../../../catalog/application/services/pricing-resolver.service";
import { WebhookService } from "../../../../webhooks/infrastructure/services/webhook.service";
import { ApiRealtimeService } from "@/common/services/realtime.service";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/db", async (importOriginal) => ({
  ...((await importOriginal()) as any),
  db: {},
}));

describe("RequestB2BQuoteUseCase", () => {
  let useCase: RequestB2BQuoteUseCase;
  let prisma: PrismaService;
  let pricingResolver: PricingResolverService;

  const mockOrderRepository = {
    create: vi.fn(),
  };

  const mockWebhookService = {
    dispatch: vi.fn(),
  };

  const mockRealtimeService = {
    publish: vi.fn(),
  };

  const mockPrisma = {
    client: {
      customer: { findUnique: vi.fn() },
      businessAccount: { findUnique: vi.fn() },
      inventoryLocation: { findFirst: vi.fn(), findUnique: vi.fn() },
      productVariant: { findMany: vi.fn() },
      transaction: { create: vi.fn() },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestB2BQuoteUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepository },
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: PricingResolverService,
          useValue: { resolveVariantPrice: vi.fn() },
        },
        { provide: WebhookService, useValue: mockWebhookService },
        { provide: ApiRealtimeService, useValue: mockRealtimeService },
      ],
    }).compile();

    useCase = module.get<RequestB2BQuoteUseCase>(RequestB2BQuoteUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    pricingResolver = module.get<PricingResolverService>(
      PricingResolverService,
    );
  });

  it("should throw BadRequestException if location cannot be resolved", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

    await expect(useCase.execute("org1", { items: [] })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException if variant stock is insufficient", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
      id: "loc1",
    });
    mockPrisma.client.productVariant.findMany.mockResolvedValue([
      {
        id: "v1",
        sku: "SKU1",
        name: "Variant 1",
        buyingPrice: { toNumber: () => 10 },
        product: { name: "Product 1" },
        variantStocks: [{ availableStock: { toNumber: () => 5 } }],
      },
    ]);

    await expect(
      useCase.execute("org1", {
        items: [{ variantId: "v1", quantity: 10 }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should aggregate quantities for duplicate variantIds in request", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
      id: "loc1",
    });
    mockPrisma.client.productVariant.findMany.mockResolvedValue([
      {
        id: "v1",
        sku: "SKU1",
        name: "Variant 1",
        buyingPrice: { toNumber: () => 10 },
        product: { name: "Product 1" },
        variantStocks: [{ availableStock: { toNumber: () => 15 } }],
      },
    ]);

    vi.mocked(pricingResolver.resolveVariantPrice).mockResolvedValue({
      unitPrice: 20,
    });
    mockPrisma.client.transaction.create.mockResolvedValue({ id: "q1" });

    await useCase.execute("org1", {
      items: [
        { variantId: "v1", quantity: 5 },
        { variantId: "v1", quantity: 5 },
      ],
    });

    expect(pricingResolver.resolveVariantPrice).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 10,
      }),
    );
  });
});
