import { Test, TestingModule } from "@nestjs/testing";
import { PosController } from "../pos.controller";
import { V3AuthCoreService } from "../../../../auth-core/infrastructure/services/v3-auth-core.service";
import { ProcessSaleUseCase } from "../../../application/use-cases/process-sale.use-case";
import { SyncUseCase } from "../../../application/use-cases/sync.use-case";
import { GetTransactionsUseCase } from "../../../application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "../../../application/use-cases/register-petty-cash.use-case";
import { PosLoginDto } from "../../../application/dto/pos.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { PosService } from "@/v2/pos/pos.service";
import { PosCustomerService } from "@/v2/pos/pos-customer.service";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("PosController (V3)", () => {
  let controller: PosController;
  let authCoreService: V3AuthCoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            client: {
              v3ApiClient: { findUnique: vi.fn() },
              inventoryLocation: { findMany: vi.fn() },
            },
          },
        },
        {
          provide: PosService,
          useValue: {
            getPricing: vi.fn(),
          },
        },
        {
          provide: PosCustomerService,
          useValue: {
            getCustomersDelta: vi.fn(),
          },
        },
        {
          provide: V3AuthCoreService,
          useValue: {
            loginMember: vi.fn(),
            provisionDevice: vi.fn(),
          },
        },
        {
          provide: ProcessSaleUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: SyncUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: GetTransactionsUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: RegisterPettyCashUseCase,
          useValue: { execute: vi.fn(), getFunds: vi.fn(), getRecentTransactions: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
    authCoreService = module.get<V3AuthCoreService>(V3AuthCoreService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("PosLoginDto class-validator integration", () => {
    it("should pass validation when deviceKey and locationId are included in request body", async () => {
      const plainPayload = {
        cardId: "1234",
        pin: "5678",
        deviceKey: "device_key_abc.secret",
        locationId: "loc_xyz",
      };

      const dtoInstance = plainToInstance(PosLoginDto, plainPayload);
      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors.length).toBe(0);
    });

    it("should pass validation when clientId is provided instead of deviceKey", async () => {
      const plainPayload = {
        clientId: "client_123",
        pin: "1234",
      };

      const dtoInstance = plainToInstance(PosLoginDto, plainPayload);
      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors.length).toBe(0);
    });
  });

  describe("login endpoint", () => {
    it("should login using deviceKey fallback from request body", async () => {
      const mockResult = {
        token: "mock_access_token",
        accessToken: "mock_access_token",
        member: { id: "m1", name: "Staff Member", role: "OWNER", cardId: "1234" },
      };
      vi.mocked(authCoreService.loginMember).mockResolvedValue(mockResult as any);

      const mockReq = { headers: {} };
      const body: PosLoginDto = {
        cardId: "1234",
        pin: "1111",
        deviceKey: "dev_key_123.secret_hash",
        locationId: "loc_1",
      };

      const response = await controller.login(body, mockReq);

      expect(response).toEqual(mockResult);
      expect(authCoreService.loginMember).toHaveBeenCalledWith(
        "dev_key_123",
        "1111",
        "1234",
      );
    });

    it("should login using X-API-KEY header when clientId and deviceKey are missing in body", async () => {
      const mockResult = {
        token: "mock_access_token",
        accessToken: "mock_access_token",
        member: { id: "m2", name: "Staff Member", role: "STAFF", cardId: "9999" },
      };
      vi.mocked(authCoreService.loginMember).mockResolvedValue(mockResult as any);

      const mockReq = { headers: { "x-api-key": "header_key_456.secret" } };
      const body: PosLoginDto = {
        cardId: "9999",
      };

      const response = await controller.login(body, mockReq);

      expect(response).toEqual(mockResult);
      expect(authCoreService.loginMember).toHaveBeenCalledWith(
        "header_key_456",
        "",
        "9999",
      );
    });

    it("should throw BadRequestException if no clientId, deviceKey, or X-API-KEY header is supplied", async () => {
      const mockReq = { headers: {} };
      const body: PosLoginDto = { cardId: "1234" };

      await expect(controller.login(body, mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe("getMe endpoint", () => {
    it("should return context with isCheckedIn: true when memberId is present", async () => {
      const mockCtx = {
        clientId: "client_1",
        organizationId: "org_1",
        orgSlug: "slug-1",
        memberId: "m1",
        locationId: "loc_1",
        authType: "v3_hybrid",
      } as any;

      const result = await controller.getMe(mockCtx);
      expect(result).toEqual({
        ...mockCtx,
        isCheckedIn: true,
      });
    });

    it("should return context with isCheckedIn: false when memberId is null", async () => {
      const mockCtx = {
        clientId: "client_1",
        organizationId: "org_1",
        orgSlug: "slug-1",
        memberId: null,
        locationId: "loc_1",
        authType: "v3_client",
      } as any;

      const result = await controller.getMe(mockCtx);
      expect(result).toEqual({
        ...mockCtx,
        isCheckedIn: false,
      });
    });
  });
});
