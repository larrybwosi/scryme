# 0027: Customer Booking & Task Assignment Integration

**Status**: In Progress
**Authors**: Jules & Senior Systems Architect
**Deciders**: Engineering Lead & Product Team
**Date**: 2026-11-04

## Summary
Enhances customer booking and task assignment across the Scryme ecosystem with automated and manual task creation from booked services, configurable checklist templates, multi-dimensional conflict detection (staff availability, member shift overlap, capacity limits, resource/station collision, customer double-booking, and location operating hours), bidirectional booking lifecycle state transitions, and projects app integration.

## Context
Customer service appointments (`ServiceBooking`) and task management (`Task` in `apps/projects` and `StaffTask` in `services.prisma`) currently operate with minimal automated coupling. Service delivery workflows require:
1. Operational readiness: when appointments are scheduled, staff members must receive clear, actionable execution tasks populated with standard service checklist items.
2. Conflict prevention: scheduling and assigning tasks must proactively validate staff shift hours, prevent member over-utilization (>100% capacity), prevent double-booking for the customer, and ensure resources and location operating hours are respected.
3. Unified lifecycle control: booking transitions (`REQUESTED` -> `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED` / `CANCELLED`) must synchronize directly with task statuses (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELED`), and vice versa.
4. Visibility across `apps/projects`: project managers, squad leads, and service dispatchers need linked booking inspection on tasks, schedules, and calendars.

## Requirements
- **AC-1 (Service Checklist Templates)**: Services define standard task checklist templates (`taskChecklistTemplate` Json array of `{ title: string; required?: boolean }`) that are cloned into generated `Task.checklist` and `StaffTask.checklist`.
- **AC-2 (Automated & Manual Task Generation)**:
  - When a booking is created or confirmed, the system automatically creates linked `Task` (in an auto-provisioned "Service Operations" project) and `StaffTask` assigned to the booking's staff members.
  - Managers can also manually trigger task generation or re-generation with custom options.
- **AC-3 (Multi-Dimensional Conflict Detection)**:
  - Staff overlap: Checks if staff members have existing overlapping bookings or conflicting shifts.
  - Staff capacity: Calculates assigned weekly workload against active shifts/working hours, returning soft warnings with override capability when exceeding 100% capacity.
  - Resource overlap: Verifies designated `ServiceResource` availability for the slot.
  - Customer double-booking: Detects if the customer already has an active overlapping booking.
  - Location operating hours: Verifies scheduled start and end times fall within location operating hours.
- **AC-4 (Bidirectional Lifecycle Synchronization)**:
  - Transitioning a booking to `IN_PROGRESS` moves linked tasks to `IN_PROGRESS`.
  - Marking a linked task `DONE` or `COMPLETED` transitions the booking to `COMPLETED`, recording actual end time and consuming configured bill of materials.
  - Cancelling a booking updates linked tasks to `CANCELED`.
- **AC-5 (Projects App Integration & UI Controls)**:
  - Tasks in `apps/projects` display linked booking metadata (customer name, scheduled slot, service name, status badge) and deep link to booking details.
  - Unified calendar and schedule views display linked bookings and enable manager overrides.
- **AC-6 (Verification & Comprehensive Testing)**: Unit and integration tests covering conflict detection, template checklist propagation, automated task dispatch, and lifecycle sync.

## Decision & Technical Design

### Data Model Enhancements (`packages/db/prisma/schema`)
1. In `packages/db/prisma/schema/services.prisma`:
   - Add `taskChecklistTemplate Json?` to `Service`
   - Add `bookingId String?` to `StaffTask` with relation `booking ServiceBooking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)`
   - Add `staffTasks StaffTask[]` to `ServiceBooking`
2. In `packages/db/prisma/schema/tasks.prisma`:
   - Add `bookingId String?` to `Task` with relation `booking ServiceBooking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)`
   - Add `tasks Task[]` to `ServiceBooking`

### Backend Services (`apps/api/src/v3/modules/services`)
1. **Conflict Detection Engine (`booking-conflict.service.ts` or extended `BookingService`)**:
   - `detectBookingConflicts(orgId, dto, options)`: Evaluates staff shifts, staff booking overlap, resource collisions, customer collisions, and location operating windows.
   - Soft warning responses with `warnings: BookingConflictWarning[]` and `canOverride: true`.
2. **Booking & Task Lifecycle Integration**:
   - On booking creation/confirmation: Auto-generate `Task` (in default "Service Operations" project) and `StaffTask` with cloned checklist items from `service.taskChecklistTemplate`.
   - On booking status change: Sync linked tasks.
   - On task status transition: When task completes, complete the booking.

### Frontend Integration (`apps/projects` & `apps/web`)
1. Extend `apps/projects/app/task-detail` and task cards to render `ServiceBooking` badge & details if `task.bookingId` is present.
2. Provide manual "Create Task from Booking" and status synchronization actions.

## Build plan
1. Update database schemas in `packages/db/prisma/schema/services.prisma` and `tasks.prisma` and generate Prisma Client (AC-1, AC-2).
2. Enhance `BookingService` and scheduling endpoints with checklist templates, multi-dimensional conflict detection, and automated/manual task creation (AC-1, AC-2, AC-3).
3. Implement bidirectional lifecycle synchronization between `ServiceBooking`, `Task`, and `StaffTask` (AC-4).
4. Update `apps/projects` components, queries, and views to display and manage booking-integrated tasks (AC-5).
5. Add comprehensive unit tests in `apps/api` and `apps/projects` verifying conflict detection, checklist cloning, and lifecycle transitions (AC-6).
6. Verify and complete pre-commit checks.
