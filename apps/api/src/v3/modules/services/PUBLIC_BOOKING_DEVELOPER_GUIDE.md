# Scryme V3: Public Services & Customer Booking Integration Guide

This guide outlines how to leverage the unauthenticated customer-facing endpoints in Scryme’s V3 API to design beautiful, performant storefront booking applications.

---

## Architecture Overview

Customer-facing portals or mobile applications do not require dashboard staff user sessions. Instead, they interact with our public routes under the `/public/:orgSlug/services` path namespace.

### The Public Booking Flow
1. **Query Available Offerings**: Retrieve bookable services and group categories.
2. **Calculate Availability**: Query specific dates to mathematically compute available timeslots.
3. **Verify Identity (OTP)**: Send a 6-digit verification code to the customer’s phone number or email address.
4. **Confirm OTP**: Exchange the OTP code for a secure, single-use `verificationId`.
5. **Secure Booking**: Complete the booking using the `verificationId`. The system automatically registers the guest customer or associates the session with an existing customer profile.

---

## API Documentation

### 1. Retrieve Public Services
Fetches all active bookable services registered under the organization.

- **Endpoint:** `GET /api/v3/public/:orgSlug/services`
- **Headers:** None (Unauthenticated)

#### Response Example
```json
{
  "success": true,
  "data": [
    {
      "id": "srv_haircut_001",
      "name": "Express Men's Haircut",
      "sku": "SRV-EX-CUT",
      "pricingModel": "FIXED",
      "price": "45.00",
      "estimatedDuration": 30,
      "bufferTimeBefore": 5,
      "bufferTimeAfter": 10
    }
  ]
}
```

---

### 2. Retrieve Service Categories
Fetches all service categories to support grouping inside the catalog.

- **Endpoint:** `GET /api/v3/public/:orgSlug/services/categories`
- **Headers:** None (Unauthenticated)

---

### 3. Fetch Service Timeslot Availability
Dynamically computes available time slots for a specific service on a target date.

- **Endpoint:** `GET /api/v3/public/:orgSlug/services/:id/availability`
- **Query Parameters:**
  - `date`: Target date in `YYYY-MM-DD` format (defaults to current date).

#### Under the Hood: Mathematical Slot Generation
Our algorithm evaluates the following variables in real-time to prevent conflicts and double-bookings:
- **Staff Shifts**: Maps working hours (e.g. `09:00` - `17:00`) of assigned/capable team members for that day.
- **Rest Breaks**: Blocks slots overlapping with staff lunch or rest windows.
- **Overlapping Bookings**: Checks both staff and required resource schedules against existing bookings (including custom pre- and post-buffer margins).

#### Response Example
```json
{
  "success": true,
  "data": {
    "serviceId": "srv_haircut_001",
    "date": "2026-10-15",
    "availableSlots": [
      "2026-10-15T09:00:00.000Z",
      "2026-10-15T09:30:00.000Z",
      "2026-10-15T11:00:00.000Z"
    ]
  }
}
```

---

### 4. Initiate OTP Identity Verification
Sends a secure 6-digit code via Email or SMS.

- **Endpoint:** `POST /api/v3/public/:orgSlug/services/otp/request`
- **Body:**
```json
{
  "email": "customer@example.com",
  "phoneNumber": "+254712345678" // Provide either email or phone number
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "verificationId": "vcode_8a92b3c4d5"
  }
}
```

---

### 5. Confirm OTP Code
Confirms the code. Successful verification unlocks the Single-Use Verification ID.

- **Endpoint:** `POST /api/v3/public/:orgSlug/services/otp/verify`
- **Body:**
```json
{
  "email": "customer@example.com",
  "code": "123456"
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "verificationId": "vcode_8a92b3c4d5"
  }
}
```

---

### 6. Create Public Booking
Finalizes the booking session. The single-use verification ID is automatically consumed and deleted to protect against replay or verification bypass attacks.

- **Endpoint:** `POST /api/v3/public/:orgSlug/services/bookings`
- **Body:**
```json
{
  "serviceId": "srv_haircut_001",
  "verificationId": "vcode_8a92b3c4d5",
  "scheduledStartTime": "2026-10-15T09:00:00.000Z",
  "notes": "Prefer window seat if available"
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "id": "bk_booking_987654",
    "status": "SCHEDULED",
    "serviceName": "Express Men's Haircut",
    "scheduledStartTime": "2026-10-15T09:00:00.000Z",
    "scheduledEndTime": "2026-10-15T09:30:00.000Z"
  }
}
```

---

## SDK Integration Examples

Using `@repo/sdk`, completing a public booking takes only a few lines of code:

```typescript
import { getSDK } from "@repo/sdk";

const scryme = getSDK({
  baseURL: "https://api.scryme.tech/api/v3"
});

const orgSlug = "scryme-nairobi";

// 1. Fetch available timeslots
const { availableSlots } = await scryme.services.getServiceAvailability(
  orgSlug,
  "srv_haircut_001",
  "2026-10-15"
);

// 2. Request OTP Code
const { verificationId } = await scryme.services.requestOtp(orgSlug, {
  email: "alice@example.com"
});

// 3. Verify OTP Code (Enter code from user)
await scryme.services.verifyOtp(orgSlug, {
  email: "alice@example.com",
  code: "555888"
});

// 4. Submit Booking Reservation
const booking = await scryme.services.createPublicBooking(orgSlug, {
  serviceId: "srv_haircut_001",
  verificationId,
  scheduledStartTime: "2026-10-15T09:00:00.000Z",
  notes: "Looking forward to it!"
});

console.log("Successfully Booked!", booking.id);
```
