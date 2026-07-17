import { Test, TestingModule } from '@nestjs/testing';
import { B2BUseCase } from '../b2b.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { PricingResolverService } from '../../../../catalog/application/services/pricing-resolver.service';

describe('B2BUseCase', () => {
  let useCase: B2BUseCase;
  let prisma: PrismaService;
  let pricingResolver: PricingResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        B2BUseCase,
        {
          provide: PrismaService,
          useValue: {
            client: {
              product: { findMany: vi.fn() },
              transaction: { findMany: vi.fn(), create: vi.fn() },
              inventoryLocation: { findFirst: vi.fn() },
              productVariant: { findMany: vi.fn() },
            },
          },
        },
        {
          provide: PricingResolverService,
          useValue: {
            resolveBatchVariantPrices: vi.fn().mockResolvedValue(new Map()),
          },
        },
      ],
    }).compile();

    useCase = module.get<B2BUseCase>(B2BUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    pricingResolver = module.get<PricingResolverService>(PricingResolverService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('getCatalog', () => {
    it('should return products in catalog with categoryName mapping', async () => {
      const mockProducts = [
        {
          id: 'p1',
          name: 'Product 1',
          category: { name: 'Category 1' },
          variants: [{ id: 'v1', name: 'Variant 1' }],
        },
      ];

      vi.spyOn(prisma.client.product as any, 'findMany').mockResolvedValue(mockProducts);
      // Mock paginate instead of findMany if we use it
      const paginateModule = await import('../../../../../common/utils/pagination');
      vi.spyOn(paginateModule, 'paginate').mockResolvedValue({
        data: mockProducts,
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      } as any);

      const result = await useCase.getCatalog('org1', 'ba1', { page: 1, limit: 20 });

      expect(result.data).toBeDefined();
      expect(result.data[0].categoryName).toBe('Category 1');
      expect(result.data[0].variants[0].unitPrice).toBeDefined();
    });
  });

  describe('getInvoices', () => {
    it('should return transactions of type POS_SALE', async () => {
      const mockInvoices = [{ id: 'i1', type: 'POS_SALE' }];
      vi.spyOn(prisma.client.transaction, 'findMany').mockResolvedValue(mockInvoices as any);

      const result = await useCase.getInvoices('org1', 'ba1');

      expect(result).toEqual(mockInvoices);
      expect(prisma.client.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'POS_SALE' }),
          select: expect.objectContaining({ id: true, number: true }),
        }),
      );
    });
  });

  describe('getOrders', () => {
    it('should return transactions of type SALES_ORDER with items included via select', async () => {
      const mockOrders = [{ id: 'o1', type: 'SALES_ORDER', items: [] }];
      vi.spyOn(prisma.client.transaction, 'findMany').mockResolvedValue(mockOrders as any);

      const result = await useCase.getOrders('org1', 'ba1');

      expect(result).toEqual(mockOrders);
      expect(prisma.client.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'SALES_ORDER' }),
          select: expect.objectContaining({
            id: true,
            number: true,
            items: expect.any(Object),
          }),
        }),
      );
    });
  });
});
