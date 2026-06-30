import { describe, it, expect, beforeEach, vi } from "vitest";
import { CheckB2BAvailabilityUseCase } from "./check-b2b-availability.use-case";

describe("CheckB2BAvailabilityUseCase", () => {
  let useCase: CheckB2BAvailabilityUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        customer: { findUnique: vi.fn() },
        businessAccount: { findUnique: vi.fn() },
        inventoryLocation: { findFirst: vi.fn() },
        productVariantStock: { findMany: vi.fn() },
      },
    };
    useCase = new CheckB2BAvailabilityUseCase(prisma as any);
  });

  it("should return availability for requested variants", async () => {
    const organizationId = "org-1";
    const variantIds = ["v1", "v2"];
    const locationId = "loc-1";

    prisma.client.productVariantStock.findMany.mockResolvedValue([
      { variantId: "v1", availableStock: { toNumber: () => 10 } },
    ]);

    const result = await useCase.execute(organizationId, {
      variantIds,
      locationId,
    });

    expect(result).toEqual([
      { variantId: "v1", locationId, availableStock: 10 },
      { variantId: "v2", locationId, availableStock: 0 },
    ]);
  });
});
