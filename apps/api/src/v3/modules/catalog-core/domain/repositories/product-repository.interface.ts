import { Product } from '../entities/product.entity';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

export interface IProductRepository {
  findByOrganization(organizationId: string, pagination?: PaginationQueryDto): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
}

export const IProductRepository = Symbol('IProductRepository');
