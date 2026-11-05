# 0030. Multi-Category Reporting Engine, AI Business Advisory, and Export System

**Date**: 2026-11-05
**Status**: In Progress

## Summary

This specification defines the enhancement of the organization reporting system within `apps/web/app/settings/reports` to allow generating, persisting, analyzing with AI, and downloading domain-specific business reports across multiple categories (Sales, Inventory/Stock, Production, Finance & Expenses, and Comprehensive Executive Summary).

## Context

Users currently have an automated dispatch scheduler and basic test trigger in `apps/web/app/settings/reports`, but lack an on-demand, interactive multi-category reporting hub where they can:
1. Generate specific category reports on-demand (Sales, Stock/Inventory, Production, Finance/Expenses, Executive Summary).
2. Apply flexible operational filters (Date range presets like 7 days, 30 days, 90 days, or custom dates; Inventory Location; Department).
3. Obtain automated AI Executive Analysis & Recommendations per category, with an interactive "Ask AI" advisory dialogue.
4. Download and export reports in PDF (custom formatted print-to-PDF view) and CSV formats.
5. Browse, filter, inspect, and re-download previously generated and persisted reports.

## Architecture & Data Flow

### 1. Data Models (`Report`, `ReportType`)
The Prisma `Report` model (`packages/db/prisma/schema/organization.prisma`) persists every generated report:
- `organizationId`: Multi-tenant organization binding.
- `type`: `SALES_REPORT`, `INVENTORY_REPORT`, `BAKERY_REPORT` (Production), `EXPENSE_REPORT`, `SALES_WEEKLY` / `SALES_MONTHLY`.
- `data`: Complete JSON payload of domain metrics, top items, breakdown tables, and parameters.
- `summary`: Stored AI-generated executive analysis and operational recommendations.
- `startDate`, `endDate`: Reporting interval.
- `generatedById`: Audited generation by the requesting member.

### 2. Server Actions & Backend Services (`apps/web/app/actions/reports.ts`)
- `generateCategoryReportAction(params)`: Aggregates metrics from DB (transactions, stock movements/inventory lots, production batches, expenses/journal entries) based on category and filters, generates AI insights (using OpenAI or built-in intelligent rule-based engine), and saves the `Report` record in the database.
- `askReportAiAction(reportId, question)`: Provides contextual AI Q&A based on the report's metrics.
- `deleteReportAction(reportId)`: Deletes historical report with multi-tenant BOLA scoping.

### 3. UI Component Architecture (`apps/web/app/settings/reports/reports-settings-client.tsx`)
- **Category Generation Hub**: Category selector tabs (Executive Overview, Sales & Orders, Stock & Inventory, Production & Batches, Finance & Expenses) with date range presets, location, and department selectors.
- **Interactive Report Viewer & AI Advisory**: Displays KPI cards, breakdown tables, AI analysis box with bulleted recommendations, and an interactive "Ask AI" question drawer.
- **Export System**: Direct PDF export (via optimized print stylesheet and clean view) and CSV export.
- **Saved Reports History**: Searchable, filterable list of all persisted historical reports with viewing and re-download capabilities.
