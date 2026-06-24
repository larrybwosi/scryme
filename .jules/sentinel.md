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
## 2026-06-18 - [Hardened PIN Validation and Comprehensive Redaction]
**Vulnerability:** 1) `V3AuthService` PIN validation was vulnerable to DoS by iterating through an unbounded list of members and performing `bcrypt.compare` on each. 2) The `redactSensitiveData` utility lacked protection for PII and financial data (SSN, Card Numbers, DOB).

**Learning:** Documented vulnerabilities (like the PIN DoS) require strict enforcement (e.g., `take` in Prisma and loop counters) to be truly mitigated. Redaction lists should proactively include standard PII/PCI identifiers beyond just authentication tokens.

**Prevention:**
- Always enforce hard limits (`take`) on database queries that feed into cryptographic loops.
- Use a comprehensive, standardized redaction list that includes `cardNumber`, `cvc`, `ssn`, and `dob` to ensure compliance with privacy standards across all logs.

## 2026-06-25 - [DoS Mitigation for Outbound Notification Webhooks]
**Vulnerability:** The `NotificationEngine` in both `notifications` and `windmill` packages lacked `timeout` and `maxContentLength` on outbound `axios` calls to external webhooks and the Discord API. A slow or malicious endpoint could cause the notification worker to hang or consume excessive memory.

**Learning:** External integration points, especially user-configurable webhooks, are critical DoS vectors. Furthermore, duplicated logic across packages (like `notifications` and `windmill`) requires coordinated hardening to ensure comprehensive protection.

**Prevention:**
- Standardize all outbound HTTP requests with a defensive default configuration (10s timeout, 1MB payload limit unless otherwise required).
- Identify and consolidate (or parallel-harden) duplicated service logic to prevent security gaps in secondary packages.

## 2026-06-27 - [Hardened PIN Authentication and O(1) Lookup]
**Vulnerability:** `V3AuthCoreService` performed an $O(N)$ loop of `bcrypt.compare` operations on all active members during PIN-based login. This created a high-severity DoS vector for large organizations and allowed for unbounded brute-force attempts.

**Learning:** Simple capping of search results (as seen in previous PRs) causes functional regressions for large tenants. A robust fix combines $O(1)$ database lookups (using `cardId`) with Redis-based rate limiting to eliminate the computational cost and mitigate brute-force risks simultaneously.

**Prevention:**
- Always prefer unique identifiers (like `cardId`, `badgeId`, or `email`) for initial lookups to ensure authentication logic is $O(1)$ relative to the number of users.
- Implement per-organization or per-device rate limiting for all PIN/password validation endpoints to protect against DoS and brute-force attacks.
- Synchronize security hardening across duplicated or similar services (e.g., `V3AuthService` and `V3AuthCoreService`) to prevent architectural gaps.

## 2026-06-23 - [Hardened Scryme Integration and Fixed Internal Fetch Loopback]
**Vulnerability:** 1) Insecure Direct Object Reference (IDOR) in `ScrymeApprovalService` endpoints (`notify`, etc.) where `requestId` was not checked against the requester's `organizationId`. 2) Authentication bypass via internal HTTP `fetch` calls using `PUBLIC_API_URL` to trigger side effects from webhooks. 3) Missing authorization on sensitive workspace provisioning endpoints.

**Learning:** Internal loopbacks via HTTP `fetch` are both a performance anti-pattern and a security risk, as they often attempt to bypass global guards or rely on "trusted" internal URLs. Additionally, Prisma's `findUnique` is strictly for primary keys or unique indices; adding additional filters like `organizationId` requires `findFirst` to avoid runtime failures.

**Prevention:**
- Always inject services directly for internal communication instead of calling the API via HTTP.
- Ensure every database lookup for multi-tenant data includes the `organizationId` filter.
- Use `findFirst` for lookups involving both a primary key and a tenant ID.
- Fail-securely for webhooks in production if signature verification secrets are missing.

## 2026-06-24 - [Enforced Windmill Webhook Signature Verification]
**Vulnerability:** The `WindmillCallbackController` in V3 API exposed public endpoints for automation callbacks (approvals, batch disposal, etc.) without any authentication or signature verification. An attacker could spoof callbacks to approve unauthorized expenses or manipulate inventory status.

**Learning:** Replicating V2 patterns (like M-Pesa or Scryme) in V3 often misses critical security middlewares or manual checks if not explicitly included in the new architecture's decorators.

**Prevention:**
- Always implement HMAC-SHA256 signature verification for any webhook or callback endpoint.
- Use `crypto.timingSafeEqual` for signature comparisons to prevent timing attacks.
- Enforce strict "fail-secure" behavior in production: reject requests if the verification secret is missing from the configuration.
