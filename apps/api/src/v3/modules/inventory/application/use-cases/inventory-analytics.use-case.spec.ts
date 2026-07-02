import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWasteAnalysisUseCase } from "./inventory-analytics.use-case";
import { Decimal } from "decimal.js";

describe("GetWasteAnalysisUseCase", () => {
  let useCase: GetWasteAnalysisUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        stockMovement: {
          findMany: vi.fn(),
        },
        stockAdjustment: {
          groupBy: vi.fn(),
        },
      },
    };
    useCase = new GetWasteAnalysisUseCase(prisma as any);
  });

  it("should aggregate waste analysis by reason correctly (groupBy version)", async () => {
    const orgId = "org-1";
    const groupedResults = [
      {
        reason: "DAMAGED",
        _sum: { quantity: new Decimal(15) },
        _count: { _all: 2 },
      },
      {
        reason: "EXPIRED",
        _sum: { quantity: new Decimal(20) },
        _count: { _all: 1 },
      },
      {
        reason: "LOST",
        _sum: { quantity: new Decimal(7) },
        _count: { _all: 1 },
      },
    ];

    prisma.client.stockAdjustment.groupBy.mockResolvedValue(groupedResults);

    const result = await useCase.execute(orgId, {});

    expect(result).toEqual({
      DAMAGED: { count: 2, totalQuantity: 15, totalValue: 0 },
      EXPIRED: { count: 1, totalQuantity: 20, totalValue: 0 },
      LOST: { count: 1, totalQuantity: 7, totalValue: 0 },
    });

    expect(prisma.client.stockAdjustment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["reason"],
        where: expect.objectContaining({
          organizationId: orgId,
          reason: expect.objectContaining({
            in: ["DAMAGED", "EXPIRED", "LOST", "STOLEN"],
          }),
        }),
      })
    );
  });
});
