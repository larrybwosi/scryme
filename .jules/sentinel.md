# Sentinel Security Journal 🛡️

## 2025-05-15 - [Secured Public Upload Endpoint]
**Vulnerability:** The `/api/upload` endpoint in the NestJS API was marked with `@Public()`, allowing anyone to upload files to the server without authentication. Additionally, the Next.js proxy route for this endpoint did not perform its own session validation.

**Learning:** It's easy to overlook decorators like `@Public()` during development, especially for utility endpoints like file uploads. Proxy routes must also enforce security policies rather than blindly forwarding requests.

**Prevention:**
- Regularly audit all endpoints marked as `@Public()`.
- Ensure all proxy routes in the Next.js application validate sessions using `getServerAuth()` before forwarding requests to the internal API.
- Sanitize all user-provided data, including filenames, even when using unique identifiers like UUIDs.
- When proxying `multipart/form-data` requests, avoid forwarding the `Content-Type` header to let the backend `fetch` generate the correct multipart boundary.

## 2026-06-09 - [Redacted Sensitive Data in Request Logs]
**Vulnerability:** The global NestJS `onRequest` hook was logging raw request `body` and `query` objects, exposing sensitive fields like staff PINs, client secrets, and passwords in the server logs.

**Learning:** Global logging hooks are powerful but dangerous. They must always include a redaction layer to ensure that user-supplied data is sanitized before hitting the logs, especially for authentication and provisioning endpoints.

**Prevention:**
- Use a recursive redaction utility for any logging that involves entire request/response payloads.
- Maintain a centralized list of sensitive keys (`password`, `pin`, `secret`, `token`, etc.) to be masked.
- Prefer logging specific, safe fields over raw objects.

## 2026-06-09 - [ESM Module Resolution in Monorepo]
**Issue:** Packages using `moduleResolution: nodenext` or `node16` (like `packages/shared`) fail to build when importing from other workspace packages (like `packages/windmill`) if relative imports do not include explicit `.js` extensions.

**Learning:** TypeScript in ESM mode requires explicit file extensions for relative imports. While many tools hide this, strict `nodenext` resolution enforces it. This is particularly relevant when shared packages are consumed by both Next.js and NestJS.

**Prevention:**
- Always use `.js` extensions for relative imports in shared workspace packages that may be consumed by ESM-strict environments.
- Run `pnpm build` or `tsc` in the package itself to catch these errors early.
