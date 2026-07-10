import { Test, TestingModule } from "@nestjs/testing";
import { V3AuthService } from "../v3-auth.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V3AuthCoreService } from "../../../../auth-core/infrastructure/services/v3-auth-core.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("V3AuthService", () => {
  let service: V3AuthService;
  let authCore: V3AuthCoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V3AuthService,
        {
          provide: PrismaService,
          useValue: {
            client: {},
          },
        },
        {
          provide: V3AuthCoreService,
          useValue: {
            provisionDevice: vi.fn(),
            validateClient: vi.fn(),
            generateToken: vi.fn(),
            loginMember: vi.fn(),
            verifyToken: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<V3AuthService>(V3AuthService);
    authCore = module.get<V3AuthCoreService>(V3AuthCoreService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("loginMember", () => {
    it("should delegate to authCore.loginMember", async () => {
      const clientId = "client-123";
      const pin = "1234";
      const mockToken = { access_token: "token" };
      vi.mocked(authCore.loginMember).mockResolvedValue(mockToken as any);

      const result = await service.loginMember(clientId, pin);

      expect(authCore.loginMember).toHaveBeenCalledWith(clientId, pin);
      expect(result).toEqual(mockToken);
    });
  });

  describe("delegations", () => {
    it("should delegate provisionDevice", async () => {
      await service.provisionDevice("token");
      expect(authCore.provisionDevice).toHaveBeenCalledWith("token");
    });

    it("should delegate validateClient", async () => {
      await service.validateClient("id", "secret");
      expect(authCore.validateClient).toHaveBeenCalledWith("id", "secret");
    });

    it("should delegate generateToken", async () => {
      await service.generateToken({});
      expect(authCore.generateToken).toHaveBeenCalledWith({}, undefined);
    });

    it("should delegate verifyToken", async () => {
      await service.verifyToken("token");
      expect(authCore.verifyToken).toHaveBeenCalledWith("token");
    });
  });
});
