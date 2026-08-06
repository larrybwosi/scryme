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
          // Both carts exist and have items. Merge guest cart items into customer cart
          for (const guestItem of guestCart.items) {
            let existingCustomerItem = null;
            if (guestItem.productId) {
              existingCustomerItem = customerCart.items.find(
                (item) =>
                  item.productId === guestItem.productId &&
                  item.variantId === guestItem.variantId,
              );
            } else if (guestItem.serviceId) {
              existingCustomerItem = customerCart.items.find(
                (item) => item.serviceId === guestItem.serviceId,
              );
            }

            if (existingCustomerItem) {
              // Update quantity
              await this.prisma.client.cartItem.update({
                where: { id: existingCustomerItem.id },
                data: {
                  quantity: guestItem.serviceId ? 1 : existingCustomerItem.quantity + guestItem.quantity,
                },
              });
            } else {
              // Create new cart item in customer cart
              await this.prisma.client.cartItem.create({
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
          }

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
