# 0022: Android Task Management and Order Display System

**Status**: Accepted
**Date**: 2026-04-03

## Summary
Implements end-to-end task management capabilities in the Android app (complete CRUD, subtask checklist creation/completion/deletion, member re-assignment, priority/category updates, due date and time controls, assessment recording) and resolves order display errors (`attempt to invoke interface method boolean java.util.Collection.isEmpty()` NPE and missing single-order API endpoint).

## Requirements
- Full task lifecycle management: create, read, update, and delete tasks from the Android client.
- Subtask breakdown management: add subtask groups, add/remove checklist items, toggle checklist items, with persistent storage in backend database.
- Backend API synchronization: persist all task updates (`category`, `dueTime`, `estimatedHours`, `actualHours`, `checklist`) in `staff_task` table and support deletion with BOLA/tenant isolation.
- Order display and serialization resilience: fix Gson deserialization bugs where null collections bypass Kotlin defaults causing `java.lang.NullPointerException` on `isEmpty()`.
- Real-time sales order inspection: expose `GET sales/orders/:id` in backend API to serve complete order line items, payment breakdown, and fulfillment tracking to the Android application.

## Decision
1. **API Layer (`apps/api`)**:
   - Expose `DELETE android/shifts/tasks/:id` in `AndroidShiftsController` and `AndroidShiftsUseCase`.
   - Update `AndroidShiftsUseCase` to serialize/deserialize subtask groups into `StaffTask.checklist` (JSON), map category and time fields, and support member assignment changes.
   - Expose `GET sales/orders/:id` in `SalesController` and `SalesService` returning populated `OrderItemDto` with line items, tax, discounts, customer notes, and payments.
2. **Data & DTO Layer (`apps/android`)**:
   - Create `SalesDtos.kt` to decouple Retrofit/Gson network deserialization from domain models. Explicitly map nullable lists to non-null `emptyList()`, eliminating any `Collection.isEmpty()` null pointer exceptions.
   - Update `ScheduleDtos.kt` and `ScheduleApiService.kt` to support `DELETE android/shifts/tasks/{id}`.
   - In `ScheduleRepositoryImpl.kt`, ensure `deleteStaffTask` removes local cache entries and calls the delete API endpoint.
3. **UI & Navigation (`apps/android`)**:
   - In `TasksScreen.kt`:
     - Allow clicking any task to navigate to `TaskDetailsScreen`.
     - Add action menu or buttons for task deletion (with confirmation dialog) and quick editing.
   - In `TaskDetailsScreen.kt` & `TaskDetailsViewModel.kt`:
     - Provide full editing dialog/fields for Title, Description, Priority, Category, Assigned Member, Due Date, Due Time, and Hours.
     - Provide ability to add new subtask groups and checklist items.
     - Add Delete Task action with confirmation and popback navigation.
   - In `NavGraph.kt`:
     - Ensure seamless navigation from `TasksScreen` to `TaskDetailsScreen`.

## Build Plan
1. Update backend `SalesController` and `SalesService` with `GET sales/orders/:id`.
2. Update backend `AndroidShiftsController` and `AndroidShiftsUseCase` with `DELETE android/shifts/tasks/:id` and checklist JSON mapping.
3. Update Android `data/dto/SalesDtos.kt` and `SalesRepositoryImpl.kt` with robust DTO parsing.
4. Update Android `ScheduleApiService.kt`, `ScheduleRepository.kt`, and `ScheduleRepositoryImpl.kt` with full management methods.
5. Enhance `TasksScreen.kt`, `TasksViewModel.kt`, `TaskDetailsScreen.kt`, `TaskDetailsViewModel.kt`, and `NavGraph.kt`.
6. Run unit tests across Android and API to verify zero regressions.
