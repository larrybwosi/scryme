import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesUseCase } from '../favorites.use-case';
import { PrismaService } from '@/prisma/prisma.service';

describe('FavoritesUseCase', () => {
  let useCase: FavoritesUseCase;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        favorite: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          delete: vi.fn(),
        },
        product: {
          findFirst: vi.fn(),
        },
      },
    } as any;

    useCase = new FavoritesUseCase(prisma);
  });

  it('should add a favorite', async () => {
    const orgId = 'org-1';
    const dto = { productId: 'prod-1', customerId: 'cust-1' };

    vi.mocked(prisma.client.product.findFirst).mockResolvedValue({ id: 'prod-1' } as any);
    vi.mocked(prisma.client.favorite.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.favorite.create).mockResolvedValue({ id: 'fav-1' } as any);

    const result = await useCase.addFavorite(orgId, dto);

    expect(result).toBeDefined();
    expect(prisma.client.favorite.create).toHaveBeenCalled();
  });
});
