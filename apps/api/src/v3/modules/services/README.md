# V3 Services & Bookings Module

This module manages organization services, staff schedules, resource allocations, and customer bookings. It integrates with the V3 POS module to support registering sales for both physical products and services.

---

## Architecture Overview

Services are defined with:
- **Pricing Models:** `FIXED`, `HOURLY`, or `VARIABLE`.
- **Assigned Staff & Resources:** Ensuring no scheduling or availability overlaps.
- **Bill of Materials (BOM):** Physical inventory items/variants consumed during service performance.

The sale of a service can be registered in two primary ways:

### 1. Option A: Complete Existing Booking
When a customer has a pre-scheduled `ServiceBooking` in the database:
- The checkout payload includes a valid `bookingId` for a service line item.
- The system:
  1. Validates that the booking exists, belongs to the organization, and is not already completed.
  2. Marks the booking as `COMPLETED`.
  3. Records the actual start/end times.
  4. Deducts the service's materials from active inventory levels at the location.
  5. Links the created transaction to the booking (`transactionId`).

### 2. Option C: Direct Service Sale (No Booking Required)
When a service is sold directly on-the-spot without any prior scheduling:
- The checkout payload includes a `serviceId` but **no** `bookingId`.
- The system:
  1. Validates the service belongs to the organization.
  2. Creates a transaction service line item referencing the service.
  3. Automatically consumes the service's defined materials directly from the active POS location.

---

## API Endpoints

### Booking Management (`/services/bookings`)

#### `POST /:orgSlug/services/bookings`
Creates a new service booking, verifying staff and resource availability. Supports single and recurring events (`recurrenceRule` in RRULE format).

#### `GET /:orgSlug/services/bookings`
Lists all service bookings.

#### `GET /:orgSlug/services/bookings/:id`
Retrieves details of a specific booking, including staff, resources, and consumed materials.

#### `PATCH /:orgSlug/services/bookings/:id/status`
Updates the status of a booking (e.g. `IN_PROGRESS`, `NOSHOW`, `CANCELLED`).

#### `PATCH /:orgSlug/services/bookings/:id/complete`
Directly completes a booking, records actual duration, and consumes materials from inventory.

---

## Service POS Checkout Schema

To register a combined sale of products and services, submit a `POST /:orgSlug/pos/sale` request.

### Example Request Payload

```json
{
  "items": [
    {
      "variantId": "prod_variant_001",
      "quantity": 2,
      "unitPrice": 15.00
    }
  ],
  "serviceItems": [
    {
      "serviceId": "srv_haircut_001",
      "quantity": 1,
      "unitPrice": 45.00,
      "bookingId": "bk_existing_booking_123",
      "notes": "Option A: Completing pre-scheduled appointment"
    },
    {
      "serviceId": "srv_wash_002",
      "quantity": 1,
      "notes": "Option C: Direct walk-in service (no booking)"
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 75.00
    }
  ],
  "discountAmount": 0,
  "customerPhone": "+254712345678",
  "notes": "Combined walk-in and scheduled appointment checkout"
}
```
