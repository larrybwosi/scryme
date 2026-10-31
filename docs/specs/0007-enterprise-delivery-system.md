# 0007. Enterprise Delivery System Architecture and End-to-End Module

**Date**: 2026-10-31
**Status**: Proposed

## Summary

This specification establishes the enterprise delivery and dispatch management system across NestJS API, Web, and Point of Sale (POS) environments. The system enables seamless dispatching of orders to internal drivers and third party logistics (3PL) partners with automated verification tokens (OTP), proof of delivery (POD), and live tracking. Post delivery reconciliation automates Cash on Delivery (COD) payment recording, partner commission and wallet settlements, and batch level inventory restocking for returned or failed items with audit logs.

## Context

Organizations operating multi branch bakeries, retail networks, and restaurants need full end to end logistics management for deliveries. Prior implementations contained basic dispatch helpers without enterprise level exception management, multi partner benefit accounting, secure recipient verification (OTP and photo POD), or automatic Cash on Delivery (COD) reconciliation. When deliveries fail or items are rejected, inventory was often unreturned or lacked batch tracing. Furthermore, drivers and POS operators lacked unified mobile friendly interfaces to complete handovers and audits.

## Requirements

**User stories**:
- As a logistics coordinator or dispatcher, I want to dispatch orders to internal fleet drivers or 3PL delivery partners with automated OTP tokens and real-time status tracking.
- As a driver, I want a dedicated mobile friendly delivery portal where I can view assigned deliveries, verify recipient OTPs, upload proof of delivery signatures or photos, and log COD payments.
- As a POS cashier, I want to dispatch deliveries directly from the POS interface and view active delivery progress.
- As an operations or finance auditor, I want post delivery reconciliation to automatically generate double entry payments for COD orders, credit 3PL partner wallets, and restock returned items into their original inventory batches.
- As an enterprise administrator, I want analytics on driver on-time delivery rates, partner fees, and delivery exception breakdowns.

**Acceptance criteria**:
- **AC-1**: When an order is dispatched for delivery, the system creates a `Fulfillment` record with a secure 4 or 6-digit confirmation token (OTP), links the assigned driver and delivery partner, reserves or deducts batch inventory, and sets the driver status to `ON_DELIVERY`.
- **AC-2**: The delivery state machine strictly enforces sequential transitions (`PENDING` -> `ASSIGNED` -> `PICKED_UP` -> `IN_TRANSIT` -> `DELIVERED` / `FAILED` / `CANCELLED` / `RETURNED`) and broadcasts real-time Socket.IO events to organization rooms.
- **AC-3**: Proof of delivery verification accepts digital recipient signatures, uploaded POD image URLs, and OTP confirmation tokens. If an OTP is provided, it must match `confirmationToken` to complete delivery.
- **AC-4**: When a delivery is reconciled as `DELIVERED`, if the underlying transaction has an unpaid balance and COD cash was collected, a `Payment` record is automatically created, the transaction marked `PAID` or partially paid, and the delivery marked `isReconciled = true`.
- **AC-5**: If a 3PL partner is associated, reconciliation automatically accrues partner commissions or fixed fees into `deliveryPartner.walletBalance` and appends a `PartnerWalletLog` entry.
- **AC-6**: When a delivery fails or has returned items, reconciliation accepts returned line item quantities and restocks undamaged items back into their original `StockBatch` and `ProductVariantStock` with `StockMovement` of type `RESTOCK`. Damaged items are marked as damaged without returning to sellable inventory.
- **AC-7**: A mobile responsive driver view (`/sales/deliveries/driver`) allows authenticated drivers to view active assigned tasks, check customer contact details, trigger calls or directions, verify OTPs, and submit handovers.
- **AC-8**: Comprehensive API endpoints exist under `apps/api/src/v3/modules/deliveries` for dispatching, driver assignment, status transitions, OTP verification, reconciliation, and delivery performance analytics.

## Options considered

### Option 1: Integrated End-to-End Enterprise Delivery Architecture (Selected)

Unify delivery management in NestJS V3 API with transactional database operations covering fleet status, 3PL wallet ledgers, batch restocking, and COD payment generation. Provide Web management dashboards, mobile friendly driver portal, and POS dispatch integration.

**Pros**:
- Guarantees strict multi tenant data isolation and financial consistency.
- Seamlessly connects order fulfillment with inventory batches and general ledger cash flow.
- Accessible for drivers on smartphones without needing a separate native app deployment.

**Cons**:
- Requires coordinating transactional logic across orders, payments, inventory, and partner ledgers.

## Build plan

1. **Schema & Migration** (AC-1, AC-4, AC-6):
   - Enhance Prisma schema with returned item fields, cancellation reasons, and payment reconciliation tracking.
2. **API & Service Logic** (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8):
   - Implement complete dispatch, status lifecycle, OTP verification, and reconciliation in `DeliveriesService`.
   - Implement driver metrics and active deliveries endpoints.
3. **Web Delivery Portal & Reconciliation UI** (AC-4, AC-6, AC-7):
   - Upgrade `/sales/deliveries` list, metrics, and reconciliation queue.
   - Build responsive driver handover mobile page (`/sales/deliveries/driver`).
4. **Verification & Testing** (AC-1 through AC-8):
   - Unit tests for delivery lifecycle, COD payment creation, partner accruals, and stock returns.
