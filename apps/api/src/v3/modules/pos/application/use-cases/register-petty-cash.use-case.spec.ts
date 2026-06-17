import { Test, TestingModule } from "@nestjs/testing";
import { RegisterPettyCashUseCase } from "./register-petty-cash.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { ExpenseUseCase } from "../../../finance/application/use-cases/expense.use-case";
import { PettyCashUseCase } from "../../../finance/application/use-cases/petty-cash.use-case";
import { NotFoundException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentMethod } from "@repo/db";

describe("RegisterPettyCashUseCase", () => {
  let useCase: RegisterPettyCashUseCase;
  let prisma: any;
  let expenseUseCase: any;
  let pettyCashUseCase: any;

  beforeEach(async () => {
    prisma = {
      client: {
        expenseCategory: { findFirst: vi.fn(), create: vi.fn() },
        pettyCashFund: { findFirst: vi.fn(), findMany: vi.fn() },
        pettyCashTransaction: { findMany: vi.fn() },
      },
    };

    expenseUseCase = {
      createExpense: vi.fn().mockResolvedValue({ id: "exp_1" }),
    };

    pettyCashUseCase = {
      getFunds: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterPettyCashUseCase,
        { provide: PrismaService, useValue: prisma },
        { provide: ExpenseUseCase, useValue: expenseUseCase },
        { provide: PettyCashUseCase, useValue: pettyCashUseCase },
      ],
    }).compile();

    useCase = module.get<RegisterPettyCashUseCase>(RegisterPettyCashUseCase);
  });

  it("should register petty cash with existing category and fund", async () => {
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    } as any;
    const dto = {
      description: "Test expense",
      amount: 100,
      paymentMethod: PaymentMethod.CASH,
    };

    prisma.client.expenseCategory.findFirst.mockResolvedValue({
      id: "cat_1",
      name: "Petty Cash",
    });
    prisma.client.pettyCashFund.findFirst.mockResolvedValue({ id: "fund_1" });

    const result = await useCase.execute(ctx, dto);

    expect(prisma.client.expenseCategory.findFirst).toHaveBeenCalled();
    expect(prisma.client.pettyCashFund.findFirst).toHaveBeenCalled();
    expect(expenseUseCase.createExpense).toHaveBeenCalledWith(
      "org_1",
      "mem_1",
      expect.objectContaining({
        description: "Test expense",
        amount: 100,
        categoryId: "cat_1",
        pettyCashFundId: "fund_1",
      }),
    );
    expect(result).toEqual({ id: "exp_1" });
  });

  it("should create category if it does not exist", async () => {
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    } as any;
    const dto = {
      description: "Test expense",
      amount: 100,
      paymentMethod: PaymentMethod.CASH,
    };

    prisma.client.expenseCategory.findFirst.mockResolvedValue(null);
    prisma.client.expenseCategory.create.mockResolvedValue({
      id: "cat_new",
      name: "Petty Cash",
    });
    prisma.client.pettyCashFund.findFirst.mockResolvedValue({ id: "fund_1" });

    await useCase.execute(ctx, dto);

    expect(prisma.client.expenseCategory.create).toHaveBeenCalledWith({
      data: {
        name: "Petty Cash",
        organizationId: "org_1",
        isActive: true,
      },
    });
  });

  it("should throw error if no fund is found", async () => {
    const ctx = {
      organizationId: "org_1",
      memberId: "mem_1",
      locationId: "loc_1",
    } as any;
    const dto = {
      description: "Test expense",
      amount: 100,
      paymentMethod: PaymentMethod.CASH,
    };

    prisma.client.expenseCategory.findFirst.mockResolvedValue({ id: "cat_1" });
    prisma.client.pettyCashFund.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(ctx, dto)).rejects.toThrow(NotFoundException);
  });

  it("should fetch recent transactions", async () => {
    const ctx = {
      organizationId: "org_1",
      locationId: "loc_1",
    } as any;

    const mockTransactions = [{ id: "tx_1", amount: 100 }];
    prisma.client.pettyCashTransaction.findMany.mockResolvedValue(mockTransactions);

    const result = await useCase.getRecentTransactions(ctx, 5);

    expect(prisma.client.pettyCashTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fund: {
            organizationId: "org_1",
            locationId: "loc_1",
          },
        },
        take: 5,
      }),
    );
    expect(result).toEqual(mockTransactions);
  });

  it("should prioritize location-specific funds in getFunds", async () => {
    const ctx = {
      organizationId: "org_1",
      locationId: "loc_1",
    } as any;

    const locFunds = [{ id: "fund_loc", locationId: "loc_1" }];
    prisma.client.pettyCashFund.findMany.mockResolvedValue(locFunds);

    const result = await useCase.getFunds(ctx);

    expect(prisma.client.pettyCashFund.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        locationId: "loc_1",
        isActive: true,
      },
    });
    expect(result).toEqual(locFunds);
    expect(pettyCashUseCase.getFunds).not.toHaveBeenCalled();
  });
});
