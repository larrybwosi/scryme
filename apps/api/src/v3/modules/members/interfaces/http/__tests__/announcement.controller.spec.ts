import { AnnouncementController, AnnouncementDto } from "../announcement.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/windmill/server", () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("AnnouncementController", () => {
  let controller: AnnouncementController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      inventoryLocation: {
        findFirst: vi.fn(),
      },
      scrymeConfiguration: {
        findUnique: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    prismaService = mockPrismaService as any;
    controller = new AnnouncementController(prismaService);
    vi.clearAllMocks();
  });

  describe("broadcastAnnouncement", () => {
    it("should successfully broadcast an announcement without targetBranchId", async () => {
      const req = {
        v3Context: {
          organizationId: "org-123",
          memberId: "mem-123",
        },
      };

      const dto: AnnouncementDto = {
        title: "Company Update",
        message: "All hands meeting tomorrow.",
      };

      mockPrismaService.client.scrymeConfiguration.findUnique.mockResolvedValue(null);

      const result = await controller.broadcastAnnouncement(req, dto);

      expect(result).toBeNull();
      expect(mockPrismaService.client.inventoryLocation.findFirst).not.toHaveBeenCalled();
    });

    it("should successfully broadcast an announcement when targetBranchId belongs to the organization", async () => {
      const req = {
        v3Context: {
          organizationId: "org-123",
          memberId: "mem-123",
        },
      };

      const dto: AnnouncementDto = {
        title: "Branch Sale",
        message: "Flash sale at main branch.",
        targetBranchId: "loc-123",
      };

      mockPrismaService.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-123",
        organizationId: "org-123",
      });
      mockPrismaService.client.scrymeConfiguration.findUnique.mockResolvedValue(null);

      const result = await controller.broadcastAnnouncement(req, dto);

      expect(result).toBeNull();
      expect(mockPrismaService.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-123", organizationId: "org-123" },
      });
    });

    it("should throw BadRequestException when targetBranchId does not belong to the organization (IDOR)", async () => {
      const req = {
        v3Context: {
          organizationId: "org-123",
          memberId: "mem-123",
        },
      };

      const dto: AnnouncementDto = {
        title: "Malicious Broadcast",
        message: "Attempting to broadcast with foreign branch.",
        targetBranchId: "loc-foreign",
      };

      mockPrismaService.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(
        controller.broadcastAnnouncement(req, dto),
      ).rejects.toThrow(new BadRequestException("Target branch location not found"));

      expect(mockPrismaService.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-foreign", organizationId: "org-123" },
      });
    });
  });
});
