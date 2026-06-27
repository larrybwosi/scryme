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
