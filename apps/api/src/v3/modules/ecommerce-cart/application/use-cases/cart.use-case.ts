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
  ) {
    const where: any = { organizationId };
    if (customerId) where.customerId = customerId;
    else if (sessionId) where.sessionId = sessionId;
    else throw new Error("Either customerId or sessionId must be provided");

    const cart = await this.prisma.client.cart.findFirst({
      where,
      include: { items: true },
    });

    if (!cart) {
      return this.prisma.client.cart.create({
        data: { organizationId, customerId, sessionId, status: "ACTIVE" },
        include: { items: true },
      });
    }

    return cart;
  }

  async addToCart(organizationId: string, dto: AddToCartDto) {
    const cart = await this.getCart(
      organizationId,
      dto.customerId,
      dto.sessionId,
    );

    const item = await this.prisma.client.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || "base",
        },
      },
      update: {
        quantity: { increment: dto.quantity },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
      },
    });

    // Queue background job for inventory check or other tasks
    await this.cartQueue.add("check-cart-inventory", {
      cartId: cart.id,
      productId: dto.productId,
      organizationId,
    });

    return item;
  }

  async removeFromCart(organizationId: string, dto: RemoveFromCartDto) {
    const cart = await this.getCart(
      organizationId,
      dto.customerId,
      dto.sessionId,
    );

    return this.prisma.client.cartItem.delete({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || "base",
        },
      },
    });
  }
}
