import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateExpenseDto } from "../dto/finance.dto";
import { Prisma, ExpenseStatus, PettyCashTransactionType } from "@repo/db";

@Injectable()
export class ExpenseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(
    organizationId: string,
    memberId: string,
    dto: CreateExpenseDto,
  ) {
    const org = await this.getOrganization(organizationId);
    const amountDecimal = new Prisma.Decimal(dto.amount);

    this.validateReceipt(org, amountDecimal, dto.receiptUrl);
    const status = this.determineStatus(
      org,
      amountDecimal,
      dto.pettyCashFundId,
    );
    const expenseNumber = await this.generateExpenseNumber(organizationId);

    return await this.prisma.client.$transaction(async (tx) => {
      const expense = await this.persistExpense(
        tx,
        organizationId,
        memberId,
        dto,
        status,
        expenseNumber,
      );

      if (status === ExpenseStatus.APPROVED) {
        await this.handlePostApprovalActions(
          tx,
          organizationId,
          memberId,
          dto,
          amountDecimal,
        );
      }

      return expense;
    });
  }

  private async getOrganization(organizationId: string) {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        expenseApprovalThreshold: true,
        expenseReceiptThreshold: true,
        pettyCashAutoApproveThreshold: true,
      },
    });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  private validateReceipt(
    org: any,
    amount: Prisma.Decimal,
    receiptUrl?: string,
  ) {
    if (
      org.expenseReceiptThreshold &&
      amount.gte(org.expenseReceiptThreshold) &&
      !receiptUrl
    ) {
      throw new BadRequestException(
        `Receipt is required for expenses above ${org.expenseReceiptThreshold}`,
      );
    }
  }

  private determineStatus(
    org: any,
    amount: Prisma.Decimal,
    pettyCashFundId?: string,
  ): ExpenseStatus {
    if (pettyCashFundId && org.pettyCashAutoApproveThreshold) {
      if (
        amount.lte(
          new Prisma.Decimal(org.pettyCashAutoApproveThreshold.toString()),
        )
      ) {
        return ExpenseStatus.APPROVED;
      }
    }
    if (
      org.expenseApprovalThreshold &&
      amount.gte(org.expenseApprovalThreshold)
    ) {
      return ExpenseStatus.PENDING;
    }
    return ExpenseStatus.APPROVED;
  }

  private async generateExpenseNumber(organizationId: string) {
    const count = await this.prisma.client.expense.count({
      where: { organizationId },
    });
    return `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
  }

  private async persistExpense(
    tx: any,
    organizationId: string,
    memberId: string,
    dto: CreateExpenseDto,
    status: ExpenseStatus,
    expenseNumber: string,
  ) {
    const {
      amount,
      categoryId,
      pettyCashFundId,
      utilityAccountId,
      budgetId,
      locationId,
      supplierId,
      purchaseId,
      expenseDate,
      ...rest
    } = dto;
    return await tx.expense.create({
      data: {
        ...rest,
        expenseNumber,
        amount: new Prisma.Decimal(amount),
        status,
        memberId,
        organizationId,
        categoryId,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        ...(locationId && { locationId }),
        ...(supplierId && { supplierId }),
        ...(purchaseId && { purchaseId }),
        ...(pettyCashFundId && { pettyCashFundId }),
        ...(utilityAccountId && { utilityAccountId }),
        ...(budgetId && { budgetId }),
        ...(status === ExpenseStatus.APPROVED
          ? {
              approverId: memberId,
              approvalDate: new Date(),
            }
          : {}),
      },
    });
  }

  private async handlePostApprovalActions(
    tx: any,
    organizationId: string,
    memberId: string,
    dto: CreateExpenseDto,
    amount: Prisma.Decimal,
  ) {
    if (dto.pettyCashFundId) {
      await this.decrementPettyCash(
        tx,
        organizationId,
        memberId,
        dto.pettyCashFundId,
        amount,
        dto.description,
      );
    }
    if (dto.budgetId) {
      await tx.budget.update({
        where: { id: dto.budgetId },
        data: { spentAmount: { increment: amount } },
      });
    }
  }

  private async decrementPettyCash(
    tx: any,
    organizationId: string,
    memberId: string,
    fundId: string,
    amount: Prisma.Decimal,
    description: string,
  ) {
    const fund = await tx.pettyCashFund.findFirst({
      where: { id: fundId, organizationId },
    });
    if (!fund) throw new NotFoundException("Petty cash fund not found");
    if (fund.amount.lessThan(amount))
      throw new BadRequestException("Insufficient funds in petty cash");

    await tx.pettyCashFund.update({
      where: { id: fundId },
      data: { amount: { decrement: amount } },
    });

    await tx.pettyCashTransaction.create({
      data: {
        fundId,
        type: PettyCashTransactionType.EXPENSE,
        amount,
        description,
        memberId,
      },
    });
  }

  async getExpenses(
    organizationId: string,
    filters: {
      status?: ExpenseStatus;
      categoryId?: string;
      locationId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { startDate, endDate, ...restFilters } = filters;
    const where: Prisma.ExpenseWhereInput = {
      organizationId,
      ...restFilters,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.expenseDate = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    return await this.prisma.client.expense.findMany({
      where,
      // ⚡ Bolt Optimization: Use targeted select for list view to reduce database load
      // and network payload size by fetching only necessary fields.
      select: {
        id: true,
        expenseNumber: true,
        description: true,
        expenseDate: true,
        amount: true,
        currencyCode: true,
        exchangeRate: true,
        baseAmount: true,
        taxAmount: true,
        taxRate: true,
        paymentMethod: true,
        status: true,
        isReimbursable: true,
        isBillable: true,
        receiptUrl: true,
        notes: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        locationId: true,
        memberId: true,
        supplierId: true,
        purchaseId: true,
        budgetId: true,
        pettyCashFundId: true,
        utilityAccountId: true,
        category: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        member: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
        pettyCashFund: { select: { id: true, name: true } },
        utilityAccount: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: "desc" },
    });
  }

  async getExpenseCategories(organizationId: string) {
    return await this.prisma.client.expenseCategory.findMany({
      where: { organizationId, isActive: true },
    });
  }

  async approveExpense(
    organizationId: string,
    memberId: string,
    expenseId: string,
  ) {
    return await this.prisma.client.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, organizationId },
        // ⚡ Bolt Optimization: Select only required fields for verification
        // and post-approval actions to reduce database I/O.
        select: {
          id: true,
          status: true,
          amount: true,
          description: true,
          pettyCashFundId: true,
          budgetId: true,
        },
      });

      if (!expense) throw new NotFoundException("Expense not found");
      if (
        expense.status !== ExpenseStatus.PENDING &&
        expense.status !== ExpenseStatus.PENDING_APPROVAL
      ) {
        throw new BadRequestException(
          "Expense is not in a state that can be approved",
        );
      }

      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.APPROVED,
          approverId: memberId,
          approvalDate: new Date(),
        },
      });

      await this.handlePostApprovalActions(
        tx,
        organizationId,
        memberId,
        {
          description: expense.description,
          pettyCashFundId: expense.pettyCashFundId,
          budgetId: expense.budgetId,
        } as any,
        expense.amount,
      );

      return updatedExpense;
    });
  }
}
