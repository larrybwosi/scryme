import { Test, TestingModule } from "@nestjs/testing";
import { ScrymeService } from "../scryme.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ScrymeApprovalService } from "../scryme-approval.service";
import { createHmac } from "crypto";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("ScrymeService", () => {
  let service: ScrymeService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      scrymeConfiguration: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
      windmillExecution: {
        create: vi.fn(),
      },
      approvalDecision: {
        findUnique: vi.fn(),
      },
      department: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      inventoryLocation: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  const mockScrymeApprovalService = {
    notifyApprovers: vi.fn(),
    updateStepMessages: vi.fn(),
    notifyRequester: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrymeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ScrymeApprovalService, useValue: mockScrymeApprovalService },
      ],
    }).compile();

    service = module.get<ScrymeService>(ScrymeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("handleWebhook", () => {
    const payload = {
      event: "message.action",
      data: {
        workspaceSlug: "org-test",
        action: { id: "test-action" },
        message: { id: "msg-1" },
        user: { id: "user-1" },
      },
    };

    it("should verify signature correctly", async () => {
      const secret = "test-secret";
      process.env.SCRYME_WEBHOOK_SECRET = secret;

      const signature = createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      mockPrisma.client.scrymeConfiguration.findFirst.mockResolvedValue({
        organizationId: "org-1",
        organization: {
          windmillConfiguration: { id: "wm-1" },
        },
      });

      const result = await service.handleWebhook(signature, payload);
      expect(result.status).toBe("success");
      expect(mockPrisma.client.windmillExecution.create).toHaveBeenCalled();

      delete process.env.SCRYME_WEBHOOK_SECRET;
    });

    it("should throw BadRequestException for invalid signature", async () => {
      process.env.SCRYME_WEBHOOK_SECRET = "test-secret";

      await expect(
        service.handleWebhook("invalid-sig", payload),
      ).rejects.toThrow(BadRequestException);

      delete process.env.SCRYME_WEBHOOK_SECRET;
    });
  });

  describe("provisionChannelForEntity (IDOR defense)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should query department scoped to organizationId (IDOR protection)", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        workspaceSlug: "test-workspace",
        isActive: true,
      });

      mockPrisma.client.department.findFirst.mockResolvedValue({
        id: "dept-123",
        name: "Engineering",
        scrymeChannelId: null,
      });

      vi.spyOn(service["scrymeClient"], "createChannel").mockResolvedValue({
        id: "channel-123",
      } as any);

      await service.provisionChannelForEntity("org-123", "department", "dept-123");

      expect(mockPrisma.client.department.findFirst).toHaveBeenCalledWith({
        where: { id: "dept-123", organizationId: "org-123" },
      });
      expect(mockPrisma.client.department.update).toHaveBeenCalledWith({
        where: { id: "dept-123" },
        data: { scrymeChannelId: "channel-123" },
      });
    });

    it("should query inventory location scoped to organizationId (IDOR protection)", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        workspaceSlug: "test-workspace",
        isActive: true,
      });

      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-123",
        name: "Warehouse",
        scrymeChannelId: null,
      });

      vi.spyOn(service["scrymeClient"], "createChannel").mockResolvedValue({
        id: "channel-456",
      } as any);

      await service.provisionChannelForEntity("org-123", "location", "loc-123");

      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-123", organizationId: "org-123" },
      });
      expect(mockPrisma.client.inventoryLocation.update).toHaveBeenCalledWith({
        where: { id: "loc-123" },
        data: { scrymeChannelId: "channel-456" },
      });
    });
  });
});
