import { Test, TestingModule } from '@nestjs/testing';
import { AttachLpoUseCase } from '../attach-lpo.use-case';
import { IOrderRepository } from '../../../domain/repositories/order-repository.interface';
import { Order } from '../../../domain/entities/order.entity';
import { TransactionStatus } from '@repo/db';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AttachLpoUseCase', () => {
  let useCase: AttachLpoUseCase;
  let orderRepository: IOrderRepository;

  const mockOrderRepository = {
    findById: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachLpoUseCase,
        { provide: IOrderRepository, useValue: mockOrderRepository },
      ],
    }).compile();

    useCase = module.get<AttachLpoUseCase>(AttachLpoUseCase);
    orderRepository = module.get<IOrderRepository>(IOrderRepository);
  });

  it('should attach LPO to a quote and update status to QUOTE_ACCEPTED', async () => {
    const orgId = 'org-1';
    const orderId = 'order-1';
    const dto = {
      lpoNumber: 'LPO-001',
      lpoDate: '2023-10-01T00:00:00Z',
      lpoExpiryDate: '2023-12-31T00:00:00Z',
      lpoUrl: 'http://example.com/lpo.pdf',
    };

    const mockOrder = new Order(
      orderId,
      'ORD-001',
      'cust-1',
      TransactionStatus.QUOTE_SENT,
      100,
      orgId,
      'loc-1',
      new Date(),
      new Date()
    );

    mockOrderRepository.findById.mockResolvedValue(mockOrder);
    mockOrderRepository.save.mockImplementation((o) => Promise.resolve(o));

    const result = await useCase.execute(orgId, orderId, dto);

    expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
    expect(orderRepository.save).toHaveBeenCalled();
    expect(result.lpoNumber).toBe(dto.lpoNumber);
    expect(result.status).toBe(TransactionStatus.QUOTE_ACCEPTED);
  });

  it('should throw NotFoundException if order does not exist or wrong organization', async () => {
    mockOrderRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'order-1', { lpoNumber: '123' }))
      .rejects.toThrow(NotFoundException);
  });
});
