import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";

@Injectable()
export class FinancialReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitAndLoss(organizationId: string, startDate: Date, endDate: Date) {
    const [accounts, lineSums] = await Promise.all([
      this.prisma.client.ledgerAccount.findMany({
        where: {
          organizationId,
          type: { in: ["REVENUE", "EXPENSE"] as any[] },
        },
        select: { id: true, name: true, code: true, type: true },
      }),
      this.prisma.client.journalLine.groupBy({
        by: ["ledgerAccountId"],
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { gte: startDate, lte: endDate },
          },
        },
        _sum: { debit: true, credit: true },
      }),
    ]);

    const sumMap = new Map(lineSums.map(s => [s.ledgerAccountId, s._sum]));

    const report = {
      revenue: [] as any[],
      expenses: [] as any[],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
    };

    for (const account of accounts) {
      const sums = sumMap.get(account.id) || { debit: 0, credit: 0 };
      const debit = Number(sums.debit || 0);
      const credit = Number(sums.credit || 0);

      // Revenue increases with Credit, Expenses increase with Debit
      const balance = account.type === "REVENUE" ? credit - debit : debit - credit;

      const entry = { name: account.name, code: account.code, balance };

      if (account.type === "REVENUE") {
        report.revenue.push(entry);
        report.totalRevenue += balance;
      } else {
        report.expenses.push(entry);
        report.totalExpenses += balance;
      }
    }

    report.netProfit = report.totalRevenue - report.totalExpenses;
    return report;
  }

  async getBalanceSheet(organizationId: string, asOfDate: Date) {
    const [accounts, lineSums] = await Promise.all([
      this.prisma.client.ledgerAccount.findMany({
        where: {
          organizationId,
          type: { in: ["ASSET", "LIABILITY", "EQUITY"] as any[] },
        },
        select: { id: true, name: true, code: true, type: true },
      }),
      this.prisma.client.journalLine.groupBy({
        by: ["ledgerAccountId"],
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { lte: asOfDate },
          },
        },
        _sum: { debit: true, credit: true },
      }),
    ]);

    const sumMap = new Map(lineSums.map(s => [s.ledgerAccountId, s._sum]));

    const report = {
      assets: [] as any[],
      liabilities: [] as any[],
      equity: [] as any[],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };

    for (const account of accounts) {
      const sums = sumMap.get(account.id) || { debit: 0, credit: 0 };
      const debit = Number(sums.debit || 0);
      const credit = Number(sums.credit || 0);

      // Assets increase with Debit, Liabilities/Equity increase with Credit
      const balance = account.type === "ASSET" ? debit - credit : credit - debit;

      const entry = { name: account.name, code: account.code, balance };

      if (account.type === "ASSET") {
        report.assets.push(entry);
        report.totalAssets += balance;
      } else if (account.type === "LIABILITY") {
        report.liabilities.push(entry);
        report.totalLiabilities += balance;
      } else {
        report.equity.push(entry);
        report.totalEquity += balance;
      }
    }

    return report;
  }

  async getCashFlowStatement(organizationId: string, startDate: Date, endDate: Date) {
    // Optimized Cash Flow (Direct Method - tracking Cash/Bank account movements)
    // Fetch journal lines directly for cash/bank accounts to avoid loading full LedgerAccount relation
    const journalLines = await this.prisma.client.journalLine.findMany({
      where: {
        journalEntry: {
          organizationId,
          status: "POSTED" as any,
          entryDate: { gte: startDate, lte: endDate },
        },
        ledgerAccount: {
          subType: { in: ["CASH", "BANK"] as any[] },
        },
      },
      select: {
        debit: true,
        credit: true,
        journalEntry: {
          select: {
            entryDate: true,
            description: true,
            sourceType: true,
          },
        },
      },
    });

    const report = {
      operatingActivities: [] as any[],
      investingActivities: [] as any[],
      financingActivities: [] as any[],
      netCashChange: 0,
    };

    for (const line of journalLines) {
      const amount = Number(line.debit) - Number(line.credit);
      const activity = {
        date: line.journalEntry.entryDate,
        description: line.journalEntry.description,
        amount,
      };

      // Simplified classification based on source type
      if (line.journalEntry.sourceType === "SALE" || line.journalEntry.sourceType === "EXPENSE") {
        report.operatingActivities.push(activity);
      } else {
        // Fallback or other classifications can go here
        report.operatingActivities.push(activity);
      }
      report.netCashChange += amount;
    }

    return report;
  }

  async getKenyanTaxSummary(organizationId: string, startDate: Date, endDate: Date) {
    const [filings, outputTaxResult, inputTaxResult] = await Promise.all([
      this.prisma.client.taxFiling.findMany({
        where: {
          organizationId,
          periodStartDate: { gte: startDate },
          periodEndDate: { lte: endDate },
        },
        select: {
          id: true,
          status: true,
          periodStartDate: true,
          periodEndDate: true,
          taxAuthority: { select: { name: true } },
        },
      }),
      this.prisma.client.journalLine.aggregate({
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { gte: startDate, lte: endDate },
            sourceType: "SALE" as any,
          },
          ledgerAccount: {
            subType: "TAX_PAYABLE" as any,
          },
        },
        _sum: { credit: true },
      }),
      this.prisma.client.journalLine.aggregate({
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { gte: startDate, lte: endDate },
            sourceType: { in: ["PURCHASE", "EXPENSE"] as any[] },
          },
          ledgerAccount: {
            subType: "TAX_PAYABLE" as any,
          },
        },
        _sum: { debit: true },
      }),
    ]);

    const outputTax = Number(outputTaxResult._sum.credit || 0);
    const inputTax = Number(inputTaxResult._sum.debit || 0);

    return {
      vatSummary: {
        outputTax,
        inputTax,
        netVatPayable: outputTax - inputTax,
      },
      filings,
    };
  }
}
