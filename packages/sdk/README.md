# Scryme V3 SDK

The official TypeScript SDK for the **Scryme V3 API**—engineered for scalability, security, type safety, and developer convenience. This SDK provides complete, type-safe coverage of all Scryme V3 services, allowing developers to seamlessly integrate storefronts, mobile apps, connected applications, and server-side workflows with the Scryme ecosystem.

For the complete, interactive documentation, live sandbox playgrounds, and detailed OpenAPI schemas, please visit our documentation portal:
👉 **[https://docs.scryme.tech](https://docs.scryme.tech)**

---

## 🚀 Features

- **End-to-End Type Safety**: Direct compilation from the core OpenAPI 3.0 specification.
- **Strictly Isolated Client & Server SDKs**: Prevents request state and session pollution in multi-tenant environments.
- **Stateful Customer Engine & Auth**: Full support for customer registration (`signUp`), credential sign-in (`signIn`), proactive/reactive token refresh, active session tracking, multi-session revocation, and reactive React hooks (`useSession`).
- **Stateful Shopping Cart**: Dynamic `customerId` resolution, automatic line item difference calculations (`cart.update`), totals metrics, guest-to-customer cart deep-merging (`mergeGuestCart`), and multi-location checkout.
- **Axios-Based Network Layer**: Interceptor-based automatic token exchange, proactive/reactive expiration handling, and multi-tenant `orgSlug` auto-injection.
- **Comprehensive Domain Coverage**:
  - **Auth & Customer Engine**: Customer login, token refresh, active session management, address directory, and client credentials flow.
  - **Catalog & Services**: Products, services, CMS customizations, product reviews with auto-resolved customer context, service categories, resources, availability slots, and public OTP booking flows.
  - **Orders & Cart**: Stateful shopping cart, sales orders, quote requests, B2B quotes, STK push payments, and checkout.
  - **Inventory**: Stock queries, multi-branch listings, batch tracking (trace, split, merge), B2B availability checks, physical reconciliation, assemblies, and lead time/waste analysis.
  - **CRM**: Custom CRM record definitions, custom fields, relationships, associations, notes logging, and timeline activities.
  - **Loyalty**: Loyalty status (tiers & points), voucher validation, customer favorites, and reward redemption.
  - **Finance & Accounting**: Invoices, corporate expenses, utility account tracking, petty cash funds, Profit & Loss reports, balance sheets, and cash flow analysis.
  - **POS**: POS device provisioning, standalone POS keys, staff login, terminal sync, and petty cash expense logging.
  - **Members & Roles**: Staff rosters, custom roles, permission sets, departments, invitations, and attendance logging (check-in/check-out).
  - **Integrations & Webhooks**: Subscription management, Strapi E-commerce integration, and Windmill workflow callback orchestration.

---

## 📦 Installation

Install `@scryme/sdk` into your project:

```bash
pnpm add @scryme/sdk
# or
npm install @scryme/sdk
# or
yarn add @scryme/sdk
```

---

## 🔑 Client & Server SDK Architecture

The SDK provides distinct, fully isolated client-side (`@scryme/sdk/client`) and server-side (`@scryme/sdk/server`) constructors to prevent request state and session pollution in multi-tenant environments.

---

## 📱 Client-Side Setup (`@scryme/sdk/client`)

The `ScrymeClientSDK` provides stateful session persistence (`localStorage` or custom `StorageProvider`), reactive auth event listeners, and stateful customer cart operations.

### Initialization

```typescript
import { ScrymeClientSDK, createClientSDK } from "@scryme/sdk/client";

// Class-based constructor
const scrymeClient = new ScrymeClientSDK({
  clientId: "storefront_client_id",
  orgSlug: "my-organization",
  baseURL: "https://api.scryme.tech", // Optional, defaults to https://api.scryme.tech
});

// Or using factory helper
const scrymeClientAlt = createClientSDK({
  clientId: "storefront_client_id",
  orgSlug: "my-organization",
});
```

---

## 👤 Customer Authentication & Session Engine (`scrymeClient.customer.auth`)

`ScrymeClientSDK` includes a stateful Customer Authentication engine that manages customer login credentials, local session storage, JWT auto-refresh, active session tracking, and reactive UI hooks.

### Customer Registration & Sign-Up (`signUp`)

Registers a new customer profile. If a `password` is provided, `signUp` automatically signs the customer in and initializes an active customer session:

```typescript
const response = await scrymeClient.customer.auth.signUp({
  name: "Jane Smith",
  email: "jane.smith@example.com",
  password: "securepassword123", // Establishes customer login credentials
  phone: "+254700000123",
  company: "Acme Commerce Inc",
  customerType: "B2B_PREMIUM",
  taxId: "PIN-KRA-123456",
  address: {
    label: "Headquarters",
    street1: "123 Commercial Way",
    city: "Nairobi",
    country: "Kenya",
    isDefault: true,
  },
});

console.log("Customer registered:", response.data);
```

### Customer Sign-In (`signIn`)

Authenticates a customer using email and password, starting an active session in Redis, saving the JWT token to storage, and firing a `SIGNED_IN` event:

```typescript
try {
  const authResponse = await scrymeClient.customer.auth.signIn({
    email: "jane.smith@example.com",
    password: "securepassword123",
  });

  console.log("Bearer Token:", authResponse.token);
  console.log("Session Metadata:", authResponse.session);
  console.log("Customer Profile:", authResponse.user);
} catch (error) {
  console.error("Login failed:", error);
}
```

### Sign-Out (`signOut`)

Clears persisted session tokens, resets memory state, and fires a `SIGNED_OUT` event:

```typescript
await scrymeClient.customer.auth.signOut();
```

### Session Refresh & Inspection

```typescript
// Explicitly refresh the current customer session
const freshSession = await scrymeClient.customer.auth.refreshSession();

// Get internal session state synchronously/asynchronously
const sessionState = await scrymeClient.customer.auth.getSession();
console.log("Token:", sessionState.token);
console.log("Active User:", sessionState.user);

// Listen for authentication state changes (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION)
const { unsubscribe } = scrymeClient.customer.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state event: ${event}`, session);
});
// Clean up listener when done
unsubscribe();
```

### Concurrent Session Revocation

Customers can view and destroy active sessions across devices:

```typescript
// List all active concurrent sessions
const sessions = await scrymeClient.customer.auth.getSessions();
console.log("Active sessions count:", sessions.length);

// Revoke a specific session by ID
await scrymeClient.customer.auth.revokeSession("sess_abc12345");

// Revoke all other sessions except the active one
await scrymeClient.customer.auth.revokeAllSessions("other");

// Revoke all sessions
await scrymeClient.customer.auth.revokeAllSessions();
```

### Reactive React Hook (`useSession`)

React storefront components can use `useSession` for immediate, real-time synchronization with customer authentication state:

```tsx
import React from "react";
import { scrymeClient } from "./scryme";

export function UserProfileHeader() {
  const { data, isPending, error, refetch } = scrymeClient.customer.auth.useSession();

  if (isPending) return <div>Loading customer session...</div>;
  if (error) return <div>Error loading session: {error.message}</div>;
  if (!data?.user) return <div>Welcome, Guest! <button onClick={() => scrymeClient.customer.auth.signIn(...)}>Sign In</button></div>;

  return (
    <div>
      <span>Welcome back, {data.user.name}!</span>
      <button onClick={() => scrymeClient.customer.auth.signOut()}>Sign Out</button>
    </div>
  );
}
```

---

## 👤 Customer Profile & Address Directory (`scrymeClient.customer`)

Manage the logged-in customer's profile details and address book:

```typescript
// Fetch current logged-in customer profile
const profile = await scrymeClient.customer.getProfile();
console.log("Profile:", profile);

// Update profile details
const updated = await scrymeClient.customer.updateProfile({
  phone: "+254799999999",
  company: "Acme Holdings Ltd",
});

// Manage saved addresses
const addresses = await scrymeClient.customer.getAddresses();
await scrymeClient.customer.addAddress({
  label: "Office Branch",
  street1: "45 Westlands Rd",
  city: "Nairobi",
  country: "Kenya",
  isDefault: false,
});
```

---

## 🛒 Stateful Shopping Cart Engine (`scrymeClient.cart`)

The SDK provides a stateful shopping cart submodule with automatic `customerId` resolution from active customer sessions, line item quantity delta calculation, and guest-to-customer cart deep merging.

### Dynamic `customerId` Resolution
For operations such as `cart.add`, `cart.remove`, `cart.update`, and `bookings.create`, the SDK automatically resolves `customerId` from the active user session (`user?.customerId || user?.id || user?.customer?.id`) if omitted from call arguments. If no authenticated customer session exists and no explicit `customerId` is passed, operations requiring customer context safely throw an error.

### Cart Mutations & Updates

```typescript
// 1. Fetch current active cart
const cartResponse = await scrymeClient.cart.get({ sessionId: "guest_session_123" });

// 2. Add product variant or service to cart
await scrymeClient.cart.add({
  productId: "prod_sourdough_bread",
  variantId: "var_large_500g",
  quantity: 2,
  sessionId: "guest_session_123", // Optional if customer is signed in
});

// 3. Smart quantity update (computes delta, calls add/remove appropriately)
await scrymeClient.cart.update({
  productId: "prod_sourdough_bread",
  variantId: "var_large_500g",
  quantity: 5, // Automatically increments by +3
});

// 4. Retrieve flat array of cart items
const items = await scrymeClient.cart.getItems();

// 5. Calculate summary metrics and total item count
const totals = await scrymeClient.cart.getTotals();
console.log("Total Items Count:", totals.itemsCount);
```

### Guest-to-Customer Cart Deep-Merging (`mergeGuestCart`)

When an anonymous guest customer signs in, call `mergeGuestCart` to aggregate their guest items into their permanent customer cart and clear the guest cart:

```typescript
// Sign in customer
await scrymeClient.customer.auth.signIn({
  email: "john@example.com",
  password: "password123",
});

// Merge guest cart items into customer cart
const mergedCart = await scrymeClient.cart.mergeGuestCart(
  "guest_session_123", // Guest session ID
  "cust_abc123"        // Target customer ID
);

console.log("Merged Cart Items:", mergedCart.data.items);
```

### Checkout & Sales Order Generation (`checkout`)

Converts the active shopping cart into an official enterprise Sales Order and deducts inventory at the target location:

```typescript
const order = await scrymeClient.cart.checkout({
  locationId: "loc_nairobi_main",
  notes: "Deliver before 2 PM",
  channel: "ONLINE_STOREFRONT",
});

console.log("Sales Order Created:", order.id);
```

---

## 🌐 Server-Side Setup (`@scryme/sdk/server`)

The `ScrymeServerSDK` strictly isolates requests and Axios instances for multi-tenant server environments (Next.js Server Components, API routes, Windmill workflows, backend services).

### Initialization

```typescript
import { ScrymeServerSDK, createServerSDK } from "@scryme/sdk/server";

const scrymeServer = new ScrymeServerSDK({
  baseURL: "https://api.scryme.tech",
  orgSlug: "my-organization",
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});

async function runServerFlow() {
  // Call APIs directly—the SDK handles Client Credentials token exchange and orgSlug auto-injection!
  const products = await scrymeServer.catalog.getProducts({ limit: 10 });
  const customers = await scrymeServer.admin.getCustomers({ limit: 20 });
  console.log("Products count:", products.data.length);
}
```

---

## 🔒 Best Practices & Security

### Multi-Tenant Organization Scoping
All domain resources are isolated by organization. The SDK automatically injects the configured `orgSlug` parameter into all API calls.

### Webhook Verification
When receiving webhooks from Scryme, verify payload HMAC signatures to prevent spoofing:

```typescript
import * as crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const expectedSignature = hmac.update(payload).digest("hex");

  // Pre-hash signatures to SHA-256 to guarantee equal length buffers and prevent timing attacks
  const expectedHash = crypto.createHash("sha256").update(expectedSignature).digest();
  const actualHash = crypto.createHash("sha256").update(signature || "").digest();

  return crypto.timingSafeEqual(expectedHash, actualHash);
}
```

---

## 📄 License

This package is licensed under the GNU Affero General Public License version 3 (AGPL-3.0). Please see the [LICENSE](../../LICENSE) file for details.
