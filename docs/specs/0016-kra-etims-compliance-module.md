# 0015. KRA & eTIMS Compliance Architecture

**Date**: 2026-11-03
**Status**: Accepted

## Summary

This specification establishes an end-to-end Kenya Revenue Authority (KRA) & electronic Tax Invoice Management System (eTIMS) module for Scryme. It introduces a modular dual-provider architecture supporting both the **Navari KRA Integration** and **Direct KRA eTIMS (OSCU / VSCU Online / API)**, customizable per-tenant configurations, automated fiscalization for POS sales and B2B invoices, full purchase input VAT tracking, audit logs with retry workflows, and a comprehensive Tax Compliance management dashboard in the web application.

## Context

Businesses operating in Kenya are legally required by the Kenya Revenue Authority (KRA) to transmit fiscalized transactions via eTIMS / ETR devices in real-time. Previously, Scryme had partial integration stubs via `NavariService` and placeholder models, but lacked:
1. First-class module toggling in `PLATFORM_MODULES` for granular tenant and administrative access control.
2. Configurable direct eTIMS protocol support alongside third-party aggregators (Navari).
3. Dedicated organization configuration records (`KRAConfig`) covering Trader PIN, Branch Code, Device Serial / Unit ID, environment toggles (Sandbox/Production), and threshold policies.
4. Robust compliance log records (`KRAComplianceLog`) with error states, fiscal confirmation codes, QR code URLs, and retry capabilities.
5. An interactive Tax Compliance Dashboard under `/finance/reports/tax-compliance` providing Kenyan businesses with fiscal oversight, return previews, live PIN validation, and configuration controls.

## Requirements

### Acceptance Criteria

- **AC-1 (Platform Module Definition)**:
  - Add `kra` as a platform module in `PLATFORM_MODULES` (`packages/shared/src/constants/modules.ts`) under category `financial` with `defaultEnabled: true`.
- **AC-2 (Database Schema & Persistence)**:
  - Add `KRAConfig` model linked 1-to-1 with `Organization`, storing provider, environment, credentials, and thresholds.
  - Enhance `KRAComplianceLog` with provider, controlCode, receiptNumber, qrCodeUrl, errorCode, errorMessage, retryCount, and metadata.
  - Enhance `Invoice` and `Transaction` with `kraControlCode`, `kraReceiptNumber`, and `kraQrCode`.
- **AC-3 (KRA Provider Engine & Abstraction)**:
  - Provide an extensible `IKRAProvider` interface implemented by `NavariKRAProvider` and `DirectEtimsKRAProvider`.
  - Implement `KRAService` to encapsulate provider resolution, credential decryption, schema validation, retry logic, and audit logging.
- **AC-4 (API & Transaction Integration)**:
  - Expose NestJS V3 REST endpoints in `KraModule` (`/v3/kra/config`, `/v3/kra/validate-pin`, `/v3/kra/logs`, `/v3/kra/logs/:id/retry`, `/v3/kra/vat-summary`).
  - Wire fiscal transmission into `ProcessSaleUseCase` and `InvoiceUseCase.finalizeInvoice`, attaching QR codes, control codes, and receipt numbers.
- **AC-5 (Web Tax Compliance Dashboard & Actions)**:
  - Implement full Tax Compliance dashboard at `apps/web/app/finance/reports/tax-compliance/page.tsx`.
  - Provide PIN validation tool, VAT summary metrics, audit log table with retry button, and settings editor.
  - Secure server actions in `apps/web/app/actions/kra.ts` with strict multi-tenant BOLA scoping.
