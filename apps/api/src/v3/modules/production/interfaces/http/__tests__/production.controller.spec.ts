import { Test, TestingModule } from "@nestjs/testing";
import { ProductionController } from "../production.controller";
import { ProductionService } from "../../../application/services/production.service";
import { ProductionReportService } from "../../../reports/production-report.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { AuditService } from "@/v3/common/services/audit.service";
import { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ProductionController (V3)", () => {
  let controller: ProductionController;
  let productionService: ProductionService;
  let productionReportService: ProductionReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ProductionService,
          useValue: {
            getProductionOverview: vi.fn(),
            getAttendanceStatus: vi.fn(),
            getBakers: vi.fn(),
            addBaker: vi.fn(),
            updateBaker: vi.fn(),
            removeBaker: vi.fn(),
            updateCategory: vi.fn(),
            updateSettings: vi.fn(),
          },
        },
        {
          provide: ProductionReportService,
          useValue: {
            generateAndSendReport: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              organization: { findUnique: vi.fn() },
              member: { findFirst: vi.fn() },
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: vi.fn(),
            setex: vi.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: vi.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ProductionController>(ProductionController);
    productionService = module.get<ProductionService>(ProductionService);
    productionReportService = module.get<ProductionReportService>(ProductionReportService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getOverview endpoint", () => {
    it("should call productionService.getProductionOverview with organizationId", async () => {
      const mockOverview = { activeBatchesCount: 5, pendingBatchesCount: 2 };
      vi.mocked(productionService.getProductionOverview).mockResolvedValue(mockOverview as any);

      const mockCtx = { organizationId: "org_123" } as any;
      const result = await controller.getOverview(mockCtx);

      expect(productionService.getProductionOverview).toHaveBeenCalledWith("org_123");
      expect(result).toEqual(mockOverview);
    });
  });

  describe("authStatus endpoint", () => {
    it("should safely handle unauthenticated calls when ctx is undefined", async () => {
      const result = await controller.authStatus(undefined as any);

      expect(result).toEqual({
        hasDeviceKey: false,
        hasMemberToken: false,
        authenticated: false,
      });
    });

    it("should return authenticated true when both device key and member token are present", async () => {
      const mockCtx = {
        organizationId: "org_123",
        authType: "v3_client",
        memberId: "mem_123",
      } as any;

      const result = await controller.authStatus(mockCtx);

      expect(result).toEqual({
        hasDeviceKey: true,
        hasMemberToken: true,
        authenticated: true,
      });
    });
  });

  describe("bakers endpoints", () => {
    it("should call productionService.getBakers with organizationId", async () => {
      const mockBakers = [{ id: "b1", name: "Baker One" }];
      vi.mocked(productionService.getBakers).mockResolvedValue(mockBakers as any);

      const mockCtx = { organizationId: "org_123" } as any;
      const result = await controller.getBakers(mockCtx);

      expect(productionService.getBakers).toHaveBeenCalledWith("org_123");
      expect(result).toEqual(mockBakers);
    });
  });

  describe("category & settings endpoints", () => {
    it("should delegate updateCategory and updateCategoryPut to productionService", async () => {
      const mockCtx = { organizationId: "org_123" } as any;
      const body = { name: "New Category Name" };
      vi.mocked(productionService.updateCategory).mockResolvedValue({ id: "cat_1", ...body } as any);

      const resPatch = await controller.updateCategory(mockCtx, "cat_1", body as any);
      const resPut = await controller.updateCategoryPut(mockCtx, "cat_1", body as any);

      expect(productionService.updateCategory).toHaveBeenCalledTimes(2);
      expect(productionService.updateCategory).toHaveBeenCalledWith("org_123", "cat_1", body);
      expect(resPatch).toEqual({ id: "cat_1", name: "New Category Name" });
      expect(resPut).toEqual({ id: "cat_1", name: "New Category Name" });
    });

    it("should delegate updateSettings and updateSettingsPut to productionService", async () => {
      const mockCtx = { organizationId: "org_123" } as any;
      const body = { autoStartBatch: true };
      vi.mocked(productionService.updateSettings).mockResolvedValue({ id: "set_1", ...body } as any);

      const resPatch = await controller.updateSettings(mockCtx, body as any);
      const resPut = await controller.updateSettingsPut(mockCtx, body as any);

      expect(productionService.updateSettings).toHaveBeenCalledTimes(2);
      expect(productionService.updateSettings).toHaveBeenCalledWith("org_123", body);
      expect(resPatch).toEqual({ id: "set_1", autoStartBatch: true });
      expect(resPut).toEqual({ id: "set_1", autoStartBatch: true });
    });
  });
});
