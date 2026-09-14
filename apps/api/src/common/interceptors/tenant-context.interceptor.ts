import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { runWithTenant } from "@repo/db";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (!request) {
      return next.handle();
    }

    const organization =
      request.organization ||
      request.v3Context?.organization ||
      request.v2Context?.organization;

    const user = request.user;
    const isSuperAdmin =
      user?.role === "SUPER_ADMIN" || user?.systemRole === "SUPER_ADMIN";

    const orgId =
      organization?.id ||
      request.v3Context?.organizationId ||
      request.v2Context?.organizationId ||
      null;

    return new Observable((observer) => {
      runWithTenant(
        {
          organizationId: orgId,
          isSuperAdmin: !!isSuperAdmin,
        },
        () => {
          next.handle().subscribe(observer);
        }
      );
    });
  }
}
