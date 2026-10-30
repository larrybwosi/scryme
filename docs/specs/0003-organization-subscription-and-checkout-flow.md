# 0003 Organization Subscription and Checkout Flow

- **Status**: Proposed
- **Date**: 2026-10-30
- **Mode**: FEATURE
- **Build Approach**: End-to-end slice

## Summary

This specification defines the complete user journey for viewing plans in the marketing application (`site-next`), transitioning into `apps/web` (`/create-org`), selecting or pre-filling plan details, starting a 14-day free trial or completing M-Pesa payments, and provisioning the organization with corresponding tier quotas and feature flags.

## Context

Users coming from `site-next` click plan call-to-actions that pass plan, billing cycle, and currency metadata in URL query parameters (e.g. `/create-org?plan=growth&billing=annual&currency=kes`). Previously, `/create-org` only created a basic organization without plan selection or trial/payment capabilities. Furthermore, M-Pesa payments were not connected to initial organization onboarding, and plan quotas were not systematically assigned during organization creation.

## Requirements

- **AC-1**: When navigating to `/create-org` with URL parameters (`plan`, `billing`, `currency`), the UI must pre-select the corresponding plan tier and billing cycle.
- **AC-2**: The `/create-org` flow must present an interactive plan selection step allowing users to view features and toggle/switch between `free`, `growth`, `scale`, and `enterprise` plans.
- **AC-3**: For paid plans (`growth`, `scale`), users can choose between starting a 14-day free trial without immediate payment or paying via M-Pesa STK Push.
- **AC-4**: Submitting the organization setup with a 14-day free trial creates the `Organization`, sets `Subscription` status to `TRIALING`, and sets `trialEndsAt` to 14 days in the future.
- **AC-5**: Submitting the setup with M-Pesa triggers an STK push payment request. Upon payment confirmation or initiation, the `Subscription` is created and configured.
- **AC-6**: Organization quotas (store node counts, monthly transaction allowances, Hermes AI flags) are persisted into the `Subscription` and/or `Organization` custom fields upon creation according to the chosen plan tier.

## Options Considered

### Option 1: External payment checkout redirect (e.g. Hosted Stripe / Dodo Checkout)
- **Pros**: Offloads payment UI entirely.
- **Cons**: Disrupts the onboarding step flow; does not support local M-Pesa STK Push modal directly within `/create-org`.

### Option 2: Embedded Onboarding Flow with 14-day Trial & M-Pesa STK Push (Chosen)
- **Pros**: Direct, friction-free onboarding; seamless support for regional M-Pesa STK push and instant 14-day free trial provisioning.
- **Cons**: Requires building UI step handling and M-Pesa server action in `apps/web`.

## Decision

We adopt **Option 2**. `/create-org` will feature a dedicated multi-step onboarding component that reads query parameters, renders plan cards with feature comparisons, offers both "Start 14-Day Free Trial" and "Pay with M-Pesa" paths, and executes the server action `createOrganizationWithPlan` to persist the organization, location, subscription, and quotas.

## Rationale

This approach provides a complete user conversion flow from `site-next` marketing cards directly into an active, functional workspace on `apps/web`, catering directly to regional payment defaults (M-Pesa) while allowing instant trial access.

## Feature Design

### Data Model & Quotas

Plan tier metadata and default limits:
- **Free**: 1 Store Node, 1,000 monthly transactions, Hermes AI disabled.
- **Growth**: 5 Store Nodes, 10,000 monthly transactions, 14-day free trial, Hermes AI disabled.
- **Scale**: Unlimited Store Nodes, 100,000 monthly transactions, 14-day free trial, Hermes AI enabled.
- **Enterprise**: Custom Store Nodes, Custom throughput, Hermes AI enabled.

Stored on `Subscription`:
- `status`: `TRIALING` | `ACTIVE`
- `trialStartedAt`, `trialEndsAt`
- `billingInterval`: `monthly` | `annual`
- `customCurrency`: `USD` | `KES` | etc.

### Value Sourcing

| Target Field | Source |
|---|---|
| Organization Name & Slug | User input in `/create-org` |
| Plan Tier | URL query param `?plan=` or UI selection card |
| Billing Cycle | URL query param `?billing=` or UI toggle |
| Currency | URL query param `?currency=` or UI selector |
| M-Pesa Phone Number | User input in M-Pesa modal/step |
| Quotas & Limits | Derived from plan tier mapping |

### API & Server Actions Surface

1. `createOrganizationWithPlan(data: CreateOrgWithPlanInput)`
   - Input: `{ name, slug, plan, billingInterval, currency, paymentMethod, phoneNumber? }`
   - Output: `{ success: boolean, organizationId: string, subscriptionId: string, checkoutStatus?: string }`

2. `initiateMpesaSubscriptionPayment(data: MpesaPaymentInput)`
   - Input: `{ phoneNumber, amount, accountReference }`
   - Output: `{ CheckoutRequestID: string, ResponseCode: string, CustomerMessage: string }`

### Security & Authorization

- Only authenticated users (`auth.user`) can invoke `createOrganizationWithPlan`.
- The user is automatically assigned the `OWNER` role on the newly created organization.

### Edge Cases & Failure Modes

- **Invalid query parameters**: Fallback gracefully to default plan (`growth`, `monthly`, `usd`).
- **M-Pesa STK push timeout/failure**: Show error banner and allow retrying or falling back to starting a 14-day trial without immediate payment.
- **Duplicate organization slug**: Validate slug availability dynamically and suggest alternatives.

## Build Plan

1. Update `apps/web/app/actions/organization.ts` to implement `createOrganizationWithPlan` with trial dates and quota setup.
2. Update `apps/web/app/create-org/page.tsx` and `client.tsx` to parse URL params, render plan selection cards, trial options, and M-Pesa payment integration.
3. Add M-Pesa STK push action integration for plan onboarding.
4. Verify end-to-end flow from query parameter navigation to workspace redirect.

## Consequences

**Positive**:
- Complete end-to-end onboarding conversion flow from marketing site to product.
- Flexible payment and trial capabilities built directly into the web application.

**Negative / Tradeoffs**:
- Requires maintaining plan tier metadata synchronization between `site-next` and `apps/web`.

**Neutral**:
- Extends the `/create-org` page component with interactive step navigation.
