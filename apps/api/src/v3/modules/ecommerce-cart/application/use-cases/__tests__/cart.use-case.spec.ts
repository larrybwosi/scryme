import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartUseCase } from '../cart.use-case';
import { PrismaService } from '@/prisma/prisma.service';

describe('CartUseCase', () => {
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
          upsert: vi.fn(),
          delete: vi.fn(),
        },
      },
    } as any;

    cartQueue = {
      add: vi.fn().mockResolvedValue({}),
    } as any;

    useCase = new CartUseCase(prisma, cartQueue);
  });

  it('should add an item to the cart', async () => {
    const orgId = 'org-1';
    const dto = { productId: 'prod-1', variantId: 'var-1', quantity: 2, sessionId: 'sess-1' };
    const mockCart = { id: 'cart-1', organizationId: orgId, sessionId: 'sess-1' };

    vi.mocked(prisma.client.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.client.cartItem.upsert).mockResolvedValue({ id: 'item-1' } as any);

    const result = await useCase.addToCart(orgId, dto);

    expect(result).toBeDefined();
    expect(prisma.client.cartItem.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        cartId_productId_variantId: {
          cartId: 'cart-1',
          productId: 'prod-1',
          variantId: 'var-1',
        }
      })
    }));
    expect(cartQueue.add).toHaveBeenCalledWith('check-cart-inventory', expect.any(Object));
  });
});
