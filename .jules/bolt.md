## 2026-09-05 - [Chunked Concurrency for Bulk Imports in CRM Actions]
**Learning:** Unbounded `Promise.all` over arbitrarily large user input collections (such as bulk CSV customer imports) can exhaust database connection pools (e.g. Prisma's pool limit) and trigger connection timeouts. Processing items in controlled chunks (e.g. `CHUNK_SIZE = 10`) using a `for` loop over slices with `Promise.all` balances high concurrent performance ($O(N/10)$ vs $O(N)$) while protecting connection resources.
**Action:** Always use chunked batching (`CHUNK_SIZE = 10`) instead of unbounded `Promise.all` when processing user-controlled bulk collections or CSV uploads.

## 2026-08-21 - [Parallelizing Async Iterations in InvoiceAutomationService]
**Learning:** Sequential `for...of` loops awaiting external network operations (like notifications or workflow triggers) or database queries per entity create an $O(N)$ blocking latency bottleneck. Mapping over collections and awaiting them with `Promise.all` collapses execution time to $O(1)$ concurrent roundtrips.
**Action:** Replace sequential `for...of` async loops in batch services with `Promise.all(items.map(...))` to maximize concurrency while maintaining localized error handling.

## 2026-08-17 - [Parallel DB Queries and Map Indexing in WorkflowsService]
**Learning:** Performing sequential database queries (such as `windmillWorkflow.findMany` and `windmillConfiguration.findUnique`) in service methods introduces unnecessary network wait times. Additionally, performing linear search scans (`.find()`) inside mapping loops creates an $O(N \times M)$ CPU bottleneck. Combining independent queries via `Promise.all` and pre-indexing relational arrays into a `Map` structure converts execution to $O(1)$ constant-time lookups and $O(N + M)$ overall complexity.
**Action:** Always group independent read queries with `Promise.all` and pre-index collections into `Map` structures before mapping or filtering over lists.
