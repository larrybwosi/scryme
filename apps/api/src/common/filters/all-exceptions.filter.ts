import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { ApiError } from "@repo/shared/api/v2/errors";
import { env } from "@repo/env";
import { OpenObserveService } from "../services/openobserve.service";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error("Unhandled Exception:", exception);
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

    // Log to OpenObserve if it's an auth error or unhandled exception
    try {
      const openObserveService =
        host.switchToHttp().getRequest().v2Context?.openObserveService ||
        host.switchToHttp().getRequest().openObserveService;

      if (openObserveService) {
        const request = ctx.getRequest<any>();
        const ip =
          (request.headers["x-forwarded-for"] as string) ||
          request.ip ||
          "unknown";
        const correlationId =
          request.headers["x-correlation-id"] ||
          request.v2Context?.correlationId;

        if (
          status === HttpStatus.UNAUTHORIZED ||
          status === HttpStatus.FORBIDDEN
        ) {
          openObserveService.logAuthFailure({
            ip,
            userAgent: request.headers["user-agent"] || "unknown",
            reason: message,
            path: request.url,
            method: request.method,
            correlationId,
          });
        } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
          openObserveService.logException(exception, {
            path: request.url,
            method: request.method,
            ip,
            correlationId,
          });
        }
      }
    } catch (e) {
      console.error("Failed to log to OpenObserve from filter:", e);
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
