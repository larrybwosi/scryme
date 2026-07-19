import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SyncUseCase } from "./sync.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { PosCustomerService } from "@/v2/pos/pos-customer.service";

// Mock the shared modules so we don't import actual dynamic helpers
vi.mock("@repo/shared/api/v2", () => ({
  getPosProducts: vi.fn().mockResolvedValue([{ id: "prod-1" }]),
  getPosProductsDelta: vi.fn().mockResolvedValue([{ id: "prod-2" }]),
}));

describe("SyncUseCase", () => {
  let useCase: SyncUseCase;
  let prisma: any;
  let posCustomerService: any;

  beforeEach(async () => {
    prisma = {
      client: {
        category: {
          findMany: vi.fn(),
        },
      },
    };
    posCustomerService = {
      getCustomersDelta: vi.fn().mockResolvedValue({ data: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncUseCase,
        { provide: PrismaService, useValue: prisma },
        { provide: PosCustomerService, useValue: posCustomerService },
      ],
    }).compile();

    useCase = module.get<SyncUseCase>(SyncUseCase);
  });

  it("should sync all categories when lastSync is not provided", async () => {
    const ctx = {
      organizationId: "org-1",
      locationId: "loc-1",
    };
    const query = {};

    prisma.client.category.findMany.mockResolvedValue([
      { id: "cat-1", name: "Beverages" },
    ]);

    const result = await useCase.execute(ctx as any, query);

    expect(result.categories).toHaveLength(1);
    expect(prisma.client.category.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org-1" },
      select: { id: true, name: true, description: true },
    });
  });

  it("should sync only updated categories when lastSync is provided", async () => {
    const ctx = {
      organizationId: "org-1",
      locationId: "loc-1",
    };
    const lastSyncDateStr = "2026-07-01T00:00:00.000Z";
    const query = { lastSync: lastSyncDateStr };

    prisma.client.category.findMany.mockResolvedValue([
      { id: "cat-2", name: "Snacks" },
    ]);

    const result = await useCase.execute(ctx as any, query);

    expect(result.categories).toHaveLength(1);
    expect(prisma.client.category.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        updatedAt: { gt: new Date(lastSyncDateStr) },
      },
      select: { id: true, name: true, description: true },
    });
  });
});
