# 0021. Enhanced Reporting Module, Settings Sidebar Navigation, and Workflow Automation

**Date**: 2026-11-04
**Status**: Accepted

## Summary

This specification defines the enhancement of the organization reporting module across the web application and backend platform. It moves reporting preferences into a dedicated sidebar item under `/settings/reports`, adds granular customization options (output formats, location scoping, summary period ranges, and threshold filters), integrates reporting directly into the automation workflow engine, and provides interactive report previews along with execution history logs.

## Context

Organization administrators previously configured basic weekly/daily email and ScrymeChat dispatches through an embedded section inside `/settings`. As operational needs expanded, organization users required more control:
1. Navigational visibility: Reporting configuration should reside as a first-class settings view accessible from the main navigation sidebar rather than being hidden inside general settings tabs.
2. Fine-grained preferences: Configurable output formats (HTML, Markdown, PDF, CSV), location/department filters, and minimum threshold alerts.
3. Workflow automation: The ability to attach reporting triggers to workflow engine executions (e.g., triggering webhooks, alerting specific slack/webhook channels, or initiating follow-up automated workflows upon report dispatch).
4. Observability and live preview: Admins need to preview executive reports interactively and review execution logs of past dispatches.

## Requirements

### Acceptance Criteria

- **AC-1 (Sidebar & Navigation Routing)**:
  - Add "Reports" navigation entry under the "Settings" section in `apps/web/components/sidebar.tsx` pointing to `/settings/reports`.
  - Remove the inline report panel from `/settings` general settings form tabs to unify configuration in `/settings/reports`.
- **AC-2 (Data Model & Preferences Persistence)**:
  - Extend `ReportSettings` in `packages/db/prisma/schema/organization.prisma` to support:
    - `formats`: String array of preferred output formats (`HTML`, `MARKDOWN`, `PDF`, `CSV`).
    - `defaultLocationId`: Optional inventory/business location filter for reports.
    - `defaultDepartmentId`: Optional department scope.
    - `minRevenueThreshold`: Optional numeric threshold for revenue alerts.
    - `summaryPeriodDays`: Default period in days (e.g., 7, 30, 90).
    - `workflowKey`: Attached automation workflow definition key or path.
    - `webhookUrl`: Direct webhook target for outgoing report payloads.
    - `workflowEnabled`: Toggle to activate automated workflow triggers on report dispatch.
- **AC-3 (Backend Service & Server Actions Extension)**:
  - Extend `UpdateReportSettingsDto` and `GenerateReportDto` in `apps/api/src/v3/modules/reports` to process new parameters.
  - In `apps/web/app/actions/reports.ts`, provide server actions for fetching, updating, previewing reports, and listing dispatch history.
  - Dispatching reports should automatically trigger associated workflow executions when `workflowEnabled` is active.
- **AC-4 (Dedicated Settings UI & Workflow Integration)**:
  - Build `apps/web/app/settings/reports/page.tsx` and interactive client components.
  - Tabbed or multi-section layout:
    - Delivery Channels & Recipient List (Email, ScrymeChat, Webhook).
    - Schedule & Frequency (Interval, Day, Time, Timezone).
    - Metrics & Modules (Sales, Inventory, Production, Tax, AI Insights).
    - Customization & Scopes (Formats, Location filter, Department filter, Period).
    - Workflow Automation (Attach workflow templates, configure triggers).
    - Live Interactive Preview & Test Dispatch.
    - Execution History & Audit Logs.

## Implementation Architecture

The enhancement spans three layers:
1. `@repo/db`: Updates the `ReportSettings` model schema and Prisma migration/client.
2. `apps/api` / Server Actions: Enhanced reporting service, workflow event emission, and execution logging.
3. `apps/web`: New dedicated `/settings/reports` route, navigation updates, and comprehensive client controls.
