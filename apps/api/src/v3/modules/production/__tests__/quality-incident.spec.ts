import { Test, TestingModule } from "@nestjs/testing";
import { ProductionService } from "../application/services/production.service";
import { ProductionReportService } from "../reports/production-report.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V3AuthCoreService } from "@/v3/modules/auth-core/infrastructure/services/v3-auth-core.service";
import { NotFoundException } from "@nestjs/common";
import { describe, beforeEach, it, expect, vi } from "vitest";

describe("ProductionService - Quality Incidents", () => {
  let service: ProductionService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      client: {
        qualityIncident: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: V3AuthCoreService, useValue: {} },
        { provide: ProductionReportService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  describe("getQualityIncident", () => {
    it("should return single quality incident when found in organization", async () => {
      const mockIncident = {
        id: "inc-1",
        organizationId: "org-1",
        title: "Burnt Crust",
        severity: "low",
      };
      prismaMock.client.qualityIncident.findFirst.mockResolvedValue(mockIncident);

      const result = await service.getQualityIncident("org-1", "inc-1");
      expect(result).toEqual(mockIncident);
      expect(prismaMock.client.qualityIncident.findFirst).toHaveBeenCalledWith({
        where: { id: "inc-1", organizationId: "org-1" },
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException if quality incident does not exist in org", async () => {
      prismaMock.client.qualityIncident.findFirst.mockResolvedValue(null);

      await expect(service.getQualityIncident("org-1", "inc-999")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteQualityIncident", () => {
    it("should delete quality incident successfully when found", async () => {
      const mockIncident = { id: "inc-1", organizationId: "org-1" };
      prismaMock.client.qualityIncident.findFirst.mockResolvedValue(mockIncident);
      prismaMock.client.qualityIncident.delete.mockResolvedValue(mockIncident);

      const result = await service.deleteQualityIncident("org-1", "inc-1");
      expect(result).toEqual(mockIncident);
      expect(prismaMock.client.qualityIncident.delete).toHaveBeenCalledWith({
        where: { id: "inc-1" },
      });
    });

    it("should throw NotFoundException when deleting non-existent incident", async () => {
      prismaMock.client.qualityIncident.findFirst.mockResolvedValue(null);

      await expect(service.deleteQualityIncident("org-1", "inc-999")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
