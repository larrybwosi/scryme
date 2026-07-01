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

## 2026-07-01 - SSRF Bypass via IPv4-Mapped IPv6 Addresses
**Vulnerability:** The `isSafeIp` utility used for SSRF protection failed to detect restricted IPv4 addresses when provided in their IPv6-mapped format (e.g., `::ffff:127.0.0.1`).
**Learning:** Node.js networking utilities correctly identify these addresses as IPv6, but security filters that only check for specific IPv6 loopback patterns (like `::1`) will miss the embedded restricted IPv4 address. Attackers can use this to bypass SSRF protections that don't account for dual-stack address representations.
**Prevention:** Always check for and normalize IPv4-mapped IPv6 addresses (starting with `::ffff:`) by extracting the IPv4 portion and recursively validating it against the restricted IP blocklist. Ensure this logic is consistently applied across all shared security utilities.
