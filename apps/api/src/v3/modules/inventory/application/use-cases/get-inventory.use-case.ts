import { Injectable, Inject } from "@nestjs/common";
import { IInventoryRepository } from "../../domain/repositories/inventory-repository.interface";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class GetInventoryUseCase {
  constructor(
    @Inject(IInventoryRepository)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async execute(
    organizationId: string,
    paginationQuery: PaginationQueryDto,
    locationId?: string,
  ) {
    if (locationId) {
      return this.inventoryRepository.findByLocation(
        organizationId,
        locationId,
        paginationQuery,
      );
    }

    return this.inventoryRepository.findByOrganization(
      organizationId,
      paginationQuery,
    );
  }
}
