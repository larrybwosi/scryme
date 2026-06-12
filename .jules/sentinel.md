# Sentinel Security Journal 🛡️

## 2025-05-15 - [Secured Public Upload Endpoint]
**Vulnerability:** The `/api/upload` endpoint in the NestJS API was marked with `@Public()`, allowing anyone to upload files to the server without authentication. Additionally, the Next.js proxy route for this endpoint did not perform its own session validation.

**Learning:** It's easy to overlook decorators like `@Public()` during development, especially for utility endpoints like file uploads. Proxy routes must also enforce security policies rather than blindly forwarding requests.

**Prevention:**
- Regularly audit all endpoints marked as `@Public()`.
- Ensure all proxy routes in the Next.js application validate sessions using `getServerAuth()` before forwarding requests to the internal API.
- Sanitize all user-provided data, including filenames, even when using unique identifiers like UUIDs.
- When proxying `multipart/form-data` requests, avoid forwarding the `Content-Type` header to let the backend `fetch` generate the correct multipart boundary.

## 2026-06-10 - [Security Hardening: Logging, Errors, and JWT]
**Vulnerability:** 1) Generic `Error` objects in the global exception filter leaked raw system messages to clients. 2) The API logged full request bodies including sensitive fields like `password`, `pin`, and `clientSecret`. 3) JWT operations in V3 auth didn't explicitly specify an algorithm.

**Learning:** Logging middlewares are a common source of accidental credential leakage. Global exception filters must be environment-aware to prevent exposing stack traces or internal logic via generic Error messages.

**Prevention:**
- Use a recursive redaction utility for all request/response logging.
- Ensure global exception filters return generic messages for unhandled non-HttpExceptions in production.
- Always explicitly specify JWT algorithms to prevent algorithm-switching attacks.

## 2026-06-11 - [Mitigated Authentication DoS and Brute-force Risks]
**Vulnerability:** 1) The API lacked global rate limiting, exposing all endpoints to brute-force and DoS attacks. 2) The `V3AuthService` PIN validation performed an $O(N)$ operation by iterating through all active members and executing `bcrypt.compare` on each, which is computationally expensive and highly exploitable for DoS.

**Learning:** Authentication loops that involve heavy cryptographic operations must be avoided or strictly rate-limited. Relying on per-endpoint guards is error-prone; global defaults should always favor security.

**Prevention:**
- Enable `ThrottlerGuard` globally to provide a baseline defense for all endpoints.
- Avoid $O(N)$ cryptographic loops in authentication logic. Store salts or use search-optimized hashing strategies if direct lookups are needed, or ensure strict rate limits are applied specifically to these endpoints.
