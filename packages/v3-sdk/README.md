# Scryme V3 SDK

The official TypeScript SDK for the **Scryme V3 API**—engineered for scalability, security, and developer convenience. This SDK provides complete, type-safe coverage of all Scryme V3 services, allowing developers to seamlessly integrate their applications with the Scryme ecosystem.

For the complete, interactive documentation, live sandbox playgrounds, and detailed OpenAPI schemas, please visit our documentation portal:
👉 **[https://docs.scryme.tech](https://docs.scryme.tech)**

## 🚀 Features

- **End-to-End Type Safety**: Direct compilation from the core OpenAPI 3.0 specification.
- **Axios-Based Client**: Built-in support for request/response interceptors, customizable base URLs, and timeout configurations.
- **Strictly Isolated Client & Server SDKs**: Prevents request state and session pollution in multi-tenant environments.
- **Comprehensive API Coverage**:
  - **Auth**: Token exchange (Client Credentials Flow) & OAuth2 proxy support.
  - **Inventory**: Stock queries, multi-branch listings, batch tracking (trace, split, merge), B2B availability checks, and integrity verify/fix logic.
  - **Orders & B2B**: Quote requests, quote-to-order conversions, and order management.
  - **CRM & Customers**: Customer registration, custom CRM definitions, custom fields, relationships, associations, notes, and activity timelines.
  - **Loyalty**: Loyalty status (tiers & points), voucher validation, and reward redemption.
  - **Finance**: Corporate expenses, utility account tracking, and petty cash fund management (allocations, transactions, top-ups).
  - **POS**: POS device provisioning, staff login, and petty cash expense logging.
  - **Members & Roles**: Staff rosters, custom roles, permission sets, departments, and attendance logging (check-in/check-out).
  - **Services & Bookings**: Resource utilization, booking funnel, public-facing OTP-verified booking, shifts, and materials consumption.
  - **Integrations & Webhooks**: Subscription management and Strapi E-commerce integration (storefront customer registration, storefront token exchange, sync queues).

---

## 📦 Installation

To use the Scryme V3 SDK in your project, install it from the workspace repository:

```bash
pnpm add @scryme/sdk
```

---

## 🔑 Client & Server SDK Isolation

The SDK supports distinct, fully isolated client-side and server-side setup options to prevent request state and session pollution in multi-tenant environments.

### 🌐 Server-Side Setup (`@scryme/sdk/server`)
Strictly isolates requests and Axios instances. Ideal for Next.js API routes, edge functions, backend microservices, or Windmill workflows.

#### Class-Based Constructor (`ScrymeServerSDK`)
Requires `clientId`, `clientSecret`, and `orgSlug` strictly to initialize correctly:

```typescript
import { ScrymeServerSDK } from "@scryme/sdk/server";

const scrymeServer = new ScrymeServerSDK({
  baseURL: "https://api.scryme.tech",
  orgSlug: "your-org-slug", // Automatic orgSlug injection on all API calls!
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});

async function run() {
  // 1. Call APIs directly—the SDK handles token retrieval, refresh, and auto-injection of orgSlug automatically!
  const products = await scrymeServer.catalog.getProducts({ limit: 10 });
  console.log("Server Products:", products.data);
}
```

Or use the helper factory `createServerSDK`, which provides fallback defaults:

```typescript
import { createServerSDK } from "@scryme/sdk/server";

const scrymeServer = createServerSDK({
  baseURL: "https://api.scryme.tech",
  orgSlug: "your-org-slug",
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});
```

### 📱 Client-Side Setup (`@scryme/sdk/client`)
Provides stateful and reactive state persistence (localStorage / StorageProviders) with login listeners and automatic session recoveries.

#### Class-Based Constructor (`ScrymeClientSDK`)
Requires `clientId`, `clientSecret`, and `orgSlug` strictly to initialize correctly:

```typescript
import { ScrymeClientSDK } from "@scryme/sdk/client";

const scrymeClient = new ScrymeClientSDK({
  orgSlug: "your-org-slug",
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});

// Reactively listen to auth state changes
scrymeClient.auth.onAuthStateChange((event, session) => {
  console.log(`Auth Event: ${event}`, session);
});

async function runClient() {
  // Call APIs directly—the SDK handles token retrieval, refresh, and auto-injection of orgSlug automatically!
  const stock = await scrymeClient.inventory.getInventory({ limit: 5 });
  console.log("Client Stock:", stock.data);
}
```

Or use the helper factory `createClientSDK`, which provides fallback defaults:

```typescript
import { createClientSDK } from "@scryme/sdk/client";

const scrymeClient = createClientSDK({
  orgSlug: "your-org-slug",
  clientId: "your_client_id_123",
  clientSecret: "your_client_secret_456",
});
```

---

## 🔑 Global / Legacy API client (`getScrymeV3API`)

Alternatively, if you prefer utilizing a global request client or overriding behavior manually, you can initialize the custom Orval proxy with `getScrymeV3API`. It supports optional auto-injection of `orgSlug` from environment variables (`SCRYME_ORG_SLUG`, etc.) or custom default configurations.

### Complete Initialization Example:

```typescript
import { getScrymeV3API } from "@scryme/sdk";
import axios from "axios";

// 1. Initialize the API instance (optionally passing a custom Axios instance)
const apiBaseUrl = process.env.SCRYME_API_URL || "https://api.scryme.tech";
axios.defaults.baseURL = apiBaseUrl;

const scryme = getScrymeV3API(axios);

async function runFlow() {
  try {
    // 2. Perform Client Credentials flow to retrieve access token
    const tokenResponse = await scryme.authExchangeToken({
      clientId: process.env.SCRYME_CLIENT_ID || "your_id",
      clientSecret: process.env.SCRYME_CLIENT_SECRET || "your_secret"
    });

    const accessToken = tokenResponse.data.accessToken;
    console.log("Successfully logged in! Token retrieved.");

    // 3. Register the token in the Axios headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    // 4. Perform type-safe V3 operations (orgSlug is auto-injected from environment!)
    const products = await scryme.catalogGetProducts({ limit: 10 });
    console.log("Catalog Products:", products.data);
  } catch (error) {
    console.error("SDK execution failed:", error);
  }
}
```

For more domain examples, detailed schemas, and active playgrounds, head over to:
👉 **[docs.scryme.tech](https://docs.scryme.tech)**

---

## 🔒 Best Practices

### Multi-tenant Organization Scoping
All core resources are strictly isolated by organization. Ensure you always pass the correct `orgSlug` parameter as required by the endpoints. Passing an invalid or unauthorized `orgSlug` will yield a `401 Unauthorized` or `404 Not Found` response.

### Secure Webhook Verification
When receiving webhook callbacks from Scryme, always verify the webhook signature before processing the payload to prevent spoofing attacks.

```typescript
import * as crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  // Generate the expected HMAC signature
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const expectedSignature = hmac.update(payload).digest("hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
```

### Robust Error Handling
Scryme V3 API returns standardized error structures. Always wrap your SDK calls in `try/catch` blocks and parse the error fields to display helpful messages to users.

```typescript
import { isAxiosError } from "axios";

try {
  await scrymeClient.inventory.getInventory({ limit: 5 });
} catch (error) {
  if (isAxiosError(error) && error.response) {
    const apiError = error.response.data;
    console.error(`Error (${apiError.error.code}): ${apiError.error.message}`);
    console.error("Details:", apiError.error.details);
  } else {
    console.error("Unexpected Error:", error);
  }
}
```

---

## 📄 License

This package is licensed under the GNU Affero General Public License version 3 (AGPL-3.0). Please see the [LICENSE](../../LICENSE) file for more details.
