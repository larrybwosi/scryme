import { Test, TestingModule } from "@nestjs/testing";
import { ExpenseUseCase } from "../expense.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { ExpenseStatus, PettyCashTransactionType } from "@repo/db";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CreateExpenseDto, PaymentMethod } from "../../dto/finance.dto";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("ExpenseUseCase", () => {
  let useCase: ExpenseUseCase;
  let prisma: PrismaService;

  const mockPrismaClient = {
    organization: {
      findUnique: vi.fn(),
    },
    expense: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    pettyCashFund: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    pettyCashTransaction: {
      create: vi.fn(),
    },
    budget: {
      update: vi.fn(),
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
        ExpenseUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    useCase = module.get<ExpenseUseCase>(ExpenseUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("createExpense", () => {
    const orgId = "org-1";
    const memberId = "member-1";
    const dto: CreateExpenseDto = {
      description: "Office supplies",
      amount: 100,
      categoryId: "cat-1",
      paymentMethod: PaymentMethod.CASH,
    };

    it("should create an approved expense when under threshold", async () => {
      mockPrismaClient.organization.findUnique.mockResolvedValue({
        expenseApprovalThreshold: 500,
        expenseReceiptThreshold: 1000,
      });
      mockPrismaClient.expense.count.mockResolvedValue(0);
      mockPrismaClient.expense.create.mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.APPROVED,
      });

      const result = await useCase.createExpense(orgId, memberId, dto);

      expect(result.status).toBe(ExpenseStatus.APPROVED);
      expect(mockPrismaClient.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ExpenseStatus.APPROVED,
            amount: expect.any(Object), // Decimal
          }),
        }),
      );
    });

    it("should create a pending expense when above threshold", async () => {
      mockPrismaClient.organization.findUnique.mockResolvedValue({
        expenseApprovalThreshold: 50,
        expenseReceiptThreshold: 1000,
      });
      mockPrismaClient.expense.count.mockResolvedValue(0);
      mockPrismaClient.expense.create.mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.PENDING,
      });

      const result = await useCase.createExpense(orgId, memberId, dto);

      expect(result.status).toBe(ExpenseStatus.PENDING);
    });

    it("should handle petty cash decrement when approved", async () => {
      const pettyDto = { ...dto, pettyCashFundId: "fund-1" };
      mockPrismaClient.organization.findUnique.mockResolvedValue({
        expenseApprovalThreshold: 500,
        expenseReceiptThreshold: 1000,
        pettyCashAutoApproveThreshold: 1000,
      });
      mockPrismaClient.expense.count.mockResolvedValue(0);
      mockPrismaClient.expense.create.mockResolvedValue({
        id: "exp-1",
        status: ExpenseStatus.APPROVED,
      });
      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue({
        id: "fund-1",
        amount: { lessThan: () => false }, // Mocking Decimal.lessThan
      });

      await useCase.createExpense(orgId, memberId, pettyDto);

      expect(mockPrismaClient.pettyCashFund.update).toHaveBeenCalled();
      expect(mockPrismaClient.pettyCashTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PettyCashTransactionType.EXPENSE,
          }),
        }),
      );
    });
  });

  describe("approveExpense", () => {
    it("should approve a pending expense and trigger petty cash decrement", async () => {
      const expenseId = "exp-1";
      const orgId = "org-1";
      const memberId = "approver-1";

      mockPrismaClient.expense.findFirst.mockResolvedValue({
        id: expenseId,
        status: ExpenseStatus.PENDING,
        amount: 500,
        description: "Large purchase",
        pettyCashFundId: "fund-1",
        organizationId: orgId,
      });

      mockPrismaClient.expense.update.mockResolvedValue({
        id: expenseId,
        status: ExpenseStatus.APPROVED,
      });
      mockPrismaClient.pettyCashFund.findFirst.mockResolvedValue({
        id: "fund-1",
        amount: { lessThan: () => false },
      });

      const result = await useCase.approveExpense(orgId, memberId, expenseId);

      expect(result.status).toBe(ExpenseStatus.APPROVED);
      expect(mockPrismaClient.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expenseId },
          data: expect.objectContaining({ status: ExpenseStatus.APPROVED }),
        }),
      );
      expect(mockPrismaClient.pettyCashFund.update).toHaveBeenCalled();
    });
  });
});
