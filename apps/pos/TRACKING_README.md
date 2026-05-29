# Dealio Tracking & Telemetry Guidelines

This document outlines the standard operating procedures and rules for implementing telemetry tracking using Aptabase in the Dealio application. Our goal is to collect enterprise-level analytics respecting user privacy while comprehensively tracking user adoption, feature usage, and system health.

## 1. Global Setup

Aptabase is integrated in both the Rust Backend and React Frontend.
**App Key:** `APPTABASE-KEY`

### Backend Initialization

Aptabase is initialized in `src-tauri/src/lib.rs` through `tauri_plugin_aptabase::Builder::new("APPTABASE-KEY").build()`.
**Note:** For tracking events from Rust, use `tauri_plugin_aptabase::EventTracker` trait.

### Frontend Tracking

Frontend tracking is done via the `@aptabase/tauri` library. The `trackEvent` function should be used for all user actions.

## 2. When to Track Events

Every new feature MUST include telemetry logging to understand user adoption.
Track an event when:

1. **Application Lifecycle:** App starts, updates, or exits (tracked automatically or via `app_started`).
2. **Core Actions:** Key operations e.g., processing a sale, adding a new customer, successful stock transfers.
3. **Engagement:** Creating/updating configuration (e.g. Settings changes).
4. **Errors:** Silent but critical application logic failures that impact user experience.

## 3. Event Naming Convention

Use `snake_case` for all event names. Be descriptive and action-oriented.
**Examples:**

- `sale_processed`
- `customer_created`
- `receipt_printed`
- `stock_transfer_initiated`
- `settings_updated`

## 4. Event Properties

Aptabase only allows `string` and `number` properties. Avoid nested JSON objects; flatten data where possible. Never track sensitive PII data.

**Good Practice:**

```typescript
import { trackEvent } from '@aptabase/tauri';

trackEvent('sale_processed', {
  sale_id: 'tx_12345', // Strings are fine
  amount: 154.5, // Numbers are fine
  payment_method: 'CARD',
});
```

**Bad Practice (Do NOT do this):**

```typescript
trackEvent('sale_processed', {
  user: { id: '123', name: 'John Doe' }, // Nested objects will fail or be stringified poorly
  customer_phone: '555-1234', // Do NOT track PII
});
```

## 5. Adding New Features

Whenever you add a new route, modal, or business action:

1. Identify the logical "success" hook of your new feature.
2. Add a `trackEvent("feature_name_action")` to the success branch of your code.
3. If the feature has variations, pass the string/number variations in the properties payload.
4. Ensure no PII (phone numbers, full names, detailed locations) is inadvertently captured in strings.

## 6. Permissions

All Tauri commands executing `trackEvent` must have the `"aptabase:default"` or `"aptabase:allow-track-event"` permission included in the Capability scopes (`default.json`).

_These guidelines ensure a consistent, privacy-focused, and robust analytics environment for the Dealio enterprise suite._
