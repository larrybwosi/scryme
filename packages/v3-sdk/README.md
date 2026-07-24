# Scryme V3 SDK

The official TypeScript SDK for the **Scryme V3 API**—engineered for scalability, security, and developer convenience. This SDK provides complete, type-safe coverage of all Scryme V3 services, allowing developers to seamlessly integrate their applications with the Scryme ecosystem.

## 🚀 Features

- **End-to-End Type Safety**: Direct compilation from the core OpenAPI 3.0 specification.
- **Axios-Based Client**: Built-in support for request/response interceptors, customizable base URLs, and timeout configurations.
- **Comprehensive API Coverage**:
  - **Auth**: Token exchange (Client Credentials Flow) & OAuth2 proxy support.
  - **Inventory**: Stock queries, multi-branch listings, batch tracking (trace, split, merge), B2B availability checks, and integrity verify/fix logic.
  - **Orders & B2B**: Quote requests, quote-to-order conversions, and order management.
  - **CRM & Customers**: Customer registration (Zitadel), custom CRM definitions, custom fields, relationships, associations, notes, and activity timelines.
  - **Loyalty**: Loyalty status (tiers & points), voucher validation, and reward redemption.
  - **Finance**: Corporate expenses, utility account tracking, and petty cash fund management (allocations, transactions, top-ups).
  - **POS**: POS device provisioning, staff login, and petty cash expense logging.
  - **Members & Roles**: Staff rosters, custom roles, permission sets, departments, and attendance logging (check-in/check-out).
  - **Services & Bookings**: Resource utilization, booking funnel, public-facing OTP-verified booking, shifts, and materials consumption.
  - **Integrations & Webhooks**: Subscription management and Strapi E-commerce integration (storefront customer registration, storefront token exchange, sync queues).

---

## 📦 Installation

To use the Scryme V3 SDK in your project, install it from the workspace repository:

```bash
pnpm add @repo/v3-sdk
```

---

## 🔑 Authentication

The Scryme V3 API uses **OAuth2 Client Credentials Flow** to authorize external applications and integrations.

### Step 1: Exchange Credentials for an Access Token
To retrieve an access token, pass your `clientId` and `clientSecret` (generated during device/app provisioning) to the token exchange endpoint:

```typescript
import axios from "axios";
import { authExchangeToken } from "@repo/v3-sdk";

// Initialize the global axios configuration if needed
axios.defaults.baseURL = "https://api.scryme.tech";

async function authenticate() {
  try {
    const response = await authExchangeToken({
      clientId: "your_client_id_123",
      clientSecret: "your_client_secret_456"
    });

    const { accessToken, expiresIn } = response.data;
    console.log(`Authenticated successfully! Token expires in ${expiresIn}s.`);
    return accessToken;
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
}
```

### Step 2: Configure Authenticated Client Calls
Once you have the `accessToken`, register an Axios request interceptor to automatically attach the bearer token to all outgoing requests:

```typescript
import axios from "axios";

function setupAuthenticatedClient(token: string) {
  axios.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}
```

---

## 🛠️ Domain Modules & Usage Examples

Below are comprehensive examples showing how to interact with the key V3 modules.

### 📦 1. V3 Inventory Management
Query stock levels, trace/merge/split batches, and check availability for B2B accounts.

```typescript
import {
  inventoryGetInventory,
  inventoryVerifyIntegrity,
  inventoryMergeBatches,
  inventorySplitBatch
} from "@repo/v3-sdk";

const orgSlug = "scryme-hq";
const locationId = "loc_nairobi_001";

// 1. Get current stock levels at a specific location
async function checkStock() {
  const response = await inventoryGetInventory(orgSlug, {
    locationId,
    limit: 50,
    offset: 0
  });
  console.log("Stock Inventory:", response.data);
}

// 2. Verify stock integrity and run discrepancy checks
async function runIntegrityCheck() {
  const result = await inventoryVerifyIntegrity(orgSlug);
  console.log("Integrity Report:", result.data);
}

// 3. Merge multiple stock batches into a single parent batch
async function consolidateBatches() {
  await inventoryMergeBatches(orgSlug, {
    // Merge parameters
  });
}
```

### 🛒 2. Orders & B2B Sales
Submit quotes, verify B2B item stock availability, and convert approved quotes to orders.

```typescript
import {
  ordersCreateOrder,
  ordersRequestB2BQuote,
  ordersConvertQuoteToOrder,
  ordersGetOrders
} from "@repo/v3-sdk";

// 1. Request a pricing and availability quote for B2B items
async function createQuote() {
  const quote = await ordersRequestB2BQuote(orgSlug, {
    customerId: "cust_999",
    businessAccountId: "biz_acme_corp",
    locationId: "loc_nairobi_001",
    items: [
      { variantId: "var_espresso_beans_01", quantity: 15 }
    ],
    notes: "Requires delivery before Friday"
  });
  console.log("Quote Requested:", quote.data);
}

// 2. Convert an approved quote directly into a sales order
async function approveAndOrder(quoteId: string) {
  const order = await ordersConvertQuoteToOrder(quoteId, orgSlug);
  console.log("Sales Order Created:", order.data);
}
```

### 👥 3. Customers & CRM
Create and query contacts, build custom CRM records with schemas, and manage timelines.

```typescript
import {
  customersGetCustomers,
  crmControllerCreateRecord,
  crmControllerCreateNote,
  crmControllerGetTimeline
} from "@repo/v3-sdk";

// 1. Fetch organization-scoped customers
async function listCustomers() {
  const customers = await customersGetCustomers(orgSlug, { limit: 10 });
  console.log("Customers list:", customers.data);
}

// 2. Create custom CRM fields and records
async function logDealRecord() {
  // Create a record under the 'deal' definition
  const record = await crmControllerCreateRecord(orgSlug, {
    objectId: "def_deal_id",
    ownerId: "member_sales_rep_01",
    data: {
      title: "Enterprise Upgrade 2026",
      amount: 450000,
      stage: "discovery",
      expectedCloseDate: "2026-12-31"
    }
  });

  const recordId = record.data.id;

  // Add rich markdown notes to the deal's timeline
  await crmControllerCreateNote(orgSlug, {
    recordId,
    content: "# Kickoff Meeting Notes\n- Client loved the POS speed.\n- Wants M-Pesa automated routing.",
    timelineDate: new Date().toISOString()
  });

  // Fetch unified timelines containing all activities and notes
  const timeline = await crmControllerGetTimeline(recordId, orgSlug);
  console.log("Deal Timeline:", timeline.data);
}
```

### 🎫 4. Loyalty & Marketing
Track customer rewards, redeem points for discounts, and validate vouchers at Checkout.

```typescript
import {
  loyaltyGetCustomerStatus,
  loyaltyRedeemReward,
  loyaltyValidateVoucher
} from "@repo/v3-sdk";

// 1. Get customer points balance, tier level, and available rewards
async function checkLoyalty(customerId: string) {
  const status = await loyaltyGetCustomerStatus(customerId, orgSlug);
  console.log(`Tier: ${status.data.tier}, Balance: ${status.data.points} pts`);
}

// 2. Validate voucher code and check customer eligibility
async function processDiscount(code: string, customerId: string) {
  try {
    const validation = await loyaltyValidateVoucher(orgSlug, {
      code,
      customerId
    });
    console.log("Voucher Approved:", validation.data);
  } catch (error) {
    console.error("Invalid voucher code:", error);
  }
}
```

### 💵 5. Finance, Petty Cash, & Expenses
Track spending, top up petty cash drawers, and map payments to utility accounts.

```typescript
import {
  expenseControllerCreateExpense,
  pettyCashControllerCreateFund,
  pettyCashControllerTopUpFund,
  utilityAccountControllerCreateAccount
} from "@repo/v3-sdk";

// 1. Create a physical utility tracking account
async function setupElectricityMeter() {
  const account = await utilityAccountControllerCreateAccount({
    name: "HQ Power - Meter A",
    provider: "Kenya Power",
    accountNumber: "22334455-01",
    meterNumber: "M-778899",
    type: "ELECTRICITY"
  });
  return account.data.id;
}

// 2. Record a direct corporate expense
async function logExpense(utilityAccountId: string) {
  await expenseControllerCreateExpense({
    description: "HQ Monthly Electricity Bill",
    amount: 14500,
    categoryId: "cat_utilities_01",
    paymentMethod: "MPESA",
    utilityAccountId,
    isReimbursable: false,
    isBillable: false
  });
}
```

### 🏢 6. Staff, Shifts, & Attendance
Log clock-ins, check rosters, and manage custom permission sets and roles.

```typescript
import {
  attendanceControllerCheckIn,
  attendanceControllerCheckOut,
  roleManagementControllerCreateCustomRole,
  membersControllerGetMembers
} from "@repo/v3-sdk";

// 1. Employee Clock-In with notes and location validation
async function clockIn(memberId: string) {
  await attendanceControllerCheckIn(orgSlug, {
    locationId: "loc_nairobi_001",
    notes: "Starting morning shift at register 02"
  });
}

// 2. Create high-security roles with customized permissions
async function setupManagerRole() {
  const role = await roleManagementControllerCreateCustomRole(orgSlug, {
    name: "Vault Auditor",
    description: "Access to petty cash floats and inventory adjustments",
    permissions: [
      "finance:manage-floats",
      "inventory:adjust"
    ]
  });
  console.log("Audit Role Created:", role.data);
}
```

### 📅 7. Services, Scheduling, & Bookings
Manage appointments, track resource utilization, and deduct materials automatically upon completion.

```typescript
import {
  servicesControllerCreateBooking,
  servicesControllerCompleteBooking,
  publicServicesControllerRequestOtp,
  publicServicesControllerVerifyOtp
} from "@repo/v3-sdk";

// 1. Book an appointment for a customer with specific staff/resources
async function bookAppointment() {
  const booking = await servicesControllerCreateBooking(orgSlug, {
    serviceId: "srv_coffee_cupping_01",
    customerId: "cust_123",
    locationId: "loc_nairobi_001",
    scheduledStartTime: "2026-10-15T09:00:00Z",
    staffIds: ["member_barista_expert_01"],
    resourceIds: ["res_cupping_lab_A"],
    notes: "VIP tasting session"
  });
  console.log("Appointment Booked:", booking.data);
}

// 2. Complete a booking and auto-deduct standard raw materials
async function checkoutBooking(bookingId: string) {
  await servicesControllerCompleteBooking(bookingId, orgSlug, {
    actualStartTime: "2026-10-15T09:02:00Z",
    actualEndTime: "2026-10-15T10:15:00Z",
    materials: [
      { variantId: "var_specialty_beans_cupping", quantity: 0.25 } // 250g beans consumed
    ]
  });
  console.log("Booking closed and inventory updated.");
}
```

### 🔗 8. Webhooks & Event Subscriptions
Subscribe to system events and safely verify incoming signatures.

```typescript
import { webhooksCreate } from "@repo/v3-sdk";

// 1. Register a webhook callback to sync orders to an external ERP
async function setupWebhook() {
  const webhook = await webhooksCreate(orgSlug, {
    name: "External ERP Sync",
    url: "https://erp.mycompany.com/webhooks/scryme",
    events: ["order.created", "inventory.updated"]
  });

  // Use the secret to verify signatures in your endpoint (see Best Practices below)
  console.log("Webhook Registered. HMAC Secret:", webhook.data.secret);
}
```

---

## 🔒 Best Practices

### Multi-tenant Organization Scoping
All core resources are strictly isolated by organization. Ensure you always pass the correct `orgSlug` parameter as required by the endpoints. Passing an invalid or unauthorized `orgSlug` will yield a `401 Unauthorized` or `404 Not Found` response.

### Secure Webhook Verification
When receiving webhook callbacks from Scryme, always verify the webhook signature before processing the payload to prevent spoofing attacks.

```typescript
import * as crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  // Generate the expected HMAC signature
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const expectedSignature = hmac.update(payload).digest("hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
```

### Robust Error Handling
Scryme V3 API returns standardized error structures. Always wrap your SDK calls in `try/catch` blocks and parse the error fields to display helpful messages to users.

```typescript
import { isAxiosError } from "axios";

try {
  await checkStock();
} catch (error) {
  if (isAxiosError(error) && error.response) {
    const apiError = error.response.data;
    console.error(`Error (${apiError.error.code}): ${apiError.error.message}`);
    console.error("Details:", apiError.error.details);
  } else {
    console.error("Unexpected Error:", error);
  }
}
```

---

## 📄 License

This package is proprietary software belonging to Scryme Ltd. All rights reserved.
