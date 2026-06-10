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
