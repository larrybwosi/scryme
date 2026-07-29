import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const url = request?.url || "";

    // Skip timeouts for long-running workflows/uploads/SSE/events paths if needed
    if (url.includes("/upload") || url.includes("/sse") || url.includes("/events") || url.includes("/workflows")) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(15000), // 15 seconds request limit to prevent event loop freezes
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException("Request timed out (limit: 15s)"));
        }
        return throwError(() => err);
      }),
    );
  }
}
