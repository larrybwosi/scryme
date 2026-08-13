# Customer Single Sign-On (SSO) & Authentication Guide

This guide provides developers with the details required to integrate customer authentication and Single Sign-On (SSO) into third-party systems. By using these endpoints, integrating systems can seamlessly provision identity configurations, register customers, and allow them to authenticate securely using standard OpenID Connect (OIDC).

---

## 🔒 Customer Authentication Architecture

Customer authentication uses **OpenID Connect (OIDC)** and **Standard API Registration** flows. This allows developers to:
1. **Provision SSO connection** for a business/organization with one click.
2. **Register/Sync customers** directly from their platforms to our ERP CRM.
3. **Log customers in** using a unified, secure SSO portal.

---

---

## 👤 2. Registering and Connecting Customers Directly

When your system registers a customer or when a customer registers on an integrating storefront, you should register them directly in our system. If they also exist on an external Identity Provider, you can link them by passing the identity user identifier.

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
*Note: The `zitadelUserId` parameter represents the external/identity provider user identifier. When supplied, it establishes a high-fidelity mapping between their login account and their CRM/ERP Customer Profile.*

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

## 🛠️ 4. Accessing Scryme APIs on Behalf of Customers

Integrating systems can invoke ERP and Catalog endpoints on behalf of the customer by supplying their authenticated Bearer token in the request headers:

```http
GET /api/v3/my-organization/catalog/products
Authorization: Bearer <customer_access_token>
```

Our system will:
1. **Introspect and verify** the JSON Web Token (JWT) signatures.
2. **Parse the customer claims** (`sub`, `email`, `urn:zitadel:iam:org:id`).
3. **Synchronize or fetch** the corresponding customer mapping from the database.
4. **Expose the request context** securely as a `customer` entity, enforcing multi-tenant isolation and secure data boundaries.
