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

## 2026-06-20 - [Global Rate Limiting and Enhanced Redaction]
**Vulnerability:** 1) ThrottlerModule was configured but not registered as a global guard, leaving endpoints unprotected by default. 2) Sensitive data redaction list was missing modern identifiers like 'apiKey' and 'access_token'. 3) V3 Auth bootstrap was blocked by global V2AuthGuard.

**Learning:** Having a security module (like Throttler) configured in the imports is not enough; it must be registered as an APP_GUARD to provide baseline protection for all endpoints.

**Prevention:**
- Always register ThrottlerGuard globally and use @SkipThrottle() for the few endpoints that need it.
- Maintain a comprehensive redaction list that includes all variations of credentials used in the app (apiKey, api_key, token, secret, etc.).
- When adding global guards, ensure authentication bootstrap endpoints (like token exchange) are explicitly marked as @AllowPublic() to prevent lockouts.
## 2026-06-11 - [Mitigated Authentication DoS and Brute-force Risks]
**Vulnerability:** 1) The API lacked global rate limiting, exposing all endpoints to brute-force and DoS attacks. 2) The `V3AuthService` PIN validation performed an $O(N)$ operation by iterating through all active members and executing `bcrypt.compare` on each, which is computationally expensive and highly exploitable for DoS.

**Learning:** Authentication loops that involve heavy cryptographic operations must be avoided or strictly rate-limited. Relying on per-endpoint guards is error-prone; global defaults should always favor security.

**Prevention:**
- Enable `ThrottlerGuard` globally to provide a baseline defense for all endpoints.
- Avoid $O(N)$ cryptographic loops in authentication logic. Store salts or use search-optimized hashing strategies if direct lookups are needed, or ensure strict rate limits are applied specifically to these endpoints.

## 2026-06-15 - [Hardened Image Optimization Pipeline]
**Vulnerability:** The `ImageService` was vulnerable to SSRF and DoS. It fetched images from arbitrary URLs provided in the `id` parameter when in Sanity mode and lacked timeouts or size limits on external requests, allowing for network probing and memory exhaustion.

**Learning:** Image optimization services that fetch external assets are prime targets for SSRF. Trusting "IDs" without strict format validation can lead to unintended proxying of internal resources.

**Prevention:**
- Strictly validate external asset identifiers using regex (e.g., Sanity's `image-[hash]-[dimensions]-[extension]` format).
- Always enforce `timeout` and `maxContentLength` on outbound HTTP requests for asset fetching to prevent DoS.
- Reject raw URLs in parameters that expect specific asset IDs.

## 2026-06-17 - [Strict Validation and Outbound DoS Protections]
**Vulnerability:** 1) `ImageService` arbitrary URL fallback was still accessible if loose ID validation failed, leading to SSRF. 2) GitHub update checks in `BakeryService` and Slack API calls in `SlackProvider` lacked timeouts and size limits, exposing the server to DoS via resource exhaustion.

**Learning:** "Trust but verify" isn't enough for ID parameters that influence outbound requests; use strict, exclusive validation (allow-listing). Furthermore, *all* outbound HTTP requests must be bounded by timeouts and size limits to prevent the server from becoming a victim of upstream "Slowloris" or large payload attacks.

**Prevention:**
- Never fallback to raw parameter values when constructing outbound request URLs.
- Standardize on a set of defensive `axios` request configuration (timeouts, maxContentLength) for all internal services.
- Ensure test suites for security-critical services (like `ImageService`) explicitly import test globals (like `describe`, `it`) for compatibility with modern Vitest environments.

## 2026-06-21 - [Hardened M-Pesa Integration and Outbound Request Security]
**Vulnerability:** 1) `MpesaController` endpoints were vulnerable to IDOR as they trusted `organizationId` from request parameters/body without validating ownership. 2) `ShortUrlController`, `ScrymeChatApiClient`, and `MpesaClient` lacked `timeout` and `maxContentLength` on outbound requests, exposing the service to DoS.

**Learning:** Multi-tenant security must be enforced at the API boundary by deriving the tenant ID from the authenticated session context rather than client-supplied parameters. Furthermore, the DoS protection pattern for `axios` must be applied consistently to *all* external API clients, not just image services.

**Prevention:**
- Always use the `@v2Context()` decorator to retrieve `organizationId` and `memberId` for sensitive operations.
- Enforce mandatory `timeout` and `maxContentLength` on all `axios` calls to prevent resource exhaustion from malicious or slow upstream responses.
