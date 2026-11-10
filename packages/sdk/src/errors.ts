/**
 * Scryme Enterprise Error Hierarchy
 */

export interface ErrorResponsePayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
  details?: any;
  [key: string]: any;
}

export class ScrymeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrymeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SecurityError extends ScrymeError {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CircuitBreakerError extends ScrymeError {
  public readonly cooldownMs: number;

  constructor(message: string, cooldownMs: number) {
    super(message);
    this.name = "CircuitBreakerError";
    this.cooldownMs = cooldownMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ScrymeApiError extends ScrymeError {
  public readonly status: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly details?: any;
  public readonly rawBody?: any;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      requestId?: string;
      details?: any;
      rawBody?: any;
    }
  ) {
    super(message);
    this.name = "ScrymeApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
    this.rawBody = options.rawBody;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends ScrymeApiError {
  constructor(message: string, options: { status?: number; code?: string; requestId?: string; details?: any; rawBody?: any } = {}) {
    super(message, {
      status: options.status ?? 401,
      code: options.code ?? "UNAUTHORIZED",
      requestId: options.requestId,
      details: options.details,
      rawBody: options.rawBody,
    });
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends ScrymeApiError {
  constructor(message: string, options: { status?: number; code?: string; requestId?: string; details?: any; rawBody?: any } = {}) {
    super(message, {
      status: options.status ?? 404,
      code: options.code ?? "NOT_FOUND",
      requestId: options.requestId,
      details: options.details,
      rawBody: options.rawBody,
    });
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends ScrymeApiError {
  constructor(message: string, options: { status?: number; code?: string; requestId?: string; details?: any; rawBody?: any } = {}) {
    super(message, {
      status: options.status ?? 409,
      code: options.code ?? "CONFLICT",
      requestId: options.requestId,
      details: options.details,
      rawBody: options.rawBody,
    });
    this.name = "ConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitError extends ScrymeApiError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      requestId?: string;
      retryAfter?: number;
      details?: any;
      rawBody?: any;
    } = {}
  ) {
    super(message, {
      status: options.status ?? 429,
      code: options.code ?? "RATE_LIMIT_EXCEEDED",
      requestId: options.requestId,
      details: options.details,
      rawBody: options.rawBody,
    });
    this.name = "RateLimitError";
    this.retryAfter = options.retryAfter;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InternalServerError extends ScrymeApiError {
  constructor(message: string, options: { status?: number; code?: string; requestId?: string; details?: any; rawBody?: any } = {}) {
    super(message, {
      status: options.status ?? 500,
      code: options.code ?? "INTERNAL_SERVER_ERROR",
      requestId: options.requestId,
      details: options.details,
      rawBody: options.rawBody,
    });
    this.name = "InternalServerError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends ScrymeError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "NetworkError";
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends ScrymeError {
  public readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Maps an HTTP response and parsed payload into the appropriate ScrymeError subclass.
 */
export function createApiErrorFromResponse(
  status: number,
  payload: any,
  headers?: Headers
): ScrymeApiError {
  let message = `Request failed with status ${status}`;
  let code: string | undefined;
  let details: any;

  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string") {
      message = payload.message;
    } else if (Array.isArray(payload.message)) {
      message = payload.message.join("; ");
    } else if (typeof payload.error === "string") {
      message = payload.error;
    }
    code = payload.code || (payload.error && typeof payload.error === "string" ? payload.error : undefined);
    details = payload.details || payload;
  } else if (typeof payload === "string" && payload.length > 0) {
    message = payload;
  }

  const requestId = headers?.get("x-request-id") || headers?.get("request-id") || undefined;

  switch (status) {
    case 401:
    case 403:
      return new AuthenticationError(message, { status, code, requestId, details, rawBody: payload });
    case 404:
      return new NotFoundError(message, { status, code, requestId, details, rawBody: payload });
    case 409:
      return new ConflictError(message, { status, code, requestId, details, rawBody: payload });
    case 429: {
      const retryAfterHeader = headers?.get("retry-after");
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      return new RateLimitError(message, { status, code, requestId, retryAfter, details, rawBody: payload });
    }
    default:
      if (status >= 500) {
        return new InternalServerError(message, { status, code, requestId, details, rawBody: payload });
      }
      return new ScrymeApiError(message, { status, code, requestId, details, rawBody: payload });
  }
}
