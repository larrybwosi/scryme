import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";

@Injectable()
export class FinancialReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitAndLoss(organizationId: string, startDate: Date, endDate: Date) {
    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId,
        type: { in: ["REVENUE", "EXPENSE"] as any[] },
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              organizationId,
              status: "POSTED" as any,
              entryDate: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    });

    const report = {
      revenue: [] as any[],
      expenses: [] as any[],
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
    };

    for (const account of accounts) {
      const balance = account.journalLines.reduce((sum, line) => {
        // Revenue increases with Credit, Expenses increase with Debit
        if (account.type === "REVENUE") {
          return sum + (Number(line.credit) - Number(line.debit));
        } else {
          return sum + (Number(line.debit) - Number(line.credit));
        }
      }, 0);

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
    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId,
        type: { in: ["ASSET", "LIABILITY", "EQUITY"] as any[] },
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              organizationId,
              status: "POSTED" as any,
              entryDate: { lte: asOfDate },
            },
          },
        },
      },
    });

    const report = {
      assets: [] as any[],
      liabilities: [] as any[],
      equity: [] as any[],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };

    for (const account of accounts) {
      const balance = account.journalLines.reduce((sum, line) => {
        // Assets increase with Debit, Liabilities/Equity increase with Credit
        if (account.type === "ASSET") {
          return sum + (Number(line.debit) - Number(line.credit));
        } else {
          return sum + (Number(line.credit) - Number(line.debit));
        }
      }, 0);

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
    // Simplified Cash Flow (Direct Method - tracking Cash/Bank account movements)
    const cashAccounts = await this.prisma.client.ledgerAccount.findMany({
      where: {
        organizationId,
        subType: { in: ["CASH", "BANK"] as any[] },
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              organizationId,
              status: "POSTED" as any,
              entryDate: { gte: startDate, lte: endDate },
            },
          },
          include: {
            journalEntry: true,
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

    for (const account of cashAccounts) {
      for (const line of account.journalLines) {
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
          report.operatingActivities.push(activity);
        }
        report.netCashChange += amount;
      }
    }

    return report;
  }

  async getKenyanTaxSummary(organizationId: string, startDate: Date, endDate: Date) {
    const filings = await this.prisma.client.taxFiling.findMany({
      where: {
        organizationId,
        periodStartDate: { gte: startDate },
        periodEndDate: { lte: endDate },
      },
      include: {
        taxAuthority: true,
      },
    });

    const ledgerData = await this.prisma.client.journalLine.findMany({
      where: {
        journalEntry: {
          organizationId,
          status: "POSTED" as any,
          entryDate: { gte: startDate, lte: endDate },
        },
        ledgerAccount: {
          subType: "TAX_PAYABLE" as any,
        },
      },
      include: {
        journalEntry: true,
      },
    });

    const outputTax = ledgerData
      .filter(l => l.journalEntry.sourceType === "SALE")
      .reduce((sum, l) => sum + Number(l.credit), 0);

    const inputTax = ledgerData
      .filter(l => l.journalEntry.sourceType === "PURCHASE" || l.journalEntry.sourceType === "EXPENSE")
      .reduce((sum, l) => sum + Number(l.debit), 0);

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
