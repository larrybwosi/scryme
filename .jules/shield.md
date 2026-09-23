## 2026-09-08 - Target Location Validation in Batch Operations
**Learning:** In batch operations that accept a `targetLocationId` (such as `MergeBatchesUseCase`), checking source batch organization IDs is insufficient to prevent BOLA/IDOR. If `targetLocationId` is supplied by an attacker, merged batches and stock movements could be assigned to a foreign organization's location if `targetLocationId` is not explicitly validated against `organizationId`.
**Action:** Always validate `targetLocationId` using `inventoryLocation.findFirst({ where: { id: targetLocationId, organizationId } })` before performing stock batch merges, transfers, or adjustments.

## 2026-09-09 - Fast-Path Entity Lookup Tenant Isolation
**Learning:** Fast-path entity lookups (e.g. querying a batch by CUID directly before falling back to ID/number search in `TraceBatchUseCase`) must immediately reject requests if the entity exists but belongs to a foreign tenant. Allowing execution to fall through to secondary lookup steps like `findById` creates side-channel timing leaks and unnecessary database queries against foreign tenant resources.
**Action:** When performing fast-path lookups, if an entity is found but `entity.organizationId !== organizationId`, immediately throw `NotFoundException` without attempting secondary repository fallbacks.

## 2026-09-21 - Relational ID Validation in Location Server Actions
**Learning:** In server actions creating or updating nested hierarchy structures (locations, zones, units), validating only the target record's tenant ownership is insufficient. Relational input fields (`parentLocationId`, `managerId`, `locationId`, `zoneId`) can be exploited in BOLA/IDOR attacks to cross-associate resources with foreign organizations.
**Action:** Explicitly validate all input foreign key IDs using `findFirst` scoped by `organizationId` before executing database mutations.

## 2026-09-23 - Address Update Scoping in Customer Address Management
**Learning:** In models lacking a composite unique index on `[id, customerId]` (such as `Address`), using Prisma's `update({ where: { id } })` ignores non-unique fields in `where` clauses, creating potential BOLA/IDOR vulnerability risks where addresses could be updated across customer boundaries if an ID was manipulated.
**Action:** Use `updateMany({ where: { id: addressId, customerId }, data })` followed by `findFirstOrThrow({ where: { id: addressId, customerId } })` to strictly enforce tenant/owner database-level isolation.
