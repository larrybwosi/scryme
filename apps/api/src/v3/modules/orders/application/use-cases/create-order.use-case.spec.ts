import { Test, TestingModule } from "@nestjs/testing";
import { CreateOrderUseCase } from "./create-order.use-case";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "@/common/services/realtime.service";
import { WebhookService } from "@/v3/modules/webhooks/infrastructure/services/webhook.service";
import { ScrymeNotificationService } from "@/v2/scryme/scryme-notification.service";
import { BookingService } from "@/v3/modules/services/application/services/booking.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { BadRequestException } from "@nestjs/common";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock @repo/shared/actions which is called inside createOrder
vi.mock("@repo/shared/actions", () => ({
  createOrder: vi.fn().mockResolvedValue({
    success: true,
    data: { id: "test-id", number: "ORD-123", finalTotal: 100 },
  }),
}));

vi.mock("@repo/shared/server", () => ({
  emitOrderPlaced: vi.fn().mockResolvedValue({}),
}));

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockPrisma: any;
  let mockOrderRepo: any;
  let mockRealtime: any;
  let mockWebhook: any;
  let mockNotification: any;
  let mockBooking: any;

  beforeEach(async () => {
    mockOrderRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByOrganization: vi.fn(),
      save: vi.fn(),
    };
    mockPrisma = {
      client: {
        transaction: {
          create: vi.fn(),
          update: vi.fn(),
        },
        service: {
          findMany: vi.fn(),
        },
        transactionServiceItem: {
          create: vi.fn(),
        },
        serviceBooking: {
          update: vi.fn(),
        },
      },
    };
    mockRealtime = {
      publish: vi.fn().mockResolvedValue({}),
    };
    mockWebhook = {
      dispatch: vi.fn().mockResolvedValue({}),
    };
    mockNotification = {
      notifyOrderCreated: vi.fn().mockResolvedValue({}),
    };
    mockBooking = {
      createBooking: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ApiRealtimeService, useValue: mockRealtime },
        { provide: WebhookService, useValue: mockWebhook },
        { provide: ScrymeNotificationService, useValue: mockNotification },
        { provide: BookingService, useValue: mockBooking },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  it("should throw BadRequestException if neither customerId nor businessAccountId is provided", async () => {
    const dto: CreateOrderDto = {
      locationId: "loc-123",
      items: [{ variantId: "var-123", quantity: 2 }],
    };

    await expect(useCase.execute("org-123", dto, "member-123")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should succeed when customerId is present but businessAccountId is absent", async () => {
    const dto: CreateOrderDto = {
      customerId: "cust-123",
      locationId: "loc-123",
      items: [{ variantId: "var-123", quantity: 2 }],
    };

    const result = await useCase.execute("org-123", dto, "member-123");
    expect(result).toBeDefined();
    expect(result.id).toBe("test-id");
  });

  it("should succeed when businessAccountId is present but customerId is absent", async () => {
    const dto: CreateOrderDto = {
      businessAccountId: "bus-123",
      locationId: "loc-123",
      items: [{ variantId: "var-123", quantity: 2 }],
    };

    const result = await useCase.execute("org-123", dto, "member-123");
    expect(result).toBeDefined();
    expect(result.id).toBe("test-id");
  });

  it("should succeed and process service checkouts concurrently when services are provided", async () => {
    const dto: CreateOrderDto = {
      customerId: "cust-123",
      locationId: "loc-123",
      services: [
        {
          serviceId: "srv-1",
          scheduledStartTime: "2026-08-09T10:00:00Z",
        },
        {
          serviceId: "srv-2",
          scheduledStartTime: "2026-08-09T11:00:00Z",
        },
      ],
    };

    mockPrisma.client.transaction.create.mockResolvedValue({
      id: "tx-123",
      number: "ORD-999",
      subtotal: 0,
      taxTotal: 0,
    });

    mockPrisma.client.service.findMany.mockResolvedValue([
      {
        id: "srv-1",
        name: "Service One",
        price: 50,
        sku: "S1",
        taxRates: [
          {
            taxRate: {
              rate: 0.16,
            },
          },
        ],
      },
      {
        id: "srv-2",
        name: "Service Two",
        price: 150,
        sku: "S2",
        taxRates: [],
      },
    ]);

    mockBooking.createBooking.mockImplementation((orgId, input) => {
      return Promise.resolve({ id: `booking-${input.serviceId}` });
    });

    mockPrisma.client.transaction.update.mockResolvedValue({
      id: "tx-123",
      finalTotal: 208, // 50 + 150 + 8 (tax of srv-1)
    });

    const result = await useCase.execute("org-123", dto, "member-123");

    expect(result.finalTotal).toBe(208);
    expect(mockPrisma.client.service.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["srv-1", "srv-2"] },
        organizationId: "org-123",
      },
      include: {
        taxRates: {
          include: {
            taxRate: true,
          },
        },
      },
    });
    expect(mockBooking.createBooking).toHaveBeenCalledTimes(2);
    expect(mockPrisma.client.transactionServiceItem.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.client.serviceBooking.update).toHaveBeenCalledTimes(2);
  });
});
