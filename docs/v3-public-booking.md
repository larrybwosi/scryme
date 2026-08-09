# Scryme V3 Public Service Booking Integration Guide

This guide details how developers can integrate the unauthenticated, storefront-safe public service booking flow of the Scryme V3 API. This feature separates security controls cleanly between Client-side (Storefront/SPA) apps and Server-side (Administrative/Staff) platforms.

---

## 1. Architectural Overview & Security Separation

To avoid exposing administrative functions and credentials to end-user environments, Scryme splits its SDK namespace:

### Client-side SDK (`@scryme/sdk/client`)
- **Security Context**: Authenticated with unprivileged credentials (single-organization scoped).
- **Target Audience**: Storefronts, public booking portals, mobile apps.
- **Allowed Services Namespaces**: Only unauthenticated/public service booking endpoints. Admin methods like `createCategory`, `updateService`, `getShifts`, or `getAttendanceLogs` are omitted at the type/runtime levels for protection.

### Server-side SDK (`@scryme/sdk/server`)
- **Security Context**: Authenticated with full Server API keys or multi-tenant client secrets.
- **Target Audience**: Backend administration panels, CRMs, internal integrations.
- **Allowed Services Namespaces**: Fully featured `services` module, including both public queries and administrative tasks (e.g., managing categories, creating services, managing recurring shifts, breaks, and booking completions).

---

## 2. API Endpoint Catalog

These unauthenticated public booking endpoints use the `orgSlug` context (transferred via URL and the `x-org-slug` header) to query organization-specific resources without full staff authorization.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v3/public/:orgSlug/services` | Lists all public, active services available for booking. |
| `GET` | `/v3/public/:orgSlug/categories` | Lists active public booking categories. |
| `GET` | `/v3/public/:orgSlug/services/:serviceId` | Retrieves details and duration rules for a single service. |
| `GET` | `/v3/public/:orgSlug/services/:serviceId/availability` | Computes live timezone-resilient slot availability. |
| `POST` | `/v3/public/:orgSlug/otp/request` | Requests a single-use OTP for customer guest session initiation. |
| `POST` | `/v3/public/:orgSlug/otp/verify` | Verifies OTP to return an ephemeral validated customer session token. |
| `POST` | `/v3/public/:orgSlug/bookings/public`| Submits a live guest booking under verified customer identity. |

---

## 3. Client-side Implementation Flow (`@scryme/sdk/client`)

Client integrations are unauthenticated and run directly in the storefront. Below is the full integration cycle:

### A. Initialization
```typescript
import { createClientSDK } from "@scryme/sdk/client";

const client = createClientSDK({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  orgSlug: "acme-wellness",
});
```

### B. Fetching Services & Categories
Query categories or list of services to render on the storefront portal:
```typescript
const categories = await client.services.getCategories();
const services = await client.services.listServices();
```

### C. Live Availability Search
Search for available timeslots for a specific service using query filters:
```typescript
const availableSlots = await client.services.getAvailability("service-uuid", {
  startDate: "2026-08-10T00:00:00Z",
  endDate: "2026-08-11T23:59:59Z",
});
```

### D. OTP Identity Verification
Guest bookings are confirmed using single-use OTP validation to protect from spam bookings:
```typescript
// 1. Request OTP to the user's phone/email
await client.services.requestOtp({
  phoneNumber: "+254700000000",
  email: "guest@example.com",
});

// 2. Verify OTP code received by guest
const verifyResponse = await client.services.verifyOtp({
  phoneNumber: "+254700000000",
  code: "123456",
});

const ephemeralToken = verifyResponse.token;
```

### E. Confirm Booking
Submit the booking along with the confirmed ephemeral customer token:
```typescript
const booking = await client.services.createBooking({
  serviceId: "service-uuid",
  startTime: "2026-08-10T10:00:00Z",
  customerToken: ephemeralToken,
  customerName: "John Doe",
  customerEmail: "guest@example.com",
  customerPhone: "+254700000000",
});
```

---

## 4. Server-side Administration Flow (`@scryme/sdk/server`)

Server applications utilize the full capabilities of scheduling and booking configurations:

### A. Initialization
```typescript
import { createServerSDK } from "@scryme/sdk/server";

const server = createServerSDK({
  clientId: "admin-client-id",
  clientSecret: "admin-client-secret",
  orgSlug: "acme-wellness",
});
```

### B. Dynamic Shift & Break Configurations
Manage recurring staff schedules and breaks which influence slot generation:
```typescript
// Add weekly recurring shift for a staff member
const shift = await server.services.createShift({
  memberId: "staff-uuid",
  dayOfWeek: 1, // Monday
  startTime: "08:00",
  endTime: "17:00",
});

// Configure breaks during shift hours
await server.services.addBreak({
  shiftId: shift.id,
  startTime: "12:00",
  endTime: "13:00",
  isActive: true,
});
```

### C. Resource & Service CRUD Operations
```typescript
// Create booking category
const category = await server.services.createCategory({
  name: "Spa Therapy",
  description: "Massage and facial therapies",
});

// Create active bookable service
const service = await server.services.createService({
  categoryId: category.id,
  name: "Deep Tissue Massage",
  duration: 60, // minutes
  preBuffer: 10, // setup buffer
  postBuffer: 15, // cleanup buffer
  isActive: true,
});
```
