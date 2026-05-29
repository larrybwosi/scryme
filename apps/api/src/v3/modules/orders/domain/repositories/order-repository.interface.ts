import { Order } from '../entities/order.entity';
import { PaginationQueryDto, PaginatedResponse } from '@/v3/common/utils/pagination';

export interface IOrderRepository {
  findByOrganization(organizationId: string, paginationQuery: PaginationQueryDto): Promise<PaginatedResponse<Order>>;
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  create(orderData: any): Promise<Order>;
}

export const IOrderRepository = Symbol('IOrderRepository');
