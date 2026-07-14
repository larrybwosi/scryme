import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
  meta?: any;
}

@Injectable()
export class StandardResponseInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const url = request?.url || "";

    // Skip intercepting for any better-auth or custom authentication API routes
    if (url.includes("/api/auth")) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Skip wrapping for StreamableFile (used for PDF downloads, etc.)
        if (data instanceof StreamableFile) {
          return data;
        }

        if (data && typeof data === "object" && "success" in data) {
          return data;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
