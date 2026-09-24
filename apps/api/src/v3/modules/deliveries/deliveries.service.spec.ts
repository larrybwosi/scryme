import { describe, it, expect, beforeEach, vi } from "vitest";
import { DeliveriesService } from "./application/services/deliveries.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { BenefitType, DriverStatus, FulfillmentStatus, TransactionStatus, WalletTxType } from "@repo/db";
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
      });

      expect(mockTx.fulfillment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionId: "tx-1",
          status: FulfillmentStatus.IN_TRANSIT,
          driverId: "driver-1",
          deliveryNotes: "Deliver via side gate",
        }),
      });

      expect(mockTx.driver.update).toHaveBeenCalledWith({
        where: { id: "driver-1" },
        data: { availability: DriverStatus.ON_DELIVERY },
      });

      expect(mockTx.transaction.update).toHaveBeenCalledWith({
        where: { id: "tx-1" },
        data: { deliveryPartnerId: "partner-1" },
      });

      expect(result.status).toEqual(DeliveryStatus.IN_TRANSIT);
    });

    it("should throw BadRequestException if assigned driver is offline", async () => {
      mockTx.transaction.findFirst.mockResolvedValue({ id: "tx-1", organizationId: mockOrgId });
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
        transaction: {
          id: "tx-1",
          number: "ORD-100",
          finalTotal: "100.00",
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
  });
});
