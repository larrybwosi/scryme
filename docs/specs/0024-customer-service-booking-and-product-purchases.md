# 0027 · Customer Service Booking and Product Purchases

**Status**: Accepted
**Date**: 2026-08-05
**Authorized by**: User / Architect

## Context
Scryme V3 supports customer authentication (`v3_customer` JWT session tokens), cart management (`/v3/:orgSlug/cart`), checkout & payments (`/v3/:orgSlug/payments/checkout`), and public/guest service bookings (`/v3/public/:orgSlug/services`).
However, previously:
1. `CheckoutUseCase` only handled physical product variants, ignoring service bookings in the cart.
2. Only M-Pesa STK push was supported at checkout, missing flexible industry checkout flows such as Cash on Delivery (COD) and Pay at Venue (PAV).
3. `PermissionsGuard` did not include `order:create` in customer default permissions (`v3_customer`), causing permission errors when authenticated customers checked out.
4. Public guest bookings created isolated `ServiceBooking` records without initiating an order transaction or supporting payment terms.

## Requirements (Acceptance Criteria)
- **AC-1 (Unified Cart & Checkout)**: A customer can check out a cart containing physical products, bookable services, or both simultaneously in a single transaction.
- **AC-2 (Service Booking Generation & Association)**: For each bookable service in the cart, the system creates/validates the service booking, allocates an available staff member if none was assigned, creates a `TransactionServiceItem`, and links the `ServiceBooking` to the created `Transaction`.
- **AC-3 (Flexible Payment Methods)**: Checkout supports multiple payment methods: `MPESA` (triggers STK push), `CASH_ON_DELIVERY`, and `PAY_AT_VENUE`. Non-instant payments create a `PENDING` payment record and order in `PENDING_CONFIRMATION` status.
- **AC-4 (Customer Authorization)**: Customers authenticated with `v3_customer` tokens have necessary permissions (`order:create`, `payment:create`, `order:read`) to execute checkout and view their created orders.
- **AC-5 (Guest / Public Booking Flow)**: Public bookings can seamlessly record customer identity and optionally initialize payment tracking.

## Decision & Technical Design

### Data Model & Entities
- Reuses existing Prisma schema entities:
  - `Transaction` (`ONLINE_ORDER`, `ECOMMERCE_STORE`)
  - `TransactionItem` (for physical products/variants)
  - `TransactionServiceItem` (for service bookings)
  - `ServiceBooking` (`SCHEDULED` / `PENDING_CONFIRMATION`)
  - `Payment` (`MPESA`, `CASH`, etc. with status `PENDING`)

### API Surface
- `POST /v3/:orgSlug/payments/checkout`:
  - Request body:
    - `cartId?: string`
    - `sessionId?: string`
    - `phoneNumber: string`
    - `locationId?: string`
    - `paymentMethod?: "MPESA" | "CASH_ON_DELIVERY" | "PAY_AT_VENUE"` (default: `MPESA`)
    - `notes?: string`
  - Response:
    - `orderId: string`
    - `paymentId: string`
    - `paymentMethod: string`
    - `status: string`
    - `merchantRequestID?: string`
    - `checkoutRequestID?: string`

### Auto-Assignment and Availability
- For services present in the cart, if `staffIds` are not specified in `bookingDetails`, the system checks staff schedules and availability for the designated timeslot and auto-assigns an available qualified staff candidate.

## Consequences
- Unified checkout provides an omnichannel retail and service experience.
- Supports physical delivery (with Cash on Delivery), in-store pickup, and salon/clinic/consulting appointments with pay-at-venue options.
