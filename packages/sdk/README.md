# Scryme V3 Enterprise TypeScript SDK

The official Enterprise TypeScript SDK for the **Scryme V3 Platform API**—engineered for high-throughput microservices, edge runtimes, modern frontend frameworks, and server-side automation.

👉 **Documentation**: [https://docs.scryme.tech](https://docs.scryme.tech)

---

## ⚡ Enterprise Features

- **Universal Edge Transport**: Built on native `fetch` with zero networking dependencies. Runs natively in Node.js 18+, Bun, Deno, Cloudflare Workers, Vercel Edge Runtime, and modern browsers.
- **Resilience & Auto-Retry with Jitter**: Built-in exponential backoff with full decorrelated jitter for transient network failures, 5xx server issues, and 429 rate limits, with automatic respect for `Retry-After` headers.
- **Typed Error Hierarchy**: Granular error types (`ScrymeError`, `ScrymeApiError`, `AuthenticationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `InternalServerError`, `NetworkError`, `TimeoutError`) with HTTP status, request IDs, and structured payloads.
- **Idempotency Support**: Built-in `Idempotency-Key` headers for safe transactions, payments, and mutation deduplication.
- **Auto-Pagination Async Iterators**: First-class async generators (`autoPaging`, `listAutoPagingToArray`) for frictionless iteration over paginated collections without manual offset math.
- **Timing-Safe Webhook Verification**: Cryptographic HMAC-SHA256 signature verification utility preventing timing attacks in Node, browser, and edge runtimes.
- **Dedicated React Export**: Clean React integration via `@scryme/sdk/react` (`ScrymeProvider`, `useSession`, `useScryme`).
- **First-Class AbortSignal & Cancellation**: Pass `signal?: AbortSignal` or configure granular request timeouts (`timeout?: number`).
- **Pluggable Telemetry & Logging**: Configurable `logger` and lifecycle hooks (`onRequest`, `onResponse`, `onError`).

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
});

// Create product with automatic retry and error mapping
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

## 🔄 Auto-Pagination

Iterate through high-volume collections using async iterators without manual page tracking:

```typescript
// Async iterable: memory-efficient streaming of items
for await (const product of scryme.catalog.listAutoPaging({ limit: 100 })) {
  console.log(`Product: ${product.name} - $${product.price}`);
}

// Or fetch all items directly into an array
const allProducts = await scryme.catalog.listAutoPagingToArray({ limit: 50 });
```

---

## 🛡️ Structured Error Handling

All failed API requests reject with typed error instances:

```typescript
import {
  ScrymeApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
} from "@scryme/sdk";

try {
  await scryme.orders.getOrder("ord_99999");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.warn(`Rate limited! Retry after ${error.retryAfter}s`);
  } else if (error instanceof NotFoundError) {
    console.error("Order not found");
  } else if (error instanceof AuthenticationError) {
    console.error("Invalid credentials or expired session");
  } else if (error instanceof TimeoutError) {
    console.error(`Request timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof ScrymeApiError) {
    console.error(`API Error ${error.status}: ${error.message} (Request ID: ${error.requestId})`);
  } else {
    console.error("Network or unexpected error:", error);
  }
}
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
| `baseURL` | `string` | Custom API base URL (default: `https://api.scryme.tech`). |
| `token` | `string` | Bearer token for server authentication. |
| `timeout` | `number` | Request timeout in milliseconds (default: `30000`). |
| `retry` | `RetryOptions` | Retry policy configuration (`maxRetries`, `initialDelayMs`, `maxDelayMs`, `backoffFactor`). |
| `fetch` | `typeof fetch` | Custom fetch function injection for test mocks or proxies. |
| `logger` | `Logger` | Custom logger implementing `debug`, `info`, `warn`, `error`. |
| `onRequest` | `Function` | Hook called before dispatching each HTTP request. |
| `onResponse` | `Function` | Hook called upon receiving a response. |
| `onError` | `Function` | Hook called when a request encounters an error. |

---

## 🧪 Testing

```bash
pnpm --filter @scryme/sdk test
```
