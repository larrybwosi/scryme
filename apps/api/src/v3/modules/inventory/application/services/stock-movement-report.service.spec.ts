import { describe, it, expect, beforeEach, vi } from "vitest";
import { StockMovementReportService } from "./stock-movement-report.service";
import { MovementType } from "@repo/db";
import { Decimal } from "decimal.js";

// Mock the ScrymeChatApiClient
vi.mock("@repo/scryme", () => {
  return {
    ScrymeChatApiClient: class {
      sendMessage = vi.fn().mockResolvedValue({ success: true });
    }
  };
});

describe("StockMovementReportService", () => {
  let service: StockMovementReportService;
  let prisma: any;
  let scrymeService: any;

  beforeEach(() => {
    prisma = {
      client: {
        stockMovement: {
          groupBy: vi.fn(),
        },
        productVariant: {
          findMany: vi.fn(),
        },
      },
    };
    scrymeService = {
      getConfiguration: vi.fn(),
    };
    service = new StockMovementReportService(prisma as any, scrymeService as any);
  });

  describe("generateAndSendReport", () => {
    it("should skip report if no movements are found", async () => {
      prisma.client.stockMovement.groupBy.mockResolvedValue([]);

      const loggerSpy = vi.spyOn((service as any).logger, "log");

      await service.generateAndSendReport("org-1", ["test@example.com"], 7);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("No stock movements found"),
      );
    });

    it("should correctly aggregate totals and fetch top items", async () => {
      // Mock summary aggregation
      prisma.client.stockMovement.groupBy
        .mockResolvedValueOnce([
          {
            movementType: MovementType.PURCHASE_RECEIPT,
            _sum: { quantity: new Decimal(100) },
          },
          {
            movementType: MovementType.SALE,
            _sum: { quantity: new Decimal(50) },
          },
        ])
        // Mock top variant aggregation
        .mockResolvedValueOnce([
          {
            variantId: "var-1",
            _sum: { quantity: new Decimal(80) },
          },
        ]);

      // Mock variant metadata
      prisma.client.productVariant.findMany.mockResolvedValue([
        {
          id: "var-1",
          name: "Variant 1",
          product: { name: "Product 1" },
        },
      ]);

      scrymeService.getConfiguration.mockResolvedValue({
        workspaceSlug: "test-workspace",
        isActive: true,
      });

      const sendMessageSpy = vi.spyOn((service as any).scrymeClient, "sendMessage");
      const formatSpy = vi.spyOn(service as any, "formatReportMessage");

      await service.generateAndSendReport("org-1", ["test@example.com"], 7);

      expect(formatSpy).toHaveBeenCalledWith(
        {
          totalIn: 100,
          totalOut: 50,
          topItems: [{ name: "Product 1 (Variant 1)", qty: 80 }],
        },
        7,
        "org-1",
      );

      expect(sendMessageSpy).toHaveBeenCalledWith(
        "test-workspace",
        "notifications",
        expect.objectContaining({
          content: expect.stringContaining("Total Items Received:** 100.00"),
        }),
      );
    });
  });
});
