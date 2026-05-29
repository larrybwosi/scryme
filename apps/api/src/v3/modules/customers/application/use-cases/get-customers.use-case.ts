import { Injectable, Inject } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer-repository.interface';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

@Injectable()
export class GetCustomersUseCase {
  constructor(
    @Inject(ICustomerRepository)
    private readonly customerRepository: ICustomerRepository
  ) {}

  async execute(organizationId: string, paginationQuery: PaginationQueryDto) {
    return this.customerRepository.findByOrganization(organizationId, paginationQuery);
  }
}
