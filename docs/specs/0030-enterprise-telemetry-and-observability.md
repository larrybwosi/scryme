# 0030. Enterprise Telemetry and Observability Standard

**Date**: 2026-11-05
**Status**: Proposed

## Summary

This specification establishes a unified enterprise telemetry collection architecture across Scryme client web applications (`apps/web`, `apps/crm`, `apps/admin`, `apps/projects`, and `apps/pos`). Operating on a dual observability model, the system pairs OpenObserve for high frequency system operational logs, performance metrics, and client unhandled error reporting with OpenPanel for user interaction tracking and product analytics. Sensitive data and PII (emails, phone numbers, auth credentials, financial secrets) are masked at the client transport boundary, and all telemetry events are scoped with multi-tenant organization identifiers.

## Context

Scryme powers mission critical retail POS, bakery production, warehouse logistics, CRM, and ERP workflows across distributed web and desktop clients. Previously, telemetry collection was fragmented:
- POS had an embedded OpenObserve transport (`apps/pos/src/lib/openobserve.ts`) and OpenPanel wrapper (`apps/pos/src/lib/openpanel.tsx`).
- CRM had basic OpenPanel client helpers (`apps/crm/lib/openpanel.ts`).
- Web, Admin, and Projects lacked unified error telemetry and performance metrics ingestion into OpenObserve, and Projects lacked OpenPanel provider integration in its root layout.
- There was no shared, reusable telemetry client library in `@repo/shared` for web applications, leading to duplicated code or unmonitored surfaces.
- Telemetry events risked leaking unmasked customer PII or lacking tenant isolation metadata necessary for multi-tenant incident diagnosis and audit compliance.

To achieve enterprise operational visibility, we require a standardized, zero external runtime dependency telemetry package exported from `@repo/shared/telemetry` with automatic PII masking, client error catching, navigation web vitals tracking, tenant scoping, and batching transports for OpenObserve and OpenPanel.

## Requirements

**User stories**:
- As a systems reliability engineer, I want client web applications to dispatch structured logs, unhandled errors, and performance events to OpenObserve so that runtime anomalies can be diagnosed in real-time.
- As a product owner, I want consistent user engagement and page transition telemetry tracked in OpenPanel across all web apps (`apps/web`, `apps/crm`, `apps/admin`, `apps/projects`) so that feature adoption is visible.
- As an enterprise compliance officer, I want customer emails, phone numbers, payment tokens, and sensitive keys automatically masked before telemetry dispatch so that PII leakage is prevented.
- As a multi-tenant administrator, I want all telemetry scoped with `organizationId` so that logs and metrics can be filtered per tenant in observability dashboards.

**Acceptance criteria**:
- **AC-1**: `@repo/shared` exports a modular telemetry library (`@repo/shared/telemetry`) featuring:
  - `OpenObserveClient` supporting memory queueing, batching, retry with exponential backoff, offline persistence via `localStorage`, and beacon flush on unload.
  - Robust PII sanitization helper (`maskSensitiveData`) that scrubs emails, phone numbers, JWTs, M-Pesa tokens, and passwords from telemetry payloads.
  - Multi-tenant contextual scoping (`setTelemetryContext`, `clearTelemetryContext`) attaching `organizationId`, `userId`, `role`, and `service`.
  - Unified dual observability dispatchers (`trackTelemetryEvent`, `trackTelemetryError`, `trackTelemetryPerformance`).
- **AC-2**: `packages/env` environment schema provides complete typing and fallbacks for `NEXT_PUBLIC_OPENOBSERVE_*` and `NEXT_PUBLIC_OPENPANEL_*` variables.
- **AC-3**: `apps/projects` layout incorporates telemetry initialization and provider components alongside `apps/web`, `apps/crm`, and `apps/admin`.
- **AC-4**: Global error boundaries and window error / unhandled promise rejection listeners in web applications dispatch sanitized error diagnostics to OpenObserve.
- **AC-5**: Comprehensive unit tests verify PII masking, event batching, tenant isolation tagging, and dual dispatch behavior in `@repo/shared`.

## Decision

Adopt the **Dual Observability Architecture (Option B)**:
1. **OpenObserve** serves as the system backbone for high frequency operational logs, frontend exceptions, API response timing metrics, and performance metrics.
2. **OpenPanel** serves as the product analytics layer for user interactions, navigation paths, and feature adoption.
3. Centralize core telemetry logic in `@repo/shared/src/telemetry/` and export it via package exports `@repo/shared/telemetry`.
4. Deploy shared React telemetry providers (`TelemetryProvider`) in Next.js web apps (`apps/web`, `apps/crm`, `apps/admin`, `apps/projects`) to capture unhandled window errors and performance marks while respecting tenant context.

## Build plan

1. Implement `maskSensitiveData` utility and test suite in `@repo/shared/src/telemetry/sanitizer.ts`, satisfies **AC-1**, **AC-5**.
2. Implement enterprise `OpenObserveClient` in `@repo/shared/src/telemetry/openobserve.ts`, satisfies **AC-1**, **AC-5**.
3. Implement dual telemetry unified interface in `@repo/shared/src/telemetry/index.ts` and add export `./telemetry` in `packages/shared/package.json`, satisfies **AC-1**.
4. Update `@repo/env` to normalize and export public OpenObserve client variables (`NEXT_PUBLIC_OPENOBSERVE_ORGANIZATION`, `NEXT_PUBLIC_OPENOBSERVE_STREAM`, `NEXT_PUBLIC_OPENOBSERVE_AUTH_TOKEN`), satisfies **AC-2**.
5. Implement client-side `TelemetryProvider` and unhandled error capture hooks in `packages/shared/src/telemetry/provider.tsx`, satisfies **AC-3**, **AC-4**.
6. Integrate telemetry provider in `apps/projects`, `apps/web`, `apps/crm`, and `apps/admin`, satisfies **AC-3**, **AC-4**.
7. Write Vitest tests covering PII masking, batching, tenant isolation, and error tracking in `@repo/shared/src/telemetry/__tests__/telemetry.spec.ts`, satisfies **AC-5**.

## Consequences

**Positive**:
- Centralized, DRY observability architecture across all Scryme client web applications.
- Automatic PII scrub prevents regulatory compliance violations (GDPR, Kenya DPA).
- Sub-second operational insight into frontend client errors and performance bottlenecks in OpenObserve.
- Full backwards compatibility with existing POS and backend OpenPanel integrations.

**Negative / tradeoffs**:
- Modest local storage footprint (~10-50KB) for offline event caching in browsers.
- Network requests for telemetry batches when online (mitigated by batching and flush intervals).

## Follow-up

- [ ] Add OpenObserve dashboard presets for client error distributions grouped by tenant and browser version.
