# 0015. Enterprise Documents V3, Customization, Live Preview, and Automatic Configuration

**Date**: 2026-11-03
**Status**: Proposed

## Summary

This specification standardizes customer-facing and operational transaction documents (invoices, receipts, waybills, and delivery notes) on the V3 API architecture. It introduces a unified V3 documents controller, automatic configuration cascading from organization preferences, a live unsaved form customization preview interface in settings, and automatic cache invalidation for stored document attachments.

## Context

The platform provides document generation across several business operations including sales transactions, deliveries, and stocking transfers. Historically, document generation was fragmented: invoices and receipts were partially serviced by `/api/v3/public-invoices` while waybills, delivery notes, and packing lists relied on legacy `/api/v2/public/documents` routes. Furthermore, delivery notes lacked dedicated database configuration models, and settings customization previews only reflected previously saved database values rather than live, unsaved form changes.

To provide an enterprise-grade document solution, all primary transaction documents must route through unified V3 endpoints, automatically apply active organization branding and layout preferences, support instant live previewing of in-flight customizations, and invalidate stale cached PDF attachments whenever configuration changes occur.

## Requirements

### Acceptance Criteria

- **AC-1 (Data Model & Persistence)**:
  - Add `DeliveryNoteConfig` model in Prisma schema (`packages/db/prisma/schema/transactions.prisma`) with branding overrides (colors, company details, logo, visibility toggles).
  - Add `defaultDeliveryNoteTemplate` string field to `OrganizationSettings` with a sensible default (`delivery-note-v3`).
- **AC-2 (Unified V3 Documents API)**:
  - Expose a unified NestJS module and controller under `/v3/documents` and `/v3/public-documents` in `apps/api`.
  - Provide authenticated endpoints: `GET /v3/documents/:type/:id` (download / stream), `GET /v3/documents/preview/:type/:id` (inline preview), `GET /v3/documents/config/:type`, and `PUT /v3/documents/config/:type`.
  - Provide public authenticated endpoint: `GET /v3/public-documents/:type/:id?token=...` supporting invoices, receipts, waybills, and delivery notes.
  - Deprecate or delegate legacy V2 public document routing to the unified V3 engine.
- **AC-3 (Automatic Configuration Cascade & Cache Invalidation)**:
  - When rendering any document, the engine automatically resolves configuration in prioritized cascade:
    1. Document-specific configuration (`InvoiceConfig`, `ReceiptConfig`, `WaybillConfig`, `DeliveryNoteConfig`).
    2. Organization base defaults (name, address, email, phone, logo).
    3. Organization active template selection in `OrganizationSettings` (`defaultInvoiceTemplate`, `defaultReceiptTemplate`, `defaultWaybillTemplate`, `defaultDeliveryNoteTemplate`).
  - When document configurations or active templates are updated, any previously cached attachments with older timestamps must be invalidated and regenerated dynamically.
- **AC-4 (Live Customization Preview UI)**:
  - In `apps/web/app/settings/documents`, the configuration interface provides live interactive PDF previewing that reacts immediately to unsaved field changes (e.g., color pickers, text inputs, logo uploads, and toggle switches).
  - Live preview supports dynamic sample data rendering without requiring intermediate database writes.
- **AC-5 (End-to-End Sales & Fulfillment Integration)**:
  - Update `apps/web/app/api/sales/documents/[id]/route.ts` to call V3 public documents endpoints.
  - Update document actions and transaction detail tabs to support seamless document downloading, sharing, and inline preview.

## Decision

We introduce a dedicated `DocumentsModule` in `apps/api/src/v3/modules/documents` alongside schema extensions in `packages/db`. Live unsaved form customizations are streamed directly into client-side preview renderers in `@repo/documents` without round-tripping to persistent storage until explicitly saved.

### Database Schema Updates

```prisma
model DeliveryNoteConfig {
  id             String       @id @default(cuid())
  organizationId String       @unique
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  showLogo Boolean @default(true)
  logoUrl  String?

  primaryColor   String?
  secondaryColor String?
  companyName    String?
  companyAddress String?
  companyEmail   String?
  companyPhone   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([organizationId])
  @@map("delivery_note_config")
}
```

## Build plan

1. Add `DeliveryNoteConfig` and `defaultDeliveryNoteTemplate` in `packages/db/prisma/schema/` and run `pnpm --filter @repo/db generate`. (AC-1)
2. Update `@repo/documents` and `@repo/shared` with delivery note configuration types, live mock generator helpers, and branding cascading. (AC-3, AC-4)
3. Implement `DocumentsModule`, `DocumentsController`, `PublicDocumentsController`, and `DocumentsUseCase` under `apps/api/src/v3/modules/documents`. (AC-2, AC-3)
4. Mount `DocumentsModule` in `apps/api/src/v3/v3.module.ts`. (AC-2)
5. Update server actions in `apps/web/app/actions/document-config.ts` and routes in `apps/web/app/api/sales/documents/[id]/route.ts`. (AC-2, AC-5)
6. Enhance `document-config-form.tsx`, `invoice-config-form.tsx`, and `enhanced-settings.tsx` to support real-time unsaved customization previewing. (AC-4)
7. Write automated tests for V3 document generation and live preview data resolution. (AC-2, AC-3)

## Consequences

**Positive**:
- Full architectural alignment on V3 API with zero dependency on V2 document endpoints.
- Instant feedback during branding and template customization eliminates trial-and-error configuration.
- Consistent typography, colors, and layout across invoices, receipts, waybills, and delivery notes.

**Negative / tradeoffs**:
- Real-time client PDF re-rendering introduces minor client-side CPU load during rapid form typing, mitigated via debouncing.
