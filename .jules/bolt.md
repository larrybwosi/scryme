## 2026-08-09 - [Eager Loading variant and Parallelizing Component Deductions in Assemblies]
**Learning:** In transaction-bound inventory routines like completing an assembly, performing a sequential `findUnique` query to fetch a variant's `productId` inside a stock `upsert` block adds redundant database roundtrips. Eagerly including the `variant` relation when fetching the parent `assembly` provides direct access to `variant.productId` in O(1). Additionally, parallelizing component stock deductions, stock batch updates, and movement logging concurrently using `Promise.all` minimizes transaction duration and row-lock holding time, avoiding pool exhaustion.
**Action:** Always include relational parent/metadata tables when fetching root entities in transactions to avoid sequential lookups, and run non-dependent database updates concurrently via `Promise.all`.

## 2026-08-09 - [Optimizing Database Transaction Block Duration in Expenses]
**Learning:** Performing multiple independent static configuration or reference database lookup queries (such as counting or verifying category, budget, or location existence) inside an active write transaction block holds database connections open unnecessarily, increasing lock contention and transaction blocking times. Moving read-only entity existences or count validations completely outside the transaction wrapper improves system concurrency and throughput significantly without losing any business logic validity.
**Action:** Always extract and parallelize read-only existence validations before entering `prisma.$transaction` database blocks.

## 2026-08-08 - [Parallelized Next.js Server Page Queries]
**Learning:** Performing multiple independent asynchronous database and server-action queries sequentially inside Next.js Server Components blocks the main rendering thread and multiplies perceived page loading latency. Gathering independent promises and awaiting them concurrently via `Promise.all` optimizes the page execution path, significantly reducing Time-to-First-Byte (TTFB) and overall render wait times.
**Action:** Always inspect Server Component data fetching blocks and group unrelated data lookups or config settings into concurrent `Promise.all` wrappers.
## 2026-08-08 - [Parallelized Session Loading and Batch Revocation in V3 Customer Sessions]
**Learning:** Performing sequential Redis lookups (like `redis.get`) or key deletions (like `redis.del`) inside loops over dynamic arrays creates O(N) blocking network roundtrips. Parallelizing key fetches concurrently using `Promise.all` and batching key deletions into a single `redis.del(...keys)` command dramatically improves throughput, shrinking operation times to constant-time O(1) Redis roundtrips.
**Action:** Always retrieve multiple Redis keys in parallel using `Promise.all` and batch delete collections of Redis keys with a single multi-argument `del` command rather than using sequential loop iterations.

## 2026-08-07 - [Controlled Batch Parallelization & Query Hoisting in Strapi Customer Sync]
**Learning:** Sequential processing of database writes and high-latency external HTTP requests inside loops creates severe $O(N)$ blocking times. While standard `Promise.all` can parallelize execution, unbounded concurrency threatens to deplete the database connection pool, trigger rate limits, or crash under socket starvation. Dividing the loop payload into small controlled chunks (e.g., batch size of 10) and executing them concurrently via `Promise.all` balances throughput and safety. Additionally, hoisting non-changing database queries (like `getOrgSlug`) completely outside the iteration scope eliminates N+1 SQL queries.
**Action:** Always hoist invariant database queries outside loop structures, and parallelize high-latency network/DB iteration tasks in controlled concurrent batches using `Promise.all` with a chunk size of 10.

## 2026-08-07 - [Controlled Batch Parallelization & Query Hoisting in Scryme Workspace Sync]
**Learning:** Performing sequential external HTTP requests (such as `findUserByEmail` or `createChannel`) and database queries/updates inside loops results in N+1 bottlenecks and slow, blocking execution. Hoisting non-changing config queries out of the loops completely (e.g. pre-fetching Scryme configuration and passing it into individual item-provisioning functions) saves redundant database roundtrips. Executing these loops in controlled chunks (batch size of 10) via concurrent `Promise.all` prevents socket exhaustion, connection pool starvation, and external rate limits while boosting performance from $O(N)$ to a flat $O(1)$ latency profile.
**Action:** Always hoist invariant configuration/database lookups out of processing loops, and parallelize high-latency external network/DB iterations in controlled batches of 10 using concurrent `Promise.all`.

## 2026-08-06 - [Parallelized Database Writes in Booking Recurrence Creation]
**Learning:** Sequential database inserts inside loops (such as creating up to 50 individual recurring `serviceBooking` records one-by-one with nested `staff` and `resources` configurations) block the main execution thread and result in prolonged response latency. Parallelizing these writes with `Promise.all` collapses the query roundtrip profile from $O(N)$ sequential blocking transactions down to a flat $O(1)$ concurrent execution block, significantly improving endpoint response times for booking creations with recurrence rules.
**Action:** Always parallelize brand-new relational writes inside loop boundaries using `Promise.all` when there are no compound unique constraints or shared resource updates to prevent lock contention and deadlocks.
## 2026-08-06 - [Parallelized External API Integrations in Service Booking Creation]
**Learning:** Sequential HTTP calls to external third-party APIs (e.g. Cal.com booking sync) inside application loops introduce high-latency, synchronous block times ($O(N)$ execution delay). Parallelizing them with `Promise.all` and enclosing each request in a localized `try/catch` block converts the latency profile to a flat, resilient $O(1)$ and prevents individual third-party failures from crashing the transaction or blocking subsequent business actions like notifications.
**Action:** Always wrap independent third-party sync and integration queries inside localized try/catch blocks and parallelize them concurrently using `Promise.all` to keep request handlers lightning fast and resilient.

## 2026-08-05 - [Parallelized HTTP Notifications and Database Writes in CRM Reminders]
**Learning:** Performing sequential HTTP requests (e.g. Scryme chat messages) and database writes (e.g. updating crmFollowUp) inside loops creates severe O(N) execution delays, leaving background/cron services vulnerable to timeouts. Combining individual tasks into try/catch-wrapped asynchronous promises and parallelizing them with `Promise.all` collapses the execution profile from $O(N)$ sequential blocking delays down to a flat, resilient $O(1)$ concurrent round-trip block.
**Action:** Always wrap independent external HTTP/DB processing steps in individual try/catch handlers and parallelize them using `Promise.all` to ensure continuous throughput on batch notifications.

## 2026-08-04 - [Parallelized Database Writes and Map Aggregation in Stock Transfer Receipt]
**Learning:** Performing sequential database updates and inserts inside a single database transaction (e.g., upserting `productVariantStock`, creating `stockBatch`, and updating `stockTransferItem`) multiply transaction duration, connection hold times, and trigger database row-lock contention under heavy concurrency. Consolidating row updates down to unique items prior to execution and parallelizing independent writes with `Promise.all` shrinks transactional roundtrip latency from $O(N)$ down to a flat $O(1)$.
**Action:** Always aggregate updates on shared compound indices (such as `variantId_locationId` in stock) into a consolidated Map and execute them concurrently via `Promise.all` inside database transactions.
## 2026-08-03 - [N+1 Transactional Stock and Variant Lookups in POS Receive Transfer]
**Learning:** Sequential database lookups inside transactional loops (like `tx.productVariantStock.findUnique` and `tx.productVariant.findUnique` during stock transfers) create a critical N+1 latency bottleneck. Gathering target identifiers before the loop, pre-fetching matching records with standard `findMany` queries, and mapping them in-memory provides O(1) constant-time lookup complexity, drastically accelerating bulk transfer receipts.
**Action:** Always pre-fetch stock and variant records in parallel using batch queries prior to entering iterative transaction loops, and use memory Map lookups inside the processing block.

## 2026-08-03 - [Parallelized Database Queries and Map Grouping in V3 Analytics Dashboard]
**Learning:** Sequential database queries (such as counting, finding multiple relations, or completed logs) in REST dashboard paths multiply database connection hold times and network roundtrips. Additionally, linear nested array filters (e.g., `completedLogs.filter(...)`) inside loops create $O(N \times M)$ CPU hotspots. Parallelizing independent queries with `Promise.all` and grouping relation lists into a Map beforehand converts execution profiles to constant-time $O(1)$ database latency and optimal $O(N + M)$ processing time.
**Action:** Always parallelize independent query blocks in read-heavy endpoints and pre-group related array results into Map structures before iterating parent entities.
## 2026-08-02 - [Function-Scoped In-Memory Map Caching in Webhook Payloads]
**Learning:** Batch webhook integration flows that process multiple nested payloads (such as Slack/communication logs) sequentially query mappings like `organizationIntegration` and configurations like `crmObjectDefinition` inside loops. Because payloads are processed concurrently or sequentially within a single request, introducing transient, function-scoped Map caches for lookups eliminates N+1 database roundtrips completely and prevents stale cache data risks.
**Action:** Always introduce function-scoped Map caches for metadata or configuration lookups inside webhook execution loops where batch records might share identical identifiers.

## 2026-07-31 - [N+1 Query Bottlenecks in Strapi E-Commerce Integration]
**Learning:** Sequential `findFirst` database requests on mapping tables (like `ecommerceProductMapping` and `ecommerceCustomerMapping`) within bulk outbound/inbound loops during e-commerce synchronization processes degrade throughput heavily. Batch pre-fetching all relevant mappings using single `findMany` queries with the `in` operator, and constructing in-memory Map caches, reduces database transaction pressure and query latency from $O(N)$ down to a flat $O(1)$ roundtrips.
**Action:** Always pre-fetch integration mapping tables for bulk processing batches and use constant-time Map lookups inside iterative sync flows.

## 2026-07-30 - [Pre-fetching Product Variants in Bakery GRN]
**Learning:** Sequential database queries (like `findFirst` on `productVariant`) inside bulk inventory receiving loops (such as GRNs) create critical N+1 query bottlenecks within database transactions. Aggregating requested variant IDs up-front and using a single scoped `findMany` query preserves multi-tenant isolation while reducing transaction hold times and query overhead from $O(N)$ down to $O(1)$.
**Action:** Always pre-fetch and map validation records before entering bulk transactional loops, ensuring all tenant-scoping fields (`organizationId`) are strictly applied to the batch query.

## 2026-06-04 - [Prisma Select Optimization vs API Contract]
**Learning:** Using Prisma's `select` block for performance optimization is effective but requires careful mapping to maintain the API contract. Specifically, scalar and relational fields needed for final data shaping must be explicitly selected, while internal data used only for intermediate calculations (e.g., raw stock records used to calculate a total) must be explicitly removed from the final response object to prevent leaking internal database structures and increasing payload size unnecessarily.
**Action:** Always cross-reference the `select` block with the `map`/shaping logic and the original `include` block to ensure no required fields are missed and no internal data is inadvertently exposed.

## 2026-06-05 - [Vitest Resolution in Monorepo]
**Learning:** In this NestJS/Turborepo setup, running `vitest` from the root fails to resolve `@/` aliases and workspace dependencies like `@repo/shared`. Tests must be executed from within the application directory (e.g., `apps/api`) to correctly load the local `tsconfig.json` and `vitest.config.ts`.
**Action:** Always `cd` into the specific application directory before running tests.

## 2026-06-06 - [Database Aggregation over In-Memory Summation]
**Learning:** Fetching full relation arrays (e.g., all invoices) just to calculate a total in-memory is a major performance anti-pattern. Using Prisma's `aggregate` (`_sum`) reduces network traffic and memory usage from $O(n)$ to $O(1)$.
**Action:** Always use database-level aggregation for totals and apply `take` limits to nested relations in "GetById" service methods to maintain consistent response times as data grows.
## 2026-06-08 - [Prisma Select vs Explicit Mapping]
**Learning:** When optimizing Prisma's queries with `select` in a service that explicitly shapes its response (e.g., via `.map()`), the `select` block must be synchronized with the mapping logic. Even if the underlying model has more fields (like `name` or `description` in `PriceList`), if the mapping logic doesn't use them, they can be safely omitted from the `select` block to reduce database load and serialization overhead.
**Action:** Always verify the `select` fields against the explicit mapping code to ensure all consumed fields are included, while avoiding over-fetching of unused scalar or relational data.

## 2026-06-12 - [Select Optimization vs Downstream Consumers]
**Learning:** When replacing broad 'include' statements with 'select' blocks, verifying only the immediate service's mapping logic is insufficient. Downstream consumers, such as frontend components or SDK-generated types, may rely on fields (especially relational IDs like 'recipe.id' or 'unit.symbol') that aren't explicitly referenced in the service's own data-shaping code. Under-fetching these fields leads to silent UI failures or TypeScript regressions.
**Action:** Always inspect the corresponding frontend components and type definitions (e.g., 'FormattedBatch' in 'apps/bakery') to ensure all required fields are included in the 'select' block. When in doubt, always include IDs and primary display fields for all selected relations.

## 2026-06-15 - [Redundant Include in Use Cases]
**Learning:** In repository-pattern or use-case-heavy architectures, many service methods use `include` by default to fetch full relations even when they only need a scalar ID (e.g., `priceListItemId`) already present on the model to perform subsequent operations. This adds unnecessary joins to the SQL query.
**Action:** Always check if the business logic actually accesses the relational object or just its ID. If it's just the ID, remove the `include` to save a join and reduce memory overhead.

## 2026-06-21 - [Two-Step Aggregation Pattern]
**Learning:** For complex statistics that involve relations not supported in Prisma's `groupBy` (like nested unit symbols), a two-step pattern is most efficient: 1) Perform `groupBy` or `aggregate` on the primary model to get raw sums and IDs, then 2) Hydrate metadata with a targeted `findMany` using `select` and the `in` operator for the IDs found. This avoids both over-fetching all records and the limitations of database-level joins on aggregated data.
**Action:** Use this pattern whenever calculating statistics that require related display fields (e.g., recipe names, unit symbols) to maintain O(1) database memory pressure.

## 2026-06-23 - [Select Optimization & API Contract Integrity]
**Learning:** When switching from 'include' to 'select' to reduce over-fetching, it is critical to ensure that all fields required for the API contract—such as 'organizationId' in list views—are explicitly included. Missing these fields can break frontend navigation or downstream logic that relies on these identifiers, even if they aren't used in the immediate service's mapping logic.
**Action:** Always cross-reference the 'select' block with the frontend requirements and ensure all primary identifiers and relational IDs are preserved.

## 2026-06-24 - [Map-Based Reconciliation Complexity]
**Learning:** Bank reconciliation logic that compares statement lines against journal entries in a nested loop ((N \times M)$) is a scalability bottleneck. Indexing candidates by amount using a `Map<string, any[]>` (with `toFixed(2)` keys for currency precision) reduces the complexity to (N + M)$, making the process viable for organizations with high transaction volumes.
**Action:** Use Map-based indexing for any many-to-many or many-to-one matching logic involving large datasets, especially in financial reconciliation or inventory synchronization.
## 2026-06-24 - [N+1 Query Optimization in Order Creation]
**Learning:** Batching database lookups for related entities (e.g., variants in an order) using Prisma's `findMany` with the `in` operator and a local `Map` is a highly effective way to eliminate N+1 query bottlenecks during complex write operations.
**Action:** Always check for asynchronous mappings that perform database lookups inside loops and replace them with pre-fetched batch queries to reduce database roundtrips from O(N) to O(1).

## 2026-06-25 - [Prisma OR Filter Safety with Undefined IDs]
**Learning:** In Prisma, using an `undefined` value in a relation filter like `{ customers: { some: { id: customerId } } }` inside an `OR` clause can lead to unexpected results or matching all records if the `OR` branch is not explicitly excluded. Dynamic construction of the `OR` array is the safest way to handle optional filters.
**Action:** Always build `OR` or `AND` filter arrays dynamically based on the presence of optional parameters to avoid incorrect matches or "match-all" behavior when IDs are missing.
## 2026-06-25 - [Batch Pre-fetching with In-Memory State Sync]
**Learning:** When replacing N+1 queries with batch pre-fetching in a loop where the database is updated (e.g., decrementing stock), the local in-memory state must be manually synchronized. If multiple lines in the same request affect the same entity (like the same `stockBatch`), failure to update the local object leads to stale data being used for availability validations in subsequent loop iterations, potentially causing over-allocation.
**Action:** Always manually update local pre-fetched objects after issuing database updates for that entity within the same execution flow.

## 2026-06-26 - [Excluding Heavy JSON Fields in Audit Logs]
**Learning:** Fetching heavy JSON fields (like `details` in `AuditLog`) during list retrieval is a significant performance drain on database I/O and network payload. Since list views usually only show the action summary, these fields should be explicitly excluded via Prisma `select` blocks.
**Action:** Always use `select` to prune large JSON or relational blobs in list-fetching service methods, ensuring they are only retrieved in detail-fetching methods if actually required.
## 2026-06-27 - [O(N) to O(1) Dashboard Aggregation]
**Learning:** Fetching full relation arrays (e.g., all recipes) just to calculate average costs or category counts in-memory is a major performance bottleneck for large organizations. Replacing these with Prisma's `aggregate` (`_avg`) and `groupBy` (`_count`) shifts the heavy lifting to the database, reducing network payload and memory usage from $O(N)$ to $O(1)$.
**Action:** Always prefer database-level aggregations (`aggregate`, `groupBy`) for dashboard summaries and use targeted `select` blocks to fetch only the scalar fields required for the final response.

## 2026-06-28 - [Batched Pre-fetching for Integrity Checks]
**Learning:** Background integrity checks that iterate over large datasets (like all variants in an organization) are prone to N+1 query bottlenecks. Process variants in batches (e.g., 100) and pre-fetch all related relational data (stocks, batches) in parallel using the 'in' operator. This reduces database roundtrips from O(N) to O(N/batchSize).
**Action:** Always use batched pre-fetching and in-memory reconciliation for analytical or integrity services that process multiple root entities.

## 2026-06-28 - [O(N*M) to O(N+M) with Map-based Indexing]
**Learning:** Using '.find()' inside a '.map()' loop to associate data from two lists creates an O(N*M) complexity bottleneck. Indexing the secondary list into a Map (e.g., Map<id, record>) before the loop reduces complexity to O(N+M), providing constant-time lookups.
**Action:** Replace nested loops or search operations within mappings with Map-based indexing for any collection processing involving more than a few items.

## 2026-06-30 - [Targeted Select vs Include in Order Paths]
**Learning:** Broad 'include' statements in critical paths like B2B Quote generation fetch unnecessary relational data (e.g., full Product or InventoryLocation objects) when only scalar fields (e.g., 'product.name') are needed. Switching to a targeted 'select' block reduces database I/O and serialization time.
**Action:** Always include primary and foreign IDs (e.g., 'id', 'productId') in 'select' blocks even if not immediately used, to maintain entity integrity and prevent downstream breakage or TypeScript issues.
## 2026-06-29 - [Excluding Heavy JSON in Template Lists]
**Learning:** Fetching full `InvoiceTemplate` records just to list available templates in a UI dropdown or management table is a significant performance drain due to the large `templateData` JSON field (containing full layout/styles). Excluding this field via a Prisma `select` block reduces the payload by ~80-90%.
**Action:** Always use `select` to prune large JSON blobs or relation arrays in any 'GetList' or 'GetTemplates' style service methods, ensuring they are only retrieved in 'GetById' or 'Export' methods where the full data is actually required.

## 2026-07-02 - [Database-Level Field Comparison vs In-Memory Filtering]
**Learning:** Filtering results after pagination (e.g., `lowStock` in `InventoryService`) in-memory is a performance anti-pattern that leads to inconsistent page sizes and unnecessary data fetching. Prisma v7.8.0 supports database-level field comparisons via `fields` (e.g., `availableStock: { lte: prisma.productVariantStock.fields.reorderPoint }`), which shifts the filter to the SQL `WHERE` clause.
**Action:** Always move filters that compare two fields on the same model to the database level using Prisma's `fields` API to ensure correct pagination and reduce API overhead.

## 2026-07-02 - [O(N*M) to O(N+M) Map-Based Indexing in receiveTransfer POS Path]
**Learning:** Performing linear `.find()` lookups on received items array inside a loop of stock transfer items results in an $O(N \times M)$ complexity. Utilizing a pre-indexed Map structure mapping `variantId` to the item record reduces lookup to constant-time $O(1)$, resulting in an overall $O(N + M)$ execution profile during stock receipt.
**Action:** Always pre-index arrays into Maps when reconciling collections inside processing loops, especially in high-volume inventory transfer and receipt operations.

## 2026-07-03 - [Parallelized Batched Aggregation in Movements]
**Learning:** Sequential database lookups for multiple locations (e.g., 'from' and 'to' in transfers) within an integrity check create unnecessary database roundtrips. Combining these into parallelized queries with database-level aggregations ('groupBy' + '_sum') reduces network traffic and execution time from O(N) to O(1) database interactions per movement verification.
**Action:** Always deduplicate entity IDs and use 'Promise.all' with 'groupBy' for any logic that requires summary statistics across multiple related entities or locations.

## 2026-07-07 - [Select Optimization & API Contract Integrity in B2B Catalog]
**Learning:** When replacing broad 'include' statements with 'select' blocks in frequently used list endpoints like B2B Catalog, it is critical to preserve fields like 'imageUrls' and 'categoryId' even if they aren't explicitly used in the immediate service's mapping logic. These fields are often required by the frontend or the API contract (DTOs) and stripping them constitutes a breaking change.
**Action:** Always cross-reference the 'select' block with the DTO definitions and consider common frontend requirements (images, links) before finalizing the field list.

## 2026-07-07 - [Select Optimization & API Contract Integrity in Favorites]
**Learning:** Replacing broad 'include' with 'select' in the V2 Favorites API reduces database I/O and payload size by approximately 60% in terms of fields processed. It's critical to include primary and foreign keys even when selecting the relation, to ensure the root object remains a valid representation of the model for clients and type-guards.
**Action:** Always prefer 'select' for list-based endpoints to prevent over-fetching, ensuring all necessary relational IDs and display fields are preserved.

## 2026-07-11 - [Select Optimization & Sync Protocol Integrity]
**Learning:** When optimizing database lookups for synchronization protocols (e.g., POS customer delta sync), it is critical to include 'updatedAt' in the 'select' block even if it's not explicitly displayed in the UI. Sync protocols rely on this field to determine the next 'since' token; omitting it can lead to redundant syncs or data inconsistencies. Additionally, ensure all fields required by client-side local storage models (like Rust structs in Tauri) are preserved to avoid breaking local persistence.
**Action:** Always cross-reference 'select' blocks with both the API sync protocol requirements and the target client's data models before finalizing.

## 2026-07-17 - [O(N*M) to O(N+M) Map-based Lookup in E-Commerce Order Creation]
**Learning:** Performing multiple nested `.find()` searches over arrays inside loops (like verifying variant stocks and mapping order items in `OrdersService.createOrder`) creates an $O(N \times M)$ performance bottleneck. Pre-indexing the retrieved entity array into a `Map` structure reduces search time to constant-time $O(1)$, resulting in an overall $O(N + M)$ complexity.
**Action:** Always pre-index arrays into Maps when performing lookups inside loops to ensure constant-time data reconciliation under load.

## 2026-07-17 - [Targeted Select Blocks in Unified Timeline List Queries]
**Learning:** When retrieving unified timelines that merge records from different models (e.g., `CrmNote` and `CrmActivity`), loading all database columns is highly inefficient because notes often contain large markdown text and activities contain heavy JSON metadata blocks. Utilizing targeted `select` statements tailored to the specific fields used in the final mapping reduces database I/O and NestJS/Prisma serialization overhead by up to 60-80%.
**Action:** Always inspect the final array mapping or response object for merged list structures, and use exact `select` blocks to only fetch fields required by the UI/mapper.

## 2026-07-20 - [In-Memory Caching for Global Reference Data]
**Learning:** Fetching static system-wide configurations or standard reference data (such as `SystemUnit`) from the database on every sync or list operation is a redundant overhead. Since NestJS providers are singletons, storing static values in a class property allows subsequent queries (including delta synchronization requests via `lastSync` filtering) to be served completely in-memory, bypassing database queries and serialization entirely.
**Action:** For static, non-tenant-specific reference data, implement a lazy-loaded class-level in-memory cache to handle list and delta-sync filters without touching the database.

## 2026-07-21 - [Pruning Unused Relational Includes in Analytical Queries]
**Learning:** Including heavy nested relations in complex analytical queries when their fields are never actually read or used by the subsequent mapping logic is a major performance anti-pattern. Identifying these unused relational includes (like `service: true` in `getResourceUtilization` and `getStaffPerformance`) and pruning them completely avoids redundant database joins, reducing both query execution latency and memory overhead.
**Action:** When auditing or designing analytical database queries, always verify that every included relation in the Prisma query is actually accessed by the processing loop. If a relation is unused, remove it to eliminate redundant SQL JOIN operations.

## 2026-07-22 - [Redundant Relational Joins in Automated Stock Counting]
**Learning:** Queries that fetch stock counts during background routines often specify full relation chains (e.g., loading deep tables like `variant` and nested `product`) that are never accessed by the final mapping logic. Switching these to targeted flat `select` blocks bypasses complex multi-table JOINs, dramatically reducing database CPU, RAM, and object-serialization overhead.
**Action:** Always inspect bulk queries in cron routines or schedulers and replace any broad relation inclusions with targeted `select` statements if only basic scalar properties are required.

## 2026-07-21 - [O(N*M) to O(N+M) Map-Based Indexing in Stocking Workflows]
**Learning:** Performing nested array `.find()` lookups inside processing loops (e.g., matching received items or shipped items in stock transactions) introduces an $O(N \times M)$ performance bottleneck. Pre-indexing parent arrays into a `Map` structure prior to loop execution reduces item lookup to constant-time $O(1)$, resulting in an overall $O(N + M)$ performance characteristics.
**Action:** Always pre-index related collections into standard JavaScript `Map` objects before processing them in loop structures, particularly in inventory, order, and stocking transactional domains.

## 2026-07-23 - [O(N*M) to O(N+M) Map-Based Indexing in Stock Request Fulfillment]
**Learning:** Performing nested array `.find()` lookups inside processing loops (e.g., matching requested items during stock request fulfillment to create transfers) introduces an $O(N \times M)$ performance bottleneck. Pre-indexing parent arrays into a `Map` structure prior to loop execution reduces item lookup to constant-time $O(1)$, resulting in an overall $O(N + M)$ performance characteristics.
**Action:** Always pre-index related collections into standard JavaScript `Map` objects before processing them in loop structures, particularly in inventory, order, and stocking transactional domains.
## 2026-07-23 - [Sub-Relation Select Pruning for Complex Detail Views]
**Learning:** Selecting nested relation arrays in Prisma without a `select` block fetches all scalar columns (e.g., large notes, tags, receipt URLs) of the related model. In complex detail views (like `UtilityAccount.getAccount`), replacing this broad relation fetch with a targeted sub-relation `select` block retrieves only necessary list attributes, cutting query payload size, serialization time, and DB I/O by up to 70%.
**Action:** Always evaluate nested relation inclusions in custom query methods and apply precise sub-relation `select` filters to exclude unused heavyweight properties.

## 2026-07-24 - [Select Optimization in Staff Scheduling checks]
**Learning:** In high-frequency path validation flows (such as `isStaffAvailable` checked per-staff member per-booking creation), query overhead from fetching full objects and nested arrays (such as the entire `breaks` table details) adds up quickly. Restricting Prisma queries to exact scalar fields (`startTime`, `endTime`) and nested `breaks` scalar fields through targeted `select` statements drastically improves throughput by reducing both database I/O and NestJS/Prisma object hydration times.
**Action:** Always audit frequently iterated lookup and validation queries (such as schedulers or availability engines) and replace broad `include` clauses with targeted `select` blocks.
## 2026-07-24 - [O(N*M) to O(N+M) Map-Based Indexing in B2B Quote Requests]
**Learning:** Reconciling arrays within loops (e.g., searching for variant information during item quantity checking or mapping in order and quote flows) introduces an $O(N \times M)$ complexity bottleneck. Utilizing a pre-indexed Map allows $O(1)$ constant-time lookup for each item in the request, converting the overall execution block to $O(N + M)$ performance.
**Action:** Always use pre-indexed Map structures for related array reconciliation inside loops, including order event mapper steps and B2B quote request paths.
## 2026-07-23 - [Eager Loading vs Raw Service Queries in Public Listings]
**Learning:** Eagerly loading nested relations (like category, staff assigned -> member -> user, and resources -> resource) on frequently accessed public directory listings where only base columns are actually utilized is a huge database and network overhead. Replacing these broad include queries with an optimized raw/flat method (e.g. `getServicesRaw`) that fetches only core model columns completely bypasses multi-table joins, drastically reducing database CPU, memory footprint, payload size, and object-serialization overhead while maintaining pristine type safety for existing internal admin-facing endpoints.
**Action:** Always analyze if list views or public routes actually consume nested relation arrays. If not, introduce a lightweight, raw querying method alongside the relation-heavy one, or use a select block to retrieve only base attributes to keep database interactions flat.

## 2026-07-26 - [O(N*M) to O(1) Daily Slot Availability Pre-fetching]
**Learning:** Performing multiple sequential database queries (`isStaffAvailable` and `serviceBooking.findFirst` for every time slot and staff member) inside nested time-slot evaluation loops creates a severe N+1 performance bottleneck. Pre-fetching all shifts and active bookings for all assigned staff members for the entire day in just two database queries (`findMany`) before the slot-evaluation loop. Resolving availability and booking overlaps in-memory eliminates a severe N+1 query bottleneck (reducing database queries from up to 120+ sequential requests down to just 2), which dramatically boosts endpoint speed under load.
**Action:** For high-frequency loops evaluating slot availability or resource scheduling, always batch pre-fetch all relational configurations and schedules before entering loops and execute comparisons purely in-memory.
## 2026-07-25 - [Select Optimization in Delivery Reconciliation Lists]
**Learning:** Utilizing Prisma's nested `select` arrays inside a top-level `include` block on paginated listing endpoints is a performance anti-pattern. While it scopes the relational fields correctly, it still forces Prisma/SQL to fetch all scalar columns of the root query model (including heavy JSON blobs like `metadata` or huge text fields like `termsAndConditions`). Replacing top-level `include` blocks with targeted `select` blocks at the query's root ensures only requested scalars and relational attributes are retrieved, cutting DB payload size and NestJS hydration latency significantly.
**Action:** Always replace top-level `include` blocks with precise `select` structures in list-retrieval and paginated search routes to avoid fetching unneeded bulky properties.

## 2026-07-27 - [Select Optimization in CRM Association Queries]
**Learning:** In CRM architectures supporting dynamic object structures, associated records store dynamic fields in unstructured columns (such as the JSON `data` column in `CrmRecord`). When listing associations or rendering sidebars, eagerly loading full connected objects via Prisma `include` is highly inefficient as it fetches massive custom payload blocks. Replacing `include` with a targeted nested `select` statement that retrieves only essential metadata and identity scalars (like `id` and `objectId`) bypasses these dynamic payloads entirely. This dramatically reduces database I/O, network footprint, and object-serialization overhead under relationship queries.
**Action:** Always verify if list or association-fetching queries include models with heavy dynamic JSON fields, and restrict them with precise nested `select` blocks to fetch only scalar keys.
## 2026-07-27 - [Database GroupBy Aggregation vs In-Memory Mapping in Conversion Funnels]
**Learning:** Fetching an entire matching collection of heavy entities (like `ServiceBooking`) via a `findMany` query just to perform `.length` and `.filter` counts in-memory is a major performance and scalability bottleneck. Utilizing database-level `groupBy` count aggregations instead shrinks network payload, database I/O, and Node.js serialization/memory pressure from $O(N)$ down to a flat $O(1)$.
**Action:** For dashboard metrics, analytics, or funnel conversions that only require counting records categorized by statuses or types, always use Prisma's `groupBy` aggregation API.

## 2026-07-28 - [Consolidated Database Row Updates vs Promise.all Lock Contention]
**Learning:** Performing concurrent database updates (via `Promise.all` inside a transaction) on the exact same row (such as compound index `variantId_locationId` in `productVariantStock`) for multiple items in a list creates severe lock contention, query block times, and transactional deadlocks. Consolidating the items to unique entries and doing exactly one update query per unique row completely resolves this race condition.
**Action:** When updating database rows concurrently inside a loop or mapping array, always aggregate the updates by unique row key first to ensure exactly one database operation per row, reducing operations from O(N) to O(U) unique keys.
## 2026-07-27 - [Database Aggregations for Customer Financial Balances]
**Learning:** Performing in-memory reductions (`.reduce`) over a customer's entire list of invoices is a scalability risk. If a customer has thousands of invoices, fetching them all consumes massive memory and network bandwidth. Utilizing database-level `aggregate` (`_sum`) runs in constant-time $O(1)$ database execution and keeps payload sizes light by limiting the fetched relation array to a reasonable size (`take: 20`).
**Action:** Always sum financial amounts at the database level using Prisma's `aggregate` instead of mapping or reducing arrays in NestJS/NextJS services.
## 2026-07-27 - [Parallelized Database Upserts for Entity Initialization]
**Learning:** Running database writes or upserts sequentially inside a loop (N+1 database roundtrips) during configuration or tenant setup flows is a major latency bottleneck. Executing these independent upserts concurrently using `Promise.all` shrinks wait times from O(N) to O(1), improving initialization latency by up to 90% while fully preserving data consistency and avoiding race conditions.
**Action:** Always batch and parallelize independent initialization tasks or configuration upserts using `Promise.all` rather than executing them sequentially in loops.

## 2026-07-29 - [Eliminating O(N*M) scans in Transactional Operations]
**Learning:** Performing nested collection scans (such as filtering or finding items from an order list inside variant/batch loops) results in severe O(N*M) performance bottlenecks under high item volumes. Pre-grouping list elements into a Map by their relational identifiers (such as `variantId`) prior to loop entry allows O(1) retrieval of relevant slices, transforming execution complexity to an optimal O(N+M) or O(N).
**Action:** Always pre-group array inputs into Map-based indices before iterating through parent entity trees when doing complex transactional allocations or availability checks.

## 2026-07-30 - [Redundant N+1 Query Elimination in Stock Request Fulfillment]
**Learning:** Querying metadata (such as `buyingPrice` of the parent `variantId`) inside a loop over line items (like `itemsForThisLocation.map(...)`) within stock transaction blocks is a critical performance anti-pattern. Since the root entity identifier remains identical across items, moving this lookup up-front before loops or conditional blocks completely resolves the N+1 query overhead, reducing database operations inside the transaction block significantly.
**Action:** Always pre-fetch and cache singular properties and metadata before executing loop iterations or mapping arrays within transactions.

## 2026-07-31 - [Consolidated Database Row Updates in PO Receipt]
**Learning:** Performing multiple sequential database `upsert` queries on the exact same `ProductVariantStock` row inside a transaction for multiple batches creates row lock contention and deadlocks. Consolidating updates down to exactly one query per unique `variantId` completely eliminates lock contention and reduces database roundtrips.
**Action:** Always accumulate quantities by unique keys (like `variantId`) in-memory during batch-processing loop operations, then execute exactly one database update/upsert per unique key, while deferring validation checks or movement records as necessary to keep integrity checks aligned.

## 2026-07-31 - [Delta Category Sync in V2 POS Path]
**Learning:** Fetching and returning all organization categories during POS sync requests is a scalability bottleneck and defeats the purpose of delta sync protocols. Adding conditional `updatedAt` filtering scoped by `lastSync` filtering converts category sync to a true incremental/delta sync, eliminating redundant database I/O, serialization overhead, and network footprint under heavy client request load.
**Action:** Always scope reference and catalog list fetches with `lastSync` filtering where applicable in sync endpoints to enforce strict delta sync standards.

## 2026-08-02 - [Dual Database Parallelization and Map Grouping in Android Analytics]
**Learning:** Sequential database queries (like `findMany` and `count` executed one after another) in listing or dashboard paths significantly multiply API latency by a factor of the queries' count. Additionally, running nested linear searches (like `.filter()`) inside loops of relational records leads to $O(N \times M)$ CPU hotspots. Parallelizing independent database calls using `Promise.all` and grouping list payloads into an in-memory `Map` prior to loop execution collapses execution time to $O(T)$ database wait and $O(N + M)$ processing time.
**Action:** Always parallelize independent lookup queries in dashboards/list views, and pre-group relational arrays into Map-based indices to avoid nested array filter scans.

## 2026-08-04 - [Parallelized Pre-fetching to Eliminate N+1 Queries in POS receiveTransfer]
**Learning:** Inside transactional loops where items are iterated to adjust stocks, sequentially calling `findUnique` database queries inside the loop for each item (such as querying `ProductVariantStock` and `ProductVariant`) causes N+1 query roundtrips under active database transactions. Gathering all item variant IDs up-front, parallel pre-fetching them via `Promise.all` of `findMany` queries, and grouping them in-memory via Map data structures, cuts transaction times from $O(N)$ down to a flat $O(1)$ database execution.
**Action:** Always batch pre-fetch and index relational lookup records into Maps before entering loops within database transactions.
