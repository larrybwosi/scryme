import { Test, TestingModule } from "@nestjs/testing";
import { AccountingService } from "../accounting.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AccountType, AccountSubType, JournalSource, JournalStatus } from "@repo/db";

describe("AccountingService", () => {
  let service: AccountingService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      ledgerAccount: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      journalEntry: {
        create: vi.fn(),
      },
      transaction: {
        findFirst: vi.fn(),
      },
      purchase: {
        findFirst: vi.fn(),
      },
      expense: {
        findFirst: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
      bankStatement: {
        findFirst: vi.fn(),
      },
      journalLine: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      bankStatementLine: {
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("initializeChartOfAccounts", () => {
    it("should initialize default ledger accounts in parallel via upsert", async () => {
      const orgId = "org-123";
      mockPrisma.client.ledgerAccount.upsert.mockResolvedValue({});

      await service.initializeChartOfAccounts(orgId);

      // Verify that ledgerAccount.upsert was called 10 times in total (one for each standard account)
      expect(mockPrisma.client.ledgerAccount.upsert).toHaveBeenCalledTimes(10);

      // Ensure cash account is initialized correctly
      expect(mockPrisma.client.ledgerAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_code: {
              organizationId: orgId,
              code: "1000",
            },
          },
          create: expect.objectContaining({
            name: "Cash",
            code: "1000",
            type: AccountType.ASSET,
            subType: AccountSubType.CASH,
            organizationId: orgId,
          }),
        }),
      );
    });
  });

  describe("createJournalEntry", () => {
    it("should throw an error if debits and credits are not balanced", async () => {
      const params = {
        organizationId: "org-1",
        memberId: "mem-1",
        description: "Test entry",
        lines: [
          { ledgerAccountId: "acc-1", debit: 100, credit: 0 },
          { ledgerAccountId: "acc-2", debit: 0, credit: 50 },
        ],
      };

      await expect(service.createJournalEntry(params)).rejects.toThrow(
        "Journal entry must be balanced (Debits must equal Credits)",
      );
    });

    it("should create a balanced journal entry", async () => {
      const params = {
        organizationId: "org-1",
        memberId: "mem-1",
        description: "Test entry",
        lines: [
          { ledgerAccountId: "acc-1", debit: 100, credit: 0 },
          { ledgerAccountId: "acc-2", debit: 0, credit: 100 },
        ],
      };

      mockPrisma.client.journalEntry.create.mockResolvedValue({ id: "entry-1" });

      const result = await service.createJournalEntry(params);

      expect(result).toEqual({ id: "entry-1" });
      expect(mockPrisma.client.journalEntry.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          memberId: "mem-1",
          description: "Test entry",
          reference: undefined,
          sourceType: undefined,
          sourceId: undefined,
          entryDate: expect.any(Date),
          status: JournalStatus.POSTED,
          lines: {
            create: [
              { ledgerAccountId: "acc-1", debit: 100, credit: 0, description: undefined },
              { ledgerAccountId: "acc-2", debit: 0, credit: 100, description: undefined },
            ],
          },
        },
        include: {
          lines: true,
        },
      });
    });
  });

  describe("autoMatchBankStatement", () => {
    it("should successfully match unmatched bank statement lines with POSTED journal lines within 3 days in a single batch transaction", async () => {
      const statementId = "stmt-123";
      const orgId = "org-123";

      const mockLines = [
        {
          id: "line-1",
          amount: 1500,
          transactionDate: new Date("2026-08-01"),
          status: "UNMATCHED",
        },
        {
          id: "line-2",
          amount: -500,
          transactionDate: new Date("2026-08-05"),
          status: "UNMATCHED",
        },
      ];

      mockPrisma.client.bankStatement.findFirst.mockResolvedValue({
        id: statementId,
        organizationId: orgId,
        lines: mockLines,
      });

      const mockCandidates = [
        {
          id: "jl-1",
          debit: 1500,
          credit: 0,
          bankStatementLineId: null,
          journalEntry: {
            organizationId: orgId,
            status: JournalStatus.POSTED,
            entryDate: new Date("2026-08-02"),
          },
        },
        {
          id: "jl-2",
          debit: 0,
          credit: 500,
          bankStatementLineId: null,
          journalEntry: {
            organizationId: orgId,
            status: JournalStatus.POSTED,
            entryDate: new Date("2026-08-05"),
          },
        },
      ];

      mockPrisma.client.journalLine.findMany.mockResolvedValue(mockCandidates);

      mockPrisma.client.bankStatementLine.update.mockImplementation((args) => args);
      mockPrisma.client.journalLine.update.mockImplementation((args) => args);
      mockPrisma.client.$transaction.mockResolvedValue([]);

      const result = await service.autoMatchBankStatement(statementId);

      expect(result).toEqual({ matchCount: 2 });
      expect(mockPrisma.client.bankStatement.findFirst).toHaveBeenCalledWith({
        where: { id: statementId },
        include: { lines: { where: { status: "UNMATCHED" } } },
      });
      expect(mockPrisma.client.journalLine.findMany).toHaveBeenCalled();
      expect(mockPrisma.client.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should not match lines if date difference is more than 3 days", async () => {
      const statementId = "stmt-123";
      const orgId = "org-123";

      const mockLines = [
        {
          id: "line-1",
          amount: 1500,
          transactionDate: new Date("2026-08-01"),
          status: "UNMATCHED",
        },
      ];

      mockPrisma.client.bankStatement.findFirst.mockResolvedValue({
        id: statementId,
        organizationId: orgId,
        lines: mockLines,
      });

      const mockCandidates = [
        {
          id: "jl-1",
          debit: 1500,
          credit: 0,
          bankStatementLineId: null,
          journalEntry: {
            organizationId: orgId,
            status: JournalStatus.POSTED,
            entryDate: new Date("2026-08-10"), // > 3 days
          },
        },
      ];

      mockPrisma.client.journalLine.findMany.mockResolvedValue(mockCandidates);
      mockPrisma.client.$transaction.mockResolvedValue([]);

      const result = await service.autoMatchBankStatement(statementId);

      expect(result).toEqual({ matchCount: 0 });
      expect(mockPrisma.client.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("postPurchaseToLedger multi-tenant scoping", () => {
    it("should look up purchase using findFirst scoped with organizationId when provided", async () => {
      const purchaseId = "po-123";
      const orgId = "org-123";

      mockPrisma.client.purchase.findFirst.mockResolvedValue(null);

      await service.postPurchaseToLedger(purchaseId, orgId);

      expect(mockPrisma.client.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: purchaseId, organizationId: orgId },
        select: expect.any(Object),
      });
    });
  });

  describe("postSaleToLedger multi-tenant scoping", () => {
    it("should look up transaction using findFirst scoped with organizationId when provided", async () => {
      const transactionId = "tx-123";
      const orgId = "org-123";

      mockPrisma.client.transaction.findFirst.mockResolvedValue(null);

      await service.postSaleToLedger(transactionId, orgId);

      expect(mockPrisma.client.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: transactionId, organizationId: orgId },
        select: expect.any(Object),
      });
    });
  });
});
