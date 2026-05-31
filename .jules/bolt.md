## 2026-05-31 - Direct Filtering on Denormalized Fields
**Learning:** The `ProductVariantStock` model contains denormalized `organizationId` and `productId` fields. Filtering on these direct fields in Prisma is significantly more efficient than using nested relation filters (e.g., `variant: { product: { organizationId } }`) because it eliminates unnecessary JOIN operations and leverages single-table indexes.
**Action:** When working with join tables or stock records, always check for denormalized IDs before reaching through relations for multi-tenant or parent-entity filtering.
