# 0016. Product and Variant Lifecycle Documentation

**Date**: 2025-05-18
**Status**: Accepted

## Summary

This specification establishes complete operational documentation for platform operators and store managers on creating, updating, managing variants, archiving, and restoring catalog products in Scryme. It documents the user interface workflows available in the web dashboard, explains the difference between soft archiving, disabling, and permanent deletion, and defines the content architecture in the documentation app. By providing step by step guidance with safeguards and business rules, store managers can manage multi variant inventories without risk of data loss.

## Context

Inventory management in Scryme is multi tenant and location aware. Products serve as parent catalog items with classifications, brand definitions, media galleries, and search engine optimization metadata. Every product contains one or more product variants that hold SKUs, barcodes, pricing structures, stocking units, expiration warnings, serial number tracking, and inventory batches.

Previously, store operators and platform managers lacked a unified operational manual within the documentation application (`apps/docs`). Questions routinely arose concerning:
- How initial stock and automatic batch creation behave upon product creation versus manual adjustments.
- How to add variants with custom attribute matrices (such as color, size, and material) and hardware barcode scanner integration.
- How multi tier selling units relate to base stocking units (such as boxes of twelve versus individual pieces).
- The behavioral difference between disabling an item (soft deactivation), archiving an item (removing from active sales channels into the archive vault), and permanently deleting records.
- How to revert accidental updates using snapshot audit logs.

Documenting these workflows in both structured Markdown files under `apps/docs/content/inventory/` and an interactive guide route in `apps/docs` ensures operators can self serve and safely manage store catalogs.

## Requirements

**User stories**:
- As a store manager, I want clear instructions on adding new products with auto generated SKUs and initial stock batches so that items are immediately sellable and auditable.
- As an inventory operator, I want to understand how to add variants with custom attributes, barcodes, and expiry rules so that multi variant items are properly tracked.
- As a platform admin, I want documented procedures for archiving, disabling, restoring, and reverting products so that catalog integrity is preserved without breaking historic sales.

**Acceptance criteria**:
- **AC-1**: Document the complete Product Creation workflow from the Web UI ProductSheet, including required fields, SKU/slug uniqueness debouncing, category selection, piece unit defaults, and initial stock batch generation.
- **AC-2**: Document Product Variant Management, including adding secondary variants, hardware barcode scanner listener behavior (timing thresholds and enter key simulation), custom attribute key value pairs, expiration warning thresholds, and serial number tracking flags.
- **AC-3**: Document the Update and Multi Unit Pricing workflows, covering selling unit multipliers, gross margin calculation indicators, reorder points, and supplier linking.
- **AC-4**: Document Product Lifecycle State Transitions (Active, Disabled/Inactive, Archived, Deleted), detailing the cascade to product variants, visibility in POS and active inventory lists, restoration from `/inventory/archived`, and state reversion via audit logs.
- **AC-5**: Create comprehensive Markdown files under `apps/docs/content/inventory/` organized into dedicated topical files plus an overview index.
- **AC-6**: Implement an interactive, readable documentation route in `apps/docs` (`/docs/inventory-lifecycle`) and register it in the navigation sidebar and search index.

## Options considered

### Option 1: Standalone developer API docs only

Document only the REST / V3 API endpoints (`/v3/catalog/products`) using OpenAPI / Scalar.

**Pros**:
- Requires less descriptive UI walkthrough documentation.

**Cons**:
- Fails the core requirement of serving platform operators and store managers who interact directly with the web application dashboard rather than cURL or API tokens.

### Option 2: Embedded UI guides and markdown files in the docs app (Chosen)

Create structured Markdown files under `apps/docs/content/inventory/` paired with an interactive operator guide in `apps/docs`.

**Pros**:
- Provides clear step by step operator instructions with UI illustrations, callouts, and safeguards.
- Markdown files can be read directly in the repository or rendered by documentation generators.
- Directly accessible from the Scryme developer and operator docs interface with search integration.

**Cons**:
- Requires maintaining both markdown content and route layout components.

## Decision

**Chosen option**: Option 2: Embedded UI guides and markdown files in the docs app.

We will create a structured content directory `apps/docs/content/inventory/` containing dedicated markdown guides for each lifecycle phase, and implement a dedicated guide route in `apps/docs/src/routes/docs.inventory-lifecycle.tsx` with sidebar navigation in `apps/docs/src/routes/__root.tsx`.

## Feature design

**Data model sketch**:
- `Product`: Parent catalog record with `name`, `sku` (unique per org), `slug` (unique per org), `categoryId`, `isActive`, `isArchived`, `type` (FINISHED_GOOD, RAW_MATERIAL, MERCHANDISE), `imageUrls`, `customFields`.
- `ProductVariant`: SKU, barcode, buyingPrice, retailPrice, wholesalePrice, reorderPoint, reorderQty, requiresExpiryTracking, requiresSerialNumber, baseUnitId, stockingUnitId.
- `VariantSellingUnit`: Selling unit conversions linked to `SystemUnit` or `OrganizationUnit` with `conversionMultiplier`.
- `StockBatch`: Batch number, receivedDate, purchasePrice, initialQuantity, currentQuantity.
- `AuditLog`: Performed by actor with JSON snapshots (`previousState`, `afterState`) enabling one click state reversion.

**State transitions**:
- `Active`: Visible in POS, storefronts, and `/inventory` active table.
- `Disabled (Inactive)`: `isActive = false`, hidden from customer sales but visible in inventory table with inactive badge.
- `Archived`: `isArchived = true`, `isActive = false`, variants cascaded to `isActive = false`. Removed from `/inventory` and moved to `/inventory/archived`. Restorable with one click.
- `Deleted`: Permanently removed from database. Only permitted if no foreign key constraints (like completed sales transactions or active POs) prevent deletion.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Product creation | Initial StockBatch and StockMovement | Derived from `initialStock` and `buyingPrice` inputs in ProductSheet |
| Barcode scanning | Populated variant barcode | Read from keystrokes in hardware scanner listener (<45ms interval) |
| Margin display | Gross margin percentage | Computed: `((retailPrice - buyingPrice) / retailPrice) * 100` |
| Restore product | Reverted attributes and prices | Sourced from `AuditLog.details.snapshot` |

## Build plan

1. Author markdown guides in `apps/docs/content/inventory/`:
   - `index.md`: Architecture overview and lifecycle summary, satisfies **AC-5**
   - `create-product.md`: Product creation, categories, units, and stock batches, satisfies **AC-1**
   - `manage-variants.md`: Variant configuration, scanner, attributes, and safeguards, satisfies **AC-2**
   - `update-and-pricing.md`: Product edits, selling units, margins, and suppliers, satisfies **AC-3**
   - `archive-and-restore.md`: Disabling, archiving, restoring, and audit reversion, satisfies **AC-4**
2. Create TanStack Router route `apps/docs/src/routes/docs.inventory-lifecycle.tsx`, satisfies **AC-6**
3. Update `apps/docs/src/routes/__root.tsx` navigation and search index, satisfies **AC-6**
4. Verify TypeScript compilation and production build for `apps/docs`, satisfies **AC-6**

## Consequences

**Positive**:
- Store managers and platform operators have clear, actionable documentation for daily catalog tasks.
- Prevents accidental data deletion by clarifying the differences between disabling, archiving, and deletion.
- Standardizes hardware barcode scanner conventions across store locations.

**Negative / tradeoffs**:
- Requires ongoing documentation updates whenever new fields or inventory actions are added.
