import { Test, TestingModule } from "@nestjs/testing";
import { BakeryService } from "../bakery.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../../auth/auth.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { V2ApiContext } from "@repo/shared/api/v2";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "decimal.js";

describe("BakeryService Security", () => {
  let service: BakeryService;
  let prisma: any;

  const mockPrisma = {
    client: {
      bakeryCategory: {
        findFirst: vi.fn(),
      },
      bakerySettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
      bakeryBaker: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      template: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      stockReceipt: {
        create: vi.fn(),
      },
      productVariant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      batch: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      stockBatch: {
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      batchIngredientConsumption: {
        createMany: vi.fn(),
      },
      stockMovement: {
        createMany: vi.fn(),
        create: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
    },
  };

  const mockAuthService = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BakeryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<BakeryService>(BakeryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const ctx: V2ApiContext = {
    organizationId: "org-1",
    memberId: "member-1",
    locationId: "loc-1",
    permissions: [],
  };

  describe("completeBatch", () => {
    it("should prevent using stock batches from another organization (IDOR)", async () => {
      mockPrisma.client.batch.findUnique.mockResolvedValue({
        id: "batch-1",
        organizationId: "org-1",
        batchNumber: "BAT-1",
        recipe: {
          producesVariantId: "variant-1",
          producesVariant: { productId: "product-1" },
        },
      });

      mockPrisma.client.batch.update.mockResolvedValue({
        id: "batch-1",
        expiresAt: new Date(),
      });

      mockPrisma.client.stockBatch.create.mockResolvedValue({
        id: "new-stock-batch",
      });

      // Mock finding stock batches.
      // If we query with organizationId, it should only return batches from that org.
      // In this test case, we simulate that findMany returns an empty array because
      // the requested stock-batch-1 belongs to 'other-org' and we are searching within 'org-1'.
      mockPrisma.client.stockBatch.findMany.mockImplementation(({ where }: any) => {
        if (where.organizationId === "org-1" && where.id.in.includes("stock-batch-1")) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const data = {
        actualQuantity: 10,
        ingredientConsumptions: [{ stockBatchId: "stock-batch-1", quantity: 5 }],
      };

      // 🛡️ Sentinel: This SHOULD throw ForbiddenException if fixed.
      // Currently, it might not throw anything (vulnerable) or throw something else.
      await expect(service.completeBatch(ctx, "batch-1", data)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("addBaker", () => {
    it("should prevent adding a member from another organization (IDOR)", async () => {
      mockPrisma.client.bakerySettings.findUnique.mockResolvedValue({ id: "settings-1", organizationId: "org-1" });
      // Member belongs to another org (not found in current org)
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(service.addBaker(ctx, { memberId: "member-from-other-org" }))
        .rejects.toThrow(ForbiddenException);
    });

    it("should prevent mass assignment of sensitive fields", async () => {
      mockPrisma.client.bakerySettings.findUnique.mockResolvedValue({ id: "settings-1", organizationId: "org-1" });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member-1", organizationId: "org-1" });
      mockPrisma.client.bakeryBaker.create.mockResolvedValue({ id: "baker-1" });

      await service.addBaker(ctx, {
        memberId: "member-1",
        bakerySettingsId: "hack-settings-id",
        extraField: "evil",
        isActive: true,
      } as any);

      expect(mockPrisma.client.bakeryBaker.create).toHaveBeenCalledWith({
        data: {
          bakerySettingsId: "settings-1", // Should use the one from getSettings, not from input
          memberId: "member-1",
          isActive: true,
          specialties: undefined,
        },
      });
    });
  });

  describe("updateBaker", () => {
    it("should enforce organizationId scoping (IDOR)", async () => {
      mockPrisma.client.bakeryBaker.findFirst.mockResolvedValue(null);

      await expect(service.updateBaker(ctx, "baker-1", { specialties: ["Bread"] }))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.client.bakeryBaker.findFirst).toHaveBeenCalledWith({
        where: { id: "baker-1", bakerySettings: { organizationId: "org-1" } },
      });
    });

    it("should prevent changing memberId or bakerySettingsId via update (Mass Assignment)", async () => {
      mockPrisma.client.bakeryBaker.findFirst.mockResolvedValue({
        id: "baker-1",
        bakerySettingsId: "settings-1",
        memberId: "member-1",
      });
      mockPrisma.client.bakeryBaker.update.mockResolvedValue({ id: "baker-1" });

      await service.updateBaker(ctx, "baker-1", {
        memberId: "hacked-member",
        bakerySettingsId: "hacked-settings",
        specialties: ["Bread"],
      } as any);

      expect(mockPrisma.client.bakeryBaker.update).toHaveBeenCalledWith({
        where: { id: "baker-1" },
        data: {
          specialties: ["Bread"],
          isActive: undefined,
        },
      });
    });
  });

  describe("getCategory", () => {
    it("should use findFirst to enforce organizationId scoping", async () => {
      mockPrisma.client.bakeryCategory.findFirst.mockResolvedValue({ id: "cat-1", organizationId: "org-1" });

      await service.getCategory(ctx, "cat-1");

      expect(mockPrisma.client.bakeryCategory.findFirst).toHaveBeenCalledWith({
        where: { id: "cat-1", organizationId: "org-1" },
      });
    });
  });

  describe("receiveIngredients", () => {
    it("should prevent receiving stock for a variant from another organization (IDOR)", async () => {
      mockPrisma.client.stockReceipt.create.mockResolvedValue({ id: "receipt-1" });
      // In a vulnerable state, findUnique only checks ID, so it might return a variant
      // even if it belongs to another org.
      mockPrisma.client.productVariant.findUnique.mockResolvedValue({ productId: "p-1" });
      mockPrisma.client.productVariant.findFirst.mockResolvedValue(null);

      const data = {
        receiptReference: "REF-1",
        lines: [{ ingredientId: "other-org-variant", quantity: 10, unitCost: 5 }],
      };

      // If we use findFirst (the fix), it should throw NotFoundException because it won't find it in the current org
      await expect(service.receiveIngredients(ctx, data)).rejects.toThrow(NotFoundException);

      // We check that findFirst was called with organizationId scoping
      expect(mockPrisma.client.productVariant.findFirst).toHaveBeenCalledWith({
        where: {
          id: "other-org-variant",
          product: { organizationId: "org-1" }
        },
        select: { productId: true },
      });
    });
  });

  describe("createTemplate", () => {
    it("should prevent mass assignment of organizationId", async () => {
      mockPrisma.client.template.create.mockResolvedValue({ id: "template-1" });

      await service.createTemplate(ctx, {
        name: "My Template",
        organizationId: "hacked-org",
        recipeId: "recipe-1",
        quantity: 10,
      } as any);

      // In a vulnerable state, it will be called with "hacked-org"
      // We expect it to be called with "org-1" after the fix.
      // For now, it fails because it's called with "hacked-org".
      expect(mockPrisma.client.template.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1", // Should use the one from ctx
        }),
      });
    });
  });
});
