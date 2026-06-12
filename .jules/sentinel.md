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
