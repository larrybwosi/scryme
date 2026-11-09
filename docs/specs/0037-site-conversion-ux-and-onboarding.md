# 0037 Site Conversion UX and Onboarding Flow

**Date**: 2026-10-30
**Status**: Proposed

## Summary

This specification defines the unified conversion experience from the Scryme marketing site to user registration and organization onboarding. It ensures that user intent such as plan tier, billing frequency, and regional currency is preserved across sign up and workspace creation. Free tier users get immediate zero friction activation, while paying and trial users receive clear tier transparency with optional instant M-Pesa STK push payments.

## Context

Prospective customers land on `apps/site-next` and evaluate features across pricing and capability pages. When they select a call to action (such as Free starter testing, or Growth and Scale 14 day trials), query parameters (`plan`, `billing`, `currency`, `trial`) are attached to outbound links pointing to the web application.

Previously, `apps/web/app/sign-up` only looked at `callbackUrl`, dropping direct plan parameters upon successful email or social authentication. Furthermore, `apps/web/app/create-org` had a comprehensive plan selector UI, but its submission handler called `createOrganization` without supplying `planConfig`. As a result, selected plans, billing cycles, and M-Pesa payment choices were not persisted to the database, and STK push requests were never dispatched during workspace setup.

## Requirements

**User stories**:
- As a visitor selecting a plan on the marketing site, I want my chosen plan, billing cycle, and currency to carry through registration into workspace creation automatically so that I do not have to reconfigure my choices.
- As a free tier user, I want instant workspace creation without payment fields or countdown anxiety so that I can explore the core product immediately.
- As a trial or paying user choosing M-Pesa, I want an immediate STK push trigger and clear status feedback so that my subscription activates without manual bank transfers.

**Acceptance criteria**:
- **AC-1**: Registration and login pages in `apps/web` must preserve `plan`, `billing`, `currency`, and `trial` parameters and forward them into the `/create-org` redirect URL.
- **AC-2**: Social logins (Google, Microsoft, GitHub) and email registrations in `apps/web/app/sign-up` must append these preserved query parameters to `callbackURL`.
- **AC-3**: In `apps/web/app/create-org`, submitting the organization form must forward `planConfig` (including `plan`, `billingInterval`, `currency`, `paymentMethod`, and `mpesaPhoneNumber`) to the `createOrganization` server action.
- **AC-4**: When M-Pesa is selected as the payment method in `/create-org`, the client must validate the phone number format and trigger `initiateMpesaSubscriptionPayment` while displaying a clear pending prompt indicator.
- **AC-5**: Free tier selection in `/create-org` must hide payment method selectors and create the organization with `ACTIVE` status and starter quotas (1 Store Node, 1,000 monthly transactions).
- **AC-6**: Marketing CTAs across `apps/site-next` must uniformly include standard query parameters for both free and paid tiers.

## Options considered

### Option 1: Store conversion state in browser cookies or localStorage
- **Pros**: Independent of URL string manipulation.
- **Cons**: Prone to cross-domain issues between `scryme.tech` and `app.scryme.tech`; fails across private browsing or third-party cookie restrictions.

### Option 2: Explicit URL Query Parameter Forwarding & Synchronized Server Actions (Chosen)
- **Pros**: Robust across subdomains, fully stateless, resilient to OAuth redirects, and easily inspectable in logs.
- **Cons**: Requires explicit parameter preservation in sign up and login client controllers.

## Decision

**Chosen option**: Option 2: Explicit URL Query Parameter Forwarding & Synchronized Server Actions.

We preserve all incoming conversion parameters (`plan`, `billing`, `currency`, `trial`) in `apps/web/app/sign-up` and `apps/web/app/login`, appending them to the `/create-org` callback URL. In `/create-org`, the client passes the active `planConfig` directly to `createOrganization` and executes `initiateMpesaSubscriptionPayment` when M-Pesa activation is requested.

## Feature Design

**Data model sketch**:
Uses existing Prisma models in `@repo/db`:
- `Organization.quotaOverrides`: `{ plan: string, storeNodes: number, monthlyTransactions: number, hermesAi: boolean }`
- `Subscription`: `{ status: 'ACTIVE' | 'TRIALING', trialStartedAt, trialEndsAt, billingInterval, customCurrency, customNotes }`

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Signup / Login Redirect | `callbackURL` query params | URL search parameters (`plan`, `billing`, `currency`, `trial`) |
| Organization Creation | `quotaOverrides` | Derived from `planConfig.plan` mapping in `createOrganization` |
| Subscription Creation | `status`, `trialEndsAt` | Derived from `planConfig.plan` and `planConfig.paymentMethod` |
| M-Pesa STK Push | `checkoutRequestId` | Returned by `initiateMpesaSubscriptionPayment` using phone number |

**API surface**:
| Server Action | Key inputs | Key outputs | Auth |
|---|---|---|---|
| `createOrganization` | `{ name, slug, industry, size, planConfig }` | `Organization` | Authenticated session |
| `initiateMpesaSubscriptionPayment` | `{ phoneNumber, plan, amount }` | `{ success, message, checkoutRequestId }` | Authenticated session |

**Critical test scenarios**:
- Happy path free tier: User registers, arrives at `/create-org?plan=free`, submits, and lands on `/dashboard` with active status, verifying **AC-1**, **AC-3**, **AC-5**.
- Happy path paid trial: User registers from scale CTA, lands on `/create-org?plan=scale&billing=annual`, creates workspace with 14 day trial, verifying **AC-1**, **AC-2**, **AC-3**.
- M-Pesa flow: User selects M-Pesa, inputs phone number, receives STK push feedback, and launches workspace, verifying **AC-3**, **AC-4**.

## Build plan

1. Author build spec `0037-site-conversion-ux-and-onboarding.md`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
2. Enhance `apps/web/app/sign-up/signup-client.tsx` and `apps/web/app/login` to propagate conversion query parameters, satisfies **AC-1**, **AC-2**.
3. Update `apps/web/app/create-org/client.tsx` to forward `planConfig` to `createOrganization` and trigger `initiateMpesaSubscriptionPayment`, satisfies **AC-3**, **AC-4**, **AC-5**.
4. Standardize CTA URLs and parameters across `apps/site-next`, satisfies **AC-6**.

## Consequences

**Positive**:
- Cohesive, unbroken user journey from marketing discovery to operational workspace.
- Proper quota allocation and subscription state initialization from the first second of usage.
- Transparent and reliable regional M-Pesa STK push handling during onboarding.

**Negative / tradeoffs**:
- Modest maintenance requirement to keep pricing tier keys aligned across site and app.
