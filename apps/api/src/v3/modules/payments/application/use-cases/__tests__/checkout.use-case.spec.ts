import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/shared/mpesa/server", () => ({
  MpesaService: vi.fn(),
}));

import { CheckoutUseCase } from "../checkout.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { CheckoutPaymentMethod } from "../../dto/checkout.dto";

vi.mock("@repo/shared/server", () => ({
  emitOrderPlaced: vi.fn().mockResolvedValue({}),
}));

describe("CheckoutUseCase (Integration)", () => {
  let useCase: CheckoutUseCase;
  let prisma: PrismaService;
  let mpesaService: any;
  let webhookService: any;
  let bookingService: any;

  beforeEach(() => {
    prisma = {
      client: {
        cart: {
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        productVariant: {
          findMany: vi.fn(),
        },
        service: {
          findMany: vi.fn(),
        },
        transaction: {
          create: vi.fn(),
        },
        transactionServiceItem: {
          create: vi.fn(),
        },
        serviceBooking: {
          update: vi.fn(),
        },
        payment: {
          create: vi.fn(),
        },
      },
    } as any;

    mpesaService = {
      initiateStkPush: vi.fn(),
    } as any;

    webhookService = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    } as any;

    bookingService = {
      createBooking: vi.fn(),
    } as any;

    useCase = new CheckoutUseCase(prisma, mpesaService, webhookService, undefined, bookingService);
  });

  it("should create an order and initiate mpesa payment with explicit locationId", async () => {
    const organizationId = "org-123";
    const customerId = "cust-123";
    const dto = {
      cartId: "cart-123",
      phoneNumber: "254700000000",
      locationId: "loc-123",
    };

    const mockCart = {
      id: "cart-123",
      organizationId,
      customerId,
      items: [{ productId: "prod-1", variantId: "var-1", quantity: 2 }],
    };

    const mockVariants = [
      {
        id: "var-1",
        productId: "prod-1",
        retailPrice: 100,
        buyingPrice: 80,
        name: "Variant 1",
        sku: "SKU-1",
        product: { name: "Product 1" },
      },
    ];

    const mockTransaction = {
      id: "order-123",
      number: "ORD-123",
      finalTotal: 200,
    };

    const mockPayment = {
      id: "pay-123",
    };

    const mockMpesaResponse = {
      paymentId: "pay-123",
      CustomerMessage: "Success",
      MerchantRequestID: "merch-123",
      CheckoutRequestID: "check-123",
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.productVariant.findMany).mockResolvedValue(
      mockVariants as any,
    );
    vi.mocked(prisma.client.transaction.create).mockResolvedValue(
      mockTransaction as any,
    );
    vi.mocked(prisma.client.payment.create).mockResolvedValue(
      mockPayment as any,
    );
    vi.mocked(mpesaService.initiateStkPush).mockResolvedValue(
      mockMpesaResponse as any,
    );
    vi.mocked(prisma.client.cart.update).mockResolvedValue({} as any);

    const result = await useCase.execute(organizationId, dto);

    expect(prisma.client.cart.findFirst).toHaveBeenCalledWith({
      where: { id: dto.cartId, organizationId },
      include: { items: true },
    });

    expect(prisma.client.inventoryLocation.findFirst).not.toHaveBeenCalled();

    expect(result).toEqual({
      orderId: "order-123",
      paymentId: "pay-123",
      paymentMethod: CheckoutPaymentMethod.MPESA,
      status: "Success",
      merchantRequestID: "merch-123",
      checkoutRequestID: "check-123",
    });

    expect(prisma.client.transaction.create).toHaveBeenCalled();
    expect(mpesaService.initiateStkPush).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 200,
        phoneNumber: "254700000000",
      }),
    );
    expect(webhookService.dispatch).toHaveBeenCalledWith(
      "order.placed",
      organizationId,
      expect.objectContaining({
        orderId: "order-123",
        finalTotal: 200,
        customerId: "cust-123",
      }),
    );
  });

  it("should process Cash on Delivery checkout without triggering Mpesa push", async () => {
    const organizationId = "org-123";
    const customerId = "cust-123";
    const dto = {
      cartId: "cart-123",
      locationId: "loc-123",
      paymentMethod: CheckoutPaymentMethod.CASH_ON_DELIVERY,
    };

    const mockCart = {
      id: "cart-123",
      organizationId,
      customerId,
      items: [{ productId: "prod-1", variantId: "var-1", quantity: 1 }],
    };

    const mockVariants = [
      {
        id: "var-1",
        productId: "prod-1",
        retailPrice: 500,
        buyingPrice: 300,
        name: "Product A",
        sku: "SKU-A",
        product: { name: "Product A" },
      },
    ];

    const mockTransaction = {
      id: "order-cod",
      number: "ORD-COD",
      finalTotal: 500,
    };

    const mockPayment = { id: "pay-cod" };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.productVariant.findMany).mockResolvedValue(mockVariants as any);
    vi.mocked(prisma.client.transaction.create).mockResolvedValue(mockTransaction as any);
    vi.mocked(prisma.client.payment.create).mockResolvedValue(mockPayment as any);
    vi.mocked(prisma.client.cart.update).mockResolvedValue({} as any);

    const result = await useCase.execute(organizationId, dto);

    expect(mpesaService.initiateStkPush).not.toHaveBeenCalled();
    expect(prisma.client.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        method: "CASH",
        status: "PENDING",
      }),
    });
    expect(result).toEqual({
      orderId: "order-cod",
      paymentId: "pay-cod",
      paymentMethod: CheckoutPaymentMethod.CASH_ON_DELIVERY,
      status: "Order placed with Cash on Delivery",
    });
  });

  it("should process unified checkout containing both physical products and service bookings", async () => {
    const organizationId = "org-123";
    const customerId = "cust-123";
    const dto = {
      cartId: "cart-unified",
      locationId: "loc-123",
      paymentMethod: CheckoutPaymentMethod.PAY_AT_VENUE,
    };

    const mockCart = {
      id: "cart-unified",
      organizationId,
      customerId,
      items: [
        { productId: "prod-1", variantId: "var-1", quantity: 1 },
        {
          serviceId: "srv-1",
          quantity: 1,
          bookingDetails: {
            scheduledStartTime: "2026-08-10T10:00:00.000Z",
            notes: "Please allocate quiet room",
          },
        },
      ],
    };

    const mockVariants = [
      {
        id: "var-1",
        productId: "prod-1",
        retailPrice: 150,
        buyingPrice: 100,
        name: "Shampoo Bottle",
        sku: "SHAMP-01",
        product: { name: "Shampoo" },
      },
    ];

    const mockServices = [
      {
        id: "srv-1",
        name: "Hair Styling",
        sku: "SRV-HAIR",
        price: 300,
        taxRates: [],
      },
    ];

    const mockBooking = {
      id: "book-123",
      serviceId: "srv-1",
    };

    const mockTransaction = {
      id: "order-unified",
      number: "ORD-UNIFIED",
      finalTotal: 450,
    };

    const mockPayment = { id: "pay-pav" };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.productVariant.findMany).mockResolvedValue(mockVariants as any);
    vi.mocked(prisma.client.service.findMany).mockResolvedValue(mockServices as any);
    vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
    vi.mocked(prisma.client.transaction.create).mockResolvedValue(mockTransaction as any);
    vi.mocked(prisma.client.transactionServiceItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.client.serviceBooking.update).mockResolvedValue({} as any);
    vi.mocked(prisma.client.payment.create).mockResolvedValue(mockPayment as any);
    vi.mocked(prisma.client.cart.update).mockResolvedValue({} as any);

    const result = await useCase.execute(organizationId, dto);

    expect(bookingService.createBooking).toHaveBeenCalledWith(
      organizationId,
      expect.objectContaining({
        serviceId: "srv-1",
        customerId,
        locationId: "loc-123",
        notes: "Please allocate quiet room",
      }),
      false,
    );

    expect(prisma.client.transactionServiceItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transactionId: "order-unified",
        serviceId: "srv-1",
        bookingId: "book-123",
        serviceName: "Hair Styling",
      }),
    });

    expect(prisma.client.serviceBooking.update).toHaveBeenCalledWith({
      where: { id: "book-123" },
      data: { transactionId: "order-unified" },
    });

    expect(result).toEqual({
      orderId: "order-unified",
      paymentId: "pay-pav",
      paymentMethod: CheckoutPaymentMethod.PAY_AT_VENUE,
      status: "Booking placed. Pay at venue upon arrival",
    });
  });

  it("should resolve default location concurrently when locationId is omitted", async () => {
    const organizationId = "org-123";
    const customerId = "cust-123";
    const dto = {
      cartId: "cart-123",
      phoneNumber: "254700000000",
    };

    const mockCart = {
      id: "cart-123",
      organizationId,
      customerId,
      items: [{ productId: "prod-1", variantId: "var-1", quantity: 1 }],
    };

    const mockLocation = { id: "loc-default" };

    const mockVariants = [
      {
        id: "var-1",
        productId: "prod-1",
        retailPrice: 50,
        buyingPrice: 40,
        name: "Variant 1",
        sku: "SKU-1",
        product: { name: "Product 1" },
      },
    ];

    const mockTransaction = {
      id: "order-456",
      number: "ORD-456",
      finalTotal: 50,
    };

    const mockPayment = { id: "pay-456" };

    const mockMpesaResponse = {
      paymentId: "pay-456",
      CustomerMessage: "Success",
      MerchantRequestID: "merch-456",
      CheckoutRequestID: "check-456",
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.inventoryLocation.findFirst).mockResolvedValue(
      mockLocation as any,
    );
    vi.mocked(prisma.client.productVariant.findMany).mockResolvedValue(
      mockVariants as any,
    );
    vi.mocked(prisma.client.transaction.create).mockResolvedValue(
      mockTransaction as any,
    );
    vi.mocked(prisma.client.payment.create).mockResolvedValue(
      mockPayment as any,
    );
    vi.mocked(mpesaService.initiateStkPush).mockResolvedValue(
      mockMpesaResponse as any,
    );
    vi.mocked(prisma.client.cart.update).mockResolvedValue({} as any);

    const result = await useCase.execute(organizationId, dto);

    expect(prisma.client.cart.findFirst).toHaveBeenCalledWith({
      where: { id: dto.cartId, organizationId },
      include: { items: true },
    });

    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });

    expect(result.orderId).toBe("order-456");
  });

  it("should throw BadRequestException if locationId is missing and default location not found", async () => {
    const organizationId = "org-123";
    const dto = {
      cartId: "cart-123",
      phoneNumber: "254700000000",
    };

    const mockCart = {
      id: "cart-123",
      organizationId,
      items: [{ productId: "prod-1", variantId: "var-1", quantity: 1 }],
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.inventoryLocation.findFirst).mockResolvedValue(
      null,
    );

    await expect(useCase.execute(organizationId, dto)).rejects.toThrow(
      "No location provided and no default location found for organization",
    );
  });
});
