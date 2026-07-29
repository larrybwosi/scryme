# V3 API Catalog & Connected Apps Integration Guide

This guide details how third-party or custom connected applications can integrate with the Scryme ERP platform to securely query products and services for a given organization using our authenticated V3 API endpoints.

---

## 🔒 Authentication

Connected apps must authenticate using the **V3 Bearer Token Authentication**. All requests must include the `Authorization` header with a valid V3 Client/Hybrid JSON Web Token (JWT).

### Headers
```http
Authorization: Bearer <v3_client_token>
```

---

## 📦 Products Catalog API

Connected applications can retrieve complete products alongside their active variants and pricing.

### Get All Products
Retrieves a paginated list of all active products for the resolved organization.

- **URL**: `/api/v3/:orgSlug/catalog/products`
- **Method**: `GET`
- **Permissions Required**: `catalog:product:read`
- **Query Parameters**:
  - `limit` (optional): Number of records to return (default: `20`)
  - `offset` (optional): Pagination offset (default: `0`)

#### Response (`200 OK`)
```json
[
  {
    "id": "prod_cln123456",
    "name": "Espresso Coffee Beans",
    "description": "Premium roasted dark arabica coffee beans.",
    "sku": "PROD-ESP-BEANS",
    "retailPrice": 15.99,
    "images": [
      "https://example.com/assets/espresso_beans_1.jpg"
    ],
    "category": {
      "id": "cat_bev789",
      "name": "Beverages"
    },
    "slug": "espresso-coffee-beans",
    "variants": [
      {
        "id": "var_cln654321",
        "name": "Espresso Coffee Beans - 1kg Bag",
        "sku": "SKU-ESP-1KG",
        "retailPrice": 15.99
      },
      {
        "id": "var_cln987654",
        "name": "Espresso Coffee Beans - 250g Box",
        "sku": "SKU-ESP-250G",
        "retailPrice": 5.99
      }
    ]
  }
]
```

---

## 🛠️ Services Catalog API

Connected applications can retrieve services offered by the organization, including extended metadata and service configurations.

### Get All Services
Retrieves a paginated list of all active services for the resolved organization.

- **URL**: `/api/v3/:orgSlug/catalog/services`
- **Method**: `GET`
- **Permissions Required**: `services:read`
- **Query Parameters**:
  - `limit` (optional): Number of records to return (default: `20`)
  - `offset` (optional): Pagination offset (default: `0`)

#### Response (`200 OK`)
```json
[
  {
    "id": "srv_cln112233",
    "name": "Hourly Barista Training Consultation",
    "description": "On-site commercial barista training and espresso calibration sessions.",
    "sku": "SRV-BARISTA-TRAIN",
    "retailPrice": 120.00,
    "images": [
      "https://example.com/assets/barista_training.jpg"
    ],
    "category": {
      "id": "cat_srv_99",
      "name": "Consulting Services"
    },
    "slug": "hourly-barista-training",
    "pricingModel": "HOURLY",
    "estimatedDuration": 60,
    "isActive": true
  }
]
```

---

## 🚀 Swagger Documentation & Client SDK Generation

These endpoints are fully annotated with `@nestjs/swagger` decorators. Re-compiling the OpenAPI schema automatically registers them inside the Swagger UI at:
- **Swagger Documentation URL**: `http://localhost:3000/api/v3/docs`

Client SDK code is automatically synchronized inside `@repo/v3-sdk` via the central OpenAPI JSON builder command:
```bash
pnpm run openapi:generate
```
