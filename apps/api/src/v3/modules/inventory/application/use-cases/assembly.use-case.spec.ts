import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssemblyUseCase } from "./assembly.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("AssemblyUseCase Security Hardening", () => {
  let useCase: AssemblyUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        productVariant: {
          count: vi.fn(),
          findUnique: vi.fn(),
        },
        stockBatch: {
          count: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        assembly: {
          create: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        productVariantStock: {
          update: vi.fn(),
          upsert: vi.fn(),
        },
        stockMovement: {
          create: vi.fn(),
        },
        $transaction: vi.fn((cb) => cb(prisma.client)),
      },
    };
    useCase = new AssemblyUseCase(prisma);
  });

  describe("create", () => {
    it("should throw NotFoundException if variant belongs to another organization", async () => {
      prisma.client.productVariant.count.mockResolvedValue(0);

      await expect(
        useCase.create("org-1", "member-1", {
          name: "Test Assembly",
          variantId: "foreign-variant",
          quantity: 1,
          items: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if component variant belongs to another organization", async () => {
      prisma.client.productVariant.count.mockResolvedValue(1); // Only 1 of 2 variants found

      await expect(
        useCase.create("org-1", "member-1", {
          name: "Test Assembly",
          variantId: "own-variant",
          quantity: 1,
          items: [{ variantId: "foreign-variant", quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if component batch belongs to another organization", async () => {
      prisma.client.productVariant.count.mockResolvedValue(2);
      prisma.client.stockBatch.count.mockResolvedValue(0);

      await expect(
        useCase.create("org-1", "member-1", {
          name: "Test Assembly",
          variantId: "own-variant",
          quantity: 1,
          items: [{ variantId: "own-comp", quantity: 1, stockBatchId: "foreign-batch" }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("complete", () => {
    it("should throw NotFoundException if location belongs to another organization", async () => {
      prisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(
        useCase.complete("org-1", "member-1", "assembly-1", "foreign-location"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should use updateMany with organizationId scoping for batch deduction", async () => {
      prisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "own-location" });
      prisma.client.assembly.findUnique.mockResolvedValue({
        id: "assembly-1",
        organizationId: "org-1",
        status: "PLANNED",
        items: [{ variantId: "comp-1", quantity: 1, stockBatchId: "batch-1" }],
      });
      prisma.client.productVariant.findUnique.mockResolvedValue({ productId: "prod-1" });
      prisma.client.stockBatch.create.mockResolvedValue({ id: "produced-batch-1" });

      await useCase.complete("org-1", "member-1", "assembly-1", "own-location");

      expect(prisma.client.stockBatch.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "batch-1", organizationId: "org-1" },
        }),
      );
    });
  });
});
