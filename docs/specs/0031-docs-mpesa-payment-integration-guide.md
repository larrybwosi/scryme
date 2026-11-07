# 0031 · M-Pesa Payment Integration & Credential Guide in Docs App

**Status**: Accepted
**Date**: 2026-11-07
**Mode**: DOCUMENTATION & UI
**Build Approach**: Vertical Slice (`apps/docs`)

## Summary

This specification defines the comprehensive user-facing documentation in `apps/docs` for enabling M-Pesa payments within Scryme. It covers end-to-end guidance for obtaining Safaricom Daraja API credentials (Sandbox and Production Go-Live), understanding Paybill vs. Buy Goods (Till) numbers, configuring organization credentials in the Scryme workspace, payment lifecycle flows (Lipa Na M-Pesa Online STK Push and C2B Paybill validation/confirmation), automatic customer profile tracking, and troubleshooting common Daraja error codes.

## Context

Scryme provides native mobile money processing via Safaricom M-Pesa across POS terminals, web checkouts, and customer invoices. Merchants frequently ask how to generate Daraja credentials, where to find passkeys, how to register their shortcodes, and how Scryme automates customer tracking and transaction settlement. Documenting this directly inside the Docs application (`/docs/integrations/mpesa`) ensures merchant onboarding is seamless and self-service.

## Requirements

- **AC-1 (Dedicated Route)**: Implement route `/docs/integrations/mpesa` in `apps/docs/src/routes/docs.integrations.mpesa.tsx` with complete SEO metadata, structured sections, interactive copyable snippets, and informative callouts.
- **AC-2 (Credential Acquisition Guide)**:
  - **Daraja Sandbox**: Step-by-step account signup on `developer.safaricom.co.ke`, sandbox app creation, obtaining Consumer Key and Consumer Secret, and utilizing default test shortcodes and passkeys.
  - **Production Go-Live**: Moving from sandbox to production, Daraja go-live approval requirements (Business KYC, Certificate of Incorporation, Director ID, Nominated Phone Number), generating production Consumer Key & Secret, obtaining Lipa Na M-Pesa Online Passkey via Safaricom M-Pesa Business Administrator or developer portal, and configuring Initiator Password for automated reversals/b2c.
- **AC-3 (Paybill vs. Till Comparison)**: Clear breakdown of when to select `PAYBILL` vs. `TILL`, account reference mechanics, and settlement rules.
- **AC-4 (Scryme In-App Setup)**: Clear visual walkthrough of `Settings > Organization Settings > Payment Options (M-Pesa)`:
  - M-Pesa Type (`PAYBILL` / `TILL`)
  - Environment (`SANDBOX` / `PRODUCTION`)
  - ShortCode (5-7 digits)
  - Consumer Key & Consumer Secret
  - Lipa Na M-Pesa Online Pass Key
  - Initiator Password (optional for disbursements)
- **AC-5 (Payment Processing Lifecycle & Customer Auto-Saving)**:
  - STK Push prompt trigger on POS and web checkouts.
  - C2B Paybill/Till manual customer payments with webhook confirmation.
  - E.164 phone normalization (`254XXXXXXXXX`) and automatic customer creation/linking.
- **AC-6 (Troubleshooting & FAQs)**:
  - Error codes (e.g. `1032` User Cancelled, `1` Insufficient Funds, `2001` Invalid Initiator, timeout handling).
- **AC-7 (Navigation & Discovery)**:
  - Link `/docs/integrations/mpesa` from `/docs/integrations` card.
  - Add to `apps/docs/src/routes/__root.tsx` sidebar navigation under Guides and the omnibar search directory.

## Value Sourcing & Structure

| Section | Content Source |
|---|---|
| Credentials | Safaricom Daraja Developer API v1/v2 & Safaricom Business Portal |
| Scryme Settings UI | `apps/web/app/settings/settings-form.tsx` (Payment Options) |
| Backend Services | `packages/shared/src/mpesa/*` & `apps/api/src/v3/modules/payments` |
| Navigation | `apps/docs/src/routes/__root.tsx` & `apps/docs/src/routes/docs.integrations.tsx` |

## Build Plan

1. Create `docs/specs/0031-docs-mpesa-payment-integration-guide.md` (this spec).
2. Create `apps/docs/src/routes/docs.integrations.mpesa.tsx` implementing the complete documentation component.
3. Update `apps/docs/src/routes/docs.integrations.tsx` linking to the guide.
4. Update `apps/docs/src/routes/__root.tsx` with sidebar navigation entry and search item.
5. Verify build, route tree generation, and TypeScript checks in `apps/docs`.
