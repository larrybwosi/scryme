# Sentinel's Journal

## 2026-06-07 - [Hardcoded Secret Fallback & Information Leakage]
**Vulnerability:** Found a hardcoded fallback for `JWT_SECRET` in `device-setup-tokens.ts` (`'fallback-secret-for-dev'`) and observed that the `AllExceptionsFilter` was leaking raw `Error` messages to API clients.
**Learning:** Hardcoded fallbacks are often introduced for developer convenience but can accidentally reach production if environment variables are misconfigured. Global exception filters often default to being verbose for debugging purposes, which is dangerous in production.
**Prevention:** Always use a "fail-fast" approach for critical secrets by throwing an error if they are missing at startup. Configure global error handlers to mask internal errors based on the environment (`NODE_ENV === 'production'`).

## 2026-06-09 - [Health Check Information Leakage]
**Vulnerability:** The `HealthController` was returning raw error messages from database and system checks directly to the client, even in production. This bypassed the global `AllExceptionsFilter` because the controller was manually constructing and throwing `ServiceUnavailableException` with the raw error message.
**Learning:** Global exception filters can be bypassed if controllers catch errors and re-throw them with specific response objects containing sensitive data. Health check endpoints are often overlooked but can leak technical details about the stack (DB type, connectivity issues, etc.).
**Prevention:** Mask raw error messages in all public-facing endpoints, especially health checks. Ensure that any manual exception throwing also respects environment-based masking.

## 2026-06-11 - [Inconsistent Security Patterns for API Secrets]
**Vulnerability:** Found that V2 API keys and V3 client secrets were being stored using simple SHA-256 hashing in shared actions, which was inconsistent with the authentication logic in the API that expected a multi-layered security pattern (Argon2 + AES-256-GCM). This caused newly created keys to be non-functional and less secure.
**Learning:** Security standards must be enforced across both the creation and validation paths. Inconsistencies often arise when shared actions and API services are developed independently without a unified security utility or clear documentation of the required secret lifecycle.
**Prevention:** Centralize secret handling (hashing/encryption) into shared utilities and ensure both the "write" (creation) and "read" (validation) logic use these same utilities. Always provide a secure fallback or migration strategy when upgrading security patterns for existing credentials.

## 2026-06-12 - [Plaintext Storage of Standalone POS Keys]
**Vulnerability:** The `StandalonePosService` was storing both `StandaloneSetupKey` (one-time tokens) and `StandaloneDeviceKey` (long-lived keys) as plaintext in the database. It also performed direct database lookups using these plaintext secrets.
**Learning:** Plaintext storage of secrets is a critical vulnerability. In this case, the schema used `@unique` constraints on the secret fields themselves, which prevents using non-deterministic hashing (like Argon2) or encryption without a separate identifier (like a prefix or key ID).
**Prevention:** For secrets that must be used as unique identifiers for lookups without schema changes, store a deterministic hash (e.g., SHA-256) instead of the plaintext. For new security-sensitive models, always include a public `prefix` or `keyId` field to enable more robust security patterns (Argon2 + AES-256-GCM).

## 2026-06-14 - [Hardcoded Secret Fallback and Dangerous Security Stubs]
**Vulnerability:** Found a hardcoded fallback `'default_secret'` for document verification hashes in `packages/documents/src/server.ts` and dangerous security stubs in `apps/api/src/lib/api/v2/security/tokens.ts` that bypassed authentication by always returning `true`.
**Learning:** Hardcoded fallbacks are "ticking time bombs" that can lead to security breaches if environment variables are missing. Stubs used for testing or early development can be accidentally left in the codebase, creating massive backdoors.
**Prevention:** Never use hardcoded fallbacks for security-sensitive secrets. Implement fail-fast checks to ensure all required secrets are present at runtime. Regularly audit the codebase for stubs or "TODO" comments in security-critical paths.

## 2026-06-14 - [Unauthenticated File Upload & Broken Implementation]
**Vulnerability:** The `UploadController` had an endpoint (`/api/upload`) marked as `@Public()`, allowing any unauthenticated user to upload arbitrary files. It also contained a functional bug where it attempted to call a non-existent method `uploadFile` on the `storageService`.
**Learning:** Publicly accessible upload endpoints are a high-risk vector for Remote Code Execution (RCE) and Denial of Service (DoS) if not properly restricted and validated. In this case, the endpoint was also broken, which might have hidden it from casual discovery but didn't reduce the risk.
**Prevention:** Never mark file upload endpoints as public by default. Always enforce authentication and specific permissions (e.g., `common:upload`). Ensure that storage service abstractions are correctly implemented and tested across the entire codebase.

## 2026-06-15 - [Inconsistent Secret Storage and Migration Regression]
**Vulnerability:** Found a regression where V3 API client secrets were being stored with plain SHA-256, which was inconsistent with the Argon2+AES-GCM pattern used for V2 keys. Also identified a dangerous stub in the OAuth `issueV2Token` middleware that could bypass authentication.
**Learning:** Hardening security patterns for existing credentials requires a robust fallback strategy. My initial fix broke authentication for "Encrypted Raw Secret" clients (the previous management standard) because Argon2 verification fails when run against non-Argon2 strings.
**Prevention:** When upgrading security for stored secrets, always implement a multi-layered validation logic that supports: 1. The new standard (Argon2+AES-GCM), 2. The immediate previous standard (Encrypted Raw), and 3. Any known legacy formats (Bcrypt, plain SHA-256). Verify changes with dedicated security test suites that cover all format permutations.

## 2026-06-16 - [Broken Access Control on Public Downloads]
**Vulnerability:** The V3 `PublicInvoiceController` had download endpoints for invoices and receipts that were publicly accessible via UUID without any token verification, leading to an IDOR (Insecure Direct Object Reference) vulnerability.
**Learning:** "Public" endpoints for sensitive documents should never be truly anonymous. They require a cryptographically signed "capability" token to ensure that only the intended recipient (who has the unique link) can access the resource.
**Prevention:** Enforce signed token verification on all public-facing resource access points. Always validate that the ID and resource type embedded in the token match the requested resource to prevent token reuse across different entities.

## 2026-06-19 - [Insecure Direct Object Reference (IDOR) in Payment Modules]
**Vulnerability:** Found that M-Pesa payment verification and initiation endpoints were missing organization isolation. Users could verify any transaction status or trigger STK pushes for other organizations by providing a different `organizationId`.
**Learning:** Secondary service modules (like payments or integrations) often lack the automatic organization scoping found in core modules. If controllers don't strictly enforce the authenticated context and pass it down to the service, it's easy to introduce cross-org IDOR vulnerabilities.
**Prevention:** Always use the authenticated `V2ApiContext` in controllers and pass the `organizationId` to every service method that performs database lookups. Use `findFirst({ where: { id, organizationId } })` instead of `findUnique({ where: { id } })` to enforce multi-tenancy at the query level.

## 2026-06-19 - [Multi-tenant Storage Isolation Leak]
**Vulnerability:** The storage system was using a single shared bucket (or dataset) for all organizations. The `UploadController` was not passing organization context to the storage service, leading to lack of infrastructure-level isolation and potential for cross-tenant data access if file names were guessed.
**Learning:** Security at the application layer (RBAC) is often insufficient if the underlying infrastructure (S3/Minio buckets) doesn't mirror the multi-tenant architecture. Incomplete implementations of "shared" services can easily bypass tenant boundaries.
**Prevention:** Always enforce organization-scoping at the lowest possible layer (e.g., bucket name or database schema). Ensure that the authenticated context (`V2ApiContext`) is explicitly passed down to all infrastructure providers.

## 2026-06-21 - [IDOR in Nested Relations & Multi-tenant Hardening]
**Vulnerability:** Found that `BakeryService.updateBaker` was allowing updates to any baker by ID without verifying the organization's ownership. This was because the model lacked a direct `organizationId` and the service wasn't checking the parent relation.
**Learning:** Models that are "nested" (linked to an organization via a settings or configuration model) are prime targets for IDOR because they lack a direct `organizationId` foreign key. Standard `findUnique` calls on these models often bypass tenant boundaries.
**Prevention:** Always verify ownership for nested models by querying through their relations (e.g., `where: { id, parent: { organizationId } }`). Additionally, harden the schema by adding `@@unique([id, organizationId])` to all multi-tenant models to facilitate atomic, organization-scoped queries.

## 2026-06-22 - [Insecure Direct Object Reference (IDOR) in M-Pesa Payment Module]
**Vulnerability:** The `MpesaController` was trusting client-provided `organizationId` in `initiateStkPush` and `verifyPayment` endpoints, allowing cross-tenant data access or manipulation.
**Learning:** External integrations often bypass standard tenant scoping filters if not explicitly coded to use the authenticated context. Trusting IDs from request bodies or parameters without verifying ownership is a classic IDOR pattern.
**Prevention:** Always use `@v2Context()` to retrieve the authenticated `organizationId` and use it as a mandatory filter in all database queries (`findFirst({ where: { id, organizationId } })`). Never trust client-provided tenant identifiers.

## 2026-06-24 - [IDOR in M-Pesa Webhooks and Outbound Call Vulnerabilities]
**Vulnerability:** M-Pesa C2B Confirmation webhooks were looking up transactions globally by `BillRefNumber` without verifying the organization's shortcode. STK Push callbacks were updating payments without verifying they belonged to the organization in the callback URL. Outbound API calls lacked timeouts/size limits.
**Learning:** Webhooks that use human-readable identifiers (like order numbers) are high-risk for cross-tenant collisions. Idempotency checks must also be scoped to the tenant. Outbound integration calls can be a DoS vector if not hardened.
**Prevention:** Always resolve the tenant context (e.g., via `BusinessShortCode`) before performing any business logic in unauthenticated webhooks. Scope all `update` and `find` operations with an explicit `organizationId`. Enforce strict `timeout` and `maxContentLength` on all outbound HTTP client instances.

## 2026-06-25 - [Insecure Direct Object Reference (IDOR) in Inventory Adjustments]
**Vulnerability:** The `InventoryService.adjustStock` method was looking up and updating `productVariantStock` records using only `variantId` and `locationId` without verifying the `organizationId`. This allowed any authenticated user to adjust stock for any organization if they knew the IDs. Other mutation methods were also missing `organizationId` in their `where` clauses.
**Learning:** Even when using `findFirst` with multiple filters, if the tenant identifier (`organizationId`) is missing, the query is not securely scoped. Prisma `update` and `delete` operations should also explicitly include `organizationId` in the `where` clause as a defense-in-depth measure, even when the primary key `id` is provided.
**Prevention:** Always include `organizationId` in the `where` clause for all database operations (read and write) in multi-tenant services. Destructure `organizationId` out of input `data` objects to prevent mass-assignment attacks that could reassign records to other tenants.
