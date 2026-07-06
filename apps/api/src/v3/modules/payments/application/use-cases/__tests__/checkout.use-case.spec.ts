import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@repo/shared/mpesa/server", () => ({
  MpesaService: vi.fn(),
}));

import { CheckoutUseCase } from "../checkout.use-case";
import { PrismaService } from "@/prisma/prisma.service";

vi.mock("@repo/windmill/server", () => ({
  emitOrderPlaced: vi.fn().mockResolvedValue({}),
}));

describe("CheckoutUseCase (Integration)", () => {
  let useCase: CheckoutUseCase;
  let prisma: PrismaService;
  let mpesaService: any;

  beforeEach(() => {
    prisma = {
      client: {
        cart: {
          findUnique: vi.fn(),
          update: vi.fn(),
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

    useCase = new CheckoutUseCase(prisma, mpesaService);
  });

  it("should create an order and initiate mpesa payment", async () => {
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

    vi.mocked(prisma.client.cart.findUnique).mockResolvedValue(mockCart as any);
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
  });
});
