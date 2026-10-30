# 0004. Enterprise Expense Management and Financial Reporting

**Date**: 2025-02-23
**Status**: Proposed

## Summary

This specification upgrades the expense management system to support enterprise requirements. Users can record operating expenses with optional dimensional tags such as cost centers, locations, suppliers, budgets, utility accounts, and tax rates. Approving or paying an expense automatically generates double entry journal entries in the general ledger. Petty cash expenses directly deduct from petty cash balances while non petty cash expenses do not. Financial reporting across Profit and Loss, cash flow, budget variance, cost centers, and category breakdowns is fully integrated with export capabilities.

## Context

Organizations need complete financial accounting and reporting for all operating expenditures. Previously, expenses were recorded in isolation without automatic posting to the general ledger, leaving financial statements such as Profit and Loss reliant on manual journal entries. Additionally, multi location businesses require optional dimensional categorization including cost centers, inventory locations, utility accounts, and tax input tracking to accurately analyze cost drivers. Approvals and petty cash operations also require clear accounting controls to prevent overdrafts and unauthorized spending.

## Requirements

**User stories**:
- As a finance manager or accountant, I want approved expenses to automatically create double entry journal entries in the general ledger, so that Profit and Loss and Balance Sheet statements remain accurate.
- As a department head or user, I want to record expenses with optional dimensions like Cost Center, Location, Tax Rate, and Petty Cash Fund, so that expenses are properly categorized.
- As an expense approver, I want expenses exceeding organization thresholds to automatically trigger approval requests, so that unauthorized spend is blocked.
- As a financial controller, I want comprehensive expense analytics, budget versus actual variance reports, and export options, so that organizational spend can be monitored and audited.

**Acceptance criteria**:
- **AC-1**: When an expense is created with optional fields (Cost Center, Location, Supplier, Budget, Utility Account, Tax Rate, Reimbursable/Billable flags), all referenced entities are validated for multi-tenant isolation and persisted properly.
- **AC-2**: When an expense status changes to APPROVED or PAID, a double entry `JournalEntry` with corresponding `JournalLine` items (Debit to the Expense Ledger Account, Credit to Cash/Bank or Accounts Payable) is automatically posted to the general ledger.
- **AC-3**: Expenses funded by Petty Cash automatically deduct from the designated `PettyCashFund` balance and record a `PettyCashTransaction`, while non petty cash expenses do not affect petty cash balances.
- **AC-4**: Expenses exceeding the organization's approval threshold or requiring category approval transition to `PENDING_APPROVAL` and create an `ApprovalRequest`.
- **AC-5**: NestJS V3 REST API endpoints exist for creating expenses, listing expenses with multi dimension filters, approving/rejecting expenses, and fetching expense report summaries.
- **AC-6**: Web finance UI allows users to record expenses with optional dimensions, view approval statuses, filter expenses by category and cost center, and trigger approvals.
- **AC-7**: Dedicated expense reporting views are available for Expense Category Breakdown, Cost Center Analytics, Budget vs Actual Variance, and integrated Profit & Loss statements.
- **AC-8**: Expense report data can be exported in CSV and formatted print/PDF formats.

## Options considered

### Option 1: Automatic Double-Entry Ledger Posting with Optional Enterprise Dimensions and Integrated Reporting

Expenses are created with optional dimensional metadata and automatically generate double-entry General Ledger journal entries upon approval/payment. Petty cash deductions are strictly scoped to petty cash funded expenses.

**Pros**:
- Guarantees accounting compliance and accurate Profit & Loss statements.
- Flexible optional fields accommodate both simple receipts and complex corporate spend.
- Provides real time budget, cost center, and tax visibility.

**Cons**:
- Requires careful handling of default ledger account mappings.

### Option 2: Unlinked Expense Records without General Ledger Integration

Expenses remain standalone records separate from the double-entry general ledger.

**Pros**:
- Simpler initial implementation.

**Cons**:
- Causes financial statements and general ledger balances to drift out of sync.

## Decision

**Chosen option**: Option 1: Automatic Double-Entry Ledger Posting with Optional Enterprise Dimensions and Integrated Reporting.

## Rationale

Automating double-entry journal postings when expenses are approved ensures complete harmony between operational expense tracking and financial statements. Optional dimensions allow users to specify cost centers, locations, or tax rates without forcing unnecessary inputs on simple expense transactions.

## Feature design

**Data model sketch**:
Uses existing Prisma models (`Expense`, `ExpenseCategory`, `LedgerAccount`, `JournalEntry`, `JournalLine`, `CostCenter`, `Budget`, `PettyCashFund`, `PettyCashTransaction`, `ApprovalRequest`).

**State transitions**:
`PENDING` / `PENDING_APPROVAL` → `APPROVED` → `PAID` / `REIMBURSED` (or `REJECTED` / `VOIDED`).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/v3/finance/expenses | POST | CreateExpenseDto | Expense | bearer | 400, 403 |
| /api/v3/finance/expenses | GET | status, categoryId, costCenterId, locationId, from, to | Expense[] | bearer | 401 |
| /api/v3/finance/expenses/:id/approve | POST | (none) | Expense | bearer | 400, 404 |
| /api/v3/finance/expenses/:id/reject | POST | reason (opt) | Expense | bearer | 400, 404 |
| /api/v3/finance/expenses/reports/summary | GET | startDate, endDate | Summary & Category/CostCenter breakdown | bearer | 401 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Create expense | expenseNumber | Generated sequence EXP-YYYY-XXXX |
| Approve expense | JournalEntry debit & credit | Expense amount & category ledger account / cash asset account |
| Petty cash deduction | PettyCashFund amount | Decremented by expense amount only if pettyCashFundId is provided |
| Report summary | Category/CostCenter totals | Sum of approved/paid expenses in date window |

**Key invariants**:
- General ledger journal entries posted for an expense must always balance (Debit total == Credit total).
- Petty cash funds can only be decremented if sufficient float/balance exists.
- Cross tenant entity access is strictly prevented using organization scoping.

**Security model**:
- `finance:read` permission required for viewing expenses and reports.
- `finance:write` permission required for creating, approving, or rejecting expenses.

**Critical test scenarios**:
- Expense creation with optional cost center, location, and tax rate, verifying **AC-1**
- Expense approval triggering balanced `JournalEntry` posting, verifying **AC-2**
- Petty cash deduction occurring only for petty cash funded expenses, verifying **AC-3**
- Threshold checking triggering `PENDING_APPROVAL` status, verifying **AC-4**
- API endpoints returning filtered expenses and summary analytics, verifying **AC-5**

## Build plan

1. Update NestJS `CreateExpenseDto` and `ExpenseUseCase` to post double entry journal entries upon expense approval, satisfy **AC-1**, **AC-2**, **AC-3**, **AC-4**
2. Add API endpoints for approving, rejecting, and generating expense report summaries in `ExpenseController`, satisfy **AC-5**
3. Update server actions in `apps/web/app/actions/finance.ts` and `apps/web/app/actions/accounting.ts` to support enterprise options, approval actions, and report data fetching, satisfy **AC-6**, **AC-7**
4. Update Web UI components (`ExpenseDialog`, `ExpenseTable`, `ExpensesPage`) to handle enterprise inputs and approval actions, satisfy **AC-6**
5. Implement Expense Category Breakdown, Cost Center Analytics, and Budget Variance reporting views with CSV/PDF export options in `apps/web/app/finance/reports`, satisfy **AC-7**, **AC-8**
6. Write unit tests for `ExpenseUseCase` double entry postings and petty cash handling, satisfy **AC-1**, **AC-2**, **AC-3**, **AC-4**

## Consequences

**Positive**:
- Full accounting rigor with automated general ledger integration.
- Granular expense analysis across categories, cost centers, and budgets.
- Automated approval workflow enforcement.

**Negative / tradeoffs**:
- Slightly increased database transaction scope during expense approval to record journal entries.

**Neutral**:
- Default expense ledger accounts are created if non existent during initialization.
