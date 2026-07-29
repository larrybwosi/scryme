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
        findUnique: vi.fn(),
      },
      purchase: {
        findUnique: vi.fn(),
      },
      expense: {
        findUnique: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
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
});
