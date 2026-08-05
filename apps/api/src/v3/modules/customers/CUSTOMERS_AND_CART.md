# V3 Customer & Cart API Developer Guide

This document covers the **Customer Registration, Management, Addresses**, and **Shopping Cart** integration APIs exposed in Scryme V3. These endpoints provide connected applications and third-party integrations with first-class APIs for managing customer flows and e-commerce shopping carts.

---

## 🔐 Customer Authentication & Identity Providers

Scryme V3 supports native and federated self-authentication options using **Zitadel** and standard credential providers. This allows your customers to register, sign-in, and manage their profiles across web, mobile (Android), and headless environments.

### Supported Authentication Methods
1. **Google Social Sign-In**: Seamless, single-tap OAuth2 federation.
2. **Email and Password**: Traditional local credential flow.

### How It Works (The Self-Authentication Cycle)
- **Federated Login (e.g., Google/OIDC)**:
  The client application coordinates with Zitadel to complete the authorization code flow (with PKCE), yielding an identity ID and a Bearer JWT.
- **Backend Syncing**:
  When the customer makes an API call with the Bearer token or accesses the portal callback, the backend:
  1. Decodes and verifies the token against the Zitadel JWKS keys.
  2. Extracts claims (such as `sub` as `zitadelUserId`, `email`, `name`).
  3. Creates or updates the customer’s profile inside the database, mapping the external Zitadel identity to our local database models via `ExternalMapping` (`provider: "ZITADEL"`).
- **Subsequent Profile Updates**:
  Once self-registered/logged-in, customers can safely modify their details (such as `company`, `phone`, `dateOfBirth`, or `taxId` KRA PIN) via the secure update profile endpoints.

---

## 👥 Customer APIs

All customer-related endpoints are grouped under the `:orgSlug/customers` path.

### 1. Register a Customer
Allows registering a new customer profile. Connected apps can provide a `zitadelUserId` to link with an existing Zitadel/social identity, or register a customer using standard credentials.

* **Endpoint**: `POST /v3/:orgSlug/customers/register`
* **Authentication**: Public (Uses `@AllowPublic()`)
* **Request Body** (`RegisterCustomerDto`):
  ```json
  {
    "zitadelUserId": "zit_12345", // Optional: Links with Zitadel identity provider
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+254700000000", // Optional
    "location": "Nairobi, Kenya", // Optional
    "company": "Acme Corporation", // Optional: Business or corporate name
    "customerType": "B2B_PREMIUM", // Optional: Custom classification tag
    "dateOfBirth": "1990-05-15", // Optional: ISO string format (YYYY-MM-DD)
    "taxId": "PIN-KRA-123456", // Optional: Tax PIN (e.g. KRA PIN for Kenya)
    "metadata": {
      "preferences": "premium"
    }, // Optional
    "address": { // Optional
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

---

## 🤖 MCP Server Tools Integration

The Scryme V3 MCP Server contains standard enterprise tools that map directly to the newly introduced endpoints.

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
