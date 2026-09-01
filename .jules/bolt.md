## 2026-08-31 - [Concurrent Multi-Channel Notification Dispatching in NotificationEngine]
**Learning:** Delivering notifications across multiple channels (Webhook, Scryme Chat, Discord, Email) in a sequential `for...of` loop creates cumulative network blocking delays where total latency equals the sum of all HTTP/email request roundtrips ($O(C)$ latency). Furthermore, an unhandled exception in an early channel blocks delivery to all subsequent channels. Dispatching channels concurrently via `Promise.allSettled` reduces total latency to $\max(\text{channel latency})$ and isolates channel failures.
**Action:** Use `Promise.allSettled` when executing fan-out operations across independent external delivery channels to achieve $O(1)$ concurrent execution and fault isolation.

## 2026-08-21 - [Parallelizing Async Iterations in InvoiceAutomationService]
**Learning:** Sequential `for...of` loops awaiting external network operations (like notifications or workflow triggers) or database queries per entity create an $O(N)$ blocking latency bottleneck. Mapping over collections and awaiting them with `Promise.all` collapses execution time to $O(1)$ concurrent roundtrips.
**Action:** Replace sequential `for...of` async loops in batch services with `Promise.all(items.map(...))` to maximize concurrency while maintaining localized error handling.

## 2026-08-17 - [Parallel DB Queries and Map Indexing in WorkflowsService]
**Learning:** Performing sequential database queries (such as `windmillWorkflow.findMany` and `windmillConfiguration.findUnique`) in service methods introduces unnecessary network wait times. Additionally, performing linear search scans (`.find()`) inside mapping loops creates an $O(N \times M)$ CPU bottleneck. Combining independent queries via `Promise.all` and pre-indexing relational arrays into a `Map` structure converts execution to $O(1)$ constant-time lookups and $O(N + M)$ overall complexity.
**Action:** Always group independent read queries with `Promise.all` and pre-index collections into `Map` structures before mapping or filtering over lists.
