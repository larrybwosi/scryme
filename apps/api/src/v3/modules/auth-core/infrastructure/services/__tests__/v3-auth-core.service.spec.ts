import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { V3AuthCoreService } from "../v3-auth-core.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import * as bcrypt from "bcryptjs";
import { validateV3ApiSecret } from "@repo/shared/actions";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

vi.mock("@repo/shared/actions", () => ({
  validateV3ApiSecret: vi.fn(),
}));

describe("V3AuthCoreService", () => {
  let service: V3AuthCoreService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V3AuthCoreService,
        {
          provide: RedisService,
          useValue: {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            incr: vi.fn(),
            expire: vi.fn(),
            ttl: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              member: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                findFirst: vi.fn(),
              },
              v3ApiClient: {
                findUnique: vi.fn(),
              },
              deviceRegistry: {
                findFirst: vi.fn(),
              },
              attendanceLog: {
                findFirst: vi.fn(),
                create: vi.fn(),
              },
              organization: {
                findUnique: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<V3AuthCoreService>(V3AuthCoreService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("validateLoginMember", () => {
    it("should throw UnauthorizedException if more than 100 members are returned", async () => {
      const mockMembers = Array(101).fill({ id: "1", pinHash: "hash" });
      (prisma.client.member.findMany as any).mockResolvedValue(mockMembers);

      await expect(
        (service as any).validateLoginMember("org-1", "1234"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return member if PIN matches within first 100 members", async () => {
      const mockMembers = Array(50).fill({ id: "1", pinHash: "hash" });
      mockMembers.push({ id: "success", pinHash: "match" });
      (prisma.client.member.findMany as any).mockResolvedValue(mockMembers);
      (bcrypt.compare as any).mockImplementation((pin: string, hash: string) => pin === "1234" && hash === "match");

      const result = await (service as any).validateLoginMember("org-1", "1234");
      expect(result.id).toBe("success");
    });

    it("should throw UnauthorizedException if no member matches", async () => {
      const mockMembers = [{ id: "1", pinHash: "hash" }];
      (prisma.client.member.findMany as any).mockResolvedValue(mockMembers);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        (service as any).validateLoginMember("org-1", "1234"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return member if cardId is provided and PIN matches", async () => {
      const mockMember = { id: "member-1", isActive: true, pinHash: "hash-1" };
      (prisma.client.member.findUnique as any).mockResolvedValue(mockMember);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await (service as any).validateLoginMember(
        "org-1",
        "1234",
        "card-123",
      );
      expect(result.id).toBe("member-1");
      expect(prisma.client.member.findUnique).toHaveBeenCalledWith({
        where: { organizationId_cardId: { organizationId: "org-1", cardId: "card-123" } },
        include: { user: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("1234", "hash-1");
    });

    it("should call bcrypt.compare with dummy pin hash and fail if cardId is provided but member is not found", async () => {
      (prisma.client.member.findUnique as any).mockResolvedValue(null);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        (service as any).validateLoginMember("org-1", "1234", "card-none"),
      ).rejects.toThrow(UnauthorizedException);

      const expectedDummyHash = "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO";
      expect(bcrypt.compare).toHaveBeenCalledWith("1234", expectedDummyHash);
    });

    it("should call bcrypt.compare with dummy pin hash and fail if cardId is provided but member is inactive", async () => {
      const mockMember = { id: "member-inactive", isActive: false, pinHash: "hash-inactive" };
      (prisma.client.member.findUnique as any).mockResolvedValue(mockMember);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        (service as any).validateLoginMember("org-1", "1234", "card-inactive"),
      ).rejects.toThrow(UnauthorizedException);

      // Even if member is inactive, we run bcrypt.compare with their pinHash to hide the existence/activity status difference
      expect(bcrypt.compare).toHaveBeenCalledWith("1234", "hash-inactive");
    });
  });

  describe("validateClient", () => {
    it("should throw unified UnauthorizedException('Invalid client credentials') when client is not found", async () => {
      (prisma.client.v3ApiClient.findUnique as any).mockResolvedValue(null);
      vi.mocked(validateV3ApiSecret).mockResolvedValue(false);

      await expect(
        service.validateClient("client-missing", "secret"),
      ).rejects.toThrow(new UnauthorizedException("Invalid client credentials"));
    });

    it("should return client without validating secret when clientSecret is omitted", async () => {
      const mockClient = { id: "client-1", isActive: true };
      (prisma.client.v3ApiClient.findUnique as any).mockResolvedValue(mockClient);

      const result = await service.validateClient("client-1");
      expect(result).toBe(mockClient);
      expect(validateV3ApiSecret).not.toHaveBeenCalled();
    });

    it("should throw unified UnauthorizedException('Invalid client credentials') when secret is invalid", async () => {
      const mockClient = { id: "client-1", isActive: true };
      (prisma.client.v3ApiClient.findUnique as any).mockResolvedValue(mockClient);
      vi.mocked(validateV3ApiSecret).mockResolvedValue(false);

      await expect(
        service.validateClient("client-1", "wrong-secret"),
      ).rejects.toThrow(new UnauthorizedException("Invalid client credentials"));

      expect(validateV3ApiSecret).toHaveBeenCalledWith("client-1", "wrong-secret");
    });

    it("should return client when client exists, is active, and secret is valid", async () => {
      const mockClient = { id: "client-1", isActive: true };
      (prisma.client.v3ApiClient.findUnique as any).mockResolvedValue(mockClient);
      vi.mocked(validateV3ApiSecret).mockResolvedValue(true);

      const result = await service.validateClient("client-1", "valid-secret");
      expect(result).toBe(mockClient);
      expect(validateV3ApiSecret).toHaveBeenCalledWith("client-1", "valid-secret");
    });
  });
});
