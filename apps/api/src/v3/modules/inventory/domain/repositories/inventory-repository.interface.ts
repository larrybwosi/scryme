import { InventoryItem } from '../entities/inventory-item.entity';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

export interface IInventoryRepository {
  findByOrganization(organizationId: string, pagination?: PaginationQueryDto): Promise<InventoryItem[]>;
  findByLocation(locationId: string): Promise<InventoryItem[]>;
  updateQuantity(id: string, delta: number): Promise<InventoryItem>;
}

export const IInventoryRepository = Symbol('IInventoryRepository');
