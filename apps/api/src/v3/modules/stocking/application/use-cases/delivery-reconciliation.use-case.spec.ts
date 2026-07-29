import { vi, describe, it, expect, beforeEach } from "vitest";
import { DeliveryReconciliationUseCase } from "./delivery-reconciliation.use-case";
import { TransactionStatus, FulfillmentStatus } from "@repo/db";

describe("DeliveryReconciliationUseCase", () => {
  let deliveryReconciliationUseCase: DeliveryReconciliationUseCase;
  let prisma: any;
  let mockTx: any;

  const mockOrgId = "org-1";

  beforeEach(() => {
    mockTx = {};

    prisma = {
      client: {
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
});
