import { Test, TestingModule } from "@nestjs/testing";
import { ScrymeService } from "../scryme.service";
import { PrismaService } from "../../../prisma/prisma.service";
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
        upsert: vi.fn(),
      },
      windmillExecution: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrymeService,
        { provide: PrismaService, useValue: mockPrisma },
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

      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
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
});
