import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { IInventoryRepository } from '../../domain/repositories/inventory-repository.interface';
import { GetInventoryUseCase } from './get-inventory.use-case';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';

describe('GetInventoryUseCase', () => {
  let useCase: GetInventoryUseCase;
  let inventoryRepository: IInventoryRepository;

  beforeEach(() => {
    inventoryRepository = {
      findByOrganization: vi.fn() as any,
      findByLocation: vi.fn() as any,
      updateQuantity: vi.fn() as any,
    };
    useCase = new GetInventoryUseCase(inventoryRepository);
  });

  it('should return inventory for a given organization', async () => {
    const orgId = 'org-1';
    const inventory = [new InventoryItem('1', 'var-1', 'loc-1', 10, orgId, new Date())];
    const paginatedResponse = {
      data: inventory,
      total: 1,
      limit: 20,
      offset: 0,
    };
    (inventoryRepository.findByOrganization as any).mockResolvedValue(paginatedResponse);

    const result = await useCase.execute(orgId, { limit: 20, offset: 0 });

    expect(result).toEqual(paginatedResponse);
    expect(inventoryRepository.findByOrganization).toHaveBeenCalledWith(orgId, { limit: 20, offset: 0 });
  });
});
