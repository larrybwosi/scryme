# 0015 · M-Pesa Customer Tracking and Auto-Saving

**Status**: Accepted
**Date**: 2026-11-03
**Mode**: FEATURE
**Build Approach**: End-to-end slice

## Summary

This specification defines the customer auto-saving and identity linking mechanism when payments are processed via Safaricom M-Pesa. Whenever an M-Pesa payment completes successfully (via STK Push callback, STK query polling, C2B confirmation, or claiming an unclaimed payment), the system normalizes the payer's mobile number, finds or creates a corresponding `Customer` record, and links it to the associated `Transaction` if no customer is currently attached, preserving existing customer assignments.

## Context

Businesses running POS and online sales frequently process transactions for walk-in or anonymous customers who pay via M-Pesa (Till or Paybill C2B, or Lipa Na M-Pesa STK Push). Previously, payments recorded `payerPhone` and `payerName` on the `Payment` record, but did not create or link a `Customer` in the database. Consequently, merchants could not track customer purchasing history, frequency, lifetime value, or re-engage customers in CRM workflows unless cashiers manually typed in customer profiles prior to checkout.

## Requirements

- **AC-1 (E.164 Kenyan Phone Normalization)**: Standardize all customer phone numbers from M-Pesa payloads to Kenyan E.164 format (`254XXXXXXXXX`) to ensure reliable deduplication regardless of incoming representation (`07...`, `+254...`, or `254...`).
- **AC-2 (Customer Deduplication & Preservation)**: Look up existing customers within the organization by normalized phone number (and common variants). If a customer already exists, use that customer without overwriting existing profile data (name, company, email, notes).
- **AC-3 (Customer Creation with Fallback Naming)**: If no matching customer exists, create a new `Customer` record scoped to the organization with `creationType: API_CREATED`:
  - For C2B payments, use the payer names (`FirstName`, `MiddleName`, `LastName`) provided by Safaricom.
  - For STK Push where names are not provided by Safaricom, format name as `"Customer " + phone` (or `"M-Pesa Customer"` if phone is absent).
- **AC-4 (Transaction Association & Retention)**:
  - If `transaction.customerId` is null, update `transaction.customerId` to the matched or newly created customer.
  - If `transaction.customerId` is already populated (e.g., cashier selected Customer A), preserve the existing customer on the transaction while still ensuring the payer is recorded on the `Payment`.
- **AC-5 (Coverage Across All Payment Completion Paths)**:
  - STK Push callback (`handleStkCallback`).
  - Active STK query polling (`queryStkStatus`).
  - C2B Paybill/Till confirmation (`handleC2BConfirmation`).
  - Unclaimed payment resolution (`claimPayment`).
- **AC-6 (Automation Event Dispatch)**: Whenever a new customer is created during M-Pesa processing, trigger `emitCustomerCreated` to notify the CRM and automation engine.

## Options Considered

### Option 1: Client-Side Prompting Only (POS Prompt)
- **Pros**: Cashier explicitly enters customer information at point of sale.
- **Cons**: High friction during busy sales hours; does not capture customer data for direct C2B Paybill payments or asynchronous web payments.

### Option 2: Server-Side Autonomous Customer Auto-Saving & Linking (Chosen)
- **Pros**: Zero cashier friction; captures 100% of M-Pesa payers into the CRM/Customer directory; standardizes phone numbers for accurate deduplication; handles STK callback, active polling, C2B webhooks, and unclaimed reconciliations identically.
- **Cons**: Requires phone number normalization and handling fallback naming when Safaricom does not return full customer names (e.g. STK Push).

## Decision

We adopt server-side autonomous customer resolution within `MpesaService` and `@repo/shared`:
1. Provide a central helper `findOrCreateCustomerFromMpesa(tx, { organizationId, phone, name })` that:
   - Normalizes phone numbers to standard `254XXXXXXXXX`.
   - Checks `tx.customer` by `organizationId` and phone variations (`254...`, `+254...`, `0...`).
   - Creates a customer if not found, with `creationType: 'API_CREATED'`.
   - Dispatches `emitCustomerCreated` asynchronously.
2. Integrate `findOrCreateCustomerFromMpesa` into `handleStkCallback`, `queryStkStatus`, `handleC2BConfirmation`, and `claimPayment`.
3. In `updateTransactionOnPayment` or the payment transaction handler, assign `transaction.customerId` if it was previously unset.

## Feature Design

### Data Model & Value Sourcing

| Value | Source | Handling |
|---|---|---|
| Customer Phone | `MSISDN` or `phoneNumber` | Normalized to `254XXXXXXXXX` |
| Customer Name | Safaricom `FirstName`, `MiddleName`, `LastName` or fallback | `[FirstName, MiddleName, LastName].filter(Boolean).join(' ')` or `"Customer " + phone` |
| Creation Type | Constant | `CustomerCreationType.API_CREATED` |
| Customer Id | Existing `Customer.id` or generated CUID | Linked to `transaction.customerId` if null |

## Build Plan

1. Create phone normalization and customer resolution utilities in `@repo/shared` (`packages/shared/src/mpesa/customer.ts`), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
2. Integrate customer auto-saving into `MpesaService.handleStkCallback` and `MpesaService.queryStkStatus`, satisfies **AC-4**, **AC-5**.
3. Integrate customer auto-saving into `MpesaService.handleC2BConfirmation`, satisfies **AC-4**, **AC-5**.
4. Integrate customer auto-saving into `MpesaService.claimPayment`, satisfies **AC-4**, **AC-5**.
5. Write unit tests in `@repo/shared` covering all flows, deduplication, and transaction retention, satisfies **AC-1** through **AC-6**.

## Consequences

**Positive**:
- Every M-Pesa transaction automatically captures customer details into the database.
- POS and CRM users can track repeat customers, purchase history, and spend analytics seamlessly.
- Idempotent and conflict-free: existing customer profiles are not overwritten, and pre-selected customers on transactions are respected.

**Negative / Tradeoffs**:
- STK Push does not provide customer names; auto-created customers receive `"Customer " + phone` fallback names which require subsequent enrichment or manual editing in CRM.
