import { describe, it, expect, beforeEach, vi } from "vitest";
import { CartUseCase } from "../cart.use-case";
import { PrismaService } from "@/prisma/prisma.service";

describe("CartUseCase", () => {
  let useCase: CartUseCase;
  let prisma: PrismaService;
  let cartQueue: any;

  beforeEach(() => {
    prisma = {
      client: {
        cart: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        cartItem: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          deleteMany: vi.fn(),
        },
      },
    } as any;

    cartQueue = {
      add: vi.fn().mockResolvedValue({}),
    } as any;

    useCase = new CartUseCase(prisma, cartQueue);
  });

  it("should add a physical product item to the cart", async () => {
    const orgId = "org-1";
    const dto = {
      productId: "prod-1",
      variantId: "var-1",
      quantity: 2,
      sessionId: "sess-1",
    };
    const mockCart = {
      id: "cart-1",
      organizationId: orgId,
      sessionId: "sess-1",
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.cartItem.create).mockResolvedValue({
      id: "item-1",
      cartId: "cart-1",
      productId: "prod-1",
      variantId: "var-1",
      quantity: 2,
    } as any);

    const result = await useCase.addToCart(orgId, dto);

    expect(result).toBeDefined();
    expect(prisma.client.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: "cart-1",
        productId: "prod-1",
        variantId: "var-1",
        serviceId: null,
        bookingDetails: undefined,
        quantity: 2,
      }
    });
    expect(cartQueue.add).toHaveBeenCalledWith(
      "check-cart-inventory",
      expect.any(Object),
    );
  });

  it("should add a service booking item to the cart", async () => {
    const orgId = "org-1";
    const dto = {
      serviceId: "srv-1",
      bookingDetails: {
        scheduledStartTime: "2026-10-15T10:00:00Z",
        staffIds: ["staff-1"],
      },
      quantity: 1,
      sessionId: "sess-1",
    };
    const mockCart = {
      id: "cart-1",
      organizationId: orgId,
      sessionId: "sess-1",
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.cartItem.create).mockResolvedValue({
      id: "item-2",
      cartId: "cart-1",
      serviceId: "srv-1",
      bookingDetails: dto.bookingDetails,
      quantity: 1,
    } as any);

    const result = await useCase.addToCart(orgId, dto);

    expect(result).toBeDefined();
    expect(prisma.client.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: "cart-1",
        productId: null,
        variantId: null,
        serviceId: "srv-1",
        bookingDetails: dto.bookingDetails,
        quantity: 1,
      }
    });
  });

  it("should clear the entire cart", async () => {
    const orgId = "org-1";
    const mockCart = {
      id: "cart-1",
      organizationId: orgId,
      sessionId: "sess-1",
    };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.cartItem.deleteMany).mockResolvedValue({ count: 2 } as any);

    const result = await useCase.clearCart(orgId, undefined, "sess-1");

    expect(result).toBeDefined();
    expect(prisma.client.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: "cart-1" },
    });
  });
});
