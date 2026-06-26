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
