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
**Learning:** When optimizing Prisma queries with `select` in a service that explicitly shapes its response (e.g., via `.map()`), the `select` block must be synchronized with the mapping logic. Even if the underlying model has more fields (like `name` or `description` in `PriceList`), if the mapping logic doesn't use them, they can be safely omitted from the `select` block to reduce database load and serialization overhead.
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

## 2026-06-26 - [Excluding Heavy JSON Fields in Audit Lists]
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

## 2026-07-03 - [Parallelized Batched Aggregation in Movements]
**Learning:** Sequential database lookups for multiple locations (e.g., 'from' and 'to' in transfers) within an integrity check create unnecessary database roundtrips. Combining these into parallelized queries with database-level aggregations ('groupBy' + '_sum') reduces network traffic and execution time from O(N) to O(1) database interactions per movement verification.
**Action:** Always deduplicate entity IDs and use 'Promise.all' with 'groupBy' for any logic that requires summary statistics across multiple related entities or locations.

## 2026-07-07 - [Select Optimization & API Contract Integrity in B2B Catalog]
**Learning:** When replacing broad 'include' statements with 'select' blocks in frequently used list endpoints like B2B Catalog, it is critical to preserve fields like 'imageUrls' and 'categoryId' even if they aren't explicitly used in the immediate service's mapping logic. These fields are often required by the frontend or the API contract (DTOs) and stripping them constitutes a breaking change.
**Action:** Always cross-reference the 'select' block with the DTO definitions and consider common frontend requirements (images, links) before finalizing the field list.

## 2026-07-09 - [Batch Pre-fetching and Parallelization in Pricing]
**Learning:** Performing repeated database lookups (N+1) inside a loop to check for existing pending requests is a major bottleneck. Pre-fetching these records into a Map and parallelizing the independent updates using `Promise.all` reduces total execution time from sequential $O(N)$ to concurrent $O(1)$ database roundtrips.
**Action:** Always batch pre-fetch optional relation or existence checks before entering a loop and use parallel execution for independent side-effect operations.
