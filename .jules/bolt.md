## 2026-08-21 - [Parallelizing Async Iterations in InvoiceAutomationService]
**Learning:** Sequential `for...of` loops awaiting external network operations (like notifications or workflow triggers) or database queries per entity create an $O(N)$ blocking latency bottleneck. Mapping over collections and awaiting them with `Promise.all` collapses execution time to $O(1)$ concurrent roundtrips.
**Action:** Replace sequential `for...of` async loops in batch services with `Promise.all(items.map(...))` to maximize concurrency while maintaining localized error handling.

## 2026-09-05 - [Chunked Concurrency for Bulk Imports in CRM Actions]
**Learning:** Unbounded `Promise.all` over arbitrarily large user input collections (such as bulk CSV customer imports) can exhaust database connection pools (e.g. Prisma's pool limit) and trigger connection timeouts. Processing items in controlled chunks (e.g. `CHUNK_SIZE = 10`) using a `for` loop over slices with `Promise.all` balances high concurrent performance ($O(N/10)$ vs $O(N)$) while protecting connection resources.
**Action:** Always use chunked batching (`CHUNK_SIZE = 10`) instead of unbounded `Promise.all` when processing user-controlled bulk collections or CSV uploads.

## 2026-08-17 - [Parallel DB Queries and Map Indexing in WorkflowsService]
**Learning:** Performing sequential database queries (such as `windmillWorkflow.findMany` and `windmillConfiguration.findUnique`) in service methods introduces unnecessary network wait times. Additionally, performing linear search scans (`.find()`) inside mapping loops creates an $O(N \times M)$ CPU bottleneck. Combining independent queries via `Promise.all` and pre-indexing relational arrays into a `Map` structure converts execution to $O(1)$ constant-time lookups and $O(N + M)$ overall complexity.
**Action:** Always group independent read queries with `Promise.all` and pre-index collections into `Map` structures before mapping or filtering over lists.

## 2026-09-15 - [Decoupling External Network Emissions from Prisma Transactions]
**Learning:** Awaiting external HTTP/event emissions (such as Windmill workflow triggers or webhooks) inside active Prisma `$transaction` blocks unnecessarily holds database connections and row locks open for the full duration of external network roundtrips. Moving event emissions outside `$transaction` callbacks allows database transactions to commit and release connection pool resources immediately.
**Action:** Always execute and commit database mutations inside `$transaction` first, then trigger non-critical external event emissions or webhooks outside the transaction scope.

## 2026-10-03 - [Consolidating In-Memory Aggregations Before Concurrent Prisma Upserts]
**Learning:** Parallelizing database writes with `Promise.all` across collections containing duplicate target entities (e.g., multiple stock reception items sharing the same `variantId`) can cause Prisma unique constraint violations (`P2002`) or row lock contentions if the target record doesn't exist yet and multiple concurrent `create` operations are attempted. Aggregating quantities per entity ID in-memory first collapses $M$ duplicate queries into 1 consolidated update per entity.
**Action:** Always aggregate line item quantities in-memory by primary/unique key before executing concurrent database writes inside Prisma transactions.

## 2026-10-06 - [Batching Reads and Pre-associating Stock Batches in bulkUpdateLocationStock]
**Learning:** Performing sequential per-item database lookups (`findUnique`) and post-creation update queries (updating adjustments/movements after batch creation) inside loops creates $O(N)$ database query roundtrips. Batch pre-fetching entities into `Map` lookups up-front and creating `stockBatch` records prior to adjustment/movement insertions allows passing `stockBatchId` directly during creation, collapsing database roundtrips from $O(8N)$ to $O(1)$.
**Action:** Always pre-fetch relational records into Map lookups up-front and structure creation ordering so foreign keys (like batch IDs) can be supplied directly on initial record insertion instead of issuing follow-up update queries.

## 2026-10-07 - [Chunked Concurrency for Interactive Prisma Transactions]
**Learning:** Unbounded `Promise.all` inside an interactive Prisma transaction callback (`tx`) floods Prisma's internal connection pipeline with un-throttled queries, leading to transaction timeouts (`P2028: Transaction is expired`) or lock contention under large payloads. Controlled chunking (`CHUNK_SIZE = 10`) balances ~10x concurrent speedups while preventing transaction timeouts and connection pipeline exhaustion.
**Action:** Always use chunked concurrency (`CHUNK_SIZE = 10`) when performing multi-item mutations inside Prisma interactive transactions (`tx`).

## 2026-10-08 - [Batched Verification and Concurrent Provisioning in AutomationService]
**Learning:** Calling seeding/verification routines like `ensureBuiltInDefinitions` on hot paths (e.g., every `getDefinitions` request) with sequential `findUnique` queries causes $O(N)$ DB latency per request. Pre-fetching existing definitions in 1 batched `findMany` with key filtering and selectively inserting missing entities in parallel collapses read queries from $O(N)$ to $O(1)$.
**Action:** Always replace per-item `findUnique` existence checks in hot path seeding/initialization helpers with a single batched `findMany` query.

## 2026-10-09 - [Concurrent Template Upserts in Meta Integration Sync]
**Learning:** Sequential `for...of` loops performing database upserts during third-party integration template synchronization (such as Meta Graph API WhatsApp message templates) create $O(N)$ sequential blocking delays. Since Meta API returns unique `[name, language]` template entries per organization, parallelizing template upserts with `Promise.all` collapses sync latency from $O(N)$ sequential roundtrips to $O(1)$ concurrent execution.
**Action:** Always parallelize third-party API template sync upserts with `Promise.all` when unique natural/composite keys guarantee no intra-batch lock contention or unique constraint collisions.

## 2026-10-10 - [Parallelizing Ingredient Unit Resolution in ProductionService]
**Learning:** Sequential `for...of` loops resolving relational or unit metadata (`resolveUnitId`) for multi-item entities (such as bakery recipe ingredients) generate $O(N)$ sequential database roundtrips. Parallelizing item unit resolution with `Promise.all` collapses execution time to $O(1)$ concurrent roundtrips while preserving exact item order and validation error behavior.
**Action:** Always replace sequential `for...of` async unit/entity resolution loops in multi-item creation and update handlers with `Promise.all(items.map(async ...))`.
