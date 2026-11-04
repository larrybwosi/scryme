# 0021. Enterprise SDK Modernization & Universal Runtime Architecture

**Date**: 2026-11-04
**Status**: Accepted

## Summary

This specification defines the modernization of `@scryme/sdk` to full enterprise standards using modern TypeScript patterns and universal web standards. The SDK migrates from a legacy Axios-coupled network layer to a zero-dependency, universal Fetch-based transport with full edge compatibility (Node.js 18+, Bun, Deno, Cloudflare Workers, Next.js Server Components, and browsers). It introduces an enterprise developer experience (DX) suite including typed error hierarchies, automatic retry with jitter, idempotency key generation, auto-pagination async iterators, request cancellation via AbortSignal, lifecycle telemetry hooks, timing-safe webhook HMAC verification, dedicated React exports, and a Vitest-powered test pipeline.

## Context

The initial implementation of `@scryme/sdk` relied on Axios and Orval code generation. While functional for basic REST calls, this architecture presented several enterprise drawbacks:
1. **Runtime Lock-in**: Axios depends on Node HTTP adapters and XMLHttpRequest, adding bundle bloat and causing compatibility frictions in Edge runtime environments (Cloudflare Workers, Vercel Edge Runtime, Deno, Bun).
2. **Missing Enterprise DX**: Enterprise developers integrating large-scale storefronts, payment workflows, and backend workers require robust retry policies (exponential backoff with jitter for 429 and 5xx errors), automatic `Idempotency-Key` headers for financial/order mutations, rich typed errors, request cancellation via `AbortSignal`, and auto-pagination helpers.
3. **Security & Cryptography**: Handling webhook notifications requires secure, constant-time signature verification to prevent timing attacks, which was absent from the SDK.
4. **Export Cleanliness**: React hooks were entangled directly inside client SDK source code rather than cleanly partitioned under dedicated export subpaths (`@scryme/sdk/react`).
5. **Testing & Tooling**: Testing was constrained to legacy Jest + ts-jest instead of modern ESM Vitest tooling used throughout modern monorepos.

By modernizing `@scryme/sdk`, developers gain a best-in-class TypeScript client comparable to Stripe, Resend, and OpenAI SDKs.

## Requirements

**User stories**:
- As a frontend engineer building Next.js or React storefronts, I want universal fetch support, structured errors, and dedicated React hooks so that my client bundle is minimal, fast, and edge-ready.
- As a backend engineer processing payments and orders, I want automatic idempotency, request retries with jitter, and timing-safe webhook verification so that my system is resilient against transient failures and network drops.
- As an enterprise platform integrator, I want auto-pagination async iterators, lifecycle observability hooks, and custom fetch injection so that I can monitor and control API traffic seamlessly.

**Acceptance criteria**:
- **AC-1 (Universal Transport)**: Core HTTP transport must use standard global `fetch` with zero external networking dependencies, supporting custom `fetch` injection for proxying or test mocking.
- **AC-2 (Typed Error Hierarchy)**: All non-2xx responses and network failures must map into a structured error hierarchy (`ScrymeError`, `ScrymeApiError`, `AuthenticationError`, `RateLimitError`, `NetworkError`, `TimeoutError`) exposing HTTP status, request ID, error code, and error details.
- **AC-3 (Resilience & Retries)**: Built-in configurable retry middleware using exponential backoff with full jitter for status codes `408`, `429`, `500`, `502`, `503`, and `504`, respecting the `Retry-After` header when present.
- **AC-4 (Idempotency)**: Mutating requests (POST, PUT, PATCH, DELETE) support automatic or explicit `Idempotency-Key` headers.
- **AC-5 (Cancellation & Timeouts)**: Every request supports timeout limits via `AbortSignal.timeout` and user-provided `signal?: AbortSignal` for early cancellation.
- **AC-6 (Auto-Pagination)**: Paginated endpoints expose an async iterator helper (`autoPaging`) enabling `for await (const item of client.products.listAutoPaging(...))` and `autoPagingToArray`.
- **AC-7 (Pluggable Observability)**: SDK instances accept a `logger` interface (`debug`, `info`, `warn`, `error`) and request/response lifecycle hooks (`onRequest`, `onResponse`, `onError`).
- **AC-8 (Timing-Safe Webhook Verification)**: Webhooks utility provides `verifySignature(rawBody, signature, secret, toleranceInSeconds)` using constant-time comparisons (`crypto.timingSafeEqual` in Node / Web Crypto in browser/edge).
- **AC-9 (React Modularization)**: Dedicated `@scryme/sdk/react` subpath export provides `useSession`, `SessionProvider`, and auth state reactivity.
- **AC-10 (Vitest Pipeline)**: Package test suite executes natively with `vitest` covering all enterprise capabilities.

## Architecture & Design

### 1. Universal Fetch Transport & Middleware Pipeline
```
[User SDK Call]
       │
       ▼
[Client / Server SDK Submodule]
       │
       ▼
[HttpClient Middleware Stack]
   ├── 1. Request Preparation (Auth Bearer, Idempotency-Key, Headers, Tracing)
   ├── 2. Lifecycle Hook: onRequest
   ├── 3. Execution (fetch + AbortSignal / Timeout)
   ├── 4. Transient Error Detection & Retry with Jitter (Backoff / Retry-After)
   ├── 5. Lifecycle Hook: onResponse / onError
   └── 6. Response Parsing & Error Hierarchy Mapping
       │
       ▼
[Structured Response / Typed Error]
```

### 2. Error Hierarchy
```
ScrymeError (base)
 ├── ScrymeApiError (status, code, details, requestId)
 │    ├── AuthenticationError (401 / 403)
 │    ├── NotFoundError (404)
 │    ├── ConflictError (409)
 │    ├── RateLimitError (429, retryAfter)
 │    └── InternalServerError (5xx)
 ├── NetworkError (DNS failure, connection dropped)
 └── TimeoutError (Request timed out)
```

### 3. Package Exports & Entrypoints
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "import": "./dist/client.mjs",
      "require": "./dist/client.js"
    },
    "./server": {
      "types": "./dist/server.d.ts",
      "import": "./dist/server.mjs",
      "require": "./dist/server.js"
    },
    "./react": {
      "types": "./dist/react.d.ts",
      "import": "./dist/react.mjs",
      "require": "./dist/react.js"
    }
  }
}
```

## Options Considered

### Option 1: Retain Axios with Axios Interceptors
- **Pros**: Keeps existing Orval-generated Axios client intact.
- **Cons**: Adds Node-specific dependencies, bloats browser bundles, creates friction on Cloudflare Workers and Edge runtimes, lacking modern streaming and web standard primitives.

### Option 2: Universal Fetch Transport with Enterprise Middleware Stack (Selected)
- **Pros**: Zero runtime networking dependencies, 100% universal runtime compatibility, native AbortSignal support, custom fetch injection, modern enterprise error and retry ergonomics.
- **Cons**: Requires custom HTTP engine and Orval/model alignment, which is fully addressed in this upgrade.

## Build Plan

1. **Core Network Layer**: Implement `src/http.ts`, `src/errors.ts`, `src/retry.ts`, and `src/pagination.ts`.
2. **Enterprise Utilities**: Implement `src/webhooks.ts` with timing-safe HMAC verification and `src/logger.ts`.
3. **Submodule Architecture**: Modernize `src/base.ts`, `src/client.ts`, `src/server.ts`, and `src/index.ts`.
4. **React Subpath**: Create `src/react.tsx` for React hooks and context.
5. **Tooling & Build**: Configure `vitest.config.ts`, `tsup.config.ts`, and `package.json` scripts/exports.
6. **Testing**: Write comprehensive Vitest test suites verifying network handling, retries, errors, auto-pagination, webhooks, and client/server workflows.
7. **Documentation**: Revamp `README.md` with enterprise code recipes.
