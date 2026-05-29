import { Customer } from '../entities/customer.entity';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

export interface ICustomerRepository {
  findByOrganization(organizationId: string, pagination?: PaginationQueryDto): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}

export const ICustomerRepository = Symbol('ICustomerRepository');
