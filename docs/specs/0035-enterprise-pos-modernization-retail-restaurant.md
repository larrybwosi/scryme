# 0031 · Enterprise POS Modernization: Retail & Restaurant Architectures and V3 API Hardening

**Status**: Accepted
**Date**: 2026-11-07
**Authorized by**: User during /architect and /develop

## Context

The Scryme POS platform is deployed across dual operating environments:
1. High-throughput retail & supermarket checkout counters (`supermarket-pos.tsx`).
2. Fast-paced dine-in and quick-service restaurant environments (`pos.tsx`, `manage-tables-page.tsx`, `kitchen-display.tsx`, Tauri KDS hub).

Both variants rely on offline-first local SQLite caching (via Tauri `tauri_plugin_sql`) and synchronization with the NestJS V3 POS backend (`apps/api/src/v3/modules/pos`). A comprehensive examination of the POS system revealed several enterprise architectural weaknesses:

1. **V3 POS API Idempotency Vulnerability**:
   When network drops or timeouts occur after the server commits a transaction, client retries re-execute `ProcessSaleUseCase.execute()`. This creates duplicate transactions, duplicates financial ledgers, and causes double-decrementing of physical stock levels.
2. **Offline Queue Synchronization Latency**:
   The offline sync worker pushed pending sales one-by-one via individual HTTP POST requests (`push_single_sale`), inducing network round-trip overhead and connection pool exhaustion when syncing hundreds of queued sales after prolonged connectivity loss.
3. **Retail Supermarket Rapid Scanning & Pricing Limitations**:
   Supermarket cashiers require sub-second barcode entry, quantity multipliers (e.g. entering `12*7622210` to scan a whole case without scanning twelve times), and automatic parsing of variable-weight/price embedded scale barcodes (GS1 / EAN-13 prefixes 20–29 for deli, produce, and butchery scales).
4. **Restaurant Table Lifecycle & Course Firing Gaps**:
   Table state was binary (`available` vs `occupied`) without granular lifecycle tracking (`order_placed`, `check_printed`, `dirty`), lacking optimistic concurrency revision counters to prevent concurrent seating or bill generation conflicts across waiter tablets. Furthermore, KDS order dispatch lacked course firing tiers (`STARTER`, `MAIN`, `DESSERT`, `BEVERAGE`) and station routing.

## Architecture & Proposed Design

### 1. V3 POS API Enhancements (`apps/api/src/v3/modules/pos`)

#### Client Idempotency Tracking
- `ProcessSaleUseCase` accepts `idempotencyKey` / `saleId` (UUID) from the POS client.
- When processing a sale, `ProcessSaleUseCase` checks whether a transaction with the matching idempotency key already exists for the organization.
- If an existing transaction is detected, it immediately short-circuits and returns the existing transaction payload without re-inserting records or re-deducting stock.
- The `idempotencyKey` is stored in `Transaction.metadata.idempotencyKey` or queried by `number` / `metadata`.

#### Batch Sale Synchronization (`POST :orgSlug/pos/sales/batch`)
- Exposes a new high-throughput batch endpoint accepting an array of pending sales (`BatchProcessSaleDto`).
- Processes each sale within the tenant scope, capturing individual success or failure states (idempotency, validation errors) and returning a structured batch summary:
  ```json
  {
    "processed": 10,
    "successful": 10,
    "failed": 0,
    "results": [
      { "saleId": "uuid-1", "success": true, "transactionNumber": "POS-1001" },
      { "saleId": "uuid-2", "success": true, "transactionNumber": "POS-1002" }
    ]
  }
  ```

### 2. Retail Supermarket POS Engine (`apps/pos/src/pages/supermarket-pos.tsx`)

#### Barcode Multiplier & Variable Weight Parser
- Implements `parseBarcodeEntry(input: string)`:
  - Multiplier support: Formats like `5*0791051` or `3X0791051` extract a quantity of 5 and barcode `0791051`.
  - Embedded-Weight / Price Barcode (EAN-13 prefix 20–29):
    - Format: `PP IIIII WWWW C` (Prefix: 2 digits, Item Code: 5 digits, Weight/Value: 4 digits, Checksum: 1 digit).
    - Automatically decodes decimal weight or unit price from the barcode payload.
- Seamless continuous scanning: Rapid scans immediately increment quantity or add line items without UI lockup.

### 3. Restaurant POS & Table Lifecycle Management (`apps/pos`, `table_store.rs`, KDS)

#### Granular Table Status Lifecycle & Optimistic Locking
- Tables support state transitions:
  `AVAILABLE` → `OCCUPIED` → `ORDER_PLACED` → `CHECK_PRINTED` → `DIRTY` → `AVAILABLE`.
- Tables store `version: i64` (revision counter). Updates with mismatched version numbers fail with conflict warnings to prevent dirty writes between multiple server tablets.

#### Course Firing Metadata & Kitchen Station Routing
- Cart and KDS order items support `course`: `'STARTER' | 'MAIN' | 'DESSERT' | 'BEVERAGE'`.
- Kitchen Display System (KDS) allows chefs to bump individual courses or view tickets grouped by course preparation state.

## Implementation Skills
- `skills/architect`
- `skills/develop`
