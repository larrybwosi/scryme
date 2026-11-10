# 0041 · Android Finance Expenses Petty Cash and Utilities

**Status**: In Progress
**Date**: 2025-05-20
**Author**: Engineering Team

## Summary

This specification documents the architecture and implementation for the Android mobile Finance Hub accessible to administrators. It surfaces financial analytics, operating expenses, petty cash float funds with transaction ledgers, and utility accounts with meter tracking, alongside operational actions including expense approval/rejection and petty cash top-ups directly from Android.

## Context

Administrators and business owners require mobile visibility into organization spending, petty cash availability, and utility bills without logging into the desktop web console. Key requirements include:
1. Unified tabbed Finance interface (`Expenses`, `Petty Cash`, `Utilities`) accessed directly from the Admin Hub.
2. High-level metric cards for organizational spend: Total Spend, Approved, Pending, Rejected, and Tax amounts with category breakdowns.
3. Filtering of expenses by status (`ALL`, `PENDING`, `APPROVED`, `REJECTED`) and date ranges (`All Time`, `This Month`, `Last 30 Days`).
4. Approving or rejecting pending expenses in real time with optional rejection reason feedback.
5. Tracking petty cash funds with real-time balance indicators, float ratios, and recent transaction history.
6. Recording petty cash top-ups to restore fund floats.
7. Tracking utility accounts (electricity, water, internet, etc.) with provider details, meter numbers, and recent billing expenses.
8. Interactive bottom sheets for detailed inspection of individual expenses, petty cash funds, and utility accounts.

## Architecture & Data Flow

### Backend Endpoints Consumed
The Android client connects to the existing NestJS V3 Finance Module:
- `GET /api/v3/finance/expenses`: List organization expenses with optional query filters (`status`, `categoryId`, `startDate`, `endDate`).
- `GET /api/v3/finance/expenses/reports/summary`: Aggregate analytics summary (`totalAmount`, `totalApproved`, `totalPending`, `totalRejected`, `totalTaxAmount`, `categoryBreakdown`).
- `GET /api/v3/finance/expenses/:id`: Retrieve single expense detail with relational joins.
- `POST /api/v3/finance/expenses/:id/approve`: Approve pending expense and trigger GL posting & petty cash deductions.
- `POST /api/v3/finance/expenses/:id/reject`: Reject pending expense with reason notes.
- `GET /api/v3/finance/petty-cash`: List petty cash funds with responsible members and balances.
- `GET /api/v3/finance/petty-cash/:id/transactions`: List transaction log for a petty cash fund.
- `POST /api/v3/finance/petty-cash/:id/top-up`: Top up a petty cash float fund.
- `GET /api/v3/finance/utility-accounts`: List registered utility accounts.
- `GET /api/v3/finance/utility-accounts/:id`: Get utility account details with recent billing history.

### Mobile Presentation Architecture
- **Navigation**: Registered `Screen.Finance` in `Screen.kt` and wired into `AppNavGraph.kt`.
- **Admin Hub**: Added a Finance card in `AdminScreen.kt` using `OutlinedSurface` and theme tokens.
- **UI Structure**:
  - `FinanceScreen.kt`: Tabbed screen with `ExpensesTab`, `PettyCashTab`, and `UtilitiesTab`. Follows the safe `TabRow` + `Tab` Compose pattern to prevent layout measurement crashes.
  - `ExpenseDetailsBottomSheet.kt`: Full expense modal with amount, status, requester, category, receipt URL viewer, and Approve/Reject buttons.
  - `PettyCashDetailsBottomSheet.kt`: Fund balance status, float utilization progress bar, recent transactions list, and quick Top-Up dialog.
  - `UtilityDetailsBottomSheet.kt`: Account and meter info, provider badges, and linked bills.
- **State Management**: `FinanceViewModel` with `FinanceUiState` orchestrating coroutine streams, optimistic UI updates, and error handling.
