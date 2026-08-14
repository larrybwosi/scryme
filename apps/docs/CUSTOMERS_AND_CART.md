# Scryme V3 Customer and Cart Management Developer Guide

This guide provides a comprehensive overview of **Customer CRUD (Create, Read, Update, Delete)** operations, **Customer Authentication / Single Sign-On (SSO)**, and **Stateful Shopping Cart** integrations using the Scryme V3 REST API and the official stateful TypeScript SDK (`@scryme/sdk`).

---

## 📖 Executive Summary

Providing custom storefronts and third-party integrations with robust, secure customer and checkout capabilities is a core pillar of the Scryme V3 architecture. This guide is designed to help developers construct frictionless e-commerce and member enrollment loops.

By leveraging the customer and cart services, developers can manage:
- **Multi-tenant Identity**: Link customers to local login credentials or federated Google accounts.
- **Full Customer CRUD Lifecycle**: Register, list, inspect, dynamically update, and cascade-safely deactivate customer profile fields.
- **Address Management Directory**: Maintain flexible, labeled shipping and billing addresses for each customer.
- **Stateful Shopping Cart**: Power both volatile guest carts (tracked by anonymous session tokens) and authenticated customer carts.
- **Deep Session & Cart Merging**: Automatically reconcile guest selections with permanent customer records upon login, performing secure quantity aggregations and database housecleaning.
- **Headless Checkout Routing**: Programmatically convert shopping cart structures into validated multi-location enterprise Sales Orders.

---

## 🔐 Customer Authentication & Token Lifecycle

Scryme V3 supports native credentials, federated social logins, and secure bearer token persistence patterns.

### Supported Authentication Methods

1. **Email and Password**: Classic local credentials stored using cryptographically secure `bcrypt` hashes.
2. **Google Social Sign-In**: Federated single-tap authentication.
3. **Better-Auth Bearer Tokens**: Transparent, standard token resolution mapping across web dashboards and mobile (Android) apps.

### Token Lifecycle & Auto-Refresh

When integrating with the `@scryme/sdk` Client-Side or Server-Side wrapper, you don't need to manually monitor JWT token expirations. The SDK is equipped with:
- **Proactive Interceptors**: Detects if the current JWT token is expiring within 30 seconds and automatically calls `/customers/auth/refresh` or re-performs a Client Credentials exchange before releasing the pending API request.
- **Reactive Interceptors**: Intercepts `401 Unauthorized` responses and retries the failed call seamlessly after acquiring a new, valid session token.

---

## 👥 Customer CRUD Lifecycle (API vs. SDK)

All customer endpoints reside under the `:orgSlug/customers` routing prefix. Here is how to execute standard Create, Read, Update, and Delete actions.

### 1. CREATE (Register a Customer)

Registering a new customer profile. For client-side storefronts, use the public signup endpoint. For server-side apps, connected clients can register users "on behalf of" customers.

#### API Payload
* **Endpoint**: `POST /v3/:orgSlug/customers/register`
* **Authentication**: Public (Uses `@AllowPublic()`)
* **Request Body**:
```json
{
  "name": "Alice Smith",
  "email": "alice.smith@example.com",
  "phone": "+254712345678",
  "company": "Acme Baking Industries",
  "customerType": "B2B_PREMIUM",
  "dateOfBirth": "1994-04-12",
  "taxId": "PIN-KRA-009121",
  "address": {
    "label": "Main Bakery Shop",
    "street1": "101 Harambee Avenue",
    "city": "Nairobi",
    "country": "Kenya",
    "isDefault": true
  }
}
```

#### SDK Code (Client-Side)
```typescript
import { ScrymeClientSDK } from '@scryme/sdk/client';

const scryme = new ScrymeClientSDK({
  clientId: "your_storefront_client_id",
  orgSlug: "bakery-co",
});

const response = await scryme.customer.auth.signUp({
  name: "Alice Smith",
  email: "alice.smith@example.com",
  password: "securepassword123", // Password registration establishes local login credentials
  phone: "+254712345678",
  company: "Acme Baking Industries",
  customerType: "B2B_PREMIUM",
  dateOfBirth: "1994-04-12",
  taxId: "PIN-KRA-009121",
});

console.log("Customer Profile Created:", response.data);
```

#### SDK Code (Server-Side Client)
```typescript
import { ScrymeServerSDK } from '@scryme/sdk/server';

const scrymeServer = new ScrymeServerSDK({
  clientId: "your_api_client_id",
  clientSecret: "your_api_client_secret",
  orgSlug: "bakery-co",
});

// Create customer "on behalf of" from a trusted secure backend environment
const response = await scrymeServer.admin.registerCustomer({
  name: "Alice Corporate Client",
  email: "corporate@alice.com",
  customerType: "B2B_PREMIUM"
});
```

---

### 2. READ (Retrieve Customer Details)

Retrieve paginated customer lists, fetch individual customer cards by ID, or resolve the current customer's profile session.

#### API Endpoints
* **Get All (Paginated)**: `GET /v3/:orgSlug/customers?limit=10&offset=0`
* **Get Single by ID**: `GET /v3/:orgSlug/customers/:id`
* **Get Authenticated Session Profile**: `GET /v3/:orgSlug/customers/auth/me`

#### SDK Code (Fetch by ID)
```typescript
// Fetch customer profile details programmatically
const customerId = "cust_abc123";
const response = await scryme.admin.getCustomerById(customerId);
console.log("Retrieved Profile:", response.data);
```

#### SDK Code (Current Session)
```typescript
// Fetch profile details for the currently logged-in customer session
const profile = await scryme.customer.getProfile();
console.log(`Welcome back, ${profile.name}!`);
```

---

### 3. UPDATE (Modify Customer Profile)

Allows authenticated users or administrative tools to add, modify, or extend custom profile parameters safely.

#### API Payload
* **Endpoint**: `PATCH /v3/:orgSlug/customers/:id`
* **Request Body**:
```json
{
  "name": "Alice Smith-Johnson",
  "phone": "+254799999999",
  "company": "Acme Baking International Ltd",
  "taxId": "PIN-KRA-999999999"
}
```

#### SDK Code (Update Profile)
```typescript
const response = await scryme.customer.updateProfile({
  name: "Alice Smith-Johnson",
  phone: "+254799999999",
  company: "Acme Baking International Ltd",
  taxId: "PIN-KRA-999999999"
});

console.log("Updated profile:", response.data);
```

---

### 4. DELETE (Deactivate Customer)

To ensure accounting auditiability and relational data integrity, deleting a customer utilizes a cascade-safe deactivation fallback. If the customer profile is linked to historical POS transactions, delivery shipments, or active service bookings, the system deactivates login privileges and flags them as soft-deleted instead of triggering database constraint errors.

#### API Endpoint
* **Endpoint**: `DELETE /v3/:orgSlug/customers/:id`

#### SDK Code
```typescript
const customerId = "cust_abc123";
const response = await scryme.admin.deleteCustomer(customerId);
console.log("Deactivation outcome:", response.data.message); // "Customer deleted successfully"
```

---

## 🛒 Stateful Shopping Cart Integrations

The Scryme V3 Shopping Cart API enables frictionless commerce transitions from anonymous browsing sessions to completed enterprise checkouts.

### Guest Carts vs. Authenticated Customer Carts

* **Guest (Anonymous) Carts**:
  When a visitor explores your storefront without logging in, their selected variants are associated with a temporary browser-generated `sessionId`. All item listings and mutations require passing this `sessionId` query filter.
* **Customer Carts**:
  When a logged-in customer adds items, the system maps the cart directly to their verified `Customer` profile ID. The backend handles multi-tenant scoping and authorization transparently using the authorization bearer JWT.

### Cart Lifecycle Methods (SDK)

The stateful SDK wraps complex quantity differences, item removals, and listings into simple, intuitive methods.

```typescript
// Initialize stateful Client-Side SDK
import { ScrymeClientSDK } from '@scryme/sdk/client';

const scryme = new ScrymeClientSDK({
  clientId: "storefront_client",
  orgSlug: "bakery-co",
});

// Define an active guest session ID (generate or read from cookies/localStorage)
const guestSessionId = "sess_temp_9921a";

// 1. ADD ITEM TO CART
await scryme.orders.addToCart({
  productId: "prod_sourdough",
  variantId: "var_large_loaf",
  quantity: 2,
  sessionId: guestSessionId, // Pass for guest context; omit if user is authenticated!
});

// 2. RETRIEVE CURRENT CART & TOTALS
const { itemsCount, items, raw } = await scryme.cart.getTotals({
  sessionId: guestSessionId,
});
console.log(`Cart holds ${itemsCount} total items:`, items);

// 3. INCREMENT OR DECREMENT ITEM QUANTITIES
// The SDK's `.update()` wrapper automatically calculates quantity delta increments or removes the item if set to <= 0
await scryme.cart.update({
  productId: "prod_sourdough",
  variantId: "var_large_loaf",
  quantity: 5, // Directly adjust target quantity to 5
  sessionId: guestSessionId,
});

// 4. REMOVE ITEM
await scryme.orders.removeFromCart({
  productId: "prod_sourdough",
  variantId: "var_large_loaf",
  sessionId: guestSessionId,
});

// 5. CLEAR ENTIRE CART
await scryme.cart.clear({
  sessionId: guestSessionId,
});
```

---

### ⚡ Seamless Guest-to-Customer Cart Merging

A classic e-commerce bottleneck is losing a customer's guest cart items when they decide to sign in or sign up before checking out. Scryme V3 resolves this by performing a **deep merge** within a single database transaction block.

#### How It Works (The Login Transition):
1. The guest browses anonymously, creating a guest cart under `guestSessionId`.
2. When the customer logs in or signs up, you retrieve their authenticated bearer JWT.
3. Call `GET /v3/:orgSlug/cart` with **both** the customer's authenticated header and the query parameter `sessionId=guestSessionId`.
4. The NestJS backend automatically:
   - Identifies both the anonymous guest cart (linked to `guestSessionId`) and the permanent customer cart (linked to `customerId`).
   - Merges item lines together: if the same variant or service booking exists in both carts, it **sums their quantities** together.
   - Migrates unique guest items into the customer's cart.
   - Deletes the temporary anonymous guest cart.
   - Returns the aggregated, fully-merged Customer Cart payload.

#### SDK Implementation snippet:
```typescript
// Trigger login and capture the verified customer details
const authResponse = await scryme.customer.auth.signIn({
  email: "customer@gmail.com",
  password: "secure_password"
});

const customerId = authResponse.user.id;

// Trigger deep merge of guest items into customer profile
const mergedCartResponse = await scryme.cart.get({
  sessionId: "sess_temp_9921a", // Merges this guest cart structure under the hood!
});

console.log("Aggregated customer cart active items:", mergedCartResponse.data.items);
```

---

### 💳 Completing Checkout

Convert your active cart entries into an active Sales Order node securely using standard checkout APIs.

```typescript
// Converts current cart structure into an enterprise Sales Order scheduled for delivery
try {
  const order = await scryme.cart.checkout({
    locationId: "loc_nairobi_warehouse", // Source warehouse location for stock deduction
    notes: "Please deliver fresh between 8:00 AM - 10:00 AM.",
    channel: "ONLINE_STOREFRONT"
  });
  console.log("Checkout complete! Sales Order Created:", order.id);
} catch (error) {
  console.error("Checkout failed:", error.message);
}
```
