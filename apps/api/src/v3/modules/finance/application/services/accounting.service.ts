import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { AccountType, AccountSubType } from "@prisma/client";

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
      await this.prisma.ledgerAccount.upsert({
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
    sourceType?: any;
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

    return this.prisma.journalEntry.create({
      data: {
        organizationId: params.organizationId,
        memberId: params.memberId,
        description: params.description,
        reference: params.reference,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        entryDate: params.entryDate || new Date(),
        status: "POSTED",
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

  // Example: Auto-posting a Sale
  async postSaleToLedger(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) return;

    const accounts = await this.prisma.ledgerAccount.findMany({
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

    return this.createJournalEntry({
      organizationId: transaction.organizationId,
      memberId: transaction.memberId || "", // Should ideally have a system member or the creator
      description: `Sale ${transaction.number}`,
      reference: transaction.number,
      sourceType: "SALE",
      sourceId: transaction.id,
      lines,
    });
  }
}
