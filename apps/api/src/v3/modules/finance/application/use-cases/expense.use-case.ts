import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AccountingService } from "../services/accounting.service";
import { Optional, Inject } from "@nestjs/common";
import { CreateExpenseDto } from "../dto/finance.dto";
import { Prisma, ExpenseStatus, PettyCashTransactionType } from "@repo/db";

@Injectable()
export class ExpenseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(AccountingService) private readonly accountingService?: AccountingService,
  ) {}

  async createExpense(
    organizationId: string,
    memberId: string,
    dto: CreateExpenseDto,
  ) {
    const org = await this.getOrganization(organizationId);
    const amountDecimal = new Prisma.Decimal(dto.amount);

    this.validateReceipt(org, amountDecimal, dto.receiptUrl);
    const status = dto.autoApprove
      ? ExpenseStatus.APPROVED
      : this.determineStatus(
          org,
          amountDecimal,
          dto.pettyCashFundId,
        );
    const expenseNumber = await this.generateExpenseNumber(organizationId);

    // ⚡ Bolt Optimization: Validate reference entity existences outside the transactional scope.
    // Executing these read-only checks beforehand avoids holding the database transaction open,
    // reducing query lock contention and connection pool occupation.
    await this.validateReferencedEntities(organizationId, dto);

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
          expense.id,
        );
      }

      return expense;
    });
  }

  private async validateReferencedEntities(
    organizationId: string,
    dto: CreateExpenseDto,
  ) {
    // 🛡️ Sentinel: IDOR Prevention - Verify all referenced entities belong to the organization
    const validations = [
      this.prisma.client.expenseCategory.count({ where: { id: dto.categoryId, organizationId } }),
    ];

    if (dto.budgetId) validations.push(this.prisma.client.budget.count({ where: { id: dto.budgetId, organizationId } }));
    if (dto.supplierId) validations.push(this.prisma.client.supplier.count({ where: { id: dto.supplierId, organizationId } }));
    if (dto.purchaseId) validations.push(this.prisma.client.purchase.count({ where: { id: dto.purchaseId, organizationId } }));
    if (dto.locationId) validations.push(this.prisma.client.inventoryLocation.count({ where: { id: dto.locationId, organizationId } }));
    if (dto.utilityAccountId) validations.push(this.prisma.client.utilityAccount.count({ where: { id: dto.utilityAccountId, organizationId } }));
    if (dto.pettyCashFundId) validations.push(this.prisma.client.pettyCashFund.count({ where: { id: dto.pettyCashFundId, organizationId } }));
    if (dto.costCenterId) validations.push(this.prisma.client.costCenter.count({ where: { id: dto.costCenterId, organizationId } }));
    if (dto.ledgerAccountId) validations.push(this.prisma.client.ledgerAccount.count({ where: { id: dto.ledgerAccountId, organizationId } }));

    const results = await Promise.all(validations);
    if (results.some((count) => count === 0)) {
      throw new ForbiddenException(
        "One or more referenced entities not found or unauthorized",
      );
    }
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
    return await tx.expense.create({
      data: {
        // 🛡️ Sentinel: Mass Assignment Protection - Explicitly map allowed fields from DTO
        expenseNumber,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        status,
        memberId,
        organizationId,
        categoryId: dto.categoryId,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        paymentMethod: dto.paymentMethod,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        tags: dto.tags,
        isReimbursable: dto.isReimbursable ?? false,
        isBillable: dto.isBillable ?? false,
        locationId: dto.locationId,
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId,
        pettyCashFundId: dto.pettyCashFundId,
        utilityAccountId: dto.utilityAccountId,
        budgetId: dto.budgetId,
        costCenterId: dto.costCenterId,
        ledgerAccountId: dto.ledgerAccountId,
        currencyCode: dto.currencyCode ?? "KES",
        taxAmount: dto.taxAmount !== undefined ? new Prisma.Decimal(dto.taxAmount) : undefined,
        taxRate: dto.taxRate !== undefined ? new Prisma.Decimal(dto.taxRate) : undefined,
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
    expenseId?: string,
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
      // 🛡️ Sentinel: Defense in Depth - Use updateMany with organizationId scoping
      await tx.budget.updateMany({
        where: { id: dto.budgetId, organizationId },
        data: { spentAmount: { increment: amount } },
      });
    }
    if (this.accountingService && expenseId) {
      try {
        await this.accountingService.postExpenseToLedger(expenseId, organizationId);
      } catch (err) {
        // Soft failure for GL posting
      }
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

    // SECURITY (Sentinel): PettyCashFund lacks a composite unique constraint on [id, organizationId].
    // Standard Prisma update ignores non-unique fields in where clauses at runtime.
    // Using updateMany strictly enforces database-level multi-tenant isolation during balance adjustments.
    await tx.pettyCashFund.updateMany({
      where: { id: fundId, organizationId },
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

  async getExpense(organizationId: string, id: string) {
    const expense = await this.prisma.client.expense.findFirst({
      where: { id, organizationId, deletedAt: null },
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
    });
    if (!expense) throw new NotFoundException("Expense not found");
    return expense;
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
    const categories = await this.prisma.client.expenseCategory.findMany({
      where: { organizationId, isActive: true },
    });
    if (categories.length === 0) {
      const defaultCategory = await this.prisma.client.expenseCategory.create({
        data: {
          name: "General Expenses",
          description: "Default category for organization expenses",
          organizationId,
          isActive: true,
        },
      });
      return [defaultCategory];
    }
    return categories;
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

      // SECURITY (Sentinel): Expense model lacks a composite unique constraint on [id, organizationId].
      // Standard Prisma update ignores non-unique fields in where clauses at runtime.
      // Using updateMany strictly enforces database-level multi-tenant isolation during status updates.
      await tx.expense.updateMany({
        where: { id: expenseId, organizationId },
        data: {
          status: ExpenseStatus.APPROVED,
          approverId: memberId,
          approvalDate: new Date(),
        },
      });

      const updatedExpense = await tx.expense.findFirstOrThrow({
        where: { id: expenseId, organizationId },
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
        expense.id,
      );

      return updatedExpense;
    });
  }

  async rejectExpense(
    organizationId: string,
    memberId: string,
    expenseId: string,
    reason?: string,
  ) {
    const expense = await this.prisma.client.expense.findFirst({
      where: { id: expenseId, organizationId },
    });
    if (!expense) throw new NotFoundException("Expense not found");
    if (
      expense.status !== ExpenseStatus.PENDING &&
      expense.status !== ExpenseStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException("Expense is not pending approval");
    }

    await this.prisma.client.expense.updateMany({
      where: { id: expenseId, organizationId },
      data: {
        status: ExpenseStatus.REJECTED,
        approverId: memberId,
        approvalDate: new Date(),
        notes: reason ? `Rejected: ${reason}` : expense.notes,
      },
    });

    return await this.prisma.client.expense.findFirstOrThrow({
      where: { id: expenseId, organizationId },
    });
  }

  async getExpenseReportSummary(
    organizationId: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const where: Prisma.ExpenseWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      };
    }

    const expenses = await this.prisma.client.expense.findMany({
      where,
      select: {
        id: true,
        amount: true,
        taxAmount: true,
        status: true,
        expenseDate: true,
        categoryId: true,
        costCenterId: true,
        pettyCashFundId: true,
        category: { select: { id: true, name: true } },
        costCenter: { select: { id: true, name: true, code: true } },
      },
    });

    let totalAmount = 0;
    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let totalTaxAmount = 0;

    const categoryMap = new Map<string, { id: string; name: string; total: number; count: number }>();
    const costCenterMap = new Map<string, { id: string; name: string; code: string; total: number; count: number }>();

    for (const exp of expenses) {
      const amt = Number(exp.amount?.toString() || 0);
      const tax = Number(exp.taxAmount?.toString() || 0);
      totalAmount += amt;
      totalTaxAmount += tax;

      if (exp.status === ExpenseStatus.APPROVED || exp.status === ExpenseStatus.PAID) {
        totalApproved += amt;
      } else if (exp.status === ExpenseStatus.PENDING || exp.status === ExpenseStatus.PENDING_APPROVAL) {
        totalPending += amt;
      } else if (exp.status === ExpenseStatus.REJECTED) {
        totalRejected += amt;
      }

      const catName = exp.category?.name || "Uncategorized";
      const catId = exp.categoryId || "uncategorized";
      const catEntry = categoryMap.get(catId) || { id: catId, name: catName, total: 0, count: 0 };
      catEntry.total += amt;
      catEntry.count += 1;
      categoryMap.set(catId, catEntry);

      if (exp.costCenterId && exp.costCenter) {
        const ccId = exp.costCenterId;
        const ccEntry = costCenterMap.get(ccId) || {
          id: ccId,
          name: exp.costCenter.name,
          code: exp.costCenter.code,
          total: 0,
          count: 0,
        };
        ccEntry.total += amt;
        ccEntry.count += 1;
        costCenterMap.set(ccId, ccEntry);
      }
    }

    return {
      totalAmount,
      totalApproved,
      totalPending,
      totalRejected,
      totalTaxAmount,
      totalExpensesCount: expenses.length,
      categoryBreakdown: Array.from(categoryMap.values()),
      costCenterBreakdown: Array.from(costCenterMap.values()),
    };
  }
}