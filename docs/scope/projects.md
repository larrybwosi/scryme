# Scope: Projects Application (`apps/projects`)

Dedicated project management, task tracking, scheduling, milestones, member assignments, and time tracking application connected to backend V3 APIs.

**Build approach:** Tracer Bullet (end-to-end walking skeleton first).
**Workflow:** Beta (verify with `/check verify` then `/test`).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | App Scaffold & Shell | Foundation | planned |
| 2 | Auth & V3 API Client | Foundation | planned |
| 3 | Project Management & Creation | Slice 1 | planned |
| 4 | Task Views (Kanban & List) | Slice 1 | planned |
| 5 | Milestone & Schedule Management | Slice 2 | planned |
| 6 | Gantt Chart & Time Tracking | Slice 2 | planned |
| 7 | Member Assignments & Sync | Slice 3 | planned |

## Foundations

### 1. App Scaffold & Shell
Initialize `apps/projects` workspace with Next.js 16, React 19, Tailwind CSS, `@repo/ui`, and navigation app shell.
**Done when:** `apps/projects` runs on port 3002 with responsive sidebar navigation and layout shell.
- [ ] Design it (spec): `/architect projects app scaffold`

### 2. Auth & V3 API Client
Integrate `@repo/auth` session state and setup V3 API client connected to backend NestJS endpoints (`/v3/tasks`, `/v3/scheduling`).
**Done when:** API client sends authenticated requests with active org/member session tokens.
- [ ] Design it (spec): `/architect projects api client`

## Slice 1: Core Projects & Tasks

### 3. Project Management & Creation
Create and manage projects, update status, set date ranges, and view active project list.
**Done when:** Users can create projects, list projects, view project details, and update status.
- [ ] Design it (spec): `/architect project management`

### 4. Task Views (Kanban & List)
Manage project tasks with Kanban drag-and-drop status columns and filterable list views.
**Done when:** Users can add, update, drag-and-drop tasks, and toggle between Kanban and List views.
- [ ] Design it (spec): `/architect task views`

## Slice 2: Schedule, Milestones, Timeline & Time Tracking

### 5. Milestone & Schedule Management
Track project milestones, schedule overrides, and shift linkages via backend scheduling modules.
**Done when:** Users can create milestones, link tasks to milestones, and view schedule timelines.
- [ ] Design it (spec): `/architect milestone management`

### 6. Gantt Chart & Time Tracking
Visualize project timelines in a Gantt chart and log time entries against tasks.
**Done when:** Interactive Gantt chart renders task dependencies and time tracking logs update task actual hours.
- [ ] Design it (spec): `/architect gantt and time tracking`

## Slice 3: Team Collaboration & Final Polish

### 7. Member Assignments & Sync
Assign organization members to projects/tasks, filter by assignee, and handle real-time sync.
**Done when:** Member selection works across tasks, assignees receive context, and state updates synchronously.
- [ ] Design it (spec): `/architect member assignments`

## Legend

**The decision box:** Every feature carries `Design it (spec)`.
**Workflow tier:** Beta.
