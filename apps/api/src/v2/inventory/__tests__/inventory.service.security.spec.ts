import { Test, TestingModule } from "@nestjs/testing";
import { InventoryService } from "../inventory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "../../../common/services/realtime.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { V2ApiContext } from "@repo/shared/api/v2";

describe("InventoryService Security", () => {
  let service: InventoryService;
  let prisma: any;

  const mockPrisma = {
    client: {
      productVariantStock: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
        fields: {
          reorderPoint: "reorderPoint",
        },
      },
      stockMovement: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: ApiRealtimeService,
          useValue: { publish: vi.fn() },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const ctx: V2ApiContext = {
    organizationId: "org-1",
    memberId: "member-1",
    locationId: "loc-1",
    permissions: [],
  };

  describe("createInventoryItem", () => {
    it("should prevent mass assignment of organizationId", async () => {
      await service.createInventoryItem(ctx, {
        productId: "p1",
        variantId: "v1",
        locationId: "l1",
        organizationId: "hacked-org",
        availableStock: 9999, // Should not be allowed to set initial stock directly
      } as any);

      const call = mockPrisma.client.productVariantStock.create.mock.calls[0][0];
      expect(call.data.organizationId).toBe("org-1");
      expect(call.data.availableStock).toBeUndefined(); // Or it should be 0/default if we whitelist
    });
  });

  describe("updateInventoryItem", () => {
    it("should prevent mass assignment and organizationId modification", async () => {
      mockPrisma.client.productVariantStock.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.productVariantStock.findFirst.mockResolvedValue({ id: "stock-1" });

      await service.updateInventoryItem(ctx, "stock-1", {
        organizationId: "hacked-org",
        availableStock: 100,
        evilField: "malicious",
      } as any);

      const call = mockPrisma.client.productVariantStock.updateMany.mock.calls[0][0];
      expect(call.where.organizationId).toBe("org-1");
      expect(call.data.organizationId).toBeUndefined();
      expect(call.data.evilField).toBeUndefined();
    });
  });

  describe("createInventoryMovement", () => {
    it("should enforce memberId and organizationId from context", async () => {
      await service.createInventoryMovement(ctx, "stock-1", {
        quantity: 10,
        memberId: "hacked-member",
        organizationId: "hacked-org",
        movementType: "IN",
        evilField: "malicious",
      } as any);

      const call = mockPrisma.client.stockMovement.create.mock.calls[0][0];
      expect(call.data.organizationId).toBe("org-1");
      expect(call.data.memberId).toBe("member-1");
      expect(call.data.evilField).toBeUndefined();
    });
  });
});
