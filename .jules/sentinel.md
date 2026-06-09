# Sentinel's Journal

## 2026-06-07 - [Hardcoded Secret Fallback & Information Leakage]
**Vulnerability:** Found a hardcoded fallback for `JWT_SECRET` in `device-setup-tokens.ts` (`'fallback-secret-for-dev'`) and observed that the `AllExceptionsFilter` was leaking raw `Error` messages to API clients.
**Learning:** Hardcoded fallbacks are often introduced for developer convenience but can accidentally reach production if environment variables are misconfigured. Global exception filters often default to being verbose for debugging purposes, which is dangerous in production.
**Prevention:** Always use a "fail-fast" approach for critical secrets by throwing an error if they are missing at startup. Configure global error handlers to mask internal errors based on the environment (`NODE_ENV === 'production'`).

## 2026-06-09 - [Health Check Information Leakage]
**Vulnerability:** The `HealthController` was returning raw error messages from database and system checks directly to the client, even in production. This bypassed the global `AllExceptionsFilter` because the controller was manually constructing and throwing `ServiceUnavailableException` with the raw error message.
**Learning:** Global exception filters can be bypassed if controllers catch errors and re-throw them with specific response objects containing sensitive data. Health check endpoints are often overlooked but can leak technical details about the stack (DB type, connectivity issues, etc.).
**Prevention:** Mask raw error messages in all public-facing endpoints, especially health checks. Ensure that any manual exception throwing also respects environment-based masking.
