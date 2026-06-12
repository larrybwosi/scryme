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
