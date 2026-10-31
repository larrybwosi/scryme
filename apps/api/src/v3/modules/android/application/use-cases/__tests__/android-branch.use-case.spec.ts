import { describe, it, expect, beforeEach, vi } from "vitest";
import { AndroidBranchUseCase } from "../android-branch.use-case";
import { NotFoundException } from "@nestjs/common";

describe("AndroidBranchUseCase", () => {
  let useCase: AndroidBranchUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        inventoryLocation: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        attendanceLog: {
          findMany: vi.fn(),
        },
        transaction: {
          findMany: vi.fn(),
        },
        stockMovement: {
          findMany: vi.fn(),
        },
      },
    };

    useCase = new AndroidBranchUseCase(mockPrisma as any);
  });

  const mockContext = { organizationId: "org-1" };

  it("should get branch locations with full coordinates and active status", async () => {
    mockPrisma.client.inventoryLocation.findMany.mockResolvedValue([
      {
        id: "loc-1",
        name: "Main Store",
        code: "LOC001",
        address: { street: "123 Main St" },
        contact: { phone: "+1234567890" },
        locationType: "STORE",
        latitude: -1.28,
        longitude: 36.81,
        geofenceRadiusMeters: 100,
        isDefault: true,
        isActive: true,
      },
    ]);

    const result = await useCase.getBranchLocations(mockContext);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toEqual({
      id: "loc-1",
      name: "Main Store",
      code: "LOC001",
      address: "123 Main St",
      phone: "+1234567890",
      locationType: "STORE",
      latitude: -1.28,
      longitude: 36.81,
      geofenceRadiusMeters: 100,
      isDefault: true,
      isActive: true,
    });
  });

  it("should throw NotFoundException if branch does not exist", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

    await expect(useCase.getBranchDetails(mockContext, "invalid-loc")).rejects.toThrow(NotFoundException);
  });

  it("should get branch activity / attendance logs", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-1", organizationId: "org-1" });
    mockPrisma.client.attendanceLog.findMany.mockResolvedValue([
      {
        id: "log-1",
        memberId: "mem-1",
        checkInTime: new Date("2026-10-31T09:00:00Z"),
        checkOutTime: new Date("2026-10-31T17:00:00Z"),
        shiftStatus: "ON_TIME",
        verificationMethod: "GPS",
        isLocationVerified: true,
        distanceMeters: 15.5,
        notes: "Morning shift",
        member: {
          user: {
            id: "u-1",
            name: "Alice Smith",
            image: "https://example.com/avatar.jpg",
          },
        },
      },
    ]);

    const result = await useCase.getBranchActivity(mockContext, "loc-1", 10);
    expect(result.activity).toHaveLength(1);
    expect(result.activity[0].memberName).toBe("Alice Smith");
    expect(result.activity[0].isLocationVerified).toBe(true);
  });

  it("should get branch recent sales", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-1", organizationId: "org-1" });
    mockPrisma.client.transaction.findMany.mockResolvedValue([
      {
        id: "tx-12345678",
        finalTotal: "120.50",
        currencyCode: "KES",
        createdAt: new Date("2026-10-31T10:00:00Z"),
        cancelledAt: null,
        completedAt: new Date("2026-10-31T10:05:00Z"),
        customer: { id: "c-1", name: "John Doe" },
        member: { user: { name: "Cashier Bob" } },
      },
    ]);

    const result = await useCase.getBranchSales(mockContext, "loc-1", 10);
    expect(result.sales).toHaveLength(1);
    expect(result.sales[0].totalAmount).toBe(120.50);
    expect(result.sales[0].currencyCode).toBe("KES");
    expect(result.sales[0].status).toBe("COMPLETED");
  });

  it("should get branch stock movements", async () => {
    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-1", organizationId: "org-1" });
    mockPrisma.client.stockMovement.findMany.mockResolvedValue([
      {
        id: "mov-1",
        quantity: "50",
        movementType: "PURCHASE_RECEIPT",
        movementDate: new Date("2026-10-31T08:00:00Z"),
        fromLocationId: null,
        toLocationId: "loc-1",
        notes: "Restock deliveries",
        variant: { product: { name: "Croissant Box" } },
        fromLocation: null,
        toLocation: { id: "loc-1", name: "Main Store" },
        member: { user: { name: "Manager Jane" } },
      },
    ]);

    const result = await useCase.getBranchStockMovements(mockContext, "loc-1", 10);
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].variantName).toBe("Croissant Box");
    expect(result.movements[0].direction).toBe("IN");
    expect(result.movements[0].quantity).toBe(50);
  });
});
