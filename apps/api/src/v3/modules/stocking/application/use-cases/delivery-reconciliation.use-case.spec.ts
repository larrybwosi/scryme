import { vi, describe, it, expect, beforeEach } from "vitest";
import { DeliveryReconciliationUseCase } from "./delivery-reconciliation.use-case";
import { TransactionStatus, FulfillmentStatus } from "@repo/db";
import { ReconciliationOutcome } from "../dto/delivery.dto";

describe("DeliveryReconciliationUseCase", () => {
  let deliveryReconciliationUseCase: DeliveryReconciliationUseCase;
  let prisma: any;
  let mockTx: any;

  const mockOrgId = "org-1";

  beforeEach(() => {
    mockTx = {
      fulfillment: {
        findFirst: vi.fn(),
      },
      transaction: {
        update: vi.fn(),
      },
      deliveryPartner: {
        update: vi.fn(),
      },
      partnerWalletLog: {
        create: vi.fn(),
      },
      return: {
        create: vi.fn(),
      },
      returnItem: {
        create: vi.fn(),
      },
      stockBatch: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      productVariantStock: {
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
    };

    prisma = {
      client: {
        $transaction: vi.fn(async (callback) => await callback(mockTx)),
        transaction: {
          findMany: vi.fn(),
        },
        fulfillment: {
          findMany: vi.fn(),
        },
      },
    };

    deliveryReconciliationUseCase = new DeliveryReconciliationUseCase(prisma);
  });

  describe("getPendingDispatch", () => {
    it("should fetch transactions pending dispatch with optimized select block and correct filters", async () => {
      const mockTransactions = [
        {
          id: "tx-1",
          number: "QT-123",
          subtotal: 100,
          customer: {
            id: "cust-1",
            name: "John Doe",
          },
          items: [
            {
              id: "item-1",
              productName: "Product A",
            },
          ],
        },
      ];

      prisma.client.transaction.findMany.mockResolvedValue(mockTransactions);

      const pagination = { limit: 10, offset: 0 };
      const result = await deliveryReconciliationUseCase.getPendingDispatch(
        mockOrgId,
        pagination,
      );

      expect(prisma.client.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          status: TransactionStatus.CONFIRMED,
          fulfillments: {
            none: {
              status: {
                in: [FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED],
              },
            },
          },
        },
        select: expect.objectContaining({
          id: true,
          number: true,
          status: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              sku: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        }),
        take: 10,
        skip: 0,
      });

      expect(result).toEqual(mockTransactions);
    });
  });

  describe("getActiveDeliveries", () => {
    it("should fetch active deliveries with optimized select block and correct filters", async () => {
      const mockFulfillments = [
        {
          id: "ful-1",
          status: FulfillmentStatus.SHIPPED,
          transaction: {
            id: "tx-1",
            number: "TX-1",
            customer: { id: "cust-1", name: "John Doe" },
          },
          items: [{ id: "fitem-1", quantity: 2 }],
        },
      ];

      prisma.client.fulfillment.findMany.mockResolvedValue(mockFulfillments);

      const pagination = { limit: 10, offset: 0 };
      const result = await deliveryReconciliationUseCase.getActiveDeliveries(
        mockOrgId,
        pagination,
      );

      expect(prisma.client.fulfillment.findMany).toHaveBeenCalledWith({
        where: {
          transaction: {
            organizationId: mockOrgId,
          },
          status: FulfillmentStatus.SHIPPED,
        },
        select: expect.objectContaining({
          id: true,
          transactionId: true,
          status: true,
          transaction: {
            select: {
              id: true,
              number: true,
              status: true,
              finalTotal: true,
              currencyCode: true,
              createdAt: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              transactionItemId: true,
            },
          },
        }),
        take: 10,
        skip: 0,
      });

      expect(result).toEqual(mockFulfillments);
    });
  });

  describe("reconcilePod", () => {
    it("should successfully reconcile delivered quantities and update transaction and delivery partner benefit", async () => {
      const mockFulfillment = {
        id: "ful-1",
        transactionId: "tx-1",
        quantityHandedOver: 10,
        transaction: {
          id: "tx-1",
          number: "TX-1",
          finalTotal: 200,
          deliveryPartner: {
            id: "dp-1",
            benefitType: "COMMISSION",
            commissionRate: 10,
            walletBalance: 50,
          },
          items: [
            {
              id: "item-1",
              variantId: "var-1",
              quantity: 10,
              unitPrice: 20,
              variant: { baseUnitId: "unit-1" },
            },
          ],
        },
      };

      mockTx.fulfillment.findFirst.mockResolvedValue(mockFulfillment);

      const dto = {
        fulfillmentId: "ful-1",
        outcome: ReconciliationOutcome.DELIVERED,
        quantityDelivered: 10,
      };

      const result = await deliveryReconciliationUseCase.reconcilePod(
        mockOrgId,
        "member-1",
        dto as any,
      );

      expect(mockTx.fulfillment.findFirst).toHaveBeenCalledWith({
        where: { id: "ful-1", transaction: { organizationId: mockOrgId } },
        include: expect.any(Object),
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-1" },
        data: expect.objectContaining({
          status: TransactionStatus.COMPLETED,
        }),
      });

      expect(mockTx.deliveryPartner.update).toHaveBeenCalledWith({
        where: { id: "dp-1" },
        data: { walletBalance: 70 }, // 50 + 20 (10% of 200)
      });

      expect(mockTx.partnerWalletLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          partnerId: "dp-1",
          amount: 20,
          balanceAfter: 70,
        }),
      });

      expect(result).toEqual({ success: true });
    });

    it("should throw NotFoundException if fulfillment is not found", async () => {
      mockTx.fulfillment.findFirst.mockResolvedValue(null);

      const dto = {
        fulfillmentId: "non-existent",
        outcome: ReconciliationOutcome.DELIVERED,
      };

      await expect(
        deliveryReconciliationUseCase.reconcilePod(mockOrgId, "member-1", dto as any),
      ).rejects.toThrow();
    });
  });
});
