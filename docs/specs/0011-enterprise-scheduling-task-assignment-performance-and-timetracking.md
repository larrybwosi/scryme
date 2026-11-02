# 0011: Enterprise Scheduling, Task Assignment, Performance Tracking & Time Tracking

**Status**: Ratified
**Authors**: Jules & Senior Systems Architect
**Deciders**: Engineering Lead & Product Team
**Date**: 2026-11-02

## Context

The Projects application (`apps/projects`) manages cross-system engineering, manufacturing, and operational workflows. While foundational task tracking and shift roster viewing existed, enterprise teams require end-to-end operational execution:
1. **User Scheduling**: Managers must be able to create, edit, reassign, and delete staff shifts directly in the UI with shift conflict detection, and team members need the ability to submit and process shift trades and time-off requests.
2. **Workload & Capacity Assignment**: Task assignment must check member capacity against scheduled shifts, warning managers when members are overloaded (>100% capacity) while supporting multi-assignee management (distinguishing Primary Owner from Contributors with individual hour allocations) and real-time task assignment notifications.
3. **User Performance Tracking**: Managers and squad leads need visibility into member performance via a dedicated `/performance` dashboard and inspection slide-over drawer on `/team` tracking on-time completion rates, task throughput/velocity, capacity utilization, overdue task count, and average resolution times.
4. **Time Tracking & Weekly Timesheets**: Upgrading `/time-tracking` with dual views: "My Timesheet" (stopwatch timer, manual entries, standalone operational non-task logging with category classification, billable vs non-billable categorization, weekly matrix grid, CSV export, and submission for approval) and "Approvals & Team Timesheets" (manager review, approve, reject with feedback notes, and automated locking of approved time entries).
5. **Backend Extensions**: Expanding `apps/api/src/v3/modules/tasks` and `apps/api/src/v3/modules/scheduling` with dedicated performance aggregation, multi-assignee management with primary owner distinction, operational non-task time logging, and timesheet tracking endpoints.

## Requirements

- **AC-1 (Staff Shift CRUD & Conflict Detection)**: Managers can create, update, and delete staff shifts in `apps/projects/app/schedule`. Overlapping shift intervals for the same member trigger conflict detection alerts before persisting.
- **AC-2 (Shift Trades & Time-off Requests)**: Team members can submit shift trade and swap requests from `/schedule`, and managers can view, approve, reject, or cancel trade requests.
- **AC-3 (Multi-Assignee & Capacity Validation)**:
  - Supports multiple assignees per task, distinguishing exactly one Primary Owner (lead accountable member) and optional Contributors.
  - Allows individual estimated hour apportionment per assignee, defaulting to equal distribution.
  - Verifies member capacity against active weekly scheduled shifts (defaulting to 40h if none scheduled). If assigning the task exceeds 100% capacity, displays a soft-warning modal allowing manager override.
  - Emits real-time Socket.io events (`task:assigned`, `task:updated`), displays in-app toast alerts, and dispatches FCM push notifications.
- **AC-4 (Dedicated Performance Dashboard & Inspection Drawer)**:
  - Route `/performance` provides a squad-wide overview (Average On-Time Rate, Team Velocity, Total Hours Logged, Average Capacity Utilization, and member comparison leaderboard).
  - Clicking any member opens `MemberPerformanceDrawer` displaying dynamic KPIs (On-Time Completion Rate, Velocity/Throughput, Capacity Utilization %, Overdue Count, Average Resolution Time, Estimation Accuracy) with date-range filters (7d, 30d, 90d).
- **AC-5 (Enterprise Time Tracking & Weekly Timesheets)**:
  - On `/time-tracking`, users can log time against tasks or standalone operational hours (with categories: `OPERATION`, `MEETING`, `SUPPORT`, `TRAINING`).
  - Supports billable vs. non-billable classification, live stopwatch timer, weekly matrix view, and CSV export.
  - Members submit weekly timesheets for manager review. When approved, underlying time entries are locked (`isLocked: true`), preventing further updates or deletions and displaying an "Approved & Locked" badge.
- **AC-6 (V3 API Endpoints & Comprehensive Test Coverage)**: Backend endpoints in `apps/api` support performance metrics calculation, multi-assignee management, standalone time tracking, timesheet submission/review, and shift operations, backed by comprehensive Vitest test coverage.

## Decision & Technical Design

### Database Schema Updates (`packages/db`)

1. **`TaskAssignee` (`packages/db/prisma/schema/tasks.prisma`)**:
   - Add `isPrimary Boolean @default(false)`
   - Add `allocatedHours Decimal? @db.Decimal(10, 2)`
2. **`TaskTimeEntry` (`packages/db/prisma/schema/tasks.prisma`)**:
   - Change `taskId String` to `taskId String?` (optional for non-task operational hours)
   - Add `category String?` (e.g. `OPERATION`, `MEETING`, `SUPPORT`, `TRAINING`)
   - Add `isLocked Boolean @default(false)`
   - Add `isBillable Boolean @default(true)`

### Backend Extensions (`apps/api/src/v3/modules`)

1. **Tasks Module (`apps/api/src/v3/modules/tasks`)**:
   - `manageAssignees`: Accepts array of `{ memberId: string; isPrimary?: boolean; allocatedHours?: number }`. Sets primary owner and allocated hours. Emits real-time `task:assigned` and dispatches FCM notifications.
   - `addTimeEntry`: Allows optional `taskId` and captures `category`, `isBillable`. Rejects modifications if timesheet/entry is locked.
   - `getMemberPerformance`: Calculates KPIs factoring primary vs. contributed tasks, shift capacity, and operational hours.
   - `getTeamPerformance`: Returns team-wide aggregated KPIs and member comparison leaderboard.
   - `submitWeeklyTimesheet` & `processWeeklyTimesheet`: On approval, batch updates corresponding time entries to `isLocked: true`.

2. **Scheduling Module (`apps/api/src/v3/modules/scheduling`)**:
   - Shift CRUD and shift trades with interval overlap conflict detection.

### Frontend Enhancements (`apps/projects`)

1. **`apps/projects/app/performance/page.tsx`**:
   - Dedicated Performance view with squad summary cards, leaderboard table, and drilldown inspection.
   - Added to `Sidebar.tsx` navigation rail.
2. **`apps/projects/app/tasks/page.tsx` & `apps/projects/app/task-detail/page.tsx`**:
   - Multi-assignee selector with Primary Owner chip and Contributor chips.
   - Hour allocation split inputs with automatic fallback.
   - Soft-warning capacity modal with manager override.
   - Prerender fix with React Suspense for search params.
3. **`apps/projects/app/time-tracking/page.tsx`**:
   - Standalone operational logging mode (toggle between Task and General Operation).
   - "Approved & Locked" status badges on locked entries with disabled delete/edit actions.
