import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeliveriesService } from "./application/services/deliveries.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { BenefitType, DriverStatus, FulfillmentStatus, TransactionStatus, WalletTxType, PaymentStatus } from "@repo/db";
import { DeliveryStatus } from "./dto/deliveries.dto";

describe("DeliveriesService", () => {
  let service: DeliveriesService;
  let mockPrisma: any;
  let mockWebhookService: any;
  let mockTx: any;

  const mockOrgId = "org-123";
  const mockCtx: any = { organizationId: mockOrgId, memberId: "mem-1" };

  beforeEach(() => {
    mockTx = {
      transaction: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      driver: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      deliveryPartner: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      fulfillment: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      fulfillmentItem: {
        update: vi.fn(),
      },
      stockBatch: {
        update: vi.fn(),
      },
      productVariantStock: {
        updateMany: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
      },
      payment: {
        create: vi.fn(),
      },
      partnerWalletLog: {
        create: vi.fn(),
      },
    };

    mockPrisma = {
      client: {
        deliveryPartner: {
          findMany: vi.fn(),
          create: vi.fn(),
          findFirst: vi.fn(),
          updateMany: vi.fn(),
        },
        fulfillment: {
          findMany: vi.fn(),
          count: vi.fn(),
        },
        driver: {
          count: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => cb(mockTx)),
      },
    };

    mockWebhookService = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    service = new DeliveriesService(mockPrisma as any, mockWebhookService as any);
  });

  describe("dispatchDelivery", () => {
    it("should successfully dispatch a delivery with driver and partner, updating status and triggering webhook", async () => {
      const mockTransaction = {
        id: "tx-1",
        organizationId: mockOrgId,
        number: "ORD-001",
        customer: { id: "cust-1", name: "John Doe" },
        items: [{ id: "ti-1", quantity: 2 }],
      };

      const mockDriver = {
        id: "driver-1",
        organizationId: mockOrgId,
        name: "Driver Speed",
        availability: DriverStatus.ONLINE,
      };

      const mockPartner = {
        id: "partner-1",
        organizationId: mockOrgId,
        name: "Fast Logistics",
        isActive: true,
      };

      const mockFulfillment = {
        id: "ful-1",
        transactionId: "tx-1",
        status: FulfillmentStatus.IN_TRANSIT,
        driverId: "driver-1",
        confirmationToken: "654321",
      };

      mockTx.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockTx.driver.findFirst.mockResolvedValue(mockDriver);
      mockTx.deliveryPartner.findFirst.mockResolvedValue(mockPartner);
      mockTx.fulfillment.findFirst.mockResolvedValue(null);
      mockTx.fulfillment.create.mockResolvedValue(mockFulfillment);

      const result = await service.dispatchDelivery(mockCtx, {
        transactionId: "tx-1",
        driverId: "driver-1",
        partnerId: "partner-1",
        notes: "Deliver via side gate",
        verificationOtp: "654321",
      });

      expect(mockTx.fulfillment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionId: "tx-1",
          status: FulfillmentStatus.IN_TRANSIT,
          driverId: "driver-1",
          deliveryNotes: "Deliver via side gate",
          confirmationToken: "654321",
        }),
      });

      expect(mockTx.driver.update).toHaveBeenCalledWith({
        where: { id: "driver-1" },
        data: { availability: DriverStatus.ON_DELIVERY },
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-1" },
        data: expect.objectContaining({ deliveryPartnerId: "partner-1" }),
      });

      expect(result.status).toEqual(DeliveryStatus.IN_TRANSIT);
      expect(result.confirmationToken).toEqual("654321");
    });

    it("should throw BadRequestException if assigned driver is offline", async () => {
      mockTx.transaction.findFirst.mockResolvedValue({ id: "tx-1", organizationId: mockOrgId, items: [] });
      mockTx.driver.findFirst.mockResolvedValue({ id: "driver-1", availability: DriverStatus.OFFLINE });

      await expect(
        service.dispatchDelivery(mockCtx, {
          transactionId: "tx-1",
          driverId: "driver-1",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("reconcileDelivery", () => {
    it("should reconcile successful delivery, update transaction status and calculate partner commission", async () => {
      const mockFulfillment = {
        id: "ful-1",
        transactionId: "tx-1",
        driverId: "driver-1",
        quantityHandedOver: 5,
        items: [],
        transaction: {
          id: "tx-1",
          number: "ORD-100",
          finalTotal: "100.00",
          paymentStatus: PaymentStatus.PAID,
          deliveryPartner: {
            id: "partner-1",
            benefitType: BenefitType.COMMISSION,
            commissionRate: "10.00",
            walletBalance: "50.00",
          },
        },
      };

      mockTx.fulfillment.findFirst.mockResolvedValue(mockFulfillment);
      mockTx.fulfillment.update.mockResolvedValue({ ...mockFulfillment, status: FulfillmentStatus.DELIVERED });
      mockTx.transaction.findUnique.mockResolvedValue({
        id: "tx-1",
        paymentStatus: PaymentStatus.PAID,
      });

      const podData = {
        recipientName: "Alice Smith",
        signatureUrl: "https://cdn.example.com/sig.png",
      };

      await service.reconcileDelivery(mockCtx, {
        fulfillmentId: "ful-1",
        status: DeliveryStatus.DELIVERED,
        pod: podData,
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-1" },
        data: expect.objectContaining({
          status: TransactionStatus.COMPLETED,
        }),
      });

      // 10% commission on 100.00 = 10.00 added to walletBalance 50.00 -> 60.00
      expect(mockTx.deliveryPartner.update).toHaveBeenCalledWith({
        where: { id: "partner-1" },
        data: { walletBalance: 60 },
      });

      expect(mockTx.partnerWalletLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          partnerId: "partner-1",
          amount: 10,
          balanceAfter: 60,
          transactionType: WalletTxType.BENEFIT_ACCRUAL,
        }),
      });

      expect(mockTx.driver.update).toHaveBeenCalledWith({
        where: { id: "driver-1" },
        data: { availability: DriverStatus.ONLINE },
      });
    });

    it("should record COD payment and update totalPaid during delivery reconciliation", async () => {
      const mockFulfillment = {
        id: "ful-2",
        transactionId: "tx-2",
        driverId: "driver-1",
        items: [],
        transaction: {
          id: "tx-2",
          number: "ORD-COD-1",
          finalTotal: "75.00",
          totalPaid: "0.00",
          paymentStatus: PaymentStatus.UNPAID,
          deliveryPartner: null,
        },
      };

      mockTx.fulfillment.findFirst.mockResolvedValue(mockFulfillment);
      mockTx.fulfillment.update.mockResolvedValue({ ...mockFulfillment, status: FulfillmentStatus.DELIVERED });
      mockTx.transaction.findUnique.mockResolvedValue({
        id: "tx-2",
        totalPaid: 75,
        paymentStatus: PaymentStatus.PAID,
      });
      mockTx.payment.create.mockResolvedValue({ id: "pay-1", amount: 75 });

      const result = await service.reconcileDelivery(mockCtx, {
        fulfillmentId: "ful-2",
        status: DeliveryStatus.DELIVERED,
        codAmountCollected: 75,
        codPaymentMethod: "CASH",
        pod: { recipientName: "Bob Jones" },
      });

      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionId: "tx-2",
          amount: 75,
          method: "CASH",
          status: PaymentStatus.COMPLETED,
        }),
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-2" },
        data: expect.objectContaining({
          totalPaid: 75,
          paymentStatus: PaymentStatus.PAID,
        }),
      });

      expect(result.codPayment).toBeDefined();
    });

    it("should restock undamaged returned items into batch and log stock movement", async () => {
      const mockFulfillment = {
        id: "ful-3",
        transactionId: "tx-3",
        driverId: "driver-1",
        transaction: {
          id: "tx-3",
          number: "ORD-RET-1",
          locationId: "loc-1",
          finalTotal: "50.00",
          paymentStatus: PaymentStatus.PAID,
        },
        items: [
          {
            id: "fi-1",
            stockBatchId: "batch-1",
            transactionItemId: "ti-1",
            transactionItem: { variantId: "var-1" },
          },
        ],
      };

      mockTx.fulfillment.findFirst.mockResolvedValue(mockFulfillment);
      mockTx.fulfillment.update.mockResolvedValue({ ...mockFulfillment, status: FulfillmentStatus.CANCELLED });
      mockTx.transaction.findUnique.mockResolvedValue({ id: "tx-3" });

      await service.reconcileDelivery(mockCtx, {
        fulfillmentId: "ful-3",
        status: DeliveryStatus.CANCELLED,
        returnedItems: [
          {
            itemId: "fi-1",
            quantityReturned: 5,
            quantityDamaged: 1, // 4 to restock
            reason: "Customer rejected 1 damaged, 4 intact",
          },
        ],
      });

      expect(mockTx.fulfillmentItem.update).toHaveBeenCalledWith({
        where: { id: "fi-1" },
        data: { quantityReturned: 5, quantityDamaged: 1 },
      });

      expect(mockTx.stockBatch.update).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        data: { currentQuantity: { increment: 4 } },
      });

      expect(mockTx.productVariantStock.updateMany).toHaveBeenCalledWith({
        where: { variantId: "var-1", locationId: "loc-1" },
        data: { currentStock: { increment: 4 } },
      });

      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          movementType: "CUSTOMER_RETURN",
          quantity: 4,
          variantId: "var-1",
          toLocationId: "loc-1",
          organizationId: mockOrgId,
        }),
      });
    });
  });
});
