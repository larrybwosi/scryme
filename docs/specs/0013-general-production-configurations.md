# 0011. General Production Configurations Architecture

**Date**: 2026-11-03
**Status**: Proposed

## Summary

This specification establishes the transition from bakery-specific configurations (`BakerySettings`, `BakeryBaker`, `BakeryCategory`) to a generalized enterprise production configuration system (`ProductionSettings`, `ProductionOperator`, `ProductionCategory`). The generalized production configuration supports manufacturing across multiple industries (food & beverage, bakeries, chemical, light assembly, and packaging) while preserving domain-specific extensions, backwards compatibility, and existing operational data without loss.

## Context

Previously, production settings were tightly coupled to the bakery domain:
- Database tables were named `bakery_settings`, `bakery_bakers`, and `bakery_category`.
- API endpoints used mixed naming (`/bakers` alongside aliases `/operators`, `/staff`), but returned data tied to `BakerySettings` and `BakeryBaker`.
- Frontend settings in `apps/bakery` and `apps/web` assumed bakery terminology (`bakers`, `bakerySettingsId`).
- As Scryme expands to multi-industry production operations, organizations require generalized production configurations covering batch numbering, staging & dispatch rules, quality incident workflows, report schedules, and operator staffing rosters while maintaining specialized frontend applications (like `apps/bakery`).

## Requirements

**User stories**:
- As an operations administrator, I want to configure production settings (batch numbering rules, production staging, quality controls, and operator assignments) for any production operation, not just bakeries.
- As a bakery staff member or supervisor, I want the bakery application (`apps/bakery`) to continue offering specialized baking workflows (recipes, baker's percentages, oven stages, scaling) while seamlessly reading and writing to the general production configuration.
- As a developer, I want a standardized data model and API surface (`/v3/production/settings`, `/v3/production/operators`, `/v3/production/categories`) that does not duplicate settings or cause data migration loss.

**Acceptance criteria**:
- **AC-1**: Prisma database models generalize `BakerySettings` to `ProductionSettings` (mapped to `production_settings`), `BakeryBaker` to `ProductionOperator` (mapped to `production_operators`), and `BakeryCategory` to `ProductionCategory` (mapped to `production_categories`).
- **AC-2**: A non-destructive database migration (`20261103000000_general_production_configurations`) moves existing rows from legacy tables into the generalized production tables and remaps foreign keys without data loss.
- **AC-3**: V3 Production API (`apps/api/src/v3/modules/production`) standardizes on `ProductionSettings` and `ProductionOperator` while retaining backwards-compatible aliases for client consumers.
- **AC-4**: Web application (`apps/web`) provides a dedicated Production Settings interface (`/settings/production` or settings panel) for managing batch numbering, staging, alerts, and operator defaults, and updates staff actions.
- **AC-5**: Bakery desktop app (`apps/bakery`) adds a local SQLite migration (v8) supporting `production_settings` and `operators` while ensuring offline operation and existing UI compatibility.
- **AC-6**: Multi-tenant isolation is preserved across all production settings queries and mutations with appropriate permissions (`production:settings:read`, `production:settings:write`).
