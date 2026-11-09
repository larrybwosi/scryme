# 0039 · Multi-Tenant Customer Subdomain and Internal Unified Auth Architecture

**Status**: In Progress
**Date**: 2026-08-20
**Authorized by**: User, during /architect and /develop

## Overview
The unified authentication gateway (`apps/auth`) serves two distinct classes of users across the Scryme ecosystem:
1. **Internal Enterprise Users**: Internal staff, operators, administrators, developers, and partners authenticating into internal applications (`apps/web`, `apps/crm`, `apps/admin`, `apps/projects`, `apps/pos`, `apps/bakery`, `apps/site-next`, `apps/android`). Supports email/password, social logins (Google, GitHub), WebAuthn/FIDO2 Passkeys, Enterprise SAML/OIDC SSO, and OAuth2/OIDC consent delegation.
2. **Organization Customers**: End-customers interacting with storefronts, consumer portals, and client applications. Addressed via dedicated tenant subdomains in the format:
   - Production: `<orgSlug>.customers.auth.scryme.tech`
   - Local Development: `<orgSlug>.customers.localhost:4444` (or port-specific host)
   - Fallback / Root: Visiting `customers.auth.scryme.tech` or `customers.localhost` prompts the user to enter their organization slug.

## Architectural Requirements & Capabilities

### 1. Internal User Auth Flow
- Primary backend: `@repo/auth` via NestJS `/api/auth/*` proxy.
- Features enabled:
  - Email & Password with lockout and rate-limiting.
  - Social Logins: Google, GitHub.
  - Biometrics / FIDO2 Passkeys (`@better-auth/passkey`).
  - Enterprise SSO (SAML 2.0 / Okta / Azure AD).
  - Two-Factor Authentication (OTP email).
  - OAuth2 Server & Consent (`/consent`) with dynamic organization workspace selection and fine-grained scope granting (`mcp:read`, `mcp:write`, `org_info`, `membership`, `profile`, `email`).

### 2. Multi-Tenant Customer Auth Flow
- Subdomain Pattern: `<orgSlug>.customers.auth.scryme.tech` / `<orgSlug>.customers.localhost:4444`.
- Tenancy Scoping: Each customer belongs strictly to their organization identified by `orgSlug`. Customer accounts and sessions in the customer database are isolated by `organizationId` / `orgSlug`.
- Authentication Capabilities for Customers:
  - **Email & Password**: Local customer credential registration and login.
  - **Google OAuth**: Delegated single-sign-on for customers.
  - **Passkeys**: WebAuthn FIDO2 biometrics authentication scoped with registrable domain Relying Party ID (`rpID: scryme.tech` in production, `localhost` in development) allowing smooth customer passkey sign-in across subdomains.
- Redirect Enforcement: When customer authentication is invoked, a valid `callbackUrl` or `redirect_uri` is strictly required to navigate the customer back to their respective portal or storefront.
- Upstream Proxy: Customer authentication requests in `apps/auth` proxy directly to `CustomerAuthService` at `/api/customer-auth/*`.

### 3. Backend & Data Model Extension (`apps/api/src/customer-auth`)
- `apps/api/src/customer-auth/prisma/schema.prisma` is enhanced with:
  - `Passkey` model supporting Better Auth WebAuthn credentials.
  - Organization binding fields on `User` and `Session` (`organizationId` / `orgSlug`).
- `CustomerAuthService` is configured with:
  - `@better-auth/passkey` plugin with dynamic origin and registrable `rpID`.
  - Rate limiting and secondary Redis session storage.

### 4. Enterprise Design Alignment
- Strict adherence to 0px border radius (`rounded-none`).
- High-contrast typography, hairline borders, and responsive desktop/mobile layouts.
