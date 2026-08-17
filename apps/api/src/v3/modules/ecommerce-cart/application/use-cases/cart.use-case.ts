import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AddToCartDto, RemoveFromCartDto } from "../dto/cart.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class CartUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("cart-sync") private readonly cartQueue: Queue,
  ) {}

  async getCart(
    organizationId: string,
    customerId?: string,
    sessionId?: string,
    includeItems: boolean = true,
  ) {
    const where: any = { organizationId };
    if (customerId) {
      where.customerId = customerId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    } else {
      throw new Error("Either customerId or sessionId must be provided");
    }

    // If both customerId and sessionId are provided, we handle cart merging/migration
    if (customerId && sessionId) {
      // Find guest cart
      const guestCart = await this.prisma.client.cart.findFirst({
        where: { organizationId, sessionId },
        include: { items: true },
      });

      // Find customer cart
      let customerCart = await this.prisma.client.cart.findFirst({
        where: { organizationId, customerId },
        include: { items: true },
      });

      if (guestCart && guestCart.items.length > 0) {
        if (!customerCart) {
          // If no customer cart exists, assign the customerId to the guest cart
          customerCart = await this.prisma.client.cart.update({
            where: { id: guestCart.id },
            data: { customerId, sessionId: null },
            include: { items: true },
          });
        } else {
          // Both carts exist and have items. Merge guest cart items into customer cart.
          // ⚡ Bolt Optimization: Map-Based Indexing & Parallelized Cart Item Writes
          // 1) Pre-index existing customer cart items into Maps by composite product key and service ID.
          //    This replaces O(N * M) nested array searches with O(1) constant-time Map lookups.
          const productItemMap = new Map<string, any>();
          const serviceItemMap = new Map<string, any>();

          for (const item of customerCart.items) {
            if (item.productId) {
              const key = `${item.productId}_${item.variantId || ""}`;
              productItemMap.set(key, item);
            } else if (item.serviceId) {
              serviceItemMap.set(item.serviceId, item);
            }
          }

          // 2) In-memory consolidation: aggregate duplicate guest cart items first to prevent duplicate creates or race conditions under concurrent writes.
          const aggregatedGuestProductMap = new Map<string, any>();
          const aggregatedGuestServiceMap = new Map<string, any>();

          for (const guestItem of guestCart.items) {
            if (guestItem.productId) {
              const key = `${guestItem.productId}_${guestItem.variantId || ""}`;
              const existing = aggregatedGuestProductMap.get(key);
              if (existing) {
                existing.quantity += guestItem.quantity;
              } else {
                aggregatedGuestProductMap.set(key, { ...guestItem });
              }
            } else if (guestItem.serviceId) {
              const existing = aggregatedGuestServiceMap.get(guestItem.serviceId);
              if (existing) {
                existing.quantity = 1;
              } else {
                aggregatedGuestServiceMap.set(guestItem.serviceId, { ...guestItem });
              }
            }
          }

          const aggregatedGuestItems = [
            ...Array.from(aggregatedGuestProductMap.values()),
            ...Array.from(aggregatedGuestServiceMap.values()),
          ];

          // 3) Map aggregated guest cart items to write promises and execute them concurrently via Promise.all.
          //    This collapses sequential O(N) blocking database roundtrips down to a flat O(1) concurrent roundtrip execution block.
          const cartItemPromises = aggregatedGuestItems.map(async (guestItem) => {
            let existingCustomerItem = null;
            if (guestItem.productId) {
              const key = `${guestItem.productId}_${guestItem.variantId || ""}`;
              existingCustomerItem = productItemMap.get(key);
            } else if (guestItem.serviceId) {
              existingCustomerItem = serviceItemMap.get(guestItem.serviceId);
            }

            if (existingCustomerItem) {
              // Update quantity
              return this.prisma.client.cartItem.update({
                where: { id: existingCustomerItem.id },
                data: {
                  quantity: guestItem.serviceId ? 1 : existingCustomerItem.quantity + guestItem.quantity,
                },
              });
            } else {
              // Create new cart item in customer cart
              return this.prisma.client.cartItem.create({
                data: {
                  cartId: customerCart.id,
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  serviceId: guestItem.serviceId,
                  bookingDetails: guestItem.bookingDetails || undefined,
                  quantity: guestItem.quantity,
                },
              });
            }
          });

          await Promise.all(cartItemPromises);

          // Delete the guest cart completely
          await this.prisma.client.cart.delete({
            where: { id: guestCart.id },
          });

          // Fetch the updated customer cart
          customerCart = await this.prisma.client.cart.findFirst({
            where: { organizationId, customerId },
            include: { items: true },
          }) as any;
        }
      } else if (guestCart) {
        // Guest cart is empty, just delete it
        await this.prisma.client.cart.delete({
          where: { id: guestCart.id },
        });
      }

      if (customerCart) {
        if (includeItems) return customerCart;
        const { items, ...cartWithoutItems } = customerCart as any;
        return cartWithoutItems;
      }
    }

    // Standard single-identity cart retrieval/creation
    const cart = await this.prisma.client.cart.findFirst({
      where,
      include: { items: includeItems },
    });

    if (!cart) {
      return this.prisma.client.cart.create({
        data: { organizationId, customerId, sessionId, status: "ACTIVE" },
        include: { items: includeItems },
      });
    }

    return cart;
  }

  async addToCart(organizationId: string, dto: AddToCartDto) {
    // ⚡ Bolt Optimization: Skip fetching cart items as we only need the cart ID
    const cart = await this.getCart(
      organizationId,
      dto.customerId,
      dto.sessionId,
      false,
    );

    let existingItem = null;

    if (dto.productId) {
      existingItem = await this.prisma.client.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
        },
      });
    } else if (dto.serviceId) {
      existingItem = await this.prisma.client.cartItem.findFirst({
        where: {
          cartId: cart.id,
          serviceId: dto.serviceId,
        },
      });
    }

    let item;
    if (existingItem) {
      item = await this.prisma.client.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: dto.serviceId ? 1 : existingItem.quantity + dto.quantity,
          bookingDetails: dto.bookingDetails ? (dto.bookingDetails as any) : existingItem.bookingDetails,
        },
      });
    } else {
      item = await this.prisma.client.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId || null,
          variantId: dto.variantId || null,
          serviceId: dto.serviceId || null,
          bookingDetails: dto.bookingDetails ? (dto.bookingDetails as any) : undefined,
          quantity: dto.quantity,
        },
      });
    }

    // Queue background job for inventory check if product variant is added
    if (dto.productId) {
      await this.cartQueue.add("check-cart-inventory", {
        cartId: cart.id,
        productId: dto.productId,
        organizationId,
      }).catch(err => console.error("Failed to add to cart queue:", err));
    }

    return item;
  }

  async removeFromCart(organizationId: string, dto: RemoveFromCartDto) {
    // ⚡ Bolt Optimization: Skip fetching cart items as we only need the cart ID
    const cart = await this.getCart(
      organizationId,
      dto.customerId,
      dto.sessionId,
      false,
    );

    let existingItem = null;

    if (dto.productId) {
      existingItem = await this.prisma.client.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
        },
      });
    } else if (dto.serviceId) {
      existingItem = await this.prisma.client.cartItem.findFirst({
        where: {
          cartId: cart.id,
          serviceId: dto.serviceId,
        },
      });
    }

    if (!existingItem) {
      throw new NotFoundException("Cart item not found");
    }

    return this.prisma.client.cartItem.delete({
      where: { id: existingItem.id },
    });
  }

  async clearCart(
    organizationId: string,
    customerId?: string,
    sessionId?: string,
  ) {
    const cart = await this.getCart(
      organizationId,
      customerId,
      sessionId,
      false,
    );

    return this.prisma.client.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
