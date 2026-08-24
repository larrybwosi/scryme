import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowsService } from "./workflows.service";
import type { V2ApiContext } from "@repo/shared/api/v2";

describe("WorkflowsService", () => {
  let service: WorkflowsService;
  let mockPrisma: any;
  let mockStockReportService: any;

  const mockCtx: V2ApiContext = {
    organizationId: "org_123",
    memberId: "mem_123",
    locationId: "loc_123",
    role: "ADMIN",
  };

  beforeEach(() => {
    mockPrisma = {
      client: {
        windmillWorkflow: {
          findMany: vi.fn(),
          upsert: vi.fn(),
        },
        windmillConfiguration: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
        windmillExecution: {
          create: vi.fn(),
          update: vi.fn(),
          findMany: vi.fn(),
        },
      },
    };

    mockStockReportService = {
      generateAndSendReport: vi.fn().mockResolvedValue(undefined),
    };

    service = new WorkflowsService(mockPrisma as any, mockStockReportService as any);
  });

  describe("getAvailableWorkflows", () => {
    it("should fetch provisioned workflows and config concurrently and map them with O(1) Map lookups", async () => {
      const mockProvisioned = [
        {
          path: "f/dealio/customer_onboarding",
          settings: { sendWelcomeEmail: false },
        },
      ];
      const mockConfig = { id: "cfg_1", organizationId: "org_123" };

      mockPrisma.client.windmillWorkflow.findMany.mockResolvedValue(mockProvisioned);
      mockPrisma.client.windmillConfiguration.findUnique.mockResolvedValue(mockConfig);

      const result = await service.getAvailableWorkflows(mockCtx);

      expect(mockPrisma.client.windmillWorkflow.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org_123" },
      });
      expect(mockPrisma.client.windmillConfiguration.findUnique).toHaveBeenCalledWith({
        where: { organizationId: "org_123" },
      });

      expect(result).toHaveLength(4);
      const onboardingScript = result.find((s) => s.path === "f/dealio/customer_onboarding");
      expect(onboardingScript).toBeDefined();
      expect(onboardingScript?.isProvisioned).toBe(true);
      expect(onboardingScript?.settings).toEqual({ sendWelcomeEmail: false });

      const alertScript = result.find((s) => s.path === "f/dealio/inventory_alert");
      expect(alertScript).toBeDefined();
      expect(alertScript?.isProvisioned).toBe(false);
      expect(alertScript?.settings).toEqual({});
    });
  });
});
