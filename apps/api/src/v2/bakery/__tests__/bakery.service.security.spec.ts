import { Test, TestingModule } from "@nestjs/testing";
import { BakeryService } from "../bakery.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../../auth/auth.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { V2ApiContext } from "@repo/shared/api/v2";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
});
