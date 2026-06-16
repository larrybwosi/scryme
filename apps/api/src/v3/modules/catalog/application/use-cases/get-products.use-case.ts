import { Injectable, Inject } from "@nestjs/common";
import { IProductRepository } from "../../../catalog-core/domain/repositories/product-repository.interface";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(IProductRepository)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(organizationId: string, paginationQuery: PaginationQueryDto) {
    return this.productRepository.findByOrganization(
      organizationId,
      paginationQuery,
    );
  }
}
