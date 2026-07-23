import { Test, TestingModule } from "@nestjs/testing";
import { UtilityAccountUseCase } from "../utility-account.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { UtilityType } from "@repo/db";
import { NotFoundException } from "@nestjs/common";
import { CreateUtilityAccountDto } from "../../dto/finance.dto";
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
    it("should create a utility account", async () => {
      const orgId = "org-1";
      const dto: CreateUtilityAccountDto = {
        name: "Main Electricity",
        provider: "Kenya Power",
        accountNumber: "ACC-123",
        type: UtilityType.ELECTRICITY,
      };

      mockPrismaClient.utilityAccount.create.mockResolvedValue({
        id: "util-1",
        ...dto,
        organizationId: orgId,
      });

      const result = await useCase.createAccount(orgId, dto);

      expect(result.id).toBe("util-1");
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
      mockPrismaClient.utilityAccount.findMany.mockResolvedValue([
        { id: "util-1", name: "Main Electricity", organizationId: orgId },
      ]);

      const result = await useCase.getAccounts(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("util-1");
      expect(mockPrismaClient.utilityAccount.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
    });
  });

  describe("getAccount", () => {
    it("should get a single utility account with expenses", async () => {
      const orgId = "org-1";
      const id = "util-1";
      mockPrismaClient.utilityAccount.findFirst.mockResolvedValue({
        id,
        name: "Main Electricity",
        organizationId: orgId,
        expenses: [],
      });

      const result = await useCase.getAccount(orgId, id);

      expect(result.id).toBe(id);
      expect(mockPrismaClient.utilityAccount.findFirst).toHaveBeenCalled();
    });

    it("should throw NotFoundException if account does not exist", async () => {
      const orgId = "org-1";
      const id = "util-1";
      mockPrismaClient.utilityAccount.findFirst.mockResolvedValue(null);

      await expect(useCase.getAccount(orgId, id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
