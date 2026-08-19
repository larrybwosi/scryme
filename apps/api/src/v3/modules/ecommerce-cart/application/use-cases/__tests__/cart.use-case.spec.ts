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
          delete: vi.fn(),
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

  describe("Cart Merging / Migration", () => {
    it("should merge guest cart items into customer cart when both exist", async () => {
      const orgId = "org-1";
      const customerId = "cust-1";
      const sessionId = "sess-1";

      const mockGuestCart = {
        id: "cart-guest",
        organizationId: orgId,
        sessionId,
        items: [
          {
            id: "item-guest-1",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 3,
            bookingDetails: null,
          },
          {
            id: "item-guest-2",
            productId: "prod-2",
            variantId: null,
            serviceId: null,
            quantity: 1,
            bookingDetails: null,
          }
        ],
      };

      const mockCustomerCart = {
        id: "cart-cust",
        organizationId: orgId,
        customerId,
        items: [
          {
            id: "item-cust-1",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 2,
            bookingDetails: null,
          }
        ],
      };

      // Mock first findFirst call (guestCart lookup)
      vi.mocked(prisma.client.cart.findFirst)
        .mockResolvedValueOnce(mockGuestCart as any) // guestCart findFirst
        .mockResolvedValueOnce(mockCustomerCart as any) // customerCart findFirst
        .mockResolvedValueOnce(mockCustomerCart as any); // refetch final cart

      await useCase.getCart(orgId, customerId, sessionId);

      // Verify that quantity was updated for existing item "prod-1"
      expect(prisma.client.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item-cust-1" },
        data: { quantity: 5 },
      });

      // Verify that new item "prod-2" was created in customer cart
      expect(prisma.client.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart-cust",
          productId: "prod-2",
          variantId: null,
          serviceId: null,
          bookingDetails: undefined,
          quantity: 1,
        },
      });

      // Verify guest cart was deleted
      expect(prisma.client.cart.delete).toHaveBeenCalledWith({
        where: { id: "cart-guest" },
      });
    });

    it("should assign guest cart to customer when no customer cart exists", async () => {
      const orgId = "org-1";
      const customerId = "cust-1";
      const sessionId = "sess-1";

      const mockGuestCart = {
        id: "cart-guest",
        organizationId: orgId,
        sessionId,
        items: [
          {
            id: "item-guest-1",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 3,
            bookingDetails: null,
          }
        ],
      };

      vi.mocked(prisma.client.cart.findFirst)
        .mockResolvedValueOnce(mockGuestCart as any) // guestCart findFirst
        .mockResolvedValueOnce(null); // customerCart findFirst (none exists)

      vi.mocked(prisma.client.cart.update).mockResolvedValue({
        id: "cart-guest",
        organizationId: orgId,
        customerId,
        sessionId: null,
        items: mockGuestCart.items,
      } as any);

      const result = await useCase.getCart(orgId, customerId, sessionId);

      expect(result).toBeDefined();
      expect(prisma.client.cart.update).toHaveBeenCalledWith({
        where: { id: "cart-guest" },
        data: { customerId, sessionId: null },
        include: { items: true },
      });
    });

    it("should delete guest cart when it is empty", async () => {
      const orgId = "org-1";
      const customerId = "cust-1";
      const sessionId = "sess-1";

      const mockGuestCart = {
        id: "cart-guest",
        organizationId: orgId,
        sessionId,
        items: [],
      };

      const mockCustomerCart = {
        id: "cart-cust",
        organizationId: orgId,
        customerId,
        items: [],
      };

      vi.mocked(prisma.client.cart.findFirst)
        .mockResolvedValueOnce(mockGuestCart as any)
        .mockResolvedValueOnce(mockCustomerCart as any)
        .mockResolvedValueOnce(mockCustomerCart as any);

      await useCase.getCart(orgId, customerId, sessionId);

      expect(prisma.client.cart.delete).toHaveBeenCalledWith({
        where: { id: "cart-guest" },
      });
    });

    it("should consolidate duplicate guest cart items before executing database updates", async () => {
      const orgId = "org-1";
      const customerId = "cust-1";
      const sessionId = "sess-1";

      const mockGuestCart = {
        id: "cart-guest",
        organizationId: orgId,
        sessionId,
        items: [
          {
            id: "item-guest-1",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 2,
            bookingDetails: null,
          },
          {
            id: "item-guest-2",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 3,
            bookingDetails: null,
          },
          {
            id: "item-guest-3",
            productId: "prod-new",
            variantId: "var-new",
            serviceId: null,
            quantity: 1,
            bookingDetails: null,
          },
          {
            id: "item-guest-4",
            productId: "prod-new",
            variantId: "var-new",
            serviceId: null,
            quantity: 4,
            bookingDetails: null,
          },
        ],
      };

      const mockCustomerCart = {
        id: "cart-cust",
        organizationId: orgId,
        customerId,
        items: [
          {
            id: "item-cust-1",
            productId: "prod-1",
            variantId: "var-1",
            serviceId: null,
            quantity: 5,
            bookingDetails: null,
          },
        ],
      };

      vi.mocked(prisma.client.cart.findFirst)
        .mockResolvedValueOnce(mockGuestCart as any)
        .mockResolvedValueOnce(mockCustomerCart as any)
        .mockResolvedValueOnce(mockCustomerCart as any);

      await useCase.getCart(orgId, customerId, sessionId);

      // Verify single consolidated update call for prod-1/var-1 (5 existing + 2 + 3 guest = 10)
      expect(prisma.client.cartItem.update).toHaveBeenCalledTimes(1);
      expect(prisma.client.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item-cust-1" },
        data: { quantity: 10 },
      });

      // Verify single consolidated create call for prod-new/var-new (1 + 4 guest = 5)
      expect(prisma.client.cartItem.create).toHaveBeenCalledTimes(1);
      expect(prisma.client.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart-cust",
          productId: "prod-new",
          variantId: "var-new",
          serviceId: null,
          bookingDetails: undefined,
          quantity: 5,
        },
      });
    });
  });
});
