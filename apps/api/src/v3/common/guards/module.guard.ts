import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRE_MODULE_KEY } from "../decorators/module.decorator";
import { ModuleAccessService } from "../services/module-access.service";
import { PlatformModuleKey } from "@repo/shared/constants";

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleAccessService: ModuleAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<PlatformModuleKey>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const isSuperAdmin =
      user?.role === "SUPER_ADMIN" || user?.systemRole === "SUPER_ADMIN";

    // Super admins bypass module restrictions
    if (isSuperAdmin) {
      return true;
    }

    const organizationId =
      request.organization?.id || request.headers["x-organization-id"];

    const resolution = await this.moduleAccessService.checkModuleAccess(
      organizationId,
      requiredModule,
    );

    if (!resolution.isEnabled) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "MODULE_DISABLED",
        error: "Module Disabled",
        message: resolution.reason || `Module '${requiredModule}' is currently disabled.`,
        moduleKey: requiredModule,
      });
    }

    return true;
  }
}
