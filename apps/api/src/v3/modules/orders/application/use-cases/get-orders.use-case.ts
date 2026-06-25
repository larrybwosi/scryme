import { Injectable, Inject } from "@nestjs/common";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(organizationId: string, paginationQuery: PaginationQueryDto) {
    return this.orderRepository.findByOrganization(
      organizationId,
      paginationQuery,
    );
  }
}
