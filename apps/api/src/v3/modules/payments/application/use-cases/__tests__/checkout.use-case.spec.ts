import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/shared/mpesa/server", () => ({
  MpesaService: vi.fn(),
}));

import { CheckoutUseCase } from "../checkout.use-case";
import { PrismaService } from "@/prisma/prisma.service";

vi.mock("@repo/shared/server", () => ({
  emitOrderPlaced: vi.fn().mockResolvedValue({}),
}));

describe("CheckoutUseCase (Integration)", () => {
  let useCase: CheckoutUseCase;
  let prisma: PrismaService;
  let mpesaService: any;
  let webhookService: any;

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
        transaction: {
          create: vi.fn(),
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

    useCase = new CheckoutUseCase(prisma, mpesaService, webhookService);
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
