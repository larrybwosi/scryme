import { describe, it, expect, beforeEach, vi } from "vitest";
import { CheckB2BAvailabilityUseCase } from "./check-b2b-availability.use-case";

describe("CheckB2BAvailabilityUseCase", () => {
  let useCase: CheckB2BAvailabilityUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        customer: { findFirst: vi.fn() },
        businessAccount: { findFirst: vi.fn() },
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

  it("should scope customer lookup by organizationId to prevent IDOR", async () => {
    const organizationId = "org-1";
    const customerId = "cust-1";

    prisma.client.customer.findFirst.mockResolvedValue({
      defaultLocationId: "loc-cust",
    });
    prisma.client.productVariantStock.findMany.mockResolvedValue([]);

    await useCase.execute(organizationId, {
      variantIds: ["v1"],
      customerId,
    });

    expect(prisma.client.customer.findFirst).toHaveBeenCalledWith({
      where: { id: customerId, organizationId },
      select: { defaultLocationId: true },
    });
  });

  it("should scope businessAccount lookup by organizationId to prevent IDOR", async () => {
    const organizationId = "org-1";
    const businessAccountId = "biz-1";

    prisma.client.businessAccount.findFirst.mockResolvedValue({
      defaultLocationId: "loc-biz",
    });
    prisma.client.productVariantStock.findMany.mockResolvedValue([]);

    await useCase.execute(organizationId, {
      variantIds: ["v1"],
      businessAccountId,
    });

    expect(prisma.client.businessAccount.findFirst).toHaveBeenCalledWith({
      where: { id: businessAccountId, organizationId },
      select: { defaultLocationId: true },
    });
  });
});
