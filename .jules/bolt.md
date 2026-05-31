## 2026-05-31 - Database-Level Filtering for Pagination
**Learning:** Performing array filtering (like `shaped.filter(p => p.variants.some(v => v.totalStock > 0))`) in the application layer after fetching paginated data from Prisma causes incorrect pagination results. The "total" count returned by the database reflects the unfiltered set, leading to empty pages and incorrect page counts on the frontend.
**Action:** Always move business logic filters (like `inStock`) into the Prisma `where` clause using relation filters (e.g., `some: { availableStock: { gt: 0 } }`). This ensures the database returns the correct "total" count and only the necessary data.

## 2026-05-31 - Direct Filtering on Denormalized Fields
**Learning:** The `ProductVariantStock` model contains denormalized `organizationId` and `productId` fields. Filtering on these direct fields in Prisma is significantly more efficient than using nested relation filters because it eliminates unnecessary JOIN operations and leverages single-table indexes.
**Action:** When working with join tables or stock records, always check for denormalized IDs before reaching through relations for multi-tenant or parent-entity filtering.
