# 0028 · Customer Booking Lifecycle Management, Task Assignment, and Conflict Detection

**Status**: Accepted
**Date**: 2026-11-05
**Authorized by**: User / Architect

## Context
Scryme supports customer service bookings, scheduling, shifts, and project task management across `packages/db`, `apps/api`, and `apps/projects`. However, operations teams require full lifecycle management, automated task generation with multi-stage checklist templates for booked services, and conflict detection spanning staff availability, active shifts, existing tasks, and room or location station capacities.

## Requirements (Acceptance Criteria)
- **AC-1 (Booking Lifecycle Management)**:
  - Supports explicit booking states: `PENDING` -> `CONFIRMED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED`, with a `CANCELLED` branch.
  - Recording payments or confirming bookings automatically transitions state and triggers task generation.
  - Updating checklist completion status drives the booking towards `COMPLETED`.
- **AC-2 (Checklist Templates & Task Creation)**:
  - Checklist templates are configurable per service or service category with multi-stage items: Pre-Service, In-Service, and Post-Service / Handover.
  - Automated task generation on confirmation/payment instantiates tasks and linked checklist items.
  - Multi-service bookings generate separate tasks that can be assigned to different staff members.
- **AC-3 (Comprehensive Conflict Detection)**:
  - Validates staff availability, shift working hours, overlapping bookings/tasks, and location room/station capacity constraints.
  - Returns structured conflict warnings and validation errors with conflict reasons, overlapping intervals, and affected resources.
- **AC-4 (Prisma Schema & Database Migrations)**:
  - Adds schema models for checklist templates, checklist item templates, booking tasks, and checklist items.
  - Preserves backwards compatibility with existing Prisma schema while adding database migrations in `packages/db/prisma/migrations/`.
- **AC-5 (Projects UI Integration in `apps/projects`)**:
  - Adds a dedicated Bookings management interface (`/bookings`), lifecycle actions, conflict detection visual indicators, and checklist execution components.

