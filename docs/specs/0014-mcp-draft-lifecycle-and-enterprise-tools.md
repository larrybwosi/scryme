# 0012. MCP Draft Lifecycle, Change Staging, Rollback, and Enterprise Tools

**Date**: 2026-11-03
**Status**: Accepted

## Summary

This specification extends the Scryme Model Context Protocol (MCP) server architecture with a robust Staging and Draft Change Set engine (`McpDraftChange`), enabling AI agents and automated assistants to stage proposed mutations (Product Catalog, Orders & Fulfillment, Staff Task Assignments), review JSON diffs, preview impact, publish changes live in ACID transactions with explicit confirmation, and safely revert applied changes using recorded snapshot state.

## Context

As AI assistants (Claude Desktop, Cursor, autonomous agents) are granted write permissions in enterprise Scryme workspaces, direct uncontrolled database mutations introduce significant risks of unintended catalog modifications, erratic pricing changes, erroneous order creation, or incorrect staff task assignments. 

To ensure safety, enterprise auditability, and human-in-the-loop oversight, mutations must support a staged draft lifecycle:
1. Proposed mutations are recorded as structured draft changes.
2. Changes can be inspected via diff previews.
3. Mutations can be published live with atomic database transactions when confirmed (`publish_draft` with `confirm: true` or `autoPublish: true`).
4. Past applied changes can be cleanly reverted (`revert_draft` with `confirm: true`) by restoring original snapshots or cancelling created entities.

## Requirements

### Acceptance Criteria

- **AC-1 (Prisma McpDraftChange Model)**:
  - Persistent model storing `organizationId`, `entityType` (`PRODUCT`, `PRICE`, `ORDER`, `FULFILLMENT`, `STAFF_TASK`), `action` (`CREATE`, `UPDATE`, `STATUS_CHANGE`), `status` (`DRAFT`, `APPLIED`, `REVERTED`, `DISCARDED`), `targetId`, `payload`, `previousState`, `diffSummary`, `appliedAt`, `revertedAt`, and audit metadata (`createdById`).
- **AC-2 (Draft Management Tools)**:
  - `list_drafts`: View pending drafts and change history with optional status and entity filters.
  - `get_draft_diff`: Retrieve structured before/after diffs and payload comparison for a staged draft.
  - `publish_draft`: Executes the staged mutation within a database transaction, records `previousState` snapshot, marks status `APPLIED`, requiring explicit parameter `confirm: true`.
  - `revert_draft`: Restores the previous state or cancels/archives the created entity using snapshot data, marks status `REVERTED`, requiring explicit parameter `confirm: true`.
  - `discard_draft`: Discards an unapplied staged draft, preventing execution.
- **AC-3 (Product Catalog Tools)**:
  - `create_product`: Stage creation of a product with category, SKU, name, description, and initial variants. Supports `autoPublish: boolean`.
  - `update_product`: Stage updates to product attributes, name, description, or status. Supports `autoPublish: boolean`.
  - `update_product_price`: Stage price modifications (retailPrice, wholesalePrice, buyingPrice) on product variants. Supports `autoPublish: boolean`.
- **AC-4 (Orders & Fulfillment Tools)**:
  - `create_order`: Stage sales order / transaction creation with customer, line items, and fulfillment location. Supports `autoPublish: boolean`.
  - `update_order_status`: Stage transition of transaction status (`PENDING_CONFIRMATION`, `CONFIRMED`, `PROCESSING`, `CANCELLED`, etc.). Supports `autoPublish: boolean`.
  - `fulfill_order`: Stage creation or status update of order fulfillment. Supports `autoPublish: boolean`.
- **AC-5 (Staff Task Assignment Tools)**:
  - `create_staff_task`: Stage task creation with title, description, priority, and due date. Supports `autoPublish: boolean`.
  - `assign_staff_task`: Stage member assignment to a staff task. Supports `autoPublish: boolean`.
  - `update_staff_task_status`: Stage staff task status update (`TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`). Supports `autoPublish: boolean`.
- **AC-6 (Tenant Isolation & Security)**:
  - Every draft lookup, creation, execution, and rollback is strictly filtered by `organizationId`. Cross-tenant draft modification or execution is blocked with 404/403 errors.

## Data Model Design

```prisma
enum McpDraftStatus {
  DRAFT
  APPLIED
  REVERTED
  DISCARDED
}

enum McpDraftEntityType {
  PRODUCT
  PRICE
  ORDER
  FULFILLMENT
  STAFF_TASK
}

enum McpDraftAction {
  CREATE
  UPDATE
  STATUS_CHANGE
}

model McpDraftChange {
  id             String             @id @default(cuid())
  organizationId String
  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  entityType     McpDraftEntityType
  action         McpDraftAction
  status         McpDraftStatus     @default(DRAFT)

  targetId       String?            // Target record ID if updating existing entity
  summary        String             // Human-readable summary of proposed change
  payload        Json               // Proposed mutation parameters
  previousState  Json?              // Snapshot of state prior to execution (for rollback)
  diffSummary    Json?              // Computed field-by-field before/after comparison

  createdById    String?
  createdByMember Member?           @relation("McpDraftCreator", fields: [createdById], references: [id], onDelete: SetNull)

  appliedAt      DateTime?
  revertedAt     DateTime?
  discardedAt    DateTime?

  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  @@index([organizationId, status])
  @@index([organizationId, entityType])
  @@map("mcp_draft_change")
}
```

## Reversion Strategy

1. **For UPDATE / STATUS_CHANGE**:
   - The snapshot `previousState` is applied back to the entity (e.g. restoring variant prices, restoring previous order status, restoring task assignment).
2. **For CREATE**:
   - For `PRODUCT`: Sets `isArchived: true` and `isActive: false`.
   - For `ORDER`: Sets `status: CANCELLED` and `cancelledAt: new Date()`.
   - For `STAFF_TASK`: Sets `status: CANCELLED`.
   - For `FULFILLMENT`: Sets `status: CANCELLED`.
