# 0009. Projects App Calendar and Management Features with API Support and Authorization

**Date**: 2026-11-02
**Status**: Accepted

## Summary

The Projects application calendar and core management features are updated to provide dynamic API support, role-based and permission-based authorization, and interactive workflows across all major surfaces. The calendar dynamically renders real dates for any month and year, supporting month, week, and day perspectives with aggregated tasks, milestones, and sprint events. Pages including the Projects directory, Project workspace tabs, Kanban Board, Roadmap Gantt, Tasks directory, Capacity Schedule, and Time Tracking console are enhanced with drag-and-drop state transitions, real date timeline mapping, persistent header and page timer synchronization, and granular authorization controls.

## Context

The previous calendar view used static October 2024 dates and placeholder views. Several project pages relied on basic layouts without full interactive capabilities, real calendar alignment, or persistent timer sync between the top header and the time tracking view. Furthermore, while the backend API (`apps/api/src/v3/modules/tasks`) enforced `tasks:manage` and `tasks:read` permissions, the frontend UI did not reflect user permissions or project-level roles (e.g., ADMIN, MEMBER, VIEWER), leading to potential unauthorized action attempts or unclear feedback.

## Requirements

**User stories**:
- As a team member or project lead, I want the Calendar to dynamically reflect real months and years, displaying real tasks, milestones, and sprint cadences fetched from the API with interactive event inspection.
- As an administrator or team member, I want the UI to respect my organization permissions (`tasks:manage`, `tasks:read`) and project roles so that actions like creating, editing, and deleting items are accessible only when authorized.
- As a developer or manager, I want the Kanban board to support drag and drop status updates, the Gantt chart to map real start and due dates, the Schedule view to compute real weekly capacity, and the Time Tracker to maintain live timer continuity with the top header.

**Acceptance criteria**:
- **AC-1**: Calendar page calculates real dates, offsets, and days for any month/year across Month, Week, and Day views, aggregating live tasks, milestones, and sprints from the API.
- **AC-2**: Calendar events allow clicking to inspect details or navigate directly to the relevant task, sprint, or milestone.
- **AC-3**: Authorization helper hooks and UI guards in `apps/projects` evaluate organization permissions and project roles, disabling or hiding mutation actions for read-only members with graceful tooltips or feedback.
- **AC-4**: Project Directory (`/projects`) and Project Details (`/projects/[id]`) allow editing project metadata, updating statuses (ACTIVE, ON_HOLD, COMPLETED, ARCHIVED), and managing project members.
- **AC-5**: Kanban Board (`/board`) supports HTML5 drag-and-drop between columns with optimistic status updates and priority filters.
- **AC-6**: Roadmap Gantt (`/gantt`) computes horizontal timeline positions from real task `startDate` and `dueDate` or estimated duration across selectable zoom levels.
- **AC-7**: Capacity Schedule (`/schedule`) computes real weekly capacity by aggregating assigned tasks scheduled within the selected week window.
- **AC-8**: Time Tracker (`/time-tracking`) and Header timer share a unified persistent timer state (elapsed time, active task, running status) via localStorage/reactive store.

## Build plan

1. Create architecture specification in `docs/specs/0009-projects-app-calendar-and-management.md`, satisfies AC-1 through AC-8.
2. Extend backend tasks module with calendar aggregation endpoint if needed, and verify permissions decorators.
3. Build authorization utilities (`usePermissions`, role checkers) and persistent timer store (`useTimerStore` / `timer-store.ts`) in `apps/projects/lib`.
4. Refactor `/calendar` with real date math, multi-view modes (month/week/day), live API event ingestion, and event detail inspector.
5. Upgrade `/projects` and `/projects/[id]` with edit project modal, status transitions, and member role assignment dialogs.
6. Upgrade `/board` with drag-and-drop column transfers and status mutations.
7. Upgrade `/gantt` with real date positioning, date ranges, and zoom level calculations.
8. Upgrade `/schedule` with real calendar week windowing and member allocation aggregation.
9. Upgrade `/time-tracking` and Header with synced timer state.
10. Verify typechecks and Next.js builds.
