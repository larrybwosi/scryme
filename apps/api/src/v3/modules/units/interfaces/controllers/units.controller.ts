import { Controller, Get, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { GetUnitsUseCase } from "../../application/use-cases/get-units.use-case";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";

@ApiTags("V3 Units")
@ApiBearerAuth()
@Controller(":orgSlug/units")
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
export class UnitsController {
  constructor(private readonly getUnitsUseCase: GetUnitsUseCase) {}

  @Get()
  @ApiOperation({
    summary: "Get all units for an organization",
    description: "Returns both system units and organization-specific units.",
    operationId: "Units_GetUnits",
  })
  @ApiQuery({ name: "lastSync", required: false, description: "Optional timestamp for delta sync" })
  @ApiResponse({ status: 200, description: "List of units" })
  async getUnits(@Req() req: any, @Query("lastSync") lastSync?: string) {
    const organizationId = req.organization.id;
    return this.getUnitsUseCase.execute(organizationId, lastSync);
  }
}
