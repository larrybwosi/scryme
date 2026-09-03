import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { StrapiConnectionController } from "../strapi-connection.controller";

describe("StrapiConnectionController - Tenant Isolation Security Tests", () => {
  let controller: StrapiConnectionController;
  let mockConnectionUseCase: any;
  let mockProductSyncUseCase: any;
  let mockCustomerSyncUseCase: any;
  let mockWebhookService: any;

  const orgId = "org-123";
  const foreignConnId = "conn-foreign";
  const validConnId = "conn-valid";

  beforeEach(() => {
    mockConnectionUseCase = {
      getConnectionOrThrow: vi.fn(),
    };
    mockProductSyncUseCase = {
      syncOutbound: vi.fn(),
      syncInbound: vi.fn(),
    };
    mockCustomerSyncUseCase = {
      bulkSyncOutbound: vi.fn(),
    };
    mockWebhookService = {
      enqueueSyncJob: vi.fn(),
    };

    controller = new StrapiConnectionController(
      mockConnectionUseCase,
      mockProductSyncUseCase,
      mockCustomerSyncUseCase,
      mockWebhookService,
    );
  });

  describe("enqueueSync", () => {
    it("should throw NotFoundException if connection does not belong to organization", async () => {
      mockConnectionUseCase.getConnectionOrThrow.mockRejectedValue(
        new NotFoundException("Strapi connection conn-foreign not found"),
      );

      const req = { organization: { id: orgId }, user: { memberId: "m-1" } };
      const dto = { syncTypes: ["PRODUCTS" as const] };

      await expect(
        controller.enqueueSync(req, foreignConnId, dto as any),
      ).rejects.toThrow(NotFoundException);

      expect(mockConnectionUseCase.getConnectionOrThrow).toHaveBeenCalledWith(
        orgId,
        foreignConnId,
      );
      expect(mockWebhookService.enqueueSyncJob).not.toHaveBeenCalled();
    });

    it("should enqueue sync job when connection belongs to organization", async () => {
      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({
        id: validConnId,
        organizationId: orgId,
      });
      mockWebhookService.enqueueSyncJob.mockResolvedValue("job-123");

      const req = { organization: { id: orgId }, user: { memberId: "m-1" } };
      const dto = { syncTypes: ["PRODUCTS" as const] };

      const result = await controller.enqueueSync(req, validConnId, dto as any);

      expect(mockConnectionUseCase.getConnectionOrThrow).toHaveBeenCalledWith(
        orgId,
        validConnId,
      );
      expect(mockWebhookService.enqueueSyncJob).toHaveBeenCalledWith(
        "strapi.product.sync.outbound",
        validConnId,
        orgId,
        "manual:m-1",
      );
      expect(result).toEqual({ queued: true, jobIds: ["job-123", "job-123"] });
    });
  });

  describe("triggerSync", () => {
    it("should throw NotFoundException if connection does not belong to organization", async () => {
      mockConnectionUseCase.getConnectionOrThrow.mockRejectedValue(
        new NotFoundException("Strapi connection conn-foreign not found"),
      );

      const req = { organization: { id: orgId }, user: { memberId: "m-1" } };
      const dto = { syncTypes: ["PRODUCTS" as const] };

      await expect(
        controller.triggerSync(req, foreignConnId, dto as any),
      ).rejects.toThrow(NotFoundException);

      expect(mockConnectionUseCase.getConnectionOrThrow).toHaveBeenCalledWith(
        orgId,
        foreignConnId,
      );
      expect(mockProductSyncUseCase.syncOutbound).not.toHaveBeenCalled();
    });

    it("should trigger manual sync when connection belongs to organization", async () => {
      mockConnectionUseCase.getConnectionOrThrow.mockResolvedValue({
        id: validConnId,
        organizationId: orgId,
      });
      mockProductSyncUseCase.syncOutbound.mockResolvedValue({ successCount: 1 });
      mockProductSyncUseCase.syncInbound.mockResolvedValue({ successCount: 1 });

      const req = { organization: { id: orgId }, user: { memberId: "m-1" } };
      const dto = { syncTypes: ["PRODUCTS" as const] };

      const result = await controller.triggerSync(req, validConnId, dto as any);

      expect(mockConnectionUseCase.getConnectionOrThrow).toHaveBeenCalledWith(
        orgId,
        validConnId,
      );
      expect(mockProductSyncUseCase.syncOutbound).toHaveBeenCalledWith(
        orgId,
        validConnId,
        "manual:m-1",
      );
      expect(result).toEqual({
        "products.outbound": { successCount: 1 },
        "products.inbound": { successCount: 1 },
      });
    });
  });
});
