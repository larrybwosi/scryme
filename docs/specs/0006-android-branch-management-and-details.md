# 0006. Android branch management and branch details screen

**Date**: 2026-10-31
**Status**: Proposed

## Summary

This specification defines the extension of the Android app's Admin Hub with branch management access and a dedicated Branch Details screen. Administrators can view, manage, and inspect branch locations, viewing distinct tabs for branch Overview, Staff Activity & Check-ins, Recent Sales, and Stock Movements. Quick administrative actions include setting the branch as the active location, editing branch details and geofence settings, and pinning the branch's current GPS location.

## Context

Administrators and managers currently access branch locations under a separate screen without a dedicated entry point inside the Admin Management Hub (`AdminScreen`). Furthermore, viewing activity, check-ins, sales, or stock movements for a specific branch requires disjointed navigation or desktop web access. Providing a consolidated branch management experience inside the Android app empowers administrators on the go to oversee physical branch operations, staff presence, recent transactions, and inventory movements seamlessly.

## Requirements

**User stories**:
- As an administrator, I want to see an entry point for "Branch Management" in the Admin Management Hub so that I can easily view and manage store locations.
- As an administrator, I want to tap any branch to navigate to a comprehensive Branch Details screen showing its operational metrics and data.
- As an administrator, I want distinct tabs on the Branch Details screen to inspect user activity & check-ins, recent sales, and stock movements.
- As an administrator, I want quick actions on the branch details screen to set as active branch, edit branch details, and pin the branch's current GPS coordinates.
- As a security measure, branch management and detailed operational data access must be restricted to administrators.

**Acceptance criteria**:
- **AC-1**: `AdminScreen` displays an OutlinedSurface card entry point for "Branch Locations & Management" (similar to the Sales Dashboard card) that navigates to `Screen.Branch`.
- **AC-2**: Tapping a branch card in `BranchScreen` navigates to `Screen.BranchDetails` with the branch's unique `id`.
- **AC-3**: The Branch Details screen presents distinct tabs: Overview, Activity & Check-ins, Recent Sales, and Stock Movements.
- **AC-4**: The Overview tab displays branch metadata (address, phone, type, code, pinned GPS coordinates) and quick action buttons: "Set as Active Branch", "Edit Branch", and "Pin Current GPS Location".
- **AC-5**: The Activity & Check-ins tab displays attendance logs for the branch (member name, avatar, check-in/out times, verification status, distance).
- **AC-6**: The Recent Sales tab displays recent transactions performed at the branch (transaction code/id, customer/cashier, final total, currency, status, timestamp).
- **AC-7**: The Stock Movements tab displays inventory movements associated with the branch (product variant name, movement type, quantity, direction from/to, timestamp).
- **AC-8**: The backend API (`AndroidBranchController` and `AndroidBranchUseCase`) is extended to serve branch activity, recent sales, and stock movements scoped to the organization and branch ID with administrator authorization.

## Options considered

### Option 1: Consolidated single-page continuous scroll vs. Tabbed view

We considered a single continuous scrolling dashboard vs. distinct tabs. Distinct tabs provide clear cognitive separation, faster navigation, independent loading states, and cleaner layout on mobile screens without requiring infinite scroll handling for sales and stock movements simultaneously.

### Option 2: Extending Android API module vs. Reusing multiple disjoint V3 APIs

We considered having the mobile app call raw pos, stocking, and attendance controllers directly. However, the NestJS V3 Android module (`/api/v3/android/branches/...`) already provides dedicated, lightweight DTOs tailored for mobile bandwidth and offline resiliency. Extending `AndroidBranchController` and `AndroidBranchUseCase` keeps multi-tenant isolation, authorization guards, and payload efficiency consistent across the Android experience.

## Decision

**Chosen option**: Tabbed Branch Details screen powered by extended NestJS V3 Android branch endpoints.

## Build plan

- Task 1: Extend NestJS V3 `AndroidBranchController` and `AndroidBranchUseCase` with endpoints for branch details, check-ins, sales, and stock movements. Tag: AC-8.
- Task 2: Add API tests for the new NestJS V3 Android branch endpoints. Tag: AC-8.
- Task 3: Update Android data layer (`BranchApiService`, DTOs, `BranchRepository`, and `BranchRepositoryImpl`). Tag: AC-5, AC-6, AC-7.
- Task 4: Add entry point in `AdminScreen` navigating to Branch screen and update navigation routes (`Screen.kt`, `NavGraph.kt`). Tag: AC-1, AC-2.
- Task 5: Implement `BranchDetailsViewModel` and `BranchDetailsScreen` with distinct tabs (Overview, Activity & Check-ins, Recent Sales, Stock Movements) and administrative actions. Tag: AC-3, AC-4, AC-5, AC-6, AC-7.
- Task 6: Add unit tests for Android branch details ViewModel and repository. Tag: AC-3, AC-4, AC-5, AC-6, AC-7.
