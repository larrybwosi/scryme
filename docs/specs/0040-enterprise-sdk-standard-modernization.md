# 0040 · Enterprise SDK Standard Modernization

**Status**: In Progress
**Date**: 2025-05-18
**Author**: Engineering Team

## Summary

Upgrade `@scryme/sdk` to full industry standard SDK configurations, performance optimizations, and security hardening. This enhancement transitions the SDK to a resilient, production grade client with minification safe routing, sensitive payload redaction, in memory response caching, circuit breaker protection, automatic idempotency key handling, secure protocol enforcement, and telemetry headers.

## Context & Motivation

The `@scryme/sdk` powers storefronts, admin dashboards, third-party integrations, and edge handlers. While the SDK previously introduced universal fetch, auto-pagination, and timing-safe webhook verification, modern high-scale environments expose several gaps:
1. **Minification Hazard**: `proxy.ts` inspected function parameter names (`fn.toString().match(...)`) to detect `orgSlug` and count arguments. In bundled/minified downstream environments (Vite, Webpack, esbuild), mangled parameter names break method invocation or miscalculate parameter offsets.
2. **Security & Data Leaks**: Logging or unhandled error traces could expose sensitive credentials such as Bearer tokens, passwords, client secrets, and API keys.
3. **Insecure Transport**: Non-localhost environments could inadvertently point to unencrypted `http://` endpoints.
4. **Resilience & Cascading Failures**: Lack of a circuit breaker means that under severe API degradation or network partitioning, repeated requests can saturate client event loops and hammer the downstream server.
5. **Redundant Roundtrips**: Repeated idempotent reads (e.g. catalog lookups, configuration fetches) generate avoidable latency and network overhead without an in-memory TTL cache.
6. **Mutation Safety**: Mutating operations (POST, PUT, PATCH) should reliably enforce idempotency to prevent duplicate charges or conflicting state updates without forcing developers to implement manual UUID generation.

## Key Decisions

### 1. Minification-Safe Proxy Resolution
Replace runtime regex analysis of function argument strings with explicit, static schema knowledge:
- A predefined lookup map specifies the exact arity and whether each generated API function requires `orgSlug` as its leading argument.
- Minification and tree-shaking will not alter argument count checks or method dispatch.

### 2. Sensitive Data Redaction & Masking
Implement a universal sanitization engine:
- Scrub known sensitive headers: `Authorization`, `x-api-key`, `x-mcp-api-key`, `cookie`, `set-cookie`.
- Recursively sanitize object fields: `password`, `token`, `access_token`, `clientSecret`, `client_secret`, `secret`, `apiKey`, `key`.
- Apply sanitization across `HttpClient` logging, error objects (`ScrymeApiError`), and telemetry outputs.

### 3. Insecure HTTP Guard
Validate `baseUrl` at initialization and per-request:
- Enforce `https://` protocol unless target host is `localhost`, `127.0.0.1`, `[::1]`, or if explicitly opted-in via `allowInsecureHttp: true`.
- Throw typed `SecurityError` upon violation.

### 4. Circuit Breaker
Implement an in-memory circuit breaker state machine:
- States: `CLOSED` (normal operation), `OPEN` (fail-fast), `HALF_OPEN` (probe recovery).
- Configurable thresholds: `failureThreshold` (default: 5 consecutive 5xx errors), `resetTimeoutMs` (default: 30000ms).
- When open, requests reject immediately with `CircuitBreakerError` to conserve resources and avoid compounding downstream distress.

### 5. In-Memory TTL & LRU Caching
Implement a lightweight, zero-dependency in-memory cache for GET requests:
- Opt-in via `cache: { enabled: boolean, ttlMs?: number, maxEntries?: number }`.
- Keyed by normalized HTTP method, URL, and query parameters.
- Supports per-request cache bypassing (`skipCache: true` in request options) and explicit cache clearing.

### 6. Automatic Idempotency Key Generation
- For mutating HTTP requests (`POST`, `PUT`, `PATCH`), automatically populate the `Idempotency-Key` header with a cryptographically secure UUID v4 if not explicitly supplied.
- Enabled by default with option to disable via `idempotency: { autoGenerate: false }`.

### 7. Standardized Client Telemetry Headers
- Add `X-Client-Info: @scryme/sdk/10.2.45` and `User-Agent` (in runtimes where permitted without header injection).
- Sanitize custom header values to prevent CRLF injection.

### 8. Package & Tree-Shaking Configuration
- Add `"sideEffects": false` to `packages/sdk/package.json` to allow modern bundlers (Webpack, Vite, Rollup) to tree-shake unused exports cleanly.

## Build Plan

1. **Core Utilities & Errors**:
   - Add `SecurityError` and `CircuitBreakerError` to `errors.ts`.
   - Implement `sanitizeSensitiveData` in `logger.ts` or a dedicated security module.
   - Implement UUID generator and header validation utilities.
2. **Resilience Components**:
   - Implement `CircuitBreaker` class.
   - Implement `CacheManager` with TTL and LRU eviction.
3. **HTTP Client Upgrade**:
   - Integrate URL security check, sanitization, telemetry headers, circuit breaker, idempotency generation, and caching into `HttpClient`.
4. **Minification-Safe Proxy**:
   - Rewrite `proxy.ts` to utilize static arity and parameter lookups.
5. **Client & Server SDK Integration**:
   - Expose cache, circuit breaker, and security options in `ClientSDKConfig` and `ServerSDKConfig`.
6. **Verification & Testing**:
   - Expand unit test suite in `packages/sdk/src/__tests__/` to test each new capability.
   - Verify build and tests pass.
