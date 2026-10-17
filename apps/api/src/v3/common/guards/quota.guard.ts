import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { QuotaService } from "../services/quota.service";
import { ENFORCE_QUOTA_KEY, QuotaMetric } from "../decorators/quota.decorator";

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly quotaService: QuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metric = this.reflector.getAllAndOverride<QuotaMetric>(
      ENFORCE_QUOTA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no quota metric is attached to the route, allow access
    if (!metric) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const isSuperAdmin =
      user?.role === "SUPER_ADMIN" || user?.systemRole === "SUPER_ADMIN";

    // Super admins are exempt from quota restrictions
    if (isSuperAdmin) {
      return true;
    }

    const organization = request.organization;
    if (!organization?.id) {
      // MultiTenancyGuard will handle missing organization or tenant validation
      return true;
    }

    const { allowed, limit, current } = await this.quotaService.checkQuota(
      organization.id,
      metric,
    );

    if (!allowed) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "QUOTA_EXCEEDED",
        error: "Quota Exceeded",
        message: `Organization has reached its capacity limit for ${metric} (${current}/${limit}). Please upgrade your plan in settings or contact your administrator.`,
        metric,
        limit,
        current,
      });
    }

    return true;
  }
}
