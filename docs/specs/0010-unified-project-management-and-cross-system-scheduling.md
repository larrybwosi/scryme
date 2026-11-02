# 0010. Unified Project Management and Cross System Scheduling Architecture

**Date**: 2026-11-02
**Status**: Proposed

## Summary

This specification establishes the unified project management and cross system scheduling system across the Scryme platform. It bridges project planning in `apps/projects` directly with operations across the business: bakery and manufacturing production schedules (`apps/api/src/v3/modules/production`), customer relationship follow-ups (`apps/api/src/v3/modules/crm`), enterprise delivery windows and driver dispatches (`apps/api/src/v3/modules/deliveries`), staff shift rosters (`apps/api/src/v3/modules/scheduling`), and user tasks/milestones (`apps/api/src/v3/modules/tasks`). A dedicated unified scheduling aggregation endpoint securely queries and transforms operational events into a standard calendar event schema, while `apps/projects` provides multi layer filtering, deep inspection dialogs, interactive status transitions, and unified capacity planning.

## Context

Previously, `apps/projects` focused on isolated task management, milestone tracking, and basic sprint schedules. Operational schedules like bakery production runs, logistics delivery windows, CRM customer call/meeting follow-ups, and staff shifts lived in disparate backend modules and applications. Operations managers, dispatchers, and project leads lacked a consolidated cockpit to visualize upcoming deadlines, monitor driver deliveries against project timelines, ensure staff availability aligns with production schedules, and complete customer follow-ups from a single operational timeline.

## Requirements

**User stories**:
- As an operations manager or project lead, I want a single unified schedule and calendar view showing all business activities: production batches, delivery windows, customer follow-ups, staff shifts, and user tasks.
- As a team member, I want to filter the calendar, Gantt chart, and schedule by event category (`tasks`, `production`, `deliveries`, `crm_followups`, `shifts`) to focus on my department's responsibilities.
- As a user inspecting an event, I want to see domain-specific details (such as recipe name and batch quantity for production, tracking number and driver for delivery, contact name and follow-up type for CRM, or shift hours and location for staff shifts) and perform status updates directly.
- As an enterprise administrator, I want system access controls and module permissions to be strictly enforced so that sensitive cross-domain activities are only exposed to users with appropriate read and write permissions.

**Acceptance criteria**:
- **AC-1**: Backend API exposes `GET /v3/scheduling/unified-calendar` (and `/:orgSlug/scheduling/unified-calendar`) aggregating operational events across tasks, production runs/batches, deliveries, CRM follow-ups, and staff shifts for any date range with permission awareness.
- **AC-2**: Backend provides dedicated endpoints or handlers for domain status transitions and updates (e.g., rescheduling a delivery or production run, transitioning batch status, completing CRM follow-ups).
- **AC-3**: `apps/projects` Calendar (`/calendar`) renders multi category events with distinct badge colors, visual icons, category toggles, date navigation (month/week/day), and domain inspector modals.
- **AC-4**: `apps/projects` Gantt chart (`/gantt`) integrates cross-system items along the timeline, rendering production run durations, scheduled deliveries, and multi-day tasks with responsive zoom levels.
- **AC-5**: `apps/projects` Capacity Schedule (`/schedule`) incorporates staff shifts alongside assigned user tasks, computing accurate member workload, active shift coverage, and scheduled commitments.
- **AC-6**: `apps/projects` Board (`/board`) and Tasks directory provide cross-category activity views with quick filter chips for Operational Domains.
- **AC-7**: All API endpoints and client actions enforce tenant isolation and verify corresponding domain permissions (`tasks:read/manage`, `shifts:read/manage`, `deliveries:read/manage`, `crm:read/manage`, `production:read/manage`).

## Options considered

### Option 1: Unified Backend Aggregator Endpoint with Direct Domain Mutations (Selected)
Provide a centralized backend endpoint in `apps/api/src/v3/modules/scheduling` that queries Prisma tables (`Task`, `Batch`, `Fulfillment`, `CrmFollowUp`, `StaffShift`) concurrently using `Promise.all` with tenant isolation and permission checks. Transform disparate models into a normalized `UnifiedCalendarEvent` contract. Client components in `apps/projects` consume this unified dataset while mutating statuses via domain actions.

**Pros**:
- Minimizes network roundtrips from client to backend from 5 separate requests down to 1.
- Guarantees consistent date filtering, timezone handling, and tenant boundary enforcement on the server.
- Leaves individual domain business rules and lifecycle logic encapsulated in their respective modules.

**Cons**:
- Aggregation query must gracefully handle nullable relations across diverse modules.

### Option 2: Client Side Federation across Multiple APIs
Have `apps/projects` execute 5 separate HTTP queries to tasks, production, deliveries, CRM, and shifts endpoints, merging results client-side.

**Pros**:
- No dedicated backend aggregation controller required.

**Cons**:
- Excessive network overhead, higher latency, and complex client-side pagination and error handling.

## Build plan

1. Create architecture specification in `docs/specs/0010-unified-project-management-and-cross-system-scheduling.md`, satisfies **AC-1** through **AC-7**.
2. Implement `UnifiedSchedulingUseCase` and `SchedulingController.getUnifiedCalendarEvents` in `apps/api/src/v3/modules/scheduling` querying tasks, production batches, fulfillments, CRM follow-ups, and staff shifts.
3. Add CRM follow-up completion / rescheduling endpoint in `apps/api/src/v3/modules/crm` or scheduling module.
4. Add API client methods and React Query hooks (`useUnifiedCalendarEvents`, `useUpdateUnifiedEvent`) in `apps/projects/lib/api.ts` and `apps/projects/lib/hooks/use-projects.ts`.
5. Enhance `apps/projects/app/calendar/page.tsx` with multi-category event layer toggles, distinct badges, and comprehensive event inspection modals.
6. Enhance `apps/projects/app/gantt/page.tsx` to visualize cross-system items (production runs, deliveries, tasks) on the Gantt timeline.
7. Enhance `apps/projects/app/schedule/page.tsx` to calculate capacity combining staff shifts and assigned operational tasks.
8. Add automated tests covering the unified calendar aggregation and verification.

## Consequences

**Positive**:
- Provides enterprise teams with an all-in-one mission control view across physical production, logistics, sales CRM, and engineering/office tasks.
- Eliminates siloed communication between bakery kitchen staff, dispatchers, sales reps, and managers.

**Negative / tradeoffs**:
- Aggregating diverse domain entities requires maintaining a normalized event data contract.

## Follow-up

- Monitor query performance on unified calendar queries over broad multi-month date ranges.
