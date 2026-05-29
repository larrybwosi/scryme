import 'server-only';
import { db as prisma } from '@repo/db';
import { redisProxy as redis } from '@repo/shared/server';

export class CartService {
  private static getCacheKey(id: string, isSession: boolean) {
    return isSession ? `session_cart:${id}` : `customer_cart:${id}`;
  }

  /**
   * Identifies and marks abandoned carts based on the provided threshold (in hours).
   * Also cleans up the corresponding cache entries in Redis.
   */
  static async processAbandonedCarts(thresholdHours: number = 24) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);

    const abandonedCarts = await prisma.cart.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lt: thresholdDate },
      },
      select: { id: true, sessionId: true, customerId: true },
    });

    if (abandonedCarts.length === 0) return { updatedCount: 0 };

    const cartIds = abandonedCarts.map((c: any) => c.id);

    const updateResult = await prisma.cart.updateMany({
      where: { id: { in: cartIds } },
      data: { status: 'ABANDONED' },
    });

    const keysToDelete: string[] = [];
    abandonedCarts.forEach((cart: any) => {
      if (cart.sessionId) keysToDelete.push(this.getCacheKey(cart.sessionId, true));
      if (cart.customerId) keysToDelete.push(this.getCacheKey(cart.customerId, false));
    });

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }

    return { updatedCount: updateResult.count };
  }
}
