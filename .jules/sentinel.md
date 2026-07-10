## 2025-05-14 - Sensitive Data Leakage in Global Exception Logs
**Vulnerability:** The global `AllExceptionsFilter` was logging raw `Error` objects directly to server logs and OpenObserve, bypassing the redaction utility for `instanceof Error` cases.
**Learning:** `Error` objects frequently encapsulate sensitive context (e.g., database query parameters, request bodies, or internal configurations) in non-enumerable properties that standard loggers might still capture. Bypassing redaction for `Error` instances creates a significant risk of PII or secret exposure in monitoring tools.
**Prevention:** Ensure the central redaction utility explicitly handles `Error` objects by using `Object.getOwnPropertyNames` to find and redact sensitive metadata before any exception is passed to a logging service. Always redact before logging, never after.

## 2025-05-15 - Authorization Bypass in Realtime WebSocket Gateways
**Vulnerability:** The V2 and V3 Realtime Gateways allowed clients to join any channel or publish arbitrary data to any channel without organization-level authorization checks.
**Learning:** WebSocket gateways in NestJS operate outside the standard global HTTP guards. Even if a connection is authenticated, individual event handlers (like `@SubscribeMessage("publish")`) can be exploited to inject data into other tenants' channels if they don't explicitly validate the channel ownership against the socket's authenticated context.
**Prevention:** Always verify authentication tokens in `handleConnection` and attach the payload to the socket object. Implement a centralized `validateChannelAccess` method and apply it to every sensitive message handler (`join`, `publish`, `presence`) to ensure strict multi-tenant isolation.

## 2025-05-16 - Sensitive Data Leakage in Request Logging
**Vulnerability:** The debug request logger in the API entry point was susceptible to leaking sensitive headers (like session cookies) if it used a deny-list approach for redaction.
**Learning:** Shared redaction utilities often use a deny-list of sensitive keys. While useful for body/query objects, applying them to entire header objects is risky because new or less common sensitive headers (e.g., `Set-Cookie`, `X-Auth-Token`) might be missed. An allow-list approach for logging headers is significantly safer.
**Prevention:** For diagnostic logging of HTTP headers, always use a strict allow-list of safe headers to log (e.g., `user-agent`, `content-type`, `x-correlation-id`). Pass even the allowed sensitive headers (like `authorization`) through a redaction utility as a second layer of defense.

## 2026-06-29 - SSRF Vulnerability in Webhook and Image Services
**Vulnerability:** Outbound HTTP requests in the `WebhookProcessor` and `ImageService` were fetching user-provided URLs without IP-level validation, allowing for Server-Side Request Forgery (SSRF).
**Learning:** Validating only the hostname or protocol is insufficient for SSRF protection as it doesn't account for hostnames that resolve to internal or reserved IP addresses (e.g., `169.254.169.254` for cloud metadata). A robust check must resolve the hostname and verify the resulting IP.
**Prevention:** Always resolve destination hostnames using `dns.lookup` and validate the resolved IP against a blocklist of private, loopback, and metadata ranges before initiating any outbound HTTP request. Centralize this logic in an `isSafeUrl` utility.
## 2026-06-29 - Case-Insensitive Redaction in Logging Utility
**Vulnerability:** The `redactSensitiveData` utility used case-sensitive matching for sensitive keys. This allowed sensitive data (like `Password` or `API_KEY`) to leak into logs if the keys didn't exactly match the lowercase entries in the deny-list.
**Learning:** Security utilities that rely on key matching must be case-insensitive to account for different naming conventions (PascalCase, camelCase, UPPER_CASE) and potential manual overrides. Relying on case-sensitive `includes()` or `hasOwnProperty()` is insufficient for security-critical redaction.
**Prevention:** Always normalize keys (e.g., `.toLowerCase()`) before performing lookups in sensitive data filters. Use efficient data structures like `Set` for these lookups to maintain performance while ensuring comprehensive coverage.
## 2025-05-17 - Case-Sensitivity in Data Redaction
**Vulnerability:** The central `redactSensitiveData` utility performed case-sensitive key matching, meaning sensitive fields like `Password` or `Secret-Key` (common in HTTP headers) would bypass redaction if the utility was only configured for lowercase versions.
**Learning:** Redaction utilities must be case-insensitive by default when handling data from sources with non-standard casing (like HTTP headers or third-party webhooks). Relying on exact string matches creates a bypass vector for data leakage into logs.
**Prevention:** Always normalize keys to lowercase before comparison in redaction utilities. For performance in recursive traversals, use a `Set` of lowercase sensitive keys.
## 2026-06-28 - SSRF Vulnerability in Webhooks and Notifications
**Vulnerability:** The V3 Webhooks module and the shared NotificationEngine were delivering payloads to user-provided URLs without validating if they pointed to internal/private network resources.
**Learning:** Outbound requests to URLs provided by users or stored in configurations are primary targets for SSRF attacks. Relying on simple string checks for "localhost" is insufficient as attackers can use DNS-resolved IPs (e.g., `127.0.0.1`, `10.0.0.1`) or IPv6 loopback addresses to bypass filters and access internal metadata services or APIs.
**Prevention:** Always use a robust URL validation utility like `isSafeUrl` (implemented in `@repo/shared/server`) that resolves the hostname via DNS and verifies that the resulting IP address does not fall within private, loopback, or reserved ranges. Apply this validation to all modules performing outbound HTTP(S) requests to external endpoints.

## 2025-05-18 - Sensitive Data Leakage at Recursion Depth Limit
**Vulnerability:** The `redactSensitiveData` utility leaked raw objects and arrays when they exceeded the `maxDepth` limit, as the recursion would stop and return the remaining data as-is without further inspection.
**Learning:** Security-critical recursion must never "fail open" by returning raw data when limits are reached. If a data structure is too deep to inspect, it must be considered potentially sensitive and replaced with a placeholder.
**Prevention:** Ensure recursive sanitization utilities return a safe placeholder (e.g., `[Object]` or `[Array]`) when the recursion depth limit is exceeded, rather than returning the original data.
## 2026-06-30 - Sensitive Data Leakage at Redaction Depth Limit
**Vulnerability:** The `redactSensitiveData` utility returned raw data when the recursion depth exceeded `maxDepth`. This allowed sensitive keys nested deeper than the limit to be leaked in plaintext to logs.
**Learning:** Recursion limits in security-sensitive utilities must fail closed or return a safe placeholder. Returning the original data as a fallback bypasses the security purpose of the utility.
**Prevention:** Always return a redaction placeholder or a truncated/safe representation when a recursion or iteration limit is reached in data processing utilities designed for security.

## 2026-07-01 - SSRF Vulnerability in Storage Download Streams
**Vulnerability:** `StorageService.getDownloadStream` performed outbound requests to arbitrary URLs using a default `axios` implementation without validating if the URLs pointed to internal or private resources.
**Learning:** Even internal helper methods in storage services can be vectors for SSRF if they perform outbound requests based on URLs that might originate from external data sources (like attachment records). Security checks must be applied at the common entry point of such methods to ensure all execution paths (provider-specific or default) are covered.
**Prevention:** Always validate outbound URLs using a robust utility like `isSafeUrl` before performing any network requests. For complex services with multiple providers, place the validation at the highest possible level (e.g., the service entry point) to ensure consistent protection across all implementations.
## 2026-07-01 - SSRF Bypass via IPv4-Mapped IPv6 Addresses
**Vulnerability:** The `isSafeIp` utility used for SSRF protection failed to detect restricted IPv4 addresses when provided in their IPv6-mapped format (e.g., `::ffff:127.0.0.1`).
**Learning:** Node.js networking utilities correctly identify these addresses as IPv6, but security filters that only check for specific IPv6 loopback patterns (like `::1`) will miss the embedded restricted IPv4 address. Attackers can use this to bypass SSRF protections that don't account for dual-stack address representations.
**Prevention:** Always check for and normalize IPv4-mapped IPv6 addresses (starting with `::ffff:`) by extracting the IPv4 portion and recursively validating it against the restricted IP blocklist. Ensure this logic is consistently applied across all shared security utilities.

## 2025-05-19 - IDOR Vulnerability in M-Pesa Payment Module
**Vulnerability:** The `MpesaService.validate` and `verifyPayment` methods were performing lookups for `UnclaimedPayment` and `MpesaPaymentRequest` using only transaction identifiers, allowing cross-tenant data access.
**Learning:** In a multi-tenant architecture, identifiers that are unique within a single provider (like M-Pesa transaction codes) are not sufficient for secure authorization. Failing to include the `organizationId` in database queries allows an authenticated user from one organization to probe or claim transactions belonging to another.
**Prevention:** Always scope database lookups for sensitive entities using the authenticated `organizationId`. Use explicit unit tests to verify that `where` clauses in repositories and services include the necessary tenant isolation filters.
## 2026-07-02 - SSRF Bypass via Multi-IP Hostnames
**Vulnerability:** The `isSafeUrl` utility only validated the first IP address returned by `dns.lookup`. An attacker could use a hostname resolving to both a safe and an unsafe IP to bypass the check.
**Learning:** Security utilities performing DNS-based validation must account for hostnames resolving to multiple IP addresses. Validating only the first returned address is insufficient as the application's HTTP client might choose a different (unsafe) IP from the resolved list.
**Prevention:** Always use `dns.lookup` with the `{ all: true }` option and iterate through all resolved IP addresses to ensure every single one is safe before allowing the request.

## 2026-07-05 - IDOR and Mass Assignment in Bakery Baker Management
**Vulnerability:** The `BakeryService.addBaker` method lacked verification that the provided `memberId` belonged to the authenticated `organizationId`, allowing an attacker to add any member from any organization as a baker. Additionally, both `addBaker` and `updateBaker` were susceptible to mass assignment of internal fields like `bakerySettingsId`.
**Learning:** In multi-tenant systems, every foreign key provided by a user (like `memberId`) must be validated against the current tenant's scope before being used in a write operation. Furthermore, using spread operators (`...data`) in Prisma `create`/`update` calls without explicit whitelisting can expose internal fields to unauthorized modifications.
**Prevention:** Always perform a scoped lookup for foreign keys (e.g., `member.findFirst({ where: { id: memberId, organizationId } })`) before persisting a record that references them. Use explicit destructuring or a whitelist to select only allowed fields from user input before passing them to the database layer.

## 2025-05-20 - IDOR Vulnerability in M-Pesa and Delivery Utilities
**Vulnerability:** Scoped lookups for `UnclaimedPayment`, `Transaction`, and `Fulfillment` were using `findUnique` with only the record ID, bypassing `organizationId` checks in multi-tenant environments.
**Learning:** Prisma's `findUnique` only enforces multi-field uniqueness if a composite unique index (`@@unique`) exists. In this codebase, many models lack `@@unique([id, organizationId])`, so `where: { id, organizationId }` in `findUnique` is often invalid or ignored in favor of just `id`. This allows an authenticated user to access records from other tenants if they know or guess the ID.
**Prevention:** Always use `findFirst` instead of `findUnique` when performing tenant-scoped lookups for models that do not have a composite unique index on `[id, organizationId]`. Explicitly include `organizationId` in the `where` clause of every sensitive lookup.

## 2025-05-21 - Role Escalation and Self-Modification in Member Management
**Vulnerability:** `MemberUseCase` allowed any user with `members:write` permissions to promote themselves or others to `OWNER`/`ADMIN` roles and delete or deactivate their own accounts.
**Learning:** Standard permission-based guards (e.g., `members:write`) are often insufficient for sensitive operations like role promotion or account deletion in multi-tenant environments. Without granular checks on the actor's role and target record, a low-privileged user with write access can escalate privileges or orphan an organization.
**Prevention:** Implement explicit role-based authorization within service logic for sensitive field updates (like `role`). Restrict promotion to administrative roles to `OWNER`s only and enforce self-protection logic to prevent users from deleting or deactivating their own memberships at the application layer.

## 2025-05-22 - Mass Assignment and IDOR in Inventory Service
**Vulnerability:** The `InventoryService` mutation methods (`createInventoryItem`, `updateInventoryItem`, `createInventoryMovement`) used unrestricted spread operators for user-provided data and lacked ownership validation for related IDs.
**Learning:** Spread operators (`...data`) in Prisma mutations allow attackers to overwrite sensitive internal fields like `organizationId` or `id`. Furthermore, accepting a record ID (e.g., `inventoryId`) in a URL or body without verifying it belongs to the authenticated `organizationId` leads to IDOR vulnerabilities, especially when using `create` or `updateMany` which may bypass single-record ownership checks if not explicitly filtered.
**Prevention:** Always use explicit field whitelisting for user input before passing it to database layers. For every foreign key or related record ID provided by the user, perform a scoped lookup (e.g., `findFirst({ where: { id, organizationId } })`) to verify ownership before performing a write operation that depends on that relationship.
## 2026-07-08 - Enforcement of Transitive Ownership for Linked Models
**Vulnerability:** Models without a direct `organizationId` (e.g., `ProductVariant`, `ProductSupplier`) were being updated using only their primary IDs, allowing cross-tenant data modification if the ID was known.
**Learning:** In multi-tenant systems where some models are linked to a tenant via a parent (transitive ownership), relying on a previous scoped lookup is insufficient if the subsequent `update` operation uses only the primary ID. Prisma's `update` does not automatically inherit filters from previous `findFirst` calls in the same transaction.
**Prevention:** Always perform an explicit existence check using scoped relation filters (e.g., `{ product: { organizationId } }`) before proceeding with an update on models lacking a direct tenant foreign key. Ensure the update operation itself or the logic leading to it is strictly aborted if the check fails.

## 2026-07-09 - IDOR and Mass Assignment in CRM V3 API
**Vulnerability:** The V3 CRM module allowed creating records with `objectId` and `ownerId` belonging to other organizations. Additionally, several services used spread operators (`...dto`) in Prisma `create` calls, exposing the models to mass assignment of internal fields.
**Learning:** Even with global multi-tenancy guards, individual fields that reference other entities (like object definitions or members) must be explicitly validated against the current tenant's scope. Spread operators in mutations are dangerous as they can bypass intended field restrictions.
**Prevention:** Always perform scoped lookups for every user-provided ID (foreign keys) before persisting them. Replace spread operators with explicit field mapping in Prisma `data` blocks to enforce a strict whitelist of modifiable fields.
## 2026-07-08 - IDOR Vulnerability in Checkout Process
**Vulnerability:** The `CheckoutUseCase.execute` method was fetching a `Cart` using only its `id`, allowing any authenticated user to potentially checkout any other user's cart if they knew the `cartId`.
**Learning:** Even if a model (like `Cart`) is considered "temporary" or "transactional", it must still enforce multi-tenant isolation. Relying on `id` alone for lookups in a multi-tenant environment is a classic IDOR vector, especially when composite unique indexes on `[id, organizationId]` are missing.
**Prevention:** Always scope database lookups using the authenticated `organizationId`. Use `findFirst` with both `id` and `organizationId` in the `where` clause to ensure strict isolation, and verify this pattern in integration tests.

## 2026-07-10 - IDOR Prevention in Bulk Lookups
**Vulnerability:** `BakeryService.completeBatch` fetched multiple `StockBatch` records using only their IDs in a `findMany` query, allowing users to consume stock from batches belonging to other organizations.
**Learning:** Scoping a `findMany` query with `organizationId` is necessary but not sufficient for IDOR protection if the application doesn't also verify that *all* requested IDs were found. If some IDs belong to another tenant, they will simply be omitted from the result set, and the application might proceed with a partial or incorrect state if it doesn't explicitly check the count.
**Prevention:** When performing bulk lookups by ID in a multi-tenant environment, always include the `organizationId` in the `where` clause AND verify that `results.length === new Set(requestedIds).size`. This ensures that every requested resource exists and belongs to the authorized tenant.

## 2026-07-09 - IDOR and Multi-tenant Stock Manipulation in Assembly Management
**Vulnerability:** The `AssemblyUseCase` allowed users to create assemblies referencing product variants and stock batches from other organizations. Upon completion, the system would decrement stock from these foreign records. Additionally, the target `locationId` for production output was trusted from the request body without ownership validation.
**Learning:** High-level "transactional" use cases often assume that since an entity (like an Assembly) is owned by a tenant, all its related entities or subsequent operational parameters (like locations) are also safe. In multi-tenant systems, every ID provided at every stage of a multi-step process must be validated against the tenant context.
**Prevention:** Always perform bulk validation (e.g., using `count`) for all user-provided foreign keys during record creation. For operational methods, explicitly verify that all parameters (like `locationId`) belong to the authenticated `organizationId` and use scoped updates (`updateMany` with `organizationId`) for defense in depth.
## 2026-07-09 - Invitation Hijacking and Mass Assignment in Member Invitations
**Vulnerability:** `InvitationUseCase.acceptInvitation` lacked verification that the authenticated user's email matched the invitation recipient's email, allowing anyone with the token to join an organization. Additionally, `createInvitation` was vulnerable to mass assignment due to the use of a spread operator on user-provided DTOs.
**Learning:** In token-based systems, the token itself is often treated as sufficient proof of authorization. However, for sensitive operations like joining a multi-tenant organization, the identity of the token bearer must still be validated against the intended recipient's identity (e.g., email) to prevent hijacking. Furthermore, spread operators in Prisma `create` calls without explicit field whitelisting remain a persistent risk for mass assignment of internal or unauthorized fields.
**Prevention:** Always validate the authenticated user's email against the `email` field in the invitation before processing an acceptance. Use explicit field destructuring or mapping for all user-provided data in Prisma mutations to prevent mass assignment of sensitive fields like `organizationId` or custom internal flags.

## 2026-07-10 - IDOR Vulnerability in V3 Public Financial Documents
**Vulnerability:** The V3 `PublicInvoiceController` provided document download endpoints (`/download`) that accepted database IDs without any token verification or organization scoping. This allowed unauthenticated access to sensitive invoices and receipts from any tenant.
**Learning:** New API versions (V3) can inadvertently regress on security patterns established in older versions (V2) if central security utilities aren't strictly enforced at the routing layer. Public endpoints must never rely on guessable IDs alone, even if they are marked as "public" for sharing purposes.
**Prevention:** Always require a signed document token for unauthenticated access to sensitive records. Implement a "belt and suspenders" approach by validating the token in the controller and enforcing strict `organizationId` scoping in the service/use-case layer using `findFirst` instead of `findUnique`.
## 2026-07-09 - Authorization Bypass via Missing Decorators (Fail-Open)
**Vulnerability:** The central `AuthorizationGuard` was returning `true` (allowing access) when neither permissions nor scopes were defined on a handler or its controller class, unless it was a newly created controller explicitly annotated. This created a fail-open default where forgotten or newly registered endpoints were public-by-default to any authenticated user.
**Learning:** Default-allow is a common but extremely critical vulnerability pattern. A secure-by-default (fail-closed) paradigm should always be enforced. If an endpoint requires authentication but is not explicitly declared as public (`@AllowPublic`) or annotated with specific permissions/scopes, the guard must throw a `ForbiddenException` to prevent accidental exposure.
**Prevention:** Enforce default-deny (fail-closed) behavior in the main `AuthorizationGuard`. Any route that is not marked public must define either `permissions` or `scopes`. Additionally, verify that a security context exists on the request before processing checks.
