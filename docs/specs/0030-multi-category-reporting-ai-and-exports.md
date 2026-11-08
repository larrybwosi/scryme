# 0030. Multi-Category Reporting Engine, AI Business Advisory, and Export System

**Date**: 2026-11-05
**Status**: In Progress

## Summary

This specification defines the enhancement of the organization reporting system within `apps/web/app/settings/reports` to allow generating, persisting, analyzing with AI, and downloading domain specific business reports across multiple categories (Sales, Inventory/Stock, Production, Finance and Expenses, and Comprehensive Executive Summary).

## Context

Users currently have an automated dispatch scheduler and basic test trigger in `apps/web/app/settings/reports`, but lack an on-demand, interactive multi category reporting hub where they can:
1. Generate specific category reports on-demand (Sales, Stock/Inventory, Production, Finance/Expenses, Executive Summary).
2. Apply flexible operational filters (Date range presets like 7 days, 30 days, 90 days, or custom dates; Inventory Location; Department).
3. Obtain automated AI Executive Analysis and Recommendations per category, with an interactive "Ask AI" advisory dialogue.
4. Download and export reports in PDF (powered by React PDF and `@repo/documents` template engine) and CSV formats.
5. Browse, filter, inspect, and re-download previously generated and persisted reports.

## Architecture and Data Flow

### 1. Data Models (`Report`, `ReportType`)
The Prisma `Report` model (`packages/db/prisma/schema/organization.prisma`) persists every generated report:
- `organizationId`: Multi tenant organization binding.
- `type`: `SALES_REPORT`, `INVENTORY_REPORT`, `BAKERY_REPORT` (Production), `EXPENSE_REPORT`, `SALES_WEEKLY` / `SALES_MONTHLY`.
- `data`: Complete JSON payload of domain metrics, top items, breakdown tables, and parameters.
- `summary`: Stored AI generated executive analysis and operational recommendations.
- `startDate`, `endDate`: Reporting interval.
- `generatedById`: Audited generation by the requesting member.

### 2. Server Actions and Backend Services (`apps/web/app/actions/reports.ts`)
- `generateCategoryReportAction(params)`: Aggregates metrics from DB (transactions, stock movements/inventory lots, production batches, expenses/journal entries) based on category and filters, generates AI insights (using OpenAI or built in intelligent rule based engine), and saves the `Report` record in the database.
- `askReportAiAction(reportId, question)`: Provides contextual AI Q and A based on the report's metrics with deep domain coverage (revenue, stock flow balance, wastage, operating spend, tax compliance).
- `deleteReportAction(reportId)`: Deletes historical report with multi tenant BOLA scoping.

### 3. PDF Document Generation (`packages/documents`, `apps/web/app/api/reports/[id]/pdf`)
- **Document Template (`BusinessReportV3`)**: Implemented in `@repo/documents` using `@react-pdf/renderer` with professional styling, organization branding, KPI grids, category breakdown tables, and executive AI advisory analysis.
- **Client Side PDF Generation**: Renders PDF client side via `@react-pdf/renderer` `pdf().toBlob()` for instantaneous downloads.
- **Server Side PDF Streaming**: Route handler at `/api/reports/[id]/pdf` for server side streaming and automated dispatch pipelines.

### 4. UI Component Architecture (`apps/web/app/settings/reports/reports-settings-client.tsx`)
- **Category Generation Hub**: Category selector tabs (Executive Overview, Sales and Orders, Stock and Inventory, Production and Batches, Finance and Expenses) with date range presets, location, and department selectors.
- **Interactive Report Viewer and AI Advisory**: Displays KPI cards, breakdown tables, AI analysis box with bulleted recommendations, and an interactive "Ask AI" question drawer.
- **Export System**: Direct React PDF export (client side with server fallback) and CSV export across active preview and history records.
- **Saved Reports History**: Searchable, filterable list of all persisted historical reports with viewing and re-download capabilities.
