## 2026-06-03 - [Move Filtering to Database]
**Learning:** Moving in-memory array filtering (e.g., stock level checks in CatalogService) into Prisma's 'where' clause using relation filters ('some', 'every') ensures correct pagination totals and reduces database data transfer.
**Action:** Always check if in-memory filters can be converted to Prisma relation filters to improve performance and fix pagination logic bugs.

## 2026-06-03 - [Targeted Selection in NestJS Services]
**Learning:** Replacing broad 'include' statements with targeted 'select' blocks in NestJS services using Prisma reduces database payload size, speeds up serialization, and avoids fetching unused large text fields.
**Action:** Use 'select' instead of 'include' for read operations to fetch only required scalar fields and relations.
