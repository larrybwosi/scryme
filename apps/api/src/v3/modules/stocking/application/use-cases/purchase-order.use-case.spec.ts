import { Test, TestingModule } from "@nestjs/testing";
import { PurchaseOrderUseCase } from "./purchase-order.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import { PricingManagementService } from "../../../catalog/application/services/pricing-management.service";
import { AccountingService } from "../../../finance/application/services/accounting.service";
import { NotFoundException } from "@nestjs/common";
import { PurchaseStatus } from "@repo/db";

describe("PurchaseOrderUseCase (Security & BOLA Hardening)", () => {
  let useCase: PurchaseOrderUseCase;
  let prismaService: any;

  const mockPrismaService = {
    client: {
      supplier: {
        findFirst: vi.fn(),
      },
      purchase: {
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        findFirstOrThrow: vi.fn(),
      },
    },
  };

  const mockInventoryMovementService = {};
  const mockPricingManagementService = {};
  const mockAccountingService = {
    postPurchaseToLedger: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryMovementService, useValue: mockInventoryMovementService },
        { provide: PricingManagementService, useValue: mockPricingManagementService },
        { provide: AccountingService, useValue: mockAccountingService },
      ],
    }).compile();

    useCase = module.get<PurchaseOrderUseCase>(PurchaseOrderUseCase);
    prismaService = module.get(PrismaService);
  });

  describe("approve", () => {
    it("should throw NotFoundException if purchase order does not belong to the tenant organization", async () => {
      const orgId = "org-1";
      const memberId = "member-1";
      const purchaseId = "purchase-1";

      mockPrismaService.client.purchase.findFirst.mockResolvedValue(null);

      await expect(useCase.approve(orgId, memberId, purchaseId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.client.purchase.findFirst).toHaveBeenCalledWith({
        where: { id: purchaseId, organizationId: orgId },
      });
      expect(mockPrismaService.client.purchase.updateMany).not.toHaveBeenCalled();
    });

    it("should execute updateMany scoped to organizationId to enforce BOLA protection", async () => {
      const orgId = "org-1";
      const memberId = "member-1";
      const purchaseId = "purchase-1";

      const existingPurchase = {
        id: purchaseId,
        organizationId: orgId,
        status: PurchaseStatus.ORDERED,
      };

      const updatedPurchase = {
        ...existingPurchase,
        status: PurchaseStatus.APPROVED,
      };

      mockPrismaService.client.purchase.findFirst.mockResolvedValue(existingPurchase);
      mockPrismaService.client.purchase.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.client.purchase.findFirstOrThrow.mockResolvedValue(updatedPurchase);

      const result = await useCase.approve(orgId, memberId, purchaseId);

      expect(mockPrismaService.client.purchase.updateMany).toHaveBeenCalledWith({
        where: { id: purchaseId, organizationId: orgId },
        data: {
          status: PurchaseStatus.APPROVED,
          updatedAt: expect.any(Date),
        },
      });

      expect(mockPrismaService.client.purchase.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: purchaseId, organizationId: orgId },
      });

      expect(result).toEqual(updatedPurchase);
      expect(mockAccountingService.postPurchaseToLedger).toHaveBeenCalledWith(
        purchaseId,
        orgId,
      );
    });
  });
});
