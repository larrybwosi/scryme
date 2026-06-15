import {Test, TestingModule} from "@nestjs/testing";
import {vi, describe, it, expect, beforeEach} from "vitest";
import {QuickStockInquiryUseCase} from "./quick-stock-inquiry.use-case";
import {PrismaService} from "@/prisma/prisma.service";
import {BadRequestException} from "@nestjs/common";
import {Decimal} from "decimal.js";

describe("QuickStockInquiryUseCase", () => {
  let useCase: QuickStockInquiryUseCase;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        businessAccount: {
          findFirst: vi.fn(),
        },
        productVariantStock: {
          findMany: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickStockInquiryUseCase,
        {provide: PrismaService, useValue: prisma},
      ],
    }).compile();

    useCase = module.get<QuickStockInquiryUseCase>(QuickStockInquiryUseCase);
  });

  it("should return stock levels for a business account default location", async () => {
    const orgId = "org-123";
    const baId = "ba-123";
    const locId = "loc-456";
    const variantIds = ["v1", "v2"];

    prisma.client.businessAccount.findFirst.mockResolvedValue({
      defaultLocationId: locId,
    });
    prisma.client.productVariantStock.findMany.mockResolvedValue([
      {
        variantId: "v1",
        availableStock: new Decimal(10),
        variant: {sku: "SKU1", name: "Product 1"},
      },
    ]);

    const result = await useCase.execute(orgId, baId, variantIds);

    expect(result).toHaveLength(2);
    expect(result[0].sku).toBe("SKU1");
    expect(result[0].availableStock).toBe(10);
    expect(result[1].availableStock).toBe(0);
    expect(result[1].name).toBe("Unknown");
  });

  it("should throw BadRequestException if business account has no default location", async () => {
    prisma.client.businessAccount.findFirst.mockResolvedValue({
      defaultLocationId: null,
    });
    await expect(useCase.execute("org-1", "ba-1", [])).rejects.toThrow(
      BadRequestException,
    );
  });
});
