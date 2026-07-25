import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiError } from "@repo/shared/api/v2";
import { env } from "@repo/env";
import { redactSensitiveData } from "../utils/redaction";
import * as Sentry from "@sentry/nestjs";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = "INTERNAL_SERVER_ERROR";
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      code = res.error || "HTTP_EXCEPTION";
    } else if (exception instanceof ApiError) {
      status = (exception as any).statusCode;
      message = (exception as any).message;
      code = (exception as any).code;
      details = (exception as any).details;
    } else if (exception instanceof Error) {
      // In production, don't leak generic error messages
      message =
        env.NODE_ENV === "development"
          ? exception.message
          : "Internal server error";
    }

    // @security Redact the entire exception object before logging to prevent
    // leaking sensitive data (secrets, PII) in server logs or OpenObserve.
    const redactedException = redactSensitiveData(exception);

    // Only log to console.error if status is 5xx (Internal Server Error or above)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error("Unhandled Exception:", redactedException);
    }

    // Log to Sentry for uncaught or severe enterprise exceptions
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      try {
        const request = ctx.getRequest<any>();
        const ip =
          (request.headers["x-forwarded-for"] as string) ||
          request.ip ||
          "unknown";
        const correlationId =
          request.headers["x-correlation-id"] ||
          request.v2Context?.correlationId;
        const userId = request.v3Context?.userId || request.user?.id;
        const email = request.user?.email;
        const memberId =
          request.v2Context?.memberId ||
          request.v3Context?.memberId ||
          request.user?.memberId;
        const organizationId =
          request.v2Context?.organizationId ||
          request.v3Context?.organizationId ||
          request.organization?.id;
        const businessAccountId = request.v3Context?.businessAccountId;
        const clientId = request.v3Context?.clientId;

        Sentry.withScope(scope => {
          if (userId || email || memberId) {
            scope.setUser({
              id: userId || undefined,
              email: email || undefined,
              ip_address: ip,
              memberId: memberId || undefined,
            } as any);
          }

          if (organizationId) scope.setTag("organizationId", organizationId);
          if (businessAccountId)
            scope.setTag("businessAccountId", businessAccountId);
          if (clientId) scope.setTag("clientId", clientId);
          if (correlationId) scope.setTag("correlationId", correlationId);
          scope.setTag("method", request.method || "unknown");
          scope.setTag("path", request.url || "unknown");
          scope.setTag("statusCode", status.toString());

          scope.setExtra("v2Context", redactSensitiveData(request.v2Context));
          scope.setExtra("v3Context", redactSensitiveData(request.v3Context));
          scope.setExtra("exceptionDetails", redactedException);

          // SECURITY: To prevent sensitive data leakage (e.g., query params, headers, secrets) to Sentry,
          // we reconstruct a clean Error with redacted info to keep Sentry's stack tracing and type parsing.
          let sentryException: any = redactedException;
          if (exception instanceof Error) {
            const redactedError = new Error(redactedException.message);
            redactedError.name = redactedException.name;
            redactedError.stack = redactedException.stack;
            for (const key of Object.getOwnPropertyNames(redactedException)) {
              if (!["name", "message", "stack"].includes(key)) {
                (redactedError as any)[key] = redactedException[key];
              }
            }
            sentryException = redactedError;
          }

          Sentry.captureException(sentryException);
        });
      } catch (sentryError) {
        console.error("Failed to capture exception in Sentry:", sentryError);
      }
    }

    response.status(status).send({
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
