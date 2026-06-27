import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { V3AuthService } from "../v3-auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V3AuthCoreService } from "../../../../auth-core/infrastructure/services/v3-auth-core.service";
import * as bcrypt from "bcryptjs";

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

describe("V3AuthService", () => {
  let service: V3AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V3AuthService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              client: {
                v3ApiClient: {
                  findUnique: vi.fn(),
                },
              },
              member: {
                findMany: vi.fn(),
              },
            },
          },
        },
        {
          provide: V3AuthCoreService,
          useValue: {
            generateToken: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<V3AuthService>(V3AuthService);
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
  });
});
