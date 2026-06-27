import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { V3AuthCoreService } from "../v3-auth-core.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import * as bcrypt from "bcryptjs";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
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
      (bcrypt.compare as any).mockImplementation(
        (pin: string, hash: string) => pin === "1234" && hash === "match",
      );

      const result = await (service as any).validateLoginMember(
        "org-1",
        "1234",
      );
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
  });
});
