import { Inject, Injectable } from "@nestjs/common";
import type { IUnitsRepository } from "../../domain/repositories/units.repository.interface";
import {
  SystemUnit,
  OrganizationUnit,
} from "../../domain/entities/unit.entity";

@Injectable()
export class GetUnitsUseCase {
  constructor(
    @Inject("IUnitsRepository")
    private readonly unitsRepository: IUnitsRepository,
  ) {}

  async execute(organizationId: string, lastSync?: string) {
    const lastSyncDate = lastSync ? new Date(lastSync) : undefined;

    const [systemUnits, organizationUnits] = await Promise.all([
      this.unitsRepository.findManySystemUnits(lastSyncDate),
      this.unitsRepository.findManyOrganizationUnits(
        organizationId,
        lastSyncDate,
      ),
    ]);

    return {
      systemUnits,
      organizationUnits,
      syncTimestamp: new Date().toISOString(),
    };
  }
}
