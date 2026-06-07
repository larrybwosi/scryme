import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionsUseCase } from './get-transactions.use-case';
import { PrismaService } from '@/prisma/prisma.service';

describe('GetTransactionsUseCase', () => {
  let useCase: GetTransactionsUseCase;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        transaction: {
          count: vi.fn(),
          findMany: vi.fn(),
        },
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionsUseCase,
        { provide: PrismaService, useValue: prisma }
      ],
    }).compile();

    useCase = module.get<GetTransactionsUseCase>(GetTransactionsUseCase);
  });

  it('should fetch transactions with targeted select', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const ctx = {
      organizationId: 'org-1',
      memberId: 'mem-1',
      locationId: 'loc-1',
      orgSlug: 'org-slug',
      permissions: ['*'],
    };
    const query = { page: '1', limit: '10' };

    prisma.client.transaction.count.mockResolvedValue(1);
    prisma.client.transaction.findMany.mockResolvedValue([
      {
        id: 'tx-1',
        number: 'TX-001',
        items: [],
        payments: [],
        customer: null,
      },
    ]);

    const result = await useCase.execute(ctx as any, query);

    expect(result.data).toHaveLength(1);
    expect(prisma.client.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          items: expect.objectContaining({
            select: expect.any(Object),
          }),
          payments: expect.objectContaining({
            select: expect.any(Object),
          }),
        }),
      })
    );

    // Verify specific fields are selected in items
    const findManyArgs = prisma.client.transaction.findMany.mock.calls[0][0];
    expect(findManyArgs.include.items.select).toHaveProperty('id');
    expect(findManyArgs.include.items.select).not.toHaveProperty('customFields');

    // Verify specific fields are selected in payments
    expect(findManyArgs.include.payments.select).toHaveProperty('id');
    expect(findManyArgs.include.payments.select).not.toHaveProperty('gatewayResponse');
  });
});
