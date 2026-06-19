import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";
import { AccountType, AccountSubType, JournalSource, JournalStatus } from "@repo/db";

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async initializeChartOfAccounts(organizationId: string) {
    const standardAccounts = [
      // ASSETS
      { name: "Cash", code: "1000", type: AccountType.ASSET, subType: AccountSubType.CASH },
      { name: "Bank", code: "1010", type: AccountType.ASSET, subType: AccountSubType.BANK },
      { name: "Accounts Receivable", code: "1200", type: AccountType.ASSET, subType: AccountSubType.ACCOUNTS_RECEIVABLE },
      { name: "Inventory", code: "1300", type: AccountType.ASSET, subType: AccountSubType.INVENTORY },

      // LIABILITIES
      { name: "Accounts Payable", code: "2000", type: AccountType.LIABILITY, subType: AccountSubType.ACCOUNTS_PAYABLE },
      { name: "VAT Payable", code: "2200", type: AccountType.LIABILITY, subType: AccountSubType.TAX_PAYABLE },

      // EQUITY
      { name: "Retained Earnings", code: "3000", type: AccountType.EQUITY, subType: AccountSubType.RETAINED_EARNINGS, isSystem: true },

      // REVENUE
      { name: "Sales Revenue", code: "4000", type: AccountType.REVENUE, subType: AccountSubType.REVENUE },

      // EXPENSES
      { name: "Cost of Goods Sold", code: "5000", type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD },
      { name: "Operating Expenses", code: "6000", type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE },
    ];

    for (const account of standardAccounts) {
      await this.prisma.client.ledgerAccount.upsert({
        where: {
          organizationId_code: {
            organizationId,
            code: account.code,
          },
        },
        update: {},
        create: {
          ...account,
          organizationId,
        },
      });
    }
  }

  async createJournalEntry(params: {
    organizationId: string;
    memberId: string;
    description: string;
    reference?: string;
    sourceType?: JournalSource;
    sourceId?: string;
    entryDate?: Date;
    lines: { ledgerAccountId: string; debit: number; credit: number; description?: string }[];
  }) {
    // Validate that debits == credits
    const totalDebit = params.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = params.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new Error("Journal entry must be balanced (Debits must equal Credits)");
    }

    return this.prisma.client.journalEntry.create({
      data: {
        organizationId: params.organizationId,
        memberId: params.memberId,
        description: params.description,
        reference: params.reference,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        entryDate: params.entryDate || new Date(),
        status: JournalStatus.POSTED,
        lines: {
          create: params.lines.map(line => ({
            ledgerAccountId: line.ledgerAccountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }

  private async getSystemMemberId(organizationId: string): Promise<string> {
    const member = await this.prisma.client.member.findFirst({
      where: { organizationId, role: "OWNER" },
      select: { id: true },
    });
    if (!member) {
        const anyMember = await this.prisma.client.member.findFirst({
            where: { organizationId },
            select: { id: true }
        });
        return anyMember?.id || "";
    }
    return member.id;
  }

  async postSaleToLedger(transactionId: string) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) return;

    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId: transaction.organizationId,
        subType: { in: [AccountSubType.ACCOUNTS_RECEIVABLE, AccountSubType.REVENUE, AccountSubType.TAX_PAYABLE] },
      },
    });

    const arAccount = accounts.find(a => a.subType === AccountSubType.ACCOUNTS_RECEIVABLE);
    const revenueAccount = accounts.find(a => a.subType === AccountSubType.REVENUE);
    const taxAccount = accounts.find(a => a.subType === AccountSubType.TAX_PAYABLE);

    if (!arAccount || !revenueAccount) return;

    const lines = [
      { ledgerAccountId: arAccount.id, debit: Number(transaction.finalTotal), credit: 0 },
      { ledgerAccountId: revenueAccount.id, debit: 0, credit: Number(transaction.subtotal) },
    ];

    if (taxAccount && Number(transaction.taxTotal) > 0) {
      lines.push({ ledgerAccountId: taxAccount.id, debit: 0, credit: Number(transaction.taxTotal) });
    }

    const memberId = transaction.memberId || (await this.getSystemMemberId(transaction.organizationId));

    return this.createJournalEntry({
      organizationId: transaction.organizationId,
      memberId,
      description: `Sale ${transaction.number}`,
      reference: transaction.number,
      sourceType: JournalSource.SALE,
      sourceId: transaction.id,
      lines,
    });
  }

  async postPurchaseToLedger(purchaseId: string) {
    const purchase = await this.prisma.client.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase || purchase.status !== "APPROVED") return;

    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId: purchase.organizationId,
        subType: { in: [AccountSubType.ACCOUNTS_PAYABLE, AccountSubType.INVENTORY, AccountSubType.TAX_PAYABLE] },
      },
    });

    const apAccount = accounts.find(a => a.subType === AccountSubType.ACCOUNTS_PAYABLE);
    const inventoryAccount = accounts.find(a => a.subType === AccountSubType.INVENTORY);
    const taxAccount = accounts.find(a => a.subType === AccountSubType.TAX_PAYABLE);

    if (!apAccount || !inventoryAccount) return;

    const taxAmount = Number(purchase.totalTaxAmount || 0);
    const netAmount = Number(purchase.totalAmount) - taxAmount;

    const lines = [
      { ledgerAccountId: inventoryAccount.id, debit: netAmount, credit: 0 },
      { ledgerAccountId: apAccount.id, debit: 0, credit: Number(purchase.totalAmount) },
    ];

    if (taxAccount && taxAmount > 0) {
      lines.push({ ledgerAccountId: taxAccount.id, debit: taxAmount, credit: 0 });
    }

    const memberId = purchase.memberId || (await this.getSystemMemberId(purchase.organizationId));

    return this.createJournalEntry({
      organizationId: purchase.organizationId,
      memberId,
      description: `Purchase Order ${purchase.purchaseNumber}`,
      reference: purchase.purchaseNumber,
      sourceType: JournalSource.PURCHASE,
      sourceId: purchase.id,
      lines,
    });
  }

  async postExpenseToLedger(expenseId: string) {
    const expense = await this.prisma.client.expense.findUnique({
      where: { id: expenseId },
      include: { category: true },
    });

    if (!expense || expense.status !== "APPROVED") return;

    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId: expense.organizationId,
        subType: { in: [AccountSubType.CASH, AccountSubType.OPERATING_EXPENSE, AccountSubType.TAX_PAYABLE] },
      },
    });

    const expenseAccount = expense.category.ledgerAccountId
      ? { id: expense.category.ledgerAccountId }
      : accounts.find(a => a.subType === AccountSubType.OPERATING_EXPENSE);

    const cashAccount = accounts.find(a => a.subType === AccountSubType.CASH);
    const taxAccount = accounts.find(a => a.subType === AccountSubType.TAX_PAYABLE);

    if (!expenseAccount || !cashAccount) return;

    const taxAmount = Number(expense.taxAmount || 0);
    const netAmount = Number(expense.amount) - taxAmount;

    const lines = [
      { ledgerAccountId: expenseAccount.id, debit: netAmount, credit: 0 },
      { ledgerAccountId: cashAccount.id, debit: 0, credit: Number(expense.amount) },
    ];

    if (taxAccount && taxAmount > 0) {
      lines.push({ ledgerAccountId: taxAccount.id, debit: taxAmount, credit: 0 });
    }

    return this.createJournalEntry({
      organizationId: expense.organizationId,
      memberId: expense.memberId,
      description: `Expense ${expense.expenseNumber}: ${expense.description}`,
      reference: expense.expenseNumber,
      sourceType: JournalSource.EXPENSE,
      sourceId: expense.id,
      lines,
    });
  }

  async autoMatchBankStatement(statementId: string) {
    const statement = await this.prisma.client.bankStatement.findUnique({
      where: { id: statementId },
      include: { lines: { where: { status: "UNMATCHED" } } },
    });

    if (!statement) return;

    const candidates = await this.prisma.client.journalLine.findMany({
      where: {
        journalEntry: {
          organizationId: statement.organizationId,
          status: JournalStatus.POSTED,
        },
        bankStatementLineId: null,
      },
      include: { journalEntry: true },
    });

    let matchCount = 0;

    for (const line of statement.lines) {
      const match = candidates.find(c => {
        const lineAmount = Number(line.amount);
        const journalAmount = lineAmount > 0 ? Number(c.debit) : -Number(c.credit);

        const dateDiff = Math.abs(new Date(line.transactionDate).getTime() - new Date(c.journalEntry.entryDate).getTime());
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        return Math.abs(lineAmount - journalAmount) < 0.01 && dateDiff <= threeDays;
      });

      if (match) {
        await this.prisma.client.$transaction([
          this.prisma.client.bankStatementLine.update({
            where: { id: line.id },
            data: { status: "MATCHED" },
          }),
          this.prisma.client.journalLine.update({
            where: { id: match.id },
            data: { bankStatementLineId: line.id },
          }),
        ]);
        matchCount++;
      }
    }

    return { matchCount };
  }
}
