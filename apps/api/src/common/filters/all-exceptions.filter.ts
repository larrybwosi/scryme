import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiError } from '@repo/shared/server';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res.message || exception.message;
      code = res.error || 'HTTP_EXCEPTION';
    } else if (exception instanceof ApiError) {
      status = (exception as any).statusCode;
      message = (exception as any).message;
      code = (exception as any).code;
      details = (exception as any).details;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Security: In production, mask internal server errors (500+) to prevent information leakage
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      message = 'Internal server error';
      code = 'INTERNAL_SERVER_ERROR';
      details = undefined;
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
