# 0011: Enterprise Scheduling, Task Assignment, Performance Tracking & Time Tracking

**Status**: In Progress
**Authors**: Jules & Senior Systems Architect
**Deciders**: Engineering Lead & Product Team
**Date**: 2025-11-02

## Context

The Projects application (`apps/projects`) manages cross-system engineering, manufacturing, and operational workflows. While foundational task tracking and shift roster viewing existed, enterprise teams require end-to-end operational execution:
1. **User Scheduling**: Managers must be able to create, edit, reassign, and delete staff shifts directly in the UI with shift conflict detection, and team members need the ability to submit and process shift trades and time-off requests.
2. **Workload & Capacity Assignment**: Task assignment must check member capacity against scheduled shifts, warning managers when members are overloaded (>100% capacity) while supporting multi-assignee management and real-time task assignment notifications.
3. **User Performance Tracking**: Managers and squad leads need visibility into member performance via an inspection slide-over drawer on `/team` tracking on-time completion rates, task throughput/velocity, capacity utilization, overdue task count, and average resolution times.
4. **Time Tracking & Weekly Timesheets**: Upgrading `/time-tracking` with dual views: "My Timesheet" (stopwatch timer, manual entries, billable vs non-billable categorization, weekly matrix grid, CSV export, and submission for approval) and "Approvals & Team Timesheets" (manager review, approve, reject with feedback notes).
5. **Backend Extensions**: Expanding `apps/api/src/v3/modules/tasks` and `apps/api/src/v3/modules/scheduling` with dedicated performance aggregation and timesheet tracking endpoints.

## Requirements

- **AC-1 (Staff Shift CRUD & Conflict Detection)**: Managers can create, update, and delete staff shifts in `apps/projects/app/schedule`. Overlapping shift intervals for the same member trigger conflict detection alerts before persisting.
- **AC-2 (Shift Trades & Time-off Requests)**: Team members can submit shift trade and swap requests from `/schedule`, and managers can view, approve, reject, or cancel trade requests.
- **AC-3 (Task Assignment & Soft Warning Capacity Validation)**: Assigning tasks verifies member allocation against their shift capacity. If the assigned task causes the member to exceed 100% capacity, a soft warning modal alerts the manager with option to proceed. Dispatches assignment notification and activity log.
- **AC-4 (User Performance Tracking Drawer)**: On `/team`, clicking a member opens a slide-over drawer displaying member KPIs (On-Time Completion Rate, Velocity/Throughput, Capacity Utilization %, Overdue Count, Average Resolution Time) calculated dynamically with date-range filters.
- **AC-5 (Enterprise Time Tracking & Weekly Timesheets)**: On `/time-tracking`, users can log billable/non-billable hours, view weekly matrix timesheet, export to CSV, and submit timesheets. Managers can review and approve/reject timesheets.
- **AC-6 (V3 API Endpoints & Unit Tests)**: Backend endpoints in `apps/api` support performance metrics calculation, timesheet submission/review, and shift operations, backed by comprehensive Vitest test coverage.

## Decision & Technical Design

### Backend Extensions (`apps/api/src/v3/modules`)

1. **Tasks Module (`apps/api/src/v3/modules/tasks`)**:
   - Add `GET /v3/tasks/members/:memberId/performance`: Computes on-time completion rate, velocity (completed tasks in window), total actual vs estimated hours, capacity utilization against shifts, overdue count, and average resolution time in hours.
   - Add `GET /v3/tasks/timesheets/weekly`: Returns aggregated timesheet summaries by member, week start date, and status.
   - Add `POST /v3/tasks/timesheets/submit`: Allows members to submit their weekly timesheet for approval.
   - Add `POST /v3/tasks/timesheets/:id/process`: Allows managers to approve or reject submitted weekly timesheets.
   - Update `CreateTaskTimeEntryDto` to accept optional `isBillable` boolean flag.

2. **Scheduling Module (`apps/api/src/v3/modules/scheduling`)**:
   - Ensure `POST /v3/shifts`, `PATCH /v3/shifts/:shiftId`, `DELETE /v3/shifts/:shiftId` validate conflict overlapping intervals (already enforced in `validateShiftOverlap`), and expose clean DTO error messaging.
   - Ensure `GET /v3/shifts/trades` and `POST /v3/shifts/trades/:tradeId/process` allow seamless trade handling.

### Frontend Enhancements (`apps/projects`)

1. **`apps/projects/lib/api.ts` & `apps/projects/lib/hooks/use-projects.ts`**:
   - Add API methods and React Query hooks: `useMemberPerformance`, `useWeeklyTimesheets`, `useSubmitWeeklyTimesheet`, `useProcessWeeklyTimesheet`, `useStaffShifts`, `useCreateStaffShift`, `useUpdateStaffShift`, `useDeleteStaffShift`, `useShiftTrades`, `useRequestShiftTrade`, `useProcessShiftTrade`.

2. **`apps/projects/app/schedule/page.tsx`**:
   - Provide "Roster & Capacity" view with Create Shift and Edit/Delete Shift modals for managers.
   - Implement "Shift Trades & Requests" tab where members can request a trade/swap and managers can approve or reject pending requests.
   - Show visual conflict badges when shifts overlap.

3. **`apps/projects/app/team/page.tsx` & `TeamTab.tsx`**:
   - Clicking a member opens `MemberPerformanceDrawer`.
   - Displays KPIs: On-time Completion %, Velocity / Throughput, Capacity Utilization %, Overdue Count, Avg Resolution Time, plus recent activity and current task allocations.
   - Includes time-range picker: "Last 7 Days", "Last 30 Days", "This Quarter".

4. **`apps/projects/app/tasks/page.tsx` & `apps/projects/app/task-detail/page.tsx`**:
   - Workload & Capacity soft-warning modal: when assigning a member whose capacity usage would exceed 100%, show a confirm dialog warning the manager while allowing override.
   - Multi-assignee support with primary indicator.

5. **`apps/projects/app/time-tracking/page.tsx`**:
   - Tab switch between "My Timesheet" and "Approvals & Team Timesheets".
   - "My Timesheet": active timer, billable toggle, weekly matrix breakdown (Mon-Sun), CSV export, submit for approval button.
   - "Approvals & Team Timesheets": table of submitted timesheets with Approve and Reject actions and feedback notes.

