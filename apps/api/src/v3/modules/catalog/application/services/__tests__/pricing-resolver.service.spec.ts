import { Test, TestingModule } from '@nestjs/testing';
import { PricingResolverService } from '../pricing-resolver.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('PricingResolverService - Bolt early return', () => {
  let service: PricingResolverService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingResolverService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              productVariant: { findMany: vi.fn() },
              priceList: { findMany: vi.fn() },
              priceListItem: { findMany: vi.fn() },
            },
          },
        },
      ],
    }).compile();

    service = module.get<PricingResolverService>(PricingResolverService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return empty Map immediately without executing database queries if items is empty', async () => {
    const result = await service.resolveBatchVariantPrices({
      items: [],
      organizationId: 'org-1',
    });

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);

    // Verify zero database queries were performed
    expect(prisma.client.productVariant.findMany).not.toHaveBeenCalled();
    expect(prisma.client.priceList.findMany).not.toHaveBeenCalled();
    expect(prisma.client.priceListItem.findMany).not.toHaveBeenCalled();
  });
});
