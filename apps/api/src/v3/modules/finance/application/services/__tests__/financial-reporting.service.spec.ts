import { Test, TestingModule } from "@nestjs/testing";
import { FinancialReportingService } from "../financial-reporting.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("FinancialReportingService", () => {
  let service: FinancialReportingService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      ledgerAccount: {
        findMany: vi.fn(),
      },
      journalLine: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      taxFiling: {
        findMany: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialReportingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinancialReportingService>(FinancialReportingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfitAndLoss", () => {
    it("should calculate profit and loss correctly", async () => {
      const orgId = "org-1";
      const start = new Date("2023-01-01");
      const end = new Date("2023-01-31");

      mockPrisma.client.ledgerAccount.findMany.mockResolvedValue([
        { id: "1", name: "Sales", code: "4000", type: "REVENUE" },
        { id: "2", name: "Rent", code: "6000", type: "EXPENSE" },
      ]);

      mockPrisma.client.journalLine.groupBy.mockResolvedValue([
        { ledgerAccountId: "1", _sum: { debit: 0, credit: 1000 } },
        { ledgerAccountId: "2", _sum: { debit: 400, credit: 0 } },
      ]);

      const result = await service.getProfitAndLoss(orgId, start, end);

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalExpenses).toBe(400);
      expect(result.netProfit).toBe(600);
      expect(result.revenue).toHaveLength(1);
      expect(result.expenses).toHaveLength(1);
    });
  });

  describe("getBalanceSheet", () => {
    it("should calculate balance sheet correctly", async () => {
      const orgId = "org-1";
      const asOf = new Date("2023-01-31");

      mockPrisma.client.ledgerAccount.findMany.mockResolvedValue([
        { id: "1", name: "Cash", code: "1000", type: "ASSET" },
        { id: "2", name: "AP", code: "2000", type: "LIABILITY" },
      ]);

      mockPrisma.client.journalLine.groupBy.mockResolvedValue([
        { ledgerAccountId: "1", _sum: { debit: 1500, credit: 500 } },
        { ledgerAccountId: "2", _sum: { debit: 100, credit: 300 } },
      ]);

      const result = await service.getBalanceSheet(orgId, asOf);

      expect(result.totalAssets).toBe(1000); // 1500 - 500
      expect(result.totalLiabilities).toBe(200); // 300 - 100
      expect(result.assets[0].balance).toBe(1000);
      expect(result.liabilities[0].balance).toBe(200);
    });
  });

  describe("getKenyanTaxSummary", () => {
    it("should aggregate tax data correctly", async () => {
      const orgId = "org-1";
      const start = new Date("2023-01-01");
      const end = new Date("2023-01-31");

      mockPrisma.client.taxFiling.findMany.mockResolvedValue([]);
      mockPrisma.client.journalLine.aggregate
        .mockResolvedValueOnce({ _sum: { credit: 160 } }) // output
        .mockResolvedValueOnce({ _sum: { debit: 100 } }); // input

      const result = await service.getKenyanTaxSummary(orgId, start, end);

      expect(result.vatSummary.outputTax).toBe(160);
      expect(result.vatSummary.inputTax).toBe(100);
      expect(result.vatSummary.netVatPayable).toBe(60);
    });
  });
});
