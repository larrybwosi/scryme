import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ModuleAccessService } from "../services/module-access.service";
import { CurrentOrganization } from "../decorators/current-organization.decorator";
import { StandardResponseInterceptor } from "../interceptors/standard-response.interceptor";
import { EffectiveModuleResolution } from "@repo/shared/constants";

@ApiTags("V3 Organization Modules")
@Controller("organization/modules")
@UseInterceptors(StandardResponseInterceptor)
export class OrganizationModulesController {
  constructor(private readonly moduleAccessService: ModuleAccessService) {}

  @Get()
  @ApiOperation({
    summary: "Get effective module resolutions for current organization",
    operationId: "Organization_GetModules",
  })
  async getModules(
    @CurrentOrganization() orgId: string | undefined,
  ): Promise<EffectiveModuleResolution[]> {
    return this.moduleAccessService.getAllModulesAccess(orgId);
  }
}
