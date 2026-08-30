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
        workflowEngineDefinition: {
          findMany: vi.fn(),
          upsert: vi.fn(),
          create: vi.fn(),
          findUnique: vi.fn(),
        },
        workflowEngineExecution: {
          create: vi.fn(),
          update: vi.fn(),
          findMany: vi.fn(),
        },
        workflowEngineJob: {
          create: vi.fn(),
        },
      },
    };

    mockStockReportService = {
      generateAndSendReport: vi.fn().mockResolvedValue(undefined),
    };

    service = new WorkflowsService(mockPrisma as any, mockStockReportService as any);
  });

  describe("getAvailableWorkflows", () => {
    it("should fetch provisioned workflows and map them with O(1) Map lookups", async () => {
      const mockProvisioned = [
        {
          key: "f/dealio/customer_onboarding",
          config: { sendWelcomeEmail: false },
        },
      ];

      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue(mockProvisioned);

      const result = await service.getAvailableWorkflows(mockCtx);

      expect(mockPrisma.client.workflowEngineDefinition.findMany).toHaveBeenCalledWith({
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
