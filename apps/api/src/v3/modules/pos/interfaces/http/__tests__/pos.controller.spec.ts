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
import { PosSaleService } from "@/v2/pos/pos-sale.service";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("PosController (V3)", () => {
  let controller: PosController;
  let authCoreService: V3AuthCoreService;
  let posService: PosService;
  let posSaleService: PosSaleService;

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
              product: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
              $transaction: vi.fn((promises) => Promise.all(promises)),
            },
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
        {
          provide: PosService,
          useValue: {
            checkOut: vi.fn(),
            getAttendanceStatus: vi.fn(),
            listLocations: vi.fn(),
            getProducts: vi.fn(),
            recordPayment: vi.fn(),
            getIncoming: vi.fn(),
            scanTransaction: vi.fn(),
            ablyAuth: vi.fn(),
            getInventory: vi.fn(),
            adjustStock: vi.fn(),
            getCustomersDelta: vi.fn(),
            createCustomer: vi.fn(),
            dispatchDelivery: vi.fn(),
            reconcileDelivery: vi.fn(),
            listStockRequests: vi.fn(),
            createStockRequest: vi.fn(),
            cancelStockRequest: vi.fn(),
            getPricing: vi.fn(),
            syncShifts: vi.fn(),
            getWaybill: vi.fn(),
            getPackingList: vi.fn(),
            receivePurchase: vi.fn(),
            receiveTransfer: vi.fn(),
            getDrivers: vi.fn(),
            createStockTransfer: vi.fn(),
            registerBarcode: vi.fn(),
          },
        },
        {
          provide: PosSaleService,
          useValue: {
            handleOrder: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
    authCoreService = module.get<V3AuthCoreService>(V3AuthCoreService);
    posService = module.get<PosService>(PosService);
    posSaleService = module.get<PosSaleService>(PosSaleService);
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

  describe("getSalesHistory endpoint", () => {
    it("should delegate to getTransactionsUseCase", async () => {
      const mockCtx = { organizationId: "org_1" } as any;
      const getTransactionsUseCase = (controller as any).getTransactionsUseCase;
      vi.mocked(getTransactionsUseCase.execute).mockResolvedValue({ data: [] } as any);

      const result = await controller.getSalesHistory(mockCtx, { locationId: "loc_1" });
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith(mockCtx, { locationId: "loc_1" });
      expect(result).toEqual({ data: [] });
    });
  });

  describe("processSale endpoint", () => {
    it("should delegate to processSaleUseCase with locationId query param fallback", async () => {
      const mockCtx = { organizationId: "org_1", memberId: "m_1" } as any;
      const processSaleUseCase = (controller as any).processSaleUseCase;
      vi.mocked(processSaleUseCase.execute).mockResolvedValue({ id: "sale_123" } as any);

      const body = { items: [{ variantId: "v_1", quantity: 1, unitPrice: 10 }], payments: [{ method: "CASH", amount: 10 }] };
      const result = await controller.processSale(mockCtx, body as any, "loc_query_1");

      expect(processSaleUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: "org_1", locationId: "loc_query_1" }),
        body
      );
      expect(result).toEqual({ id: "sale_123" });
    });
  });

  describe("checkOut & attendance", () => {
    it("should call posService.checkOut", async () => {
      const mockCtx = { organizationId: "org_1", memberId: "m1" } as any;
      vi.mocked(posService.checkOut).mockResolvedValue({ message: "Check-out successful." } as any);

      const res = await controller.checkOut(mockCtx, { locationId: "loc_1" });
      expect(res).toEqual({ message: "Check-out successful." });
      expect(posService.checkOut).toHaveBeenCalledWith(mockCtx, { locationId: "loc_1" });
    });

    it("should call posService.getAttendanceStatus", async () => {
      const mockCtx = { organizationId: "org_1", memberId: "m1" } as any;
      vi.mocked(posService.getAttendanceStatus).mockResolvedValue({ isCheckedIn: true } as any);

      const res = await controller.getAttendanceStatus(mockCtx);
      expect(res).toEqual({ isCheckedIn: true });
      expect(posService.getAttendanceStatus).toHaveBeenCalledWith(mockCtx);
    });
  });

  describe("locations & products & pricing", () => {
    it("should call posService.listLocations", async () => {
      const mockCtx = { organizationId: "org_1" } as any;
      const prismaService = (controller as any).prisma;
      vi.mocked(prismaService.client.inventoryLocation.findMany).mockResolvedValue([] as any);

      const res = await controller.getLocations(mockCtx);
      expect(res).toEqual({ locations: [] });
    });

    it("should call posService.getProducts", async () => {
      const mockCtx = { organizationId: "org_1", locationId: "loc_1" } as any;
      const prismaService = (controller as any).prisma;
      if (prismaService.client.productVariant) {
        vi.mocked(prismaService.client.productVariant.findMany).mockResolvedValue([] as any);
      }

      const res = await controller.getProducts(mockCtx, { locationId: "loc_1" });
      expect(res).toBeDefined();
    });

    it("should call posService.getPricing", async () => {
      const mockCtx = { organizationId: "org_1" } as any;
      vi.mocked(posService.getPricing).mockResolvedValue({ success: true, data: {} } as any);

      const res = await controller.getPricing(mockCtx);
      expect(res).toEqual({ success: true, data: {} });
      expect(posService.getPricing).toHaveBeenCalledWith(mockCtx, undefined);
    });
  });

  describe("barcode registration", () => {
    it("should call posService.registerBarcode", async () => {
      const mockCtx = { organizationId: "org_1", memberId: "m1" } as any;
      const body = { variantId: "v1", barcode: "123456789" };
      vi.mocked(posService.registerBarcode).mockResolvedValue({ id: "v1", barcode: "123456789" } as any);

      const res = await controller.registerBarcode(mockCtx, body);
      expect(res).toEqual({ id: "v1", barcode: "123456789" });
      expect(posService.registerBarcode).toHaveBeenCalledWith(mockCtx, body);
    });
  });
});