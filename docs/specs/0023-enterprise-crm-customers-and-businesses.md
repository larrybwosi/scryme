# 0023 · Enterprise CRM Customers and Businesses

**Status**: Accepted
**Date**: 2025-05-18
**Mode**: ENHANCEMENT
**Workspace**: apps/crm

## Summary

This specification establishes enterprise grade capabilities for managing individual customers (B2C/clients) and business accounts (B2B companies) within the Scryme CRM workspace (`apps/crm`). It enhances account governance, credit terms, corporate hierarchy, custom pricing agreements, customer lifetime value analytics, account ownership, deduplication merging, and lifecycle automation.

## Requirements

- **AC-1 (Credit & Financial Terms)**: Support credit limits, credit hold flags, flexible payment terms (e.g. Net 15, Net 30, Net 60, COD), and tracking of outstanding receivables and credit utilization for business accounts.
- **AC-2 (Corporate Hierarchy & Multi-Branch)**: Enable parent-child subsidiary corporate structures for business accounts, with consolidated rollups and branch location mapping.
- **AC-3 (Contracts, SLAs & Custom Pricing)**: Manage B2B contract lifecycle dates (effective date, expiry date, renewal terms), SLA commitments, and custom price list associations.
- **AC-4 (B2B Connection & Integration Governance)**: Provide direct interface to view, generate, revoke, and manage `B2BConnection` credentials and API client keys (`V3ApiClient`) per business account.
- **AC-5 (Account Ownership & Relationship Management)**: Support dedicated Account Managers / Relationship Owners (`Member` reference) on both `BusinessAccount` and `Customer`, with audit history on reassignment.
- **AC-6 (Enterprise Customer Lifecycle & CLV)**: Implement customer lifecycle stages (`LEAD`, `PROSPECT`, `ACTIVE`, `ENTERPRISE`, `AT_RISK`, `CHURNED`), customer lifetime value (CLV/LTV) computation, and dynamic segmentation.
- **AC-7 (Customer Deduplication & Merge)**: Provide an enterprise tool to identify duplicates by email/phone/name and merge secondary customer records into a primary master record, consolidating transactions, invoices, addresses, notes, and activity history.

## Data Model Enhancements

### BusinessAccount (`packages/db/prisma/schema/customers.prisma`)
- `parentAccountId`: String? nullable, self-relation `parentAccount` / `subsidiaries` for corporate parent/subsidiary hierarchy.
- `creditLimit`: Float? nullable default 0.
- `creditHold`: Boolean default false.
- `accountManagerId`: String? nullable, relation to `Member`.
- `lifecycleStage`: String default "ACTIVE" (e.g. "LEAD", "PROSPECT", "ACTIVE", "ENTERPRISE", "AT_RISK", "CHURNED").
- `contractStartDate`: DateTime? nullable.
- `contractEndDate`: DateTime? nullable.
- `contractStatus`: String? default "ACTIVE" (e.g. "ACTIVE", "EXPIRED", "UNDER_REVIEW").
- `slaTier`: String? default "STANDARD" (e.g. "STANDARD", "PREMIUM", "ENTERPRISE_24_7").
- `annualRevenue`: Float? nullable.
- `employeeCount`: Int? nullable.
- `industry`: String? nullable.
- `website`: String? nullable.

### Customer (`packages/db/prisma/schema/customers.prisma`)
- `accountManagerId`: String? nullable, relation to `Member`.
- `lifecycleStage`: String default "ACTIVE".
- `lifetimeValue`: Float? default 0.
- `creditLimit`: Float? default 0.
- `creditHold`: Boolean default false.

## Architecture & Server Actions

- `apps/crm/app/actions/companies.ts` and `apps/crm/app/actions/company-enterprise.ts`:
  - `updateCompanyCreditTerms(id, { creditLimit, creditHold, paymentTermsDays })`
  - `updateCompanyHierarchy(id, { parentAccountId })`
  - `updateCompanyContract(id, { contractStartDate, contractEndDate, contractStatus, slaTier })`
  - `assignCompanyAccountManager(id, memberId)`
  - `createB2BConnectionAction(businessAccountId, data)`
  - `revokeB2BConnectionAction(connectionId)`
  - `getCompanyHierarchy(id)`
- `apps/crm/app/actions/customer-enterprise.ts`:
  - `mergeCustomers(primaryCustomerId, secondaryCustomerId)`
  - `calculateCustomerLifetimeValue(customerId)`
  - `updateCustomerLifecycleStage(customerId, stage)`
  - `assignCustomerAccountManager(customerId, memberId)`
  - `getCustomerDuplicates(query)`

## Frontend UI Surface

- `apps/crm/app/companies/[id]/_components/company-detail-view.tsx`:
  - Dedicated tabs: `Overview`, `Financials & Credit`, `Hierarchy & Branches`, `Contracts & Pricing`, `Integrations & API`, `Contacts`, `Invoices`, `Transactions`, `Notes`, `Activities`, `Follow-ups`.
- `apps/crm/app/customers/[id]/_components/`:
  - Lifecycle stage switcher badge.
  - Account Manager card and assignment dialog.
  - CLV and RFM health analytics card.
  - Merge customer modal dialog.
- Forms:
  - `company-form.tsx`: Add enterprise fields (Industry, Website, Employees, Credit Limit, Payment Terms, SLA Tier, Account Manager).
  - `customer-form.tsx`: Add Account Manager, Lifecycle Stage, and enterprise tags.

## Value Sourcing & Multi-Tenancy

Every mutation and query strictly enforces `organizationId` matching from `getServerAuth()`, guaranteeing tenant isolation. All reassignments log audit entries to `CrmActivity` on the associated `CrmRecord`.
