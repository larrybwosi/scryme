import { Test, TestingModule } from "@nestjs/testing";
import { UtilityAccountUseCase } from "../utility-account.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { CreateUtilityAccountDto } from "../../dto/finance.dto";
import { UtilityType } from "@repo/db";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("UtilityAccountUseCase", () => {
  let useCase: UtilityAccountUseCase;
  let prisma: PrismaService;

  const mockPrismaClient = {
    utilityAccount: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilityAccountUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    useCase = module.get<UtilityAccountUseCase>(UtilityAccountUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("createAccount", () => {
    it("should successfully create a utility account", async () => {
      const orgId = "org-1";
      const dto: CreateUtilityAccountDto = {
        name: "Electricity Account",
        provider: "Kenya Power",
        accountNumber: "12345678",
        meterNumber: "E123",
        type: UtilityType.ELECTRICITY,
      };

      const mockResponse = { id: "acc-1", ...dto, organizationId: orgId };
      mockPrismaClient.utilityAccount.create.mockResolvedValue(mockResponse);

      const result = await useCase.createAccount(orgId, dto);

      expect(result).toEqual(mockResponse);
      expect(mockPrismaClient.utilityAccount.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          organizationId: orgId,
        },
      });
    });
  });

  describe("getAccounts", () => {
    it("should list all utility accounts for an organization", async () => {
      const orgId = "org-1";
      const mockAccounts = [
        { id: "acc-1", name: "Electricity", organizationId: orgId },
        { id: "acc-2", name: "Water", organizationId: orgId },
      ];
      mockPrismaClient.utilityAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await useCase.getAccounts(orgId);

      expect(result).toEqual(mockAccounts);
      expect(mockPrismaClient.utilityAccount.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
    });
  });

  describe("getAccount", () => {
    it("should return the utility account with selected expenses", async () => {
      const orgId = "org-1";
      const id = "acc-1";
      const mockAccount = {
        id,
        name: "Electricity",
        provider: "Kenya Power",
        accountNumber: "12345678",
        meterNumber: "E123",
        type: "ELECTRICITY",
        organizationId: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
        expenses: [
          {
            id: "exp-1",
            expenseNumber: "EXP-1",
            description: "Power bill",
            amount: 1500,
            status: "APPROVED",
            expenseDate: new Date(),
            paymentMethod: "CASH",
          },
        ],
      };

      mockPrismaClient.utilityAccount.findFirst.mockResolvedValue(mockAccount);

      const result = await useCase.getAccount(orgId, id);

      expect(result).toEqual(mockAccount);
      expect(mockPrismaClient.utilityAccount.findFirst).toHaveBeenCalledWith({
        where: { id, organizationId: orgId },
        select: {
          id: true,
          name: true,
          provider: true,
          accountNumber: true,
          meterNumber: true,
          type: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          expenses: {
            take: 10,
            orderBy: { expenseDate: "desc" },
            select: {
              id: true,
              expenseNumber: true,
              description: true,
              amount: true,
              status: true,
              expenseDate: true,
              paymentMethod: true,
            },
          },
        },
      });
    });

    it("should throw NotFoundException if account does not exist", async () => {
      const orgId = "org-1";
      const id = "acc-nonexistent";

      mockPrismaClient.utilityAccount.findFirst.mockResolvedValue(null);

      await expect(useCase.getAccount(orgId, id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
