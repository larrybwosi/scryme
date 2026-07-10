import { Test, TestingModule } from "@nestjs/testing";
import { InventoryService } from "../inventory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "../../../common/services/realtime.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: ApiRealtimeService,
          useValue: {
            publish: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              productVariantStock: {
                create: vi.fn(),
                findMany: vi.fn(),
                findFirst: vi.fn(),
                updateMany: vi.fn(),
                deleteMany: vi.fn(),
                count: vi.fn(),
                fields: {
                  reorderPoint: "reorderPoint",
                },
              },
              stockMovement: {
                create: vi.fn(),
                findMany: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("getInventory", () => {
    it("should return paginated inventory data", async () => {
      const ctx = { organizationId: "org-1" } as any;
      const query = { page: 1, limit: 10 };

      const mockStocks = [
        {
          id: "stock-1",
          availableStock: 10,
          reorderPoint: 5,
          variant: {
            id: "v1",
            sku: "SKU1",
            product: { id: "p1", name: "Product 1" },
          },
          location: { id: "l1", name: "Location 1" },
        },
      ];

      (prisma.client.productVariantStock.findMany as any).mockResolvedValue(
        mockStocks,
      );
      (prisma.client.productVariantStock.count as any).mockResolvedValue(1);

      const result = await service.getInventory(ctx, query);

      expect(result).toHaveProperty("data");
      expect(result.data).toHaveLength(1);
      const item = result.data[0];
      expect(item.sku).toBe("SKU1");
      expect(item.availableStock).toBe(10);
      expect(item.isLowStock).toBe(false);
    });

    it("should filter by low stock at the database level", async () => {
      const ctx = { organizationId: "org-1" } as any;
      const query = { lowStock: "true" };

      (prisma.client.productVariantStock.findMany as any).mockResolvedValue([]);
      (prisma.client.productVariantStock.count as any).mockResolvedValue(0);

      await service.getInventory(ctx, query);

      expect(prisma.client.productVariantStock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableStock: {
              lte: expect.anything(),
            },
          }),
        }),
      );
    });
  });

  describe("createInventoryItem", () => {
    it("should whitelist fields and enforce organizationId", async () => {
      const ctx = { organizationId: "my-org" } as any;
      const data = {
        productId: "p1",
        variantId: "v1",
        locationId: "l1",
        currentStock: 10,
        availableStock: 10,
        reorderPoint: 5,
        reorderQty: 10,
        maliciousField: "hack",
      };

      await service.createInventoryItem(ctx, data);

      expect(prisma.client.productVariantStock.create).toHaveBeenCalledWith({
        data: {
          productId: "p1",
          variantId: "v1",
          locationId: "l1",
          currentStock: 10,
          availableStock: 10,
          reorderPoint: 5,
          reorderQty: 10,
          organizationId: "my-org",
        },
      });
    });
  });

  describe("updateInventoryItem", () => {
    it("should whitelist fields and enforce multi-tenant isolation", async () => {
      const ctx = { organizationId: "my-org" } as any;
      const data = {
        currentStock: 20,
        maliciousField: "hack",
      };
      const id = "stock-123";

      (prisma.client.productVariantStock.updateMany as any).mockResolvedValue({
        count: 1,
      });
      vi.spyOn(service, "getInventoryItem").mockResolvedValue({ data: {} } as any);

      await service.updateInventoryItem(ctx, id, data);

      expect(prisma.client.productVariantStock.updateMany).toHaveBeenCalledWith({
        where: { id, organizationId: "my-org" },
        data: { currentStock: 20 },
      });
    });

    it("should throw NotFoundException if no item was updated", async () => {
      const ctx = { organizationId: "my-org" } as any;
      (prisma.client.productVariantStock.updateMany as any).mockResolvedValue({
        count: 0,
      });

      await expect(
        service.updateInventoryItem(ctx, "id", { currentStock: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createInventoryMovement", () => {
    it("should validate inventory item ownership and enforce memberId", async () => {
      const ctx = { organizationId: "my-org", memberId: "member-123" } as any;
      const inventoryId = "inv-123";
      const data = {
        quantity: 5,
        movementType: "SALE",
        maliciousField: "hack",
      };

      (prisma.client.productVariantStock.findFirst as any).mockResolvedValue({
        id: inventoryId,
        variantId: "v1",
        organizationId: "my-org",
      });

      await service.createInventoryMovement(ctx, inventoryId, data);

      expect(prisma.client.productVariantStock.findFirst).toHaveBeenCalledWith({
        where: { id: inventoryId, organizationId: "my-org" },
      });

      expect(prisma.client.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: "v1",
          quantity: 5,
          movementType: "SALE",
          organizationId: "my-org",
          memberId: "member-123",
        }),
      });
    });

    it("should throw NotFoundException if inventory item not found in organization", async () => {
      const ctx = { organizationId: "my-org" } as any;
      (prisma.client.productVariantStock.findFirst as any).mockResolvedValue(null);

      await expect(
        service.createInventoryMovement(ctx, "inv-123", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getInventoryItem (IDOR Check)", () => {
    it("should throw NotFoundException if item belongs to a different organization", async () => {
      const ctx = { organizationId: "my-org" } as any;
      const stockId = "stock-123";

      // Mock findFirst to return null because of the organizationId filter
      (prisma.client.productVariantStock.findFirst as any).mockResolvedValue(null);

      await expect(service.getInventoryItem(ctx, stockId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
