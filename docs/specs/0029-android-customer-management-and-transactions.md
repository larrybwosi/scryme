# 0029. Android customer management and transactions view

**Date**: 2026-11-05
**Status**: Accepted

## Summary

This specification defines the customer management feature for the Android application. It introduces dedicated customer management within the mobile app, providing an administrative entry point on the Admin Hub screen, a searchable and paginated customer list, a detailed customer profile view displaying customer transactions and metrics, and editing capabilities for updating customer information.

## Context

Mobile administrators currently have direct access to branch operations, staff scheduling, and sales analytics, but lack a dedicated customer relationship management interface within the Android app. While backend APIs support customer operations, mobile managers cannot inspect customer histories or verify purchase transactions on the floor. Introducing customer management to the Android app allows store managers and administrators to view customer profiles, track purchase histories and transactions, and update customer contact details directly on mobile devices.

## Requirements

**User stories**:
- As an administrator, I want an entry card on the Admin screen to access Customer Management so that I can easily oversee client profiles.
- As an administrator, I want to view a list of registered customers with real time search filtering by name, email, or phone.
- As an administrator, I want to tap on a customer to view their detailed profile, including contact details, company, loyalty points, and active status.
- As an administrator, I want to inspect a customer's recent orders and transactions to review their purchase history and order status.
- As an administrator, I want to update a customer's information such as name, phone number, email, and company name.

**Acceptance criteria**:
- **AC-1**: `AdminScreen` displays an entry card for Customer Management that navigates to the Customer Management screen (`Screen.Customer`).
- **AC-2**: `CustomerScreen` displays a search bar and customer cards showing the customer's name, email, phone number, and status badge.
- **AC-3**: Tapping a customer card navigates to `CustomerDetailsScreen` with the customer's unique identifier.
- **AC-4**: `CustomerDetailsScreen` displays customer profile details alongside a list of recent transactions (order ID, date, total amount, currency, and status).
- **AC-5**: `CustomerDetailsScreen` provides an Edit Customer action and dialog to update the customer's name, phone, email, and company name.
- **AC-6**: The NestJS V3 Android module exposes dedicated customer endpoints (`/android/customers`, `/android/customers/:id`, `/android/customers/:id/transactions`, `PATCH /android/customers/:id`) with multi tenant scoping and administrator authorization.

## Options considered

### Option 1: Generic customer API vs Dedicated Android customer endpoints
Using the generic `:orgSlug/customers` endpoints requires extra client side aggregation for transactions and customer stats. Dedicated `/android/customers` endpoints match the existing `/android/branches` architecture, providing lightweight DTOs tailored for mobile bandwidth and offline resiliency.

## Decision

Implement dedicated NestJS V3 Android customer endpoints and corresponding Android UI components adhering to the Jetpack Compose and Hilt architecture of the app.

## Build plan

- Task 1: Add NestJS V3 Android customer controller and use case endpoints for customer listing, customer details, transactions, and profile updates. Tag: AC-6.
- Task 2: Add API tests for the new NestJS V3 Android customer endpoints. Tag: AC-6.
- Task 3: Implement Android customer DTOs, domain models, Retrofit API service, repository interface, and repository implementation. Tag: AC-2, AC-4, AC-5.
- Task 4: Add Customer navigation routes (`Screen.Customer` and `Screen.CustomerDetails`) and wire them into `AppNavGraph`. Tag: AC-1, AC-3.
- Task 5: Add Customer Management card entry point in `AdminScreen`. Tag: AC-1.
- Task 6: Implement `CustomerViewModel`, `CustomerScreen`, `CustomerDetailsViewModel`, and `CustomerDetailsScreen` with customer editing dialog and transactions list. Tag: AC-2, AC-3, AC-4, AC-5.
- Task 7: Add unit tests for Android customer repository and ViewModels. Tag: AC-2, AC-4, AC-5.
