import { Test, TestingModule } from "@nestjs/testing";
import { PurchaseOrderUseCase } from "./purchase-order.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { InventoryMovementService } from "../../../inventory/application/services/inventory-movement.service";
import { PricingManagementService } from "../../../catalog/application/services/pricing-management.service";
import { AccountingService } from "../../../finance/application/services/accounting.service";
import { WhatsappService } from "../../../crm-integrations/application/use-cases/whatsapp.service";
import { NotFoundException } from "@nestjs/common";
import { PurchaseStatus } from "@repo/db";

describe("PurchaseOrderUseCase (Security, BOLA & WhatsApp PO Notifications)", () => {
  let useCase: PurchaseOrderUseCase;
  let prismaService: any;
  let whatsappService: any;

  const mockPrismaService = {
    client: {
      supplier: {
        findFirst: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        findFirstOrThrow: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };

  const mockInventoryMovementService = {};
  const mockPricingManagementService = {};
  const mockAccountingService = {
    postPurchaseToLedger: vi.fn().mockResolvedValue(undefined),
  };
  const mockWhatsappService = {
    sendPurchaseOrderNotification: vi.fn().mockResolvedValue({ message: "sent" }),
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
        { provide: WhatsappService, useValue: mockWhatsappService },
      ],
    }).compile();

    useCase = module.get<PurchaseOrderUseCase>(PurchaseOrderUseCase);
    prismaService = module.get(PrismaService);
    whatsappService = module.get(WhatsappService);
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

    it("should execute updateMany scoped to organizationId to enforce BOLA protection and trigger WhatsApp notification", async () => {
      const orgId = "org-1";
      const memberId = "member-1";
      const purchaseId = "purchase-1";

      const existingPurchase = {
        id: purchaseId,
        organizationId: orgId,
        purchaseNumber: "PO-100",
        totalAmount: 4500,
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
      expect(mockWhatsappService.sendPurchaseOrderNotification).toHaveBeenCalledWith(
        orgId,
        "PO-100",
        undefined,
        4500,
        purchaseId,
      );
    });
  });

  describe("create", () => {
    it("should create purchase order and send WhatsApp notification when supplier phone is present", async () => {
      const orgId = "org-1";
      const memberId = "member-1";
      const dto: any = {
        supplierId: "supplier-1",
        items: [{ variantId: "var-1", orderedQuantity: 2, unitCost: 100 }],
      };

      const mockSupplier = {
        id: "supplier-1",
        organizationId: orgId,
        phone: "+254700000000",
      };

      const createdPurchase = {
        id: "po-new-1",
        purchaseNumber: "PO-888",
        organizationId: orgId,
        totalAmount: 200,
        member: { user: { name: "John" } },
      };

      mockPrismaService.client.supplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaService.client.$transaction.mockImplementation(async (cb: any) =>
        cb({
          purchase: {
            create: vi.fn().mockResolvedValue(createdPurchase),
          },
        }),
      );

      const res = await useCase.create(orgId, memberId, dto);

      expect(res).toEqual(createdPurchase);
      expect(mockWhatsappService.sendPurchaseOrderNotification).toHaveBeenCalledWith(
        orgId,
        "PO-888",
        "+254700000000",
        200,
        "po-new-1",
      );
    });
  });
});
