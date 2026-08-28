# V3 Customer & Cart API Developer Guide

This document covers the **Customer Registration, Authentication, Session Management, Address Directory**, and **Shopping Cart Integration APIs** exposed in Scryme V3. These endpoints provide connected applications, storefronts, mobile clients, and third-party integrations with first-class APIs for managing customer flows and e-commerce shopping carts.

---

## 🔐 Customer Authentication & Identity Providers

Scryme V3 supports native credentials authentication alongside federated identity options. This allows your customers to register, sign-in, manage sessions, and maintain their profiles across web, mobile (Android), and headless environments.

### Supported Authentication Methods
1. **Email and Password Credentials**: Direct local authentication returning high-performance `HS256` Bearer JWTs and managing active session records in Redis.
2. **Federated Sign-In (OpenID Connect / OIDC)**: Single Sign-On integration via external OIDC identity providers.

### How It Works (The Customer Authentication Cycle)
- **Customer Sign-Up / Registration**:
  When a customer registers (`POST /v3/:orgSlug/customers/register`), the system creates a customer record scoped to the target organization (`organizationId`). If credentials (`password`) are provided, a corresponding global `User` record is created or linked securely, hashing passwords with `bcrypt`.
- **Credential Login**:
  Executing `POST /v3/:orgSlug/customers/auth/login` verifies credentials against the linked user profile using cryptographically heavy `bcrypt.compare` (mitigating timing attacks and username/email enumeration side-channels). Upon successful validation, the backend:
  1. Generates a unique session identifier (`sess_<uuid>`).
  2. Signs an `HS256` JWT containing claims (`sub: customerId`, `sessionId`, `customerEmail`, `organizationId`, `orgSlug`, `type: "v3_customer"`).
  3. Stores active session metadata in Redis (`customer_session:<customerId>:<sessionId>`) with a 7-day TTL.
  4. Returns the Bearer token, session metadata, and customer profile payload to the client.
- **Request Authentication (`V3AuthGuard`)**:
  On subsequent API calls, the client supplies `Authorization: Bearer <token>`. `V3AuthGuard` verifies the JWT, checks Redis to ensure the session remains active (and hasn't been revoked), and injects `v3Context` (`customerId`, `sessionId`, `customer`, `organization`) into the request context.
- **Session Refresh**:
  Executing `POST /v3/:orgSlug/customers/auth/refresh` allows active client sessions to extend token validity before expiration, issuing a fresh `HS256` JWT and updating Redis session state.
- **Concurrent Session Revocation**:
  Customers can inspect active sessions (`GET /v3/:orgSlug/customers/auth/sessions`) and selectively revoke specific session tokens (`DELETE /v3/:orgSlug/customers/auth/sessions/:id`) or all/other concurrent sessions (`DELETE /v3/:orgSlug/customers/auth/sessions?mode=other`).

---

## 🔑 Customer Authentication & Session APIs

All customer authentication endpoints are located under `:orgSlug/customers/auth/`.

### 1. Customer Login
Authenticates a customer using email and password, returning an `HS256` Bearer token and creating a session in Redis.

* **Endpoint**: `POST /v3/:orgSlug/customers/auth/login`
* **Authentication**: Public (`@AllowPublic()`)
* **Request Body** (`CustomerLoginDto`):
  ```json
  {
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }
  ```
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session": {
      "id": "sess_8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "customerId": "cust_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userAgent": "Mozilla/5.0 ...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-08-05T10:00:00.000Z",
      "expiresAt": "2026-08-12T10:00:00.000Z"
    },
    "user": {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+254700000000",
      "company": "Acme Corporation",
      "customerType": "B2B_PREMIUM"
    }
  }
  ```

### 2. Refresh Customer Session
Refreshes an active customer session token, issuing a new `HS256` Bearer JWT and resetting Redis session expiration to 7 days.

* **Endpoint**: `POST /v3/:orgSlug/customers/auth/refresh`
* **Authentication**: Public (`@AllowPublic()`, Authorization header required with current/expiring Bearer token)
* **Headers**: `Authorization: Bearer <token>`
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session": {
      "id": "sess_8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "customerId": "cust_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "expiresAt": "2026-08-12T10:00:00.000Z"
    },
    "user": {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
  ```

### 3. Get Active Session & Profile
Retrieves current customer session information and detailed customer profile attributes.

* **Endpoint**: `GET /v3/:orgSlug/customers/auth/session`
* **Authentication**: Customer JWT (`Bearer <token>`)
* **Response** (200 OK):
  ```json
  {
    "session": {
      "id": "sess_8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "customerId": "cust_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "userAgent": "Mozilla/5.0 ...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-08-05T10:00:00.000Z",
      "expiresAt": "2026-08-12T10:00:00.000Z"
    },
    "customer": {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+254700000000",
      "company": "Acme Corporation",
      "customerType": "B2B_PREMIUM",
      "dateOfBirth": "1990-05-15",
      "loyaltyPoints": 150,
      "taxId": "PIN-KRA-123456",
      "isActive": true,
      "createdAt": "2026-08-05T10:00:00.000Z",
      "updatedAt": "2026-08-05T10:00:00.000Z"
    }
  }
  ```

### 4. List All Concurrent Sessions
Lists all active concurrent session records associated with the authenticated customer.

* **Endpoint**: `GET /v3/:orgSlug/customers/auth/sessions`
* **Authentication**: Customer JWT (`Bearer <token>`)
* **Response** (200 OK):
  ```json
  [
    {
      "id": "sess_8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "customerId": "cust_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-08-05T10:00:00.000Z",
      "expiresAt": "2026-08-12T10:00:00.000Z"
    },
    {
      "id": "sess_9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
      "customerId": "cust_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "userAgent": "ScrymeAndroid/1.0",
      "ipAddress": "10.0.0.42",
      "createdAt": "2026-08-05T11:30:00.000Z",
      "expiresAt": "2026-08-12T11:30:00.000Z"
    }
  ]
  ```

### 5. Revoke Specific Session
Terminates a specific active session by its identifier.

* **Endpoint**: `DELETE /v3/:orgSlug/customers/auth/sessions/:id`
* **Authentication**: Customer JWT (`Bearer <token>`)
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Session sess_9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d successfully revoked"
  }
  ```

### 6. Revoke All or Other Sessions
Revokes all active sessions for the customer, or revokes all sessions *except* the active current session using `mode=other`.

* **Endpoint**: `DELETE /v3/:orgSlug/customers/auth/sessions`
* **Query Parameters**:
  - `mode`: `"other"` (optional: revokes all sessions except the active one) or omitted (revokes all sessions)
* **Authentication**: Customer JWT (`Bearer <token>`)
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Other sessions successfully revoked"
  }
  ```

---

## 👥 Customer Profile APIs

All customer-related endpoints are grouped under the `:orgSlug/customers` path.

### 1. Register a Customer
Allows registering a new customer profile. Connected apps can register a customer using standard credentials.

* **Endpoint**: `POST /v3/:orgSlug/customers/register` (also aliased at `POST /v3/:orgSlug/customer/register`)
* **Authentication**: Public (`@AllowPublic()`)
* **Request Body** (`RegisterCustomerDto`):
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123", // Optional: If provided, enables customer login
    "phone": "+254700000000", // Optional
    "location": "Nairobi, Kenya", // Optional
    "company": "Acme Corporation", // Optional: Business or corporate name
    "customerType": "B2B_PREMIUM", // Optional: Custom classification tag
    "dateOfBirth": "1990-05-15", // Optional: ISO string format (YYYY-MM-DD)
    "taxId": "PIN-KRA-123456", // Optional: Tax PIN (e.g. KRA PIN for Kenya)
    "metadata": {
      "preferences": "premium"
    }, // Optional
    "address": { // Optional initial address
      "label": "Home",
      "street1": "123 Main St",
      "city": "Nairobi",
      "country": "Kenya",
      "isDefault": true
    }
  }
  ```
* **Response** (201 Created):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+254700000000",
      "company": "Acme Corporation",
      "customerType": "B2B_PREMIUM",
      "dateOfBirth": "1990-05-15",
      "taxId": "PIN-KRA-123456"
    }
  }
  ```

### 2. Get All Customers
Retrieves a paginated list of customers registered under the active organization.

* **Endpoint**: `GET /v3/:orgSlug/customers`
* **Query Parameters**:
  - `limit`: number (default: 10)
  - `offset`: number (default: 0)
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": [
      {
        "id": "cust_abc123",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+254700000000",
        "company": "Acme Corporation",
        "customerType": "B2B_PREMIUM",
        "dateOfBirth": "1990-05-15",
        "taxId": "PIN-KRA-123456"
      }
    ]
  }
  ```

### 3. Get Customer by ID
Retrieves details of a single customer profile by their unique ID.

* **Endpoint**: `GET /v3/:orgSlug/customers/:id`
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+254700000000",
      "company": "Acme Corporation",
      "customerType": "B2B_PREMIUM",
      "dateOfBirth": "1990-05-15",
      "taxId": "PIN-KRA-123456"
    }
  }
  ```

### 4. Update Customer Profile
Updates details of an existing customer profile. Allows self-authenticated users to add or modify secondary profile fields at any time.

* **Endpoint**: `PATCH /v3/:orgSlug/customers/:id`
* **Request Body** (`UpdateCustomerDto`):
  ```json
  {
    "name": "John Doe Junior",
    "phone": "+254711111111",
    "company": "Acme Corporation International",
    "taxId": "PIN-KRA-99999"
  }
  ```
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "cust_abc123",
      "name": "John Doe Junior",
      "email": "john.doe@example.com",
      "phone": "+254711111111",
      "company": "Acme Corporation International",
      "customerType": "B2B_PREMIUM",
      "dateOfBirth": "1990-05-15",
      "taxId": "PIN-KRA-99999"
    }
  }
  ```

### 5. Delete or Deactivate Customer
Deletes or deactivates a customer profile. Uses standard Prisma cascade/foreign-key safe deactivation as fallback if the customer has existing transactions or dependencies.

* **Endpoint**: `DELETE /v3/:orgSlug/customers/:id`
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "success": true,
      "message": "Customer deleted successfully"
    }
  }
  ```

---

## 📍 Address APIs

Allows connected clients to manage multiple addresses for customer profiles.

### 1. Get Customer Addresses
Retrieves all registered addresses for a customer.

* **Endpoint**: `GET /v3/:orgSlug/customers/:id/addresses`
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": [
      {
        "id": "addr_987",
        "customerId": "cust_abc123",
        "label": "Home",
        "street1": "123 Main St",
        "city": "Nairobi",
        "country": "Kenya",
        "isDefault": true
      }
    ]
  }
  ```

### 2. Add or Update Customer Address
Adds a new address for the customer, or updates an existing address if matching parameters are found.

* **Endpoint**: `POST /v3/:orgSlug/customers/:id/addresses`
* **Request Body**:
  ```json
  {
    "label": "Office",
    "street1": "Westlands Commercial Center",
    "city": "Nairobi",
    "country": "Kenya",
    "isDefault": false
  }
  ```
* **Response** (201 Created):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "addr_654",
      "customerId": "cust_abc123",
      "label": "Office",
      "street1": "Westlands Commercial Center",
      "city": "Nairobi",
      "country": "Kenya",
      "isDefault": false
    }
  }
  ```

---

## 🛒 Shopping Cart APIs

Allows managing temporary guest or authenticated customer carts.

### 1. Get Current Cart
Retrieves the active cart for a customer or a guest session.

* **Endpoint**: `GET /v3/:orgSlug/cart`
* **Query Parameters**:
  - `sessionId`: string (required for guest/anonymous carts if user is not authenticated)
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "cart_xyz",
      "organizationId": "org_123",
      "customerId": "cust_abc123",
      "sessionId": "sess_888",
      "status": "ACTIVE",
      "items": [
        {
          "id": "item_111",
          "productId": "prod_456",
          "variantId": "var_789",
          "quantity": 2
        }
      ]
    }
  }
  ```

### 2. Add Item to Cart
Adds a product variant or service booking to the cart. If the item already exists in the cart, it increments its quantity.

* **Endpoint**: `POST /v3/:orgSlug/cart/items`
* **Request Body** (`AddToCartDto`):
  ```json
  {
    "productId": "prod_456",
    "variantId": "var_789",
    "quantity": 1,
    "sessionId": "sess_888" // Optional if authenticated
  }
  ```
* **Response** (201 Created):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "item_111",
      "cartId": "cart_xyz",
      "productId": "prod_456",
      "variantId": "var_789",
      "quantity": 3
    }
  }
  ```

### 3. Remove Item from Cart
Removes a specific product/variant/service from the cart.

* **Endpoint**: `DELETE /v3/:orgSlug/cart/items`
* **Request Body** (`RemoveFromCartDto`):
  ```json
  {
    "productId": "prod_456",
    "variantId": "var_789",
    "sessionId": "sess_888"
  }
  ```
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "id": "item_111"
    }
  }
  ```

### 4. Clear Entire Cart
Deletes all items from the active shopping cart, resetting it to an empty state.

* **Endpoint**: `DELETE /v3/:orgSlug/cart`
* **Query Parameters**:
  - `sessionId`: string (required for guest/anonymous carts if user is not authenticated)
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "timestamp": "2026-08-05T10:00:00.000Z",
    "data": {
      "count": 1
    }
  }
  ```

### Cart Session Merging and Customer Authentication

When a customer is logged in via a customer session token, `V3AuthGuard` automatically resolves their Customer profile and attaches their `customerId` to the request context.

To support transition from an anonymous guest session to an authenticated customer session (e.g. upon customer login):
- If the client calls `GET /v3/:orgSlug/cart` with both the customer's authenticated Bearer token and the `sessionId` they used as a guest, the API will automatically:
  1. Detect both the guest cart (linked to `sessionId`) and the permanent customer cart (linked to `customerId`).
  2. Perform a deep-merge: transfer or increment quantities of products/variants and services from the guest cart into the customer's cart.
  3. Delete the temporary guest cart to keep database storage clean.
  4. Return the fully-merged customer cart.

---

## 🤖 MCP Server Tools Integration

The Scryme V3 MCP Server contains standard enterprise tools that map directly to customer and cart endpoints.

### Customer Management Tools

| Tool Name | Description | Required Arguments |
| :--- | :--- | :--- |
| `get_customers` | Retrieve a list of registered customers. | `orgSlug` |
| `get_customer_by_id` | Get details of a single customer by ID. | `orgSlug`, `id` |
| `register_customer` | Register a new customer profile. | `orgSlug`, `name`, `email` |
| `update_customer` | Update customer details. | `orgSlug`, `id` |
| `delete_customer` | Deactivates or hard-deletes a customer by ID. | `orgSlug`, `id` |
| `get_customer_addresses` | Get all addresses of a customer. | `orgSlug`, `id` |
| `add_customer_address` | Add or update an address for a customer. | `orgSlug`, `id`, `street1`, `city`, `country` |

### Shopping Cart Tools

| Tool Name | Description | Required Arguments |
| :--- | :--- | :--- |
| `get_cart` | Fetch the current cart by session/customer ID. | `orgSlug` |
| `add_to_cart` | Add a product variant or service to the cart. | `orgSlug`, `quantity` |
| `remove_from_cart` | Remove an item from the cart. | `orgSlug` |
| `clear_cart` | Remove all items from the cart. | `orgSlug` |
