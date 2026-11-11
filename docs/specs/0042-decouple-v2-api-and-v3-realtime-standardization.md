# 0042 · Decouple V2 API and V3 Realtime Standardization

**Status**: Accepted
**Date**: 2026-11-11
**Area**: API Architecture, Realtime Services, Multi-tenancy

## Context & Problem Statement
The Scryme platform previously relied on legacy V2 API controllers, modules, and realtime socket gateways that were tightly coupled into core backend modules (`CommonModule`, `ApiRealtimeService`, exceptions filters, and interceptors). Realtime broadcasts concurrently published to both V2 and V3 socket gateways, while client applications like POS pairing maintained legacy socket connection URLs. Additionally, shared errors and context types were imported directly from `@repo/shared/api/v2`, impeding complete deprecation and removal of the V2 subsystem.

## Architectural Changes

### 1. Decoupled Realtime Service and Gateway
- **Single Gateway Source**: Migrated `ApiRealtimeService` in `apps/api/src/common/services/realtime.service.ts` to strictly inject and publish events through `V3RealtimeGateway` and V3 `RealtimeRedisService`.
- **Common Module Independence**: Replaced legacy `RealtimeModule` (from v2) in `CommonModule` (`apps/api/src/common/common.module.ts`) with `V3CommonModule`.

### 2. Client Realtime Socket Connections Standardized on V3
- All client applications (`apps/pos`, `apps/projects`, and `@repo/shared/realtime`) connect exclusively to the `/v3` socket namespace.
- POS device setup pairing in `apps/pos/src/pages/set-up.tsx` now normalizes the API base URL and connects directly to `${cleanSocketBaseUrl}/v3`.

### 3. Decoupled Shared Errors and Context
- Exported neutral `ApiError` and `ValidationError` under `@repo/shared/errors` and re-exported from `@repo/shared`.
- Updated `AllExceptionsFilter`, `AuthorizationGuard`, and image controllers (`ImageController`, `ShortUrlController`) to resolve authentication and tenant contexts neutrally (`v3Context`, tenant headers, or user session) rather than strictly requiring `v2Context`.
- Removed stale `V2AuthGuard` imports from V3 controllers (e.g. `ReportsController`).

### 4. Optional & Isolatable V2 Module
- Introduced `ENABLE_V2_API` in `@repo/env` (defaulting to `true` for backwards-compatible migration).
- Guarded `V2Module` import, Swagger V2 documentation generation, and `v2` routing tree conditionally in `app.module.ts` and `main.ts`.
- Created native `V3HealthModule` (`/api/v3/health`, `/api/v3/health/ping`, `/api/v3/health/enhanced`) and updated container health checks (`Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`) to use `/api/v3/health`.

## Verification & Testing
- Vitest unit tests in `apps/api` passing for `ApiRealtimeService`, `V3RealtimeGateway`, `V3HealthController`, `AuthorizationGuard`, `AllExceptionsFilter`, and `ImageController`.
