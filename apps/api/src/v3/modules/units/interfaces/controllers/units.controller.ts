import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { GetUnitsUseCase } from '../../application/use-cases/get-units.use-case';
import { V3AuthGuard } from '@/v3/common/guards/v3-auth.guard';
import { MultiTenancyGuard } from '@/v3/common/guards/multi-tenancy.guard';

@Controller(':orgSlug/units')
@UseGuards(V3AuthGuard, MultiTenancyGuard)
export class UnitsController {
  constructor(private readonly getUnitsUseCase: GetUnitsUseCase) {}

  @Get()
  async getUnits(@Req() req: any, @Query('lastSync') lastSync?: string) {
    const organizationId = req.organization.id;
    return this.getUnitsUseCase.execute(organizationId, lastSync);
  }
}
