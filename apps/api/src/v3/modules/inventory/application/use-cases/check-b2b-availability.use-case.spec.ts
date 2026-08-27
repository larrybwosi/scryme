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

  it("should return availability for requested variants when location is valid", async () => {
    const organizationId = "org-1";
    const variantIds = ["v1", "v2"];
    const locationId = "loc-1";

    prisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
    prisma.client.productVariantStock.findMany.mockResolvedValue([
      { variantId: "v1", availableStock: { toNumber: () => 10 } },
    ]);

    const result = await useCase.execute(organizationId, {
      variantIds,
      locationId,
    });

    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { id: locationId, organizationId },
      select: { id: true },
    });
    expect(result).toEqual([
      { variantId: "v1", locationId, availableStock: 10 },
      { variantId: "v2", locationId, availableStock: 0 },
    ]);
  });

  it("should throw BadRequestException if explicit locationId does not belong to organization", async () => {
    const organizationId = "org-1";
    const locationId = "foreign-loc-99";

    prisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute(organizationId, {
        variantIds: ["v1"],
        locationId,
      }),
    ).rejects.toThrow("Location not found or access denied.");
  });

  it("should resolve location from scoped customer defaultLocationId", async () => {
    const organizationId = "org-1";
    const customerId = "cust-1";
    const defaultLocationId = "loc-cust";

    prisma.client.customer.findFirst.mockResolvedValue({ defaultLocationId });
    prisma.client.productVariantStock.findMany.mockResolvedValue([]);

    const result = await useCase.execute(organizationId, {
      variantIds: ["v1"],
      customerId,
    });

    expect(prisma.client.customer.findFirst).toHaveBeenCalledWith({
      where: { id: customerId, organizationId },
      select: { defaultLocationId: true },
    });
    expect(result[0].locationId).toBe(defaultLocationId);
  });
});
