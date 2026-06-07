# Sentinel's Journal

## 2026-06-07 - [Hardcoded Secret Fallback & Information Leakage]
**Vulnerability:** Found a hardcoded fallback for `JWT_SECRET` in `device-setup-tokens.ts` (`'fallback-secret-for-dev'`) and observed that the `AllExceptionsFilter` was leaking raw `Error` messages to API clients.
**Learning:** Hardcoded fallbacks are often introduced for developer convenience but can accidentally reach production if environment variables are misconfigured. Global exception filters often default to being verbose for debugging purposes, which is dangerous in production.
**Prevention:** Always use a "fail-fast" approach for critical secrets by throwing an error if they are missing at startup. Configure global error handlers to mask internal errors based on the environment (`NODE_ENV === 'production'`).
