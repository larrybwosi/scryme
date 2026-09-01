import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrapiConnectionController } from "../strapi-connection.controller";
import { SyncDirection } from "@repo/db";

describe("StrapiConnectionController", () => {
  let controller: StrapiConnectionController;
  let connectionUseCase: any;
  let productSyncUseCase: any;
  let customerSyncUseCase: any;
  let webhookService: any;

  beforeEach(() => {
    connectionUseCase = {};
    productSyncUseCase = {
      syncOutbound: vi.fn().mockResolvedValue({ success: true, count: 10 }),
      syncInbound: vi.fn().mockResolvedValue({ success: true, count: 5 }),
    };
    customerSyncUseCase = {
      bulkSyncOutbound: vi.fn().mockResolvedValue({ success: true, count: 8 }),
    };
    webhookService = {
      enqueueSyncJob: vi.fn().mockImplementation((jobName: string) => Promise.resolve(`job_${jobName}`)),
    };

    controller = new StrapiConnectionController(
      connectionUseCase,
      productSyncUseCase,
      customerSyncUseCase,
      webhookService,
    );
  });

  describe("triggerSync", () => {
    it("should run product and customer sync tasks concurrently and return aggregated results", async () => {
      const req = {
        organization: { id: "org-1" },
        user: { memberId: "mem-1" },
      };

      const dto = {
        syncTypes: ["PRODUCTS", "CUSTOMERS"] as any,
        direction: SyncDirection.BIDIRECTIONAL,
      };

      const result = await controller.triggerSync(req, "conn-1", dto);

      expect(productSyncUseCase.syncOutbound).toHaveBeenCalledWith("org-1", "conn-1", "manual:mem-1");
      expect(productSyncUseCase.syncInbound).toHaveBeenCalledWith("org-1", "conn-1", "manual:mem-1");
      expect(customerSyncUseCase.bulkSyncOutbound).toHaveBeenCalledWith("org-1", "conn-1", "manual:mem-1");

      expect(result).toEqual({
        "products.outbound": { success: true, count: 10 },
        "products.inbound": { success: true, count: 5 },
        "customers.outbound": { success: true, count: 8 },
      });
    });
  });

  describe("enqueueSync", () => {
    it("should enqueue background jobs concurrently and return jobIds", async () => {
      const req = {
        organization: { id: "org-1" },
        user: { memberId: "mem-1" },
      };

      const dto = {
        syncTypes: ["PRODUCTS", "CUSTOMERS"] as any,
        direction: SyncDirection.BIDIRECTIONAL,
      };

      const result = await controller.enqueueSync(req, "conn-1", dto);

      expect(webhookService.enqueueSyncJob).toHaveBeenCalledWith("strapi.product.sync.outbound", "conn-1", "org-1", "manual:mem-1");
      expect(webhookService.enqueueSyncJob).toHaveBeenCalledWith("strapi.product.sync.inbound", "conn-1", "org-1", "manual:mem-1");
      expect(webhookService.enqueueSyncJob).toHaveBeenCalledWith("strapi.customer.sync.outbound", "conn-1", "org-1", "manual:mem-1");

      expect(result).toEqual({
        queued: true,
        jobIds: [
          "job_strapi.product.sync.outbound",
          "job_strapi.product.sync.inbound",
          "job_strapi.customer.sync.outbound",
        ],
      });
    });
  });
});
