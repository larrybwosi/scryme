## 2026-09-08 - Target Location Validation in Batch Operations
**Learning:** In batch operations that accept a `targetLocationId` (such as `MergeBatchesUseCase`), checking source batch organization IDs is insufficient to prevent BOLA/IDOR. If `targetLocationId` is supplied by an attacker, merged batches and stock movements could be assigned to a foreign organization's location if `targetLocationId` is not explicitly validated against `organizationId`.
**Action:** Always validate `targetLocationId` using `inventoryLocation.findFirst({ where: { id: targetLocationId, organizationId } })` before performing stock batch merges, transfers, or adjustments.

## 2026-09-09 - Fast-Path Entity Lookup Tenant Isolation
**Learning:** Fast-path entity lookups (e.g. querying a batch by CUID directly before falling back to ID/number search in `TraceBatchUseCase`) must immediately reject requests if the entity exists but belongs to a foreign tenant. Allowing execution to fall through to secondary lookup steps like `findById` creates side-channel timing leaks and unnecessary database queries against foreign tenant resources.
**Action:** When performing fast-path lookups, if an entity is found but `entity.organizationId !== organizationId`, immediately throw `NotFoundException` without attempting secondary repository fallbacks.
