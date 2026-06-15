import {Test, TestingModule} from "@nestjs/testing";
import {PettyCashUseCase} from "../petty-cash.use-case";
import {PrismaService} from "@/prisma/prisma.service";
import {PettyCashTransactionType, Prisma} from "@repo/db";
import {NotFoundException} from "@nestjs/common";
import {vi, describe, it, expect, beforeEach} from "vitest";

describe("PettyCashUseCase", () => {
  let useCase: PettyCashUseCase;
  let prisma: PrismaService;

  const mockPrismaClient = {
    pettyCashFund: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    pettyCashTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(cb => cb(mockPrismaClient)),
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PettyCashUseCase,
        {provide: PrismaService, useValue: mockPrismaService},
      ],
    }).compile();

    useCase = module.get<PettyCashUseCase>(PettyCashUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("createFund", () => {
    it("should create a fund and an initial transaction", async () => {
      const orgId = "org-1";
      const dto = {
        name: "Office Petty Cash",
        floatAmount: 5000,
        responsibleMemberId: "member-1",
        currencyCode: "KES",
      };

      mockPrismaClient.pettyCashFund.create.mockResolvedValue({
        id: "fund-1",
        ...dto,
      });

      const result = await useCase.createFund(orgId, dto);

      expect(result.id).toBe("fund-1");
      expect(mockPrismaClient.pettyCashFund.create).toHaveBeenCalled();
      expect(mockPrismaClient.pettyCashTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PettyCashTransactionType.TOP_UP,
            amount: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("topUpFund", () => {
    it("should increment fund amount and create a transaction", async () => {
      const orgId = "org-1";
      const fundId = "fund-1";
      const dto = {amount: 1000, description: "Weekly topup"};
      const memberId = "member-1";

      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue({
        id: fundId,
        organizationId: orgId,
      });
      mockPrismaClient.pettyCashFund.update.mockResolvedValue({
        id: fundId,
        amount: 6000,
      });

      const result = await useCase.topUpFund(orgId, fundId, dto, memberId);

      expect(result.amount).toBe(6000);
      expect(mockPrismaClient.pettyCashFund.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {id: fundId},
          data: {amount: {increment: expect.any(Object)}},
        }),
      );
    });

    it("should throw NotFoundException if fund does not exist", async () => {
      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue(null);

      await expect(
        useCase.topUpFund("org-1", "invalid", {amount: 100}, "member-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getFundById", () => {
    it("should return fund details", async () => {
      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue({
        id: "fund-1",
        name: "Test Fund",
      });

      const result = await useCase.getFundById("org-1", "fund-1");
      expect(result.name).toBe("Test Fund");
    });

    it("should throw if not found", async () => {
      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue(null);
      await expect(useCase.getFundById("org-1", "fund-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
