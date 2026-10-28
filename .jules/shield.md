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

## 2026-09-24 - Customer Update Tenant Isolation
**Learning:** In `UpdateCustomerUseCase`, updating records using Prisma's `update({ where: { id: customerId } })` relies solely on `findFirst` pre-checks. Because `Customer` lacks a composite unique constraint on `[id, organizationId]`, Prisma's `update` operation target only matches `id`, leaving potential window for BOLA/IDOR if `findFirst` checks are bypassed or raced against.
**Action:** Use `customer.updateMany({ where: { id: customerId, organizationId }, data })` followed by `customer.findFirstOrThrow({ where: { id: customerId, organizationId } })` to enforce database-level tenant isolation directly on update mutations.

## 2026-09-27 - Department Mutation Tenant Isolation
**Learning:** In `DepartmentUseCase`, `department.update` and `department.delete` rely solely on primary key `id` in `where` clauses because `Department` lacks a composite unique index on `[id, organizationId]`. If pre-checks are bypassed or raced against, single-ID targeting creates potential BOLA/IDOR risks.
**Action:** Use `department.updateMany({ where: { id, organizationId }, data })` followed by `findFirstOrThrow` (and `department.deleteMany({ where: { id, organizationId } })`) to enforce database-level multi-tenant isolation during mutations.

## 2026-09-29 - Multi-Tenant Scoping in Prisma Delete and Wallet Updates
**Learning:** Models like `Customer` and `DeliveryPartner` lack composite unique keys on `[id, organizationId]`. Using Prisma's standard `delete({ where: { id } })` or `update({ where: { id } })` ignores `organizationId` filters in `where` parameters, creating BOLA/IDOR vulnerabilities if mutations are executed against foreign tenant entity IDs.
**Action:** Use `deleteMany({ where: { id, organizationId } })` and `updateMany({ where: { id, organizationId }, data })` to enforce strict database-level multi-tenant isolation during entity deletion, deactivation, and balance adjustments.

## 2026-10-02 - Custom Role Mutation Tenant Isolation
**Learning:** In `RoleManagementUseCase`, `CustomRole` lacks a composite unique constraint on `[id, organizationId]`. Using standard `customRole.update` or `customRole.delete` with `{ where: { id } }` ignores non-unique tenant parameters at database execution time.
**Action:** Use `updateMany({ where: { id, organizationId }, data })` (followed by `findFirstOrThrow`) and `deleteMany({ where: { id, organizationId } })` to enforce database-level multi-tenant isolation during custom role mutations.

## 2026-10-05 - Multi-Tenant Scoping and Atomic State Check in Invitation Revocation
**Learning:** `Invitation` model lacks a composite unique constraint on `[id, organizationId]`. Calling standard Prisma `invitation.update({ where: { id } })` ignores `organizationId` at runtime. Using `updateMany({ where: { id, organizationId, status: PENDING }, data: { status: DECLINED } })` guarantees database-level multi-tenant isolation and prevents invalid state transitions.
**Action:** Always use `updateMany({ where: { id, organizationId, status: InvitationStatus.PENDING }, data })` followed by `findFirstOrThrow` for database-level multi-tenant and state-aware invitation mutations.

## 2026-10-07 - Purchase Order Approval Tenant Isolation
**Learning:** In `PurchaseOrderUseCase.approve`, `Purchase` model lacks a composite unique constraint on `[id, organizationId]`. Using standard `purchase.update({ where: { id } })` ignores non-unique `organizationId` filters in Prisma's `where` clause at runtime. If pre-checks are bypassed or raced against, single-ID targeting creates potential BOLA/IDOR risks.
**Action:** Use `purchase.updateMany({ where: { id: purchaseId, organizationId }, data })` followed by `purchase.findFirstOrThrow({ where: { id: purchaseId, organizationId } })` to enforce database-level multi-tenant isolation during status mutations.

## 2026-10-09 - Stock Transfer Mutation Multi-Tenant Scoping
**Learning:** In `StockTransferUseCase` (`approve`, `ship`, `receive`), `StockTransfer` model lacks a composite unique constraint on `[id, organizationId]`. Standard Prisma `stockTransfer.update({ where: { id } })` ignores non-unique `organizationId` parameters in `where` clauses at database execution time, risking cross-tenant BOLA mutations if single-ID lookups are targeted directly.
**Action:** Use `stockTransfer.updateMany({ where: { id: transferId, organizationId }, data })` followed by `stockTransfer.findFirstOrThrow({ where: { id: transferId, organizationId } })` to enforce database-level multi-tenant isolation during stock transfer status mutations.

## 2026-10-12 - Physical Reconciliation Status Mutation Tenant Isolation
**Learning:** In `PhysicalReconciliationUseCase.approve`, the `StockReconciliation` model lacks a composite unique constraint on `[id, organizationId]`. Standard Prisma `stockReconciliation.update({ where: { id } })` ignores non-unique `organizationId` filters in `where` parameters at database execution time. Relying solely on pre-checks leaves potential BOLA/IDOR vulnerability risks if single-ID lookups are targeted directly or raced against.
**Action:** Always use `stockReconciliation.updateMany({ where: { id: reconciliationId, organizationId }, data })` followed by `stockReconciliation.findFirstOrThrow({ where: { id: reconciliationId, organizationId } })` to enforce database-level multi-tenant isolation during physical reconciliation approvals.

## 2026-10-15 - Expense & Petty Cash Fund Mutation Tenant Isolation
**Learning:** In `ExpenseUseCase` (`approveExpense` and `decrementPettyCash`), `Expense` and `PettyCashFund` models lack composite unique constraints on `[id, organizationId]`. Standard Prisma `update({ where: { id } })` ignores non-unique `organizationId` filters in `where` parameters at database execution time.
**Action:** Always use `updateMany({ where: { id, organizationId }, data })` (followed by `findFirstOrThrow`) for database-level multi-tenant isolation on expense approvals and petty cash balance adjustments.

## 2026-10-18 - Delivery Partner Wallet Balance Mutation Tenant Isolation
**Learning:** In `DeliveryReconciliationUseCase.reconcilePod`, `DeliveryPartner` model lacks a composite unique constraint on `[id, organizationId]`. Calling standard Prisma `deliveryPartner.update({ where: { id: partner.id } })` ignores `organizationId` at database execution runtime.
**Action:** Always use `updateMany({ where: { id: partner.id, organizationId }, data })` for database-level multi-tenant isolation during delivery partner wallet balance updates.

## 2026-10-21 - Product Supplier Linking Tenant Isolation in Server Actions
**Learning:** In `apps/web/app/actions/supplier.ts`, `ProductSupplier` model lacks a composite unique index on `[id, organizationId]`. Server actions `updateSupplierProductPrice` and `removeProductFromSupplier` previously executed `update` and `delete` directly by `id` or `productSupplierId` without verifying tenant ownership of `supplierId` or `productId`. An attacker could supply foreign IDs to mutate or delete supplier product links across tenants.
**Action:** Always verify `supplierId` and `productId` belong to `auth.organizationId` via `findFirst` pre-checks, and use `updateMany({ where: { id: productSupplierId, supplierId }, data })` and `deleteMany({ where: { id: productSupplierId, supplierId } })` to enforce database-level multi-tenant isolation on product supplier links.

## 2026-10-24 - Price Change Request & Price List Item Tenant Isolation
**Learning:** In `ReviewPriceChangeUseCase`, `PriceChangeRequest` and `PriceListItem` models lack composite unique constraints on `[id, organizationId]`. Using standard Prisma `update` with `{ where: { id } }` ignores non-unique `organizationId` or relational `priceList: { organizationId }` conditions at runtime.
**Action:** Use `priceListItem.updateMany({ where: { id: request.priceListItemId, priceList: { organizationId } }, data })` and `priceChangeRequest.updateMany({ where: { id: requestId, organizationId, status: PENDING }, data })` followed by `findFirstOrThrow` to enforce strict database-level multi-tenant isolation and atomic state verification.

## 2026-10-27 - Multi-Tenant Isolation in Device and API Key Server Actions
**Learning:** In `apps/web/app/actions/devices.ts`, models `DeviceRegistry`, `ApiKey`, and `V3ApiClient` lack composite unique constraints on `[id, organizationId]`. Calling standard Prisma `findUnique`, `update`, or `delete` with `{ where: { id, organizationId } }` ignores non-unique `organizationId` filters at database execution time, creating potential BOLA/IDOR risks if single-ID targets are manipulated.
**Action:** Always use `findFirst({ where: { id, organizationId } })`, `updateMany({ where: { id, organizationId }, data })`, and `deleteMany({ where: { id, organizationId } })` to enforce strict database-level tenant isolation on device and API key mutations.

## 2026-10-27 - Driver Management Relational ID Validation & BOLA Tenant Isolation
**Learning:** In driver management server actions (`apps/web/app/actions/drivers.ts`), relational fields (`vehicleId` and `deliveryPartnerId`) provided by client callers were not checked for tenant ownership before driver creation/updates, allowing cross-tenant resource binding. Furthermore, because `Driver` lacks a composite unique constraint on `[id, organizationId]`, standard Prisma `update` and `delete` ignore non-unique `organizationId` parameters in `where` clauses at runtime.
**Action:** Always validate relational foreign key IDs (`vehicleId`, `deliveryPartnerId`) using `findFirst` scoped by `organizationId`, and use `updateMany({ where: { id, organizationId }, data })` followed by `findFirstOrThrow` and `deleteMany({ where: { id, organizationId } })` to enforce database-level tenant isolation.

## 2026-10-27 - Member Deletion and Status Mutation Tenant Isolation
**Learning:** In `MemberUseCase` (`deleteMember` and `updateMemberStatus`), `Member` lacks a composite unique constraint on `[id, organizationId]`. Standard Prisma `member.update({ where: { id } })` ignores non-unique `organizationId` parameters in `where` parameters at database execution time.
**Action:** Use `member.updateMany({ where: { id, organizationId, deletedAt: null }, data })` followed by `member.findFirstOrThrow({ where: { id, organizationId } })` to enforce database-level multi-tenant isolation during member deletion and status updates.

## 2026-10-27 - Organization Unit Relational ID Validation & BOLA Tenant Isolation
**Learning:** In organization unit conversion actions (`apps/web/app/actions/units.ts`), relational fields (`fromUnitId` and `toUnitId`) were previously accepted without validating tenant ownership, allowing cross-tenant unit conversion binding. Furthermore, `OrganizationUnit` and `OrgUnitConversion` lack composite unique constraints on `[id, organizationId]`, meaning standard Prisma `update` and `delete` ignore non-unique `organizationId` filters at runtime.
**Action:** Always validate relational foreign key unit IDs (`fromUnitId`, `toUnitId`) using `findFirst` scoped by `organizationId`, and use `updateMany({ where: { id, organizationId }, data })` followed by `findFirstOrThrow` and `deleteMany({ where: { id, organizationId } })` to enforce database-level tenant isolation.

## 2026-10-27 - Service, Category, and Resource Management BOLA Tenant Isolation
**Learning:** In `ServiceManagementService` (`apps/api/src/v3/modules/services/application/services/service-management.service.ts`), `ServiceCategory`, `Service`, and `ServiceResource` Prisma models lack composite unique constraints on `[id, organizationId]`. Calling standard Prisma `serviceCategory.update`, `serviceCategory.delete`, `service.update`, `service.delete`, `serviceResource.update`, or `serviceResource.delete` with `{ where: { id } }` ignores non-unique `organizationId` parameters at database execution time. Relying solely on `findFirst` pre-checks leaves potential race or bypass exposure for IDOR/BOLA attacks.
**Action:** Use `updateMany({ where: { id, organizationId: orgId }, data })` (followed by `findFirstOrThrow` or entity lookup) and `deleteMany({ where: { id, organizationId: orgId } })` to enforce strict database-level multi-tenant isolation during service, category, and resource mutations.

## 2026-10-28 - Service & ServiceCategory Relational ID Validation & BOLA Tenant Isolation
**Learning:** In service management server actions (`apps/web/app/actions/services.ts`), foreign relational field `categoryId` provided by client callers was not verified for tenant ownership before service creation or updates, permitting cross-tenant category binding. Additionally, `ServiceCategory` and `Service` models lack composite unique constraints on `[id, organizationId]`, meaning standard Prisma `update` and `delete` ignore non-unique `organizationId` parameters in `where` clauses at runtime.
**Action:** Always validate relational foreign key IDs (`categoryId`) using `findFirst` scoped by `organizationId`, and use `updateMany({ where: { id, organizationId }, data })` and `deleteMany({ where: { id, organizationId } })` to enforce database-level tenant isolation.

## 2026-10-28 - Petty Cash Relational ID Validation & Top-Up Multi-Tenant Scoping
**Learning:** In `createPettyCashFund` (`apps/web/app/actions/petty-cash.ts`), foreign relational IDs (`responsibleMemberId` and `locationId`) supplied by callers were not validated for tenant ownership before fund creation, permitting cross-tenant resource binding. Furthermore, in `topUpPettyCashFund`, because `PettyCashFund` lacks a composite unique constraint on `[id, organizationId]`, calling standard `tx.pettyCashFund.update({ where: { id } })` ignores non-unique tenant parameters at database execution runtime.
**Action:** Validate relational foreign key IDs (`responsibleMemberId`, `locationId`) using `findFirst` scoped by `organizationId`, and use `tx.pettyCashFund.updateMany({ where: { id: fundId, organizationId: auth.organizationId }, data })` followed by `findFirstOrThrow` to enforce strict database-level multi-tenant isolation on petty cash fund updates.

## 2026-10-28 - Location Relational ID Validation & Setup Token Revocation Multi-Tenant Scoping
**Learning:** In `createDeviceSetupTokenCore` (`packages/shared/src/lib/provisioning/common.ts`), foreign relational field `locationId` supplied by callers was not verified for tenant ownership before issuing device setup tokens, permitting cross-tenant location binding. Furthermore, in `revokeSetupTokenCore`, because `DeviceSetupToken` lacks a composite unique constraint on `[id, organizationId]`, standard Prisma `update` ignores non-unique `organizationId` parameters in `where` clauses at runtime.
**Action:** Validate `locationId` using `p.inventoryLocation.findFirst` scoped by `organizationId` before creating setup tokens, and use `p.deviceSetupToken.updateMany({ where: { id: tokenId, organizationId }, data })` to enforce database-level multi-tenant isolation during token revocation.

## 2026-10-28 - Finance Settings Relational ID Validation & Approval Workflow BOLA Tenant Isolation
**Learning:** In `apps/web/app/actions/finance-settings.ts`, `updateApprovalWorkflow` previously executed `ApprovalWorkflowStep.deleteMany({ where: { approvalWorkflowId: id } })` without checking that the workflow belonged to `auth.organizationId`, allowing cross-tenant workflow step purging. Additionally, `ApprovalWorkflow`, `CostCenter`, and `BudgetAlert` lack composite unique constraints on `[id, organizationId]`, meaning Prisma's standard `update` and `delete` ignore non-unique `organizationId` filters in `where` parameters at runtime. Relational input fields (`locationId`, `expenseCategoryId`, `specificMemberId`, `budgetId`) supplied by callers were also not verified for tenant ownership before binding.
**Action:** Validate all relational foreign key IDs (`locationId`, `expenseCategoryId`, `specificMemberId`, `budgetId`) against `auth.organizationId` via `findFirst` pre-checks, verify workflow ownership before purging workflow steps, and use `updateMany({ where: { id, organizationId }, data })` and `deleteMany({ where: { id, organizationId } })` to enforce database-level multi-tenant isolation across finance settings actions.

## 2026-10-28 - Department Relational ID Validation & Approval Chain BOLA Tenant Isolation
**Learning:** In `apps/web/app/actions/department.ts`, foreign relational fields (`headId`, `parentId`, `locationId`, `costCenterId`, `memberId`, `approverId`) were accepted without checking caller organization ownership, permitting cross-tenant resource linking in departments and approval chains. Furthermore, `Department` and `PurchaseApprovalChain` models lack composite unique constraints on `[id, organizationId]`, causing standard Prisma `update` and `delete` to ignore non-unique `organizationId` filters in `where` clauses at runtime.
**Action:** Always validate relational foreign key IDs against `session.organizationId` using `findFirst` pre-checks, and use `updateMany({ where: { id, organizationId }, data })` and `deleteMany({ where: { id, organizationId } })` to enforce database-level multi-tenant isolation across department and approval chain operations.

## 2026-10-28 - Privilege Escalation Prevention and BOLA Isolation in Permission Request Approvals
**Learning:** In `approvePermissionRequestAction` (`apps/web/app/actions/permissions.ts`), non-OWNER administrators (such as `ADMIN`) could approve permission requests and grant the `OWNER` role, leading to Privilege Escalation (CWE-269). Furthermore, because `Member` lacks a composite unique constraint on `[id, organizationId]`, calling standard Prisma `member.update({ where: { id } })` ignores non-unique `organizationId` parameters at runtime.
**Action:** Always enforce role hierarchy restrictions so only `OWNER` members can grant the `OWNER` role (`if (data.roleToGrant === 'OWNER' && currentMember.role !== 'OWNER') return { success: false, error: "..." }`), and use `updateMany({ where: { id: memberToUpdate.id, organizationId: auth.organizationId }, data })` followed by `findFirstOrThrow` to guarantee database-level multi-tenant BOLA isolation.

## 2026-10-28 - Pricing Multi-Tenant Scoping & BOLA Isolation
**Learning:** In pricing server actions (`apps/web/app/actions/pricing.ts`), models like `PriceList`, `PriceListItem`, `PricingRule`, and `PricingBundle` lack composite unique constraints on `[id, organizationId]`. Standard Prisma calls like `priceList.delete({ where: { id } })`, `priceListItem.delete({ where: { id } })`, and `priceList.update({ where: { id } })` ignore non-unique `organizationId` filters in `where` parameters at runtime. If pre-checks are bypassed or raced against, single-ID targeting creates BOLA/IDOR risks.
**Action:** Use `deleteMany({ where: { id, organizationId } })` and `updateMany({ where: { id, organizationId }, data })` followed by `findFirstOrThrow` (or pre-validation lookup) to strictly enforce database-level multi-tenant isolation across price lists, volume tiers, pricing rules, and bundle mutations.
