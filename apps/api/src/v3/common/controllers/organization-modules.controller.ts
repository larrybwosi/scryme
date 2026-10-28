import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ModuleAccessService } from "../services/module-access.service";
import { v3Context } from "../decorators/v3-context.decorator";
import { StandardResponseInterceptor } from "../interceptors/standard-response.interceptor";
import type { EffectiveModuleResolution } from "@repo/shared/constants";
import type { V3ApiContext } from "@repo/shared/api/v3";

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
    @v3Context() ctx: V3ApiContext | undefined,
  ): Promise<EffectiveModuleResolution[]> {
    return this.moduleAccessService.getAllModulesAccess(ctx?.organizationId);
  }
}
