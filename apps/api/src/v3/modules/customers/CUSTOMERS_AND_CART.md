# V3 Customer & Cart API Developer Guide

This document covers the **Customer Registration, Management, Addresses**, and **Shopping Cart** integration APIs exposed in Scryme V3. These endpoints provide connected applications and third-party integrations with first-class APIs for managing customer flows and e-commerce shopping carts.

---

## 👥 Customer APIs

All customer-related endpoints are grouped under the `:orgSlug/customers` path.

### 1. Register a Customer
Allows registering a new customer profile. Connected apps have the option to provide a Zitadel User ID to link the profile, or register a customer purely using standard credentials (email/name/phone/etc.), creating/re-using customer profiles directly in the database.

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
    "id": "cust_abc123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+254700000000"
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
  [
    {
      "id": "cust_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+254700000000"
    }
  ]
  ```

### 3. Get Customer by ID
Retrieves details of a single customer profile by their unique ID.

* **Endpoint**: `GET /v3/:orgSlug/customers/:id`
* **Response** (200 OK):
  ```json
  {
    "id": "cust_abc123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+254700000000"
  }
  ```

### 4. Update Customer Profile
Updates details of an existing customer profile.

* **Endpoint**: `PATCH /v3/:orgSlug/customers/:id`
* **Request Body** (`UpdateCustomerDto`):
  ```json
  {
    "name": "John Doe Junior",
    "phone": "+254711111111"
  }
  ```
* **Response** (200 OK):
  ```json
  {
    "id": "cust_abc123",
    "name": "John Doe Junior",
    "email": "john.doe@example.com",
    "phone": "+254711111111"
  }
  ```

### 5. Delete or Deactivate Customer
Deletes or deactivates a customer profile. Uses standard Prisma cascade/foreign-key safe deactivation as fallback if the customer has existing transactions or dependencies.

* **Endpoint**: `DELETE /v3/:orgSlug/customers/:id`
* **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Customer deleted successfully" // or "Customer deactivated successfully"
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
  [
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
    "id": "addr_654",
    "customerId": "cust_abc123",
    "label": "Office",
    "street1": "Westlands Commercial Center",
    "city": "Nairobi",
    "country": "Kenya",
    "isDefault": false
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
    "id": "item_111",
    "cartId": "cart_xyz",
    "productId": "prod_456",
    "variantId": "var_789",
    "quantity": 3
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
    "id": "item_111"
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
    "count": 1
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
