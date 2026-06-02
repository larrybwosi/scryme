## 2026-06-02 - Database-Level Filtering and Projection
**Learning:** Moving in-memory array filtering (e.g., stock level checks) into Prisma's 'where' clause using relation filters ('some', 'every') is critical for correct pagination totals and reducing database data transfer. Combining this with targeted 'select' blocks (projection) significantly reduces database payload and memory usage.
**Action:** Always prioritize database-level filtering and projection for large datasets. Verify that pagination logic remains correct after moving filters from application to database.
