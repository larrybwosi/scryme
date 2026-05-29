import { SystemUnit, OrganizationUnit } from '../entities/unit.entity';

export interface IUnitsRepository {
  findManySystemUnits(lastSync?: Date): Promise<SystemUnit[]>;
  findManyOrganizationUnits(organizationId: string, lastSync?: Date): Promise<OrganizationUnit[]>;
}
