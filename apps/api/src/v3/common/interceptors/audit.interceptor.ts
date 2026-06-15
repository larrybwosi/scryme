import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import {Observable} from "rxjs";
import {tap, catchError} from "rxjs/operators";
import {AuditService} from "../services/audit.service";
import {GqlExecutionContext} from "@nestjs/graphql";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isGql = context.getType() === ("graphql" as any);
    let request: any;
    let method: string;
    let url: string;

    if (isGql) {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().reply.request;
      const info = gqlContext.getInfo();
      method = "GRAPHQL";
      url = info.fieldName;
    } else {
      request = context.switchToHttp().getRequest();
      method = request.method;
      url = request.url;
    }

    const {user, organization} = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.auditService.log({
          timestamp: new Date().toISOString(),
          method,
          url,
          userId: user?.id,
          organizationId: organization?.id,
          duration,
        });
      }),
      catchError((error: any) => {
        const duration = Date.now() - now;
        this.auditService.log({
          timestamp: new Date().toISOString(),
          method,
          url,
          userId: user?.id,
          organizationId: organization?.id,
          duration,
          metadata: {error: error.message},
        });
        throw error;
      }),
    );
  }
}
