## 2025-05-14 - Sensitive Data Leakage in Global Exception Logs
**Vulnerability:** The global `AllExceptionsFilter` was logging raw `Error` objects directly to server logs and OpenObserve, bypassing the redaction utility for `instanceof Error` cases.
**Learning:** `Error` objects frequently encapsulate sensitive context (e.g., database query parameters, request bodies, or internal configurations) in non-enumerable properties that standard loggers might still capture. Bypassing redaction for `Error` instances creates a significant risk of PII or secret exposure in monitoring tools.
**Prevention:** Ensure the central redaction utility explicitly handles `Error` objects by using `Object.getOwnPropertyNames` to find and redact sensitive metadata before any exception is passed to a logging service. Always redact before logging, never after.

## 2025-05-15 - Authorization Bypass in Realtime WebSocket Gateways
**Vulnerability:** The V2 and V3 Realtime Gateways allowed clients to join any channel or publish arbitrary data to any channel without organization-level authorization checks.
**Learning:** WebSocket gateways in NestJS operate outside the standard global HTTP guards. Even if a connection is authenticated, individual event handlers (like `@SubscribeMessage("publish")`) can be exploited to inject data into other tenants' channels if they don't explicitly validate the channel ownership against the socket's authenticated context.
**Prevention:** Always verify authentication tokens in `handleConnection` and attach the payload to the socket object. Implement a centralized `validateChannelAccess` method and apply it to every sensitive message handler (`join`, `publish`, `presence`) to ensure strict multi-tenant isolation.
