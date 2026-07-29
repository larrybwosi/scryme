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
    if (customerId) where.customerId = customerId;
    else if (sessionId) where.sessionId = sessionId;
    else throw new Error("Either customerId or sessionId must be provided");

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
