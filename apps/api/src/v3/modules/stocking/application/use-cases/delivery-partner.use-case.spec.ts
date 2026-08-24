import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeliveryPartnerUseCase } from "./delivery-partner.use-case";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { BenefitType, ReconciliationPolicy, WalletTxType } from "@repo/db";

describe("DeliveryPartnerUseCase", () => {
  let useCase: DeliveryPartnerUseCase;
  let mockPrisma: any;

  const mockOrgId = "org-123";
  const mockPartnerId = "partner-123";

  const mockPartner = {
    id: mockPartnerId,
    name: "Express Logistics",
    email: "express@example.com",
    phone: "+123456789",
    address: "123 Main St",
    organizationId: mockOrgId,
    walletBalance: 100,
    benefitType: BenefitType.COMMISSION,
    commissionRate: 10,
    fixedFee: null,
    reconciliationPolicy: ReconciliationPolicy.RETURN_TO_STOCK,
    isActive: true,
  };

  beforeEach(() => {
    mockPrisma = {
      client: {
        deliveryPartner: {
          create: vi.fn(),
          findMany: vi.fn(),
          findFirst: vi.fn(),
          updateMany: vi.fn(),
          update: vi.fn(),
        },
        partnerWalletLog: {
          create: vi.fn(),
        },
        $transaction: vi.fn((cb) => cb(mockPrisma.client)),
      },
    };

    useCase = new DeliveryPartnerUseCase(mockPrisma as any);
  });

  describe("createPartner", () => {
    it("should whitelist input fields and create a delivery partner", async () => {
      const dto: any = {
        name: "Express Logistics",
        email: "express@example.com",
        phone: "+123456789",
        address: "123 Main St",
        benefitType: BenefitType.COMMISSION,
        commissionRate: 10,
        reconciliationPolicy: ReconciliationPolicy.RETURN_TO_STOCK,
        // Unsanitized/Mass assignment field
        walletBalance: 999999,
        organizationId: "attacker-org",
      };

      mockPrisma.client.deliveryPartner.create.mockResolvedValue(mockPartner);

      const result = await useCase.createPartner(mockOrgId, dto);

      expect(mockPrisma.client.deliveryPartner.create).toHaveBeenCalledWith({
        data: {
          name: "Express Logistics",
          email: "express@example.com",
          phone: "+123456789",
          address: "123 Main St",
          benefitType: BenefitType.COMMISSION,
          commissionRate: 10,
          fixedFee: undefined,
          reconciliationPolicy: ReconciliationPolicy.RETURN_TO_STOCK,
          organizationId: mockOrgId,
        },
      });
      expect(result).toEqual(mockPartner);
    });
  });

  describe("getPartner", () => {
    it("should return partner when found with matching organizationId", async () => {
      mockPrisma.client.deliveryPartner.findFirst.mockResolvedValue(
        mockPartner,
      );

      const result = await useCase.getPartner(mockOrgId, mockPartnerId);

      expect(mockPrisma.client.deliveryPartner.findFirst).toHaveBeenCalledWith({
        where: { id: mockPartnerId, organizationId: mockOrgId },
        include: {
          drivers: true,
          walletLogs: {
            take: 50,
            orderBy: { createdAt: "desc" },
          },
        },
      });
      expect(result).toEqual(mockPartner);
    });

    it("should throw NotFoundException when partner does not exist or belongs to another tenant", async () => {
      mockPrisma.client.deliveryPartner.findFirst.mockResolvedValue(null);

      await expect(
        useCase.getPartner(mockOrgId, mockPartnerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updatePartner", () => {
    it("should whitelist update fields and scope update to organizationId", async () => {
      mockPrisma.client.deliveryPartner.findFirst.mockResolvedValue(
        mockPartner,
      );
      mockPrisma.client.deliveryPartner.updateMany.mockResolvedValue({
        count: 1,
      });

      const updateDto: any = {
        name: "Updated Logistics",
        isActive: false,
        // Mass assignment attempt
        walletBalance: 5000,
        organizationId: "other-org",
      };

      await useCase.updatePartner(mockOrgId, mockPartnerId, updateDto);

      expect(mockPrisma.client.deliveryPartner.updateMany).toHaveBeenCalledWith({
        where: { id: mockPartnerId, organizationId: mockOrgId },
        data: {
          name: "Updated Logistics",
          isActive: false,
        },
      });
    });
  });

  describe("adjustWallet", () => {
    it("should adjust wallet balance and log transaction for valid organization", async () => {
      mockPrisma.client.deliveryPartner.findFirst.mockResolvedValue(
        mockPartner,
      );
      mockPrisma.client.deliveryPartner.update.mockResolvedValue({
        ...mockPartner,
        walletBalance: 150,
      });
      mockPrisma.client.partnerWalletLog.create.mockResolvedValue({
        id: "log-1",
      });

      const result = await useCase.adjustWallet(mockOrgId, mockPartnerId, {
        amount: 50,
        notes: "Deposit",
      });

      expect(mockPrisma.client.deliveryPartner.update).toHaveBeenCalledWith({
        where: { id: mockPartnerId },
        data: { walletBalance: 150 },
      });
      expect(mockPrisma.client.partnerWalletLog.create).toHaveBeenCalledWith({
        data: {
          partnerId: mockPartnerId,
          amount: 50,
          balanceAfter: 150,
          transactionType: WalletTxType.ADJUSTMENT,
          notes: "Deposit",
        },
      });
    });

    it("should throw BadRequestException on negative balance for withdrawal", async () => {
      mockPrisma.client.deliveryPartner.findFirst.mockResolvedValue(
        mockPartner,
      );

      await expect(
        useCase.adjustWallet(
          mockOrgId,
          mockPartnerId,
          { amount: -200, notes: "Withdrawal" },
          WalletTxType.WITHDRAWAL,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
