# Customer Single Sign-On (SSO) & Authentication Guide

This guide provides developers with the details required to integrate customer authentication and Single Sign-On (SSO) into storefronts, mobile apps, and third-party systems. By using these endpoints, integrating applications can seamlessly register customers, authenticate via direct email/password credentials, manage active sessions, or delegate identity via OpenID Connect (OIDC).

---

## 🔒 Customer Authentication Architecture

Customer authentication in Scryme V3 is designed for complete multi-tenant isolation, security, and developer flexibility. It supports two primary authentication modes:

1. **Local Customer Credentials & Session Management**:
   Customers authenticate directly using email and password against `/v3/:orgSlug/customers/auth/login`. The system returns an `HS256` Bearer JWT token while creating an active, manageable session in Redis.
2. **Federated OpenID Connect (OIDC) Single Sign-On**:
   Customers authenticate via a standard OIDC identity provider authorization code flow, exchanging tokens and linking identities to local Customer records.

---

## 🔑 1. Local Customer Authentication & Sessions

### Customer Sign-Up & Password Registration
Customers can self-register using `POST /v3/:orgSlug/customers/register`. Providing a `password` in the registration payload hashes the password securely with `bcrypt` and provisions or links a global `User` identity for local authentication.

### Customer Login Flow
- **Endpoint**: `POST /v3/:orgSlug/customers/auth/login`
- **Authentication**: Public (`@AllowPublic()`)
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session": {
      "id": "sess_8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "customerId": "cust_abc123",
      "email": "customer@example.com",
      "name": "Jane Smith",
      "createdAt": "2026-08-05T10:00:00.000Z",
      "expiresAt": "2026-08-12T10:00:00.000Z"
    },
    "user": {
      "id": "cust_abc123",
      "name": "Jane Smith",
      "email": "customer@example.com",
      "phone": "+254700000123",
      "company": "Acme Commerce Inc"
    }
  }
  ```

#### Timing Attack Mitigation
`CustomerController.login` performs a cryptographically heavy `bcrypt.compare` against a valid dummy hash even if the requested email or customer profile is not found. This eliminates timing side-channels and username/email enumeration vulnerabilities.

### Session Token Refresh
Extend active customer session JWT tokens before expiration without requiring re-entry of credentials.

- **Endpoint**: `POST /v3/:orgSlug/customers/auth/refresh`
- **Headers**: `Authorization: Bearer <token>`
- **Response (`200 OK`)**: Returns a fresh `HS256` Bearer JWT and updated session object with a renewed 7-day TTL.

### Active Session Management & Revocation
Customers can inspect and control all active concurrent sessions across devices:
- **Get Active Session & Profile**: `GET /v3/:orgSlug/customers/auth/session`
- **List All Concurrent Sessions**: `GET /v3/:orgSlug/customers/auth/sessions`
- **Revoke Specific Session**: `DELETE /v3/:orgSlug/customers/auth/sessions/:sessionId`
- **Revoke Other Concurrent Sessions**: `DELETE /v3/:orgSlug/customers/auth/sessions?mode=other`
- **Revoke All Sessions**: `DELETE /v3/:orgSlug/customers/auth/sessions`

---

## 👤 2. Registering and Connecting Customers Directly

When your system registers a customer or when a customer registers on an integrating storefront, you should register them directly in our system.

### Endpoint: Register Customer
- **URL**: `/api/v3/:orgSlug/customers/register`
- **Method**: `POST`
- **Authentication**: Public endpoint (Authorized via Multi-Tenancy headers)
- **Headers**:
  ```http
  Content-Type: application/json
  ```

#### Request Body
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "securepassword123",
  "phone": "+254700000123",
  "company": "Acme Commerce Inc",
  "customerType": "B2B_PREMIUM",
  "dateOfBirth": "1990-11-23",
  "taxId": "KRA-11223344",
  "address": {
    "street1": "123 Business Parkway",
    "city": "Nairobi",
    "country": "Kenya",
    "postalCode": "00100",
    "isDefault": true
  }
}
```

#### Response (`201 Created`)
```json
{
  "id": "cust_smith456",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+254700000123",
  "company": "Acme Commerce Inc",
  "customerType": "B2B_PREMIUM",
  "dateOfBirth": "1990-11-23",
  "taxId": "KRA-11223344",
  "organizationId": "org_cln123456",
  "createdAt": "2026-08-06T12:00:00.000Z",
  "updatedAt": "2026-08-06T12:00:00.000Z"
}
```

---

## 🔑 3. Authenticating Customers via OIDC Flow

Once the OIDC/SSO workspace is provisioned and your customer profiles are registered, you can direct users to authenticate via standard OIDC.

### Step 3.1: Redirect User to Authorize Endpoint
Your storefront or web application redirects the customer to the Identity Provider authorize URL to start the OAuth2 flow:

```http
GET https://<sso-domain>/oauth/v2/authorize
  ?response_type=code
  &client_id=<YOUR_CLIENT_ID>
  &redirect_uri=<YOUR_REDIRECT_URI>
  &scope=openid profile email
  &state=<CRYPTOGRAPHICALLY_SECURE_STATE>
```

### Step 3.2: OIDC Callback & Token Exchange
Upon successful authentication, the identity provider redirects back to your registered `redirect_uri` with an authorization `code` and `state`:

```http
GET https://your-app.com/api/auth/callback/customer-sso
  ?code=auth_code_example_xyz
  &state=your_secure_state
```

Your server-side backend handles this callback and exchanges the `code` for token payloads:

```http
POST https://<sso-domain>/oauth/v2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth_code_example_xyz
&redirect_uri=https://your-app.com/api/auth/callback/customer-sso
&client_id=<YOUR_CLIENT_ID>
```

#### Token Response
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 🛠️ 4. Request Authentication & Scoping in `V3AuthGuard`

Integrating systems can invoke ERP, Catalog, Cart, and Customer endpoints on behalf of the customer by supplying their authenticated Bearer token in the request headers:

```http
GET /api/v3/my-organization/catalog/products
Authorization: Bearer <customer_access_token>
```

Our system (`V3AuthGuard`) will:
1. **Verify Token**: Validates `HS256` customer JWT signatures or introspects session tokens.
2. **Verify Session Active State**: Checks Redis (`customer_session:<sub/customerId>:<sessionId>`) to confirm the session has not been revoked.
3. **Establish Context**: Sets `req.v3Context` with resolved `customerId`, `sessionId`, `customer` profile, and `organization`.
4. **Multi-Tenant Isolation**: Enforces organization slug boundaries (`orgSlug`), guaranteeing that customers only access data belonging to their authenticated organization.
