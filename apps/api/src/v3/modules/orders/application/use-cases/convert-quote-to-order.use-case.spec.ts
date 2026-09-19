import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConvertQuoteToOrderUseCase } from "./convert-quote-to-order.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("ConvertQuoteToOrderUseCase", () => {
  let useCase: ConvertQuoteToOrderUseCase;
  let mockPrismaService: any;
  let mockWebhookService: any;
  let mockRealtimeService: any;

  beforeEach(() => {
    mockPrismaService = {
      client: {
        transaction: {
          findFirst: vi.fn(),
          updateMany: vi.fn(),
          findFirstOrThrow: vi.fn(),
        },
      },
    };

    mockWebhookService = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    mockRealtimeService = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new ConvertQuoteToOrderUseCase(
      mockPrismaService as any,
      mockWebhookService as any,
      mockRealtimeService as any,
    );
  });

  it("should successfully convert a quote to a sales order", async () => {
    const orgId = "org-1";
    const quoteId = "quote-1";

    mockPrismaService.client.transaction.findFirst.mockResolvedValue({
      id: quoteId,
      type: "QUOTE",
      status: "DRAFT",
    });

    mockPrismaService.client.transaction.updateMany.mockResolvedValue({
      count: 1,
    });

    const mockUpdatedTx = {
      id: quoteId,
      organizationId: orgId,
      type: "SALES_ORDER",
      status: "PENDING_CONFIRMATION",
    };

    mockPrismaService.client.transaction.findFirstOrThrow.mockResolvedValue(
      mockUpdatedTx,
    );

    const result = await useCase.execute(orgId, quoteId);

    expect(result).toEqual(mockUpdatedTx);
    expect(mockPrismaService.client.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: quoteId, organizationId: orgId },
      select: { id: true, type: true, status: true },
    });
    expect(mockPrismaService.client.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: quoteId, organizationId: orgId },
      data: {
        type: "SALES_ORDER",
        status: "PENDING_CONFIRMATION",
        confirmedAt: expect.any(Date),
      },
    });
    expect(mockRealtimeService.publish).toHaveBeenCalledWith(
      `order:${quoteId}`,
      "order.created",
      mockUpdatedTx,
    );
    expect(mockWebhookService.dispatch).toHaveBeenCalledWith(
      "order.created",
      orgId,
      mockUpdatedTx,
    );
  });

  it("should throw NotFoundException if quote is not found", async () => {
    mockPrismaService.client.transaction.findFirst.mockResolvedValue(null);

    await expect(useCase.execute("org-1", "nonexistent-id")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should throw BadRequestException if transaction is not a QUOTE", async () => {
    mockPrismaService.client.transaction.findFirst.mockResolvedValue({
      id: "quote-1",
      type: "SALES_ORDER",
      status: "DRAFT",
    });

    await expect(useCase.execute("org-1", "quote-1")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException if quote status is CANCELLED or COMPLETED", async () => {
    mockPrismaService.client.transaction.findFirst.mockResolvedValue({
      id: "quote-1",
      type: "QUOTE",
      status: "CANCELLED",
    });

    await expect(useCase.execute("org-1", "quote-1")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw NotFoundException if updateMany updates 0 rows (cross-tenant IDOR attack)", async () => {
    mockPrismaService.client.transaction.findFirst.mockResolvedValue({
      id: "quote-foreign",
      type: "QUOTE",
      status: "DRAFT",
    });

    mockPrismaService.client.transaction.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(useCase.execute("org-1", "quote-foreign")).rejects.toThrow(
      NotFoundException,
    );
  });
});
