# Scryme V3 Enterprise TypeScript SDK

The official Enterprise TypeScript SDK for the **Scryme V3 Platform API**—engineered for high-throughput microservices, edge runtimes, modern frontend frameworks, and server-side automation.

👉 **Documentation**: [https://docs.scryme.tech](https://docs.scryme.tech)

---

## ⚡ Enterprise Features

- **Universal Edge Transport**: Built on native `fetch` with zero networking dependencies. Runs natively in Node.js 18+, Bun, Deno, Cloudflare Workers, Vercel Edge Runtime, and modern browsers.
- **Resilience & Auto-Retry with Jitter**: Built-in exponential backoff with full decorrelated jitter for transient network failures, 5xx server issues, and 429 rate limits, with automatic respect for `Retry-After` headers.
- **Circuit Breaker Protection**: Built-in fast-failing circuit breaker pattern (`CLOSED` / `OPEN` / `HALF_OPEN`) to protect upstream systems and avoid cascading failures during sustained outages.
- **In-Memory TTL & LRU Caching**: Configurable client-side response cache with TTL and LRU eviction for idempotent reads, minimizing redundant roundtrips.
- **Automatic Idempotency Key Generation**: Automatic UUID v4 injection for mutating requests (`POST`, `PUT`, `PATCH`) to safeguard against duplicate operations and network replay hazards.
- **Sensitive Data Redaction & Masking**: Automatic credential masking for tokens, secrets, passwords, cookies, and keys in logs, headers, and error representations.
- **Strict Transport Security**: Enforces HTTPS for remote environments, permitting HTTP strictly for loopback interfaces (`localhost`, `127.0.0.1`, `::1`) or via explicit bypass.
- **Minification & Tree-Shaking Safe**: Static arity mapping and `sideEffects: false` metadata guaranteeing predictable routing and lean client bundles under esbuild, Vite, Rollup, and Webpack.
- **Typed Error Hierarchy**: Granular error types (`ScrymeError`, `SecurityError`, `CircuitBreakerError`, `ScrymeApiError`, `AuthenticationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `InternalServerError`, `NetworkError`, `TimeoutError`) with HTTP status, request IDs, and structured payloads.
- **Auto-Pagination Async Iterators**: First-class async generators (`autoPaging`, `listAutoPagingToArray`) for frictionless iteration over paginated collections without manual offset math.
- **Timing-Safe Webhook Verification**: Cryptographic HMAC-SHA256 signature verification utility preventing timing attacks in Node, browser, and edge runtimes.
- **Dedicated React Export**: Clean React integration via `@scryme/sdk/react` (`ScrymeProvider`, `useSession`, `useScryme`).
- **First-Class AbortSignal & Cancellation**: Pass `signal?: AbortSignal` or configure granular request timeouts (`timeout?: number`).
- **Pluggable Telemetry & Logging**: Configurable `logger` with telemetry header injection (`X-Client-Info`) and lifecycle hooks (`onRequest`, `onResponse`, `onError`).

---

## 📦 Installation

```bash
pnpm add @scryme/sdk
# or
npm install @scryme/sdk
# or
yarn add @scryme/sdk
```

---

## 🏗 Client & Server Subpaths

The SDK provides cleanly partitioned subpaths to avoid session state pollution:
- `@scryme/sdk/client`: Client-side SDK with session persistence (`localStorage` or custom `StorageProvider`).
- `@scryme/sdk/server`: Server-side SDK for backend services, jobs, and server actions.
- `@scryme/sdk/react`: React providers and hooks for frontend storefronts and portals.
- `@scryme/sdk`: Core exports, errors, types, and utilities.

---

## 🚀 Quickstart: Server SDK

```typescript
import { createServerSDK } from "@scryme/sdk/server";

const scryme = createServerSDK({
  orgSlug: "acme-corp",
  token: process.env.SCRYME_API_TOKEN,
  timeout: 10000,
  retry: {
    maxRetries: 3,
    initialDelayMs: 200,
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  },
  cache: {
    enabled: true,
    ttlMs: 60000,
  },
});

// Create product with automatic idempotency key, retry, and error mapping
const product = await scryme.catalog.createProduct({
  name: "Premium Roast Coffee",
  price: 24.5,
  sku: "COF-ROAST-01",
});
```

---

## 🛒 Quickstart: Client SDK & React

### 1. Initialize Client SDK
```typescript
// lib/scryme.ts
import { createClientSDK } from "@scryme/sdk/client";

export const scrymeClient = createClientSDK({
  orgSlug: "acme-storefront",
  clientId: process.env.NEXT_PUBLIC_SCRYME_CLIENT_ID,
  cache: {
    enabled: true,
    ttlMs: 30000,
  },
});
```

### 2. React Provider & Hooks
```tsx
// app/providers.tsx
"use client";

import { ScrymeProvider, useSession } from "@scryme/sdk/react";
import { scrymeClient } from "@/lib/scryme";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ScrymeProvider client={scrymeClient}>{children}</ScrymeProvider>;
}

export function UserNav() {
  const { data, isPending } = useSession();

  if (isPending) return <div>Loading session...</div>;
  if (!data?.user) return <a href="/login">Sign In</a>;

  return <div>Welcome, {data.user.name}</div>;
}
```

---

## 🛡️ Circuit Breaker & Resilient Outage Protection

Prevent cascading downstream failures during API degradation:

```typescript
import { createServerSDK, CircuitBreakerError } from "@scryme/sdk";

const scryme = createServerSDK({
  orgSlug: "acme-corp",
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5, // Trips open after 5 consecutive 5xx failures
    resetTimeoutMs: 30000, // Waits 30s before testing probe requests
  },
});

try {
  await scryme.catalog.getProducts();
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    console.warn(`Circuit breaker is OPEN. Fast-failing: ${error.cooldownMs}ms remaining.`);
  }
}
```

---

## 🔄 In-Memory Caching

Enable TTL & LRU caching for read requests with per-request bypass:

```typescript
const scryme = createClientSDK({
  orgSlug: "acme-storefront",
  cache: {
    enabled: true,
    ttlMs: 60000, // Cache GET responses for 1 minute
    maxEntries: 500, // Evict oldest via LRU
  },
});

// Read from cache
const categories = await scryme.catalog.getServiceCategories();

// Bypass cache dynamically for real-time reads
const liveCategories = await scryme.catalog.getServiceCategories(undefined, { skipCache: true } as any);
```

---

## 🔐 Webhook Signature Verification

Verify inbound webhooks with timing-safe HMAC-SHA256 comparisons:

```typescript
import { verifyWebhookSignature, WebhookVerificationError } from "@scryme/sdk";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-scryme-signature")!;
  const secret = process.env.SCRYME_WEBHOOK_SECRET!;

  try {
    await verifyWebhookSignature(rawBody, signature, secret, 300); // 300s timestamp tolerance
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return new Response("Invalid webhook signature", { status: 400 });
    }
    return new Response("Internal error", { status: 500 });
  }

  const event = JSON.parse(rawBody);
  console.log("Processed webhook event:", event.type);
  return new Response("OK", { status: 200 });
}
```

---

## ⚙️ Universal Configuration Options

| Option | Type | Description |
|---|---|---|
| `orgSlug` | `string` | **Required**. Multi-tenant organization slug. |
| `baseURL` | `string` | Custom API base URL (default: `https://api.scryme.tech`). Validates HTTPS for non-loopback domains. |
| `token` | `string` | Bearer token for server authentication. |
| `timeout` | `number` | Request timeout in milliseconds (default: `30000`). |
| `retry` | `RetryOptions` | Retry policy configuration (`maxRetries`, `initialDelayMs`, `maxDelayMs`, `backoffFactor`). |
| `circuitBreaker` | `CircuitBreakerOptions` | Circuit breaker options (`enabled`, `failureThreshold`, `resetTimeoutMs`). |
| `cache` | `CacheOptions` | In-memory response caching (`enabled`, `ttlMs`, `maxEntries`). |
| `idempotency` | `Object` | Automatic `Idempotency-Key` generation (`autoGenerate?: boolean`, default: `true`). |
| `allowInsecureHttp` | `boolean` | Allows non-HTTPS connections for remote test servers (default: `false`). |
| `fetch` | `typeof fetch` | Custom fetch function injection for test mocks or proxies. |
| `logger` | `Logger` | Custom logger implementing `debug`, `info`, `warn`, `error`. Automatically sanitizes sensitive keys. |
| `onRequest` | `Function` | Hook called before dispatching each HTTP request. |
| `onResponse` | `Function` | Hook called upon receiving a response. |
| `onError` | `Function` | Hook called when a request encounters an error. |

---

## 🧪 Testing

```bash
pnpm --filter @scryme/sdk test
```
