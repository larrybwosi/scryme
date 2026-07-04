import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ReviewPriceChangeUseCase } from "./review-price-change.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { PriceChangeStatus } from "@repo/db";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("ReviewPriceChangeUseCase", () => {
  let useCase: ReviewPriceChangeUseCase;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        priceChangeRequest: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        priceListItem: {
          update: vi.fn(),
        },
        priceHistory: {
          create: vi.fn(),
        },
        $transaction: vi.fn(cb => cb(prisma.client)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewPriceChangeUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get<ReviewPriceChangeUseCase>(ReviewPriceChangeUseCase);
  });

  it("should approve a price change request", async () => {
    const requestId = "req-1";
    const organizationId = "org-1";
    const memberId = "mem-1";
    const request = {
      id: requestId,
      organizationId,
      priceListItemId: "pli-1",
      oldPrice: 10,
      newPrice: 15,
      oldCost: 8,
      newCost: 12,
      status: PriceChangeStatus.PENDING,
      reason: "Cost increase",
    };

    prisma.client.priceChangeRequest.findFirst.mockResolvedValue(request);
    prisma.client.priceChangeRequest.update.mockResolvedValue({
      ...request,
      status: PriceChangeStatus.APPROVED,
    });

    const result = await useCase.execute({
      organizationId,
      requestId,
      memberId,
      status: PriceChangeStatus.APPROVED,
    });

    expect(prisma.client.priceChangeRequest.findFirst).toHaveBeenCalledWith({
      where: { id: requestId, organizationId },
    });
    expect(prisma.client.priceListItem.update).toHaveBeenCalledWith({
      where: { id: request.priceListItemId },
      data: { price: request.newPrice },
    });
    expect(prisma.client.priceHistory.create).toHaveBeenCalled();
    expect(prisma.client.priceChangeRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: expect.objectContaining({
        status: PriceChangeStatus.APPROVED,
        reviewedBy: memberId,
      }),
    });
    expect(result.status).toBe(PriceChangeStatus.APPROVED);
  });

  it("should reject a price change request", async () => {
    const requestId = "req-1";
    const organizationId = "org-1";
    const memberId = "mem-1";
    const request = {
      id: requestId,
      organizationId,
      priceListItemId: "pli-1",
      status: PriceChangeStatus.PENDING,
    };

    prisma.client.priceChangeRequest.findFirst.mockResolvedValue(request);
    prisma.client.priceChangeRequest.update.mockResolvedValue({
      ...request,
      status: PriceChangeStatus.REJECTED,
    });

    const result = await useCase.execute({
      organizationId,
      requestId,
      memberId,
      status: PriceChangeStatus.REJECTED,
      rejectionReason: "Too expensive",
    });

    expect(prisma.client.priceListItem.update).not.toHaveBeenCalled();
    expect(prisma.client.priceHistory.create).not.toHaveBeenCalled();
    expect(prisma.client.priceChangeRequest.update).toHaveBeenCalledWith({
      where: { id: requestId },
      data: expect.objectContaining({
        status: PriceChangeStatus.REJECTED,
        rejectionReason: "Too expensive",
      }),
    });
  });

  it("should throw NotFoundException if request not found", async () => {
    prisma.client.priceChangeRequest.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute({
        organizationId: "org-1",
        requestId: "non-existent",
        memberId: "mem-1",
        status: PriceChangeStatus.APPROVED,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should throw BadRequestException if request is not pending", async () => {
    prisma.client.priceChangeRequest.findFirst.mockResolvedValue({
      status: PriceChangeStatus.APPROVED,
    });

    await expect(
      useCase.execute({
        organizationId: "org-1",
        requestId: "req-1",
        memberId: "mem-1",
        status: PriceChangeStatus.APPROVED,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
