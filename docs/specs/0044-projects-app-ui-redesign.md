# 0044. Projects app UI redesign

**Date**: 2026-11-18
**Status**: Proposed

## Summary

This decision reorganizes the `apps/projects` interface around one clear navigation, one working feedback path, and shared building blocks. The current app has duplicate screens, controls that do nothing, and messages that never appear, so people cannot tell whether their work was saved. The build starts with one thin user path, finding a task, opening it, changing its status, and seeing a truthful result, then extends the same pattern to the rest of the app. No backend endpoint or database change is part of this decision.

## Context

> ⚠️ Premise note: This request bundles navigation cleanup, feedback repair, and several new controls. They are kept together because you chose them as one coherent pass, but the build plan deliberately proves one task path first so a broken thread is found before the wider rollout.

The projects app grew feature by feature until the same idea appears in several places. Team, milestones, documents, and task detail each have more than one route. The sidebar and header carry controls with no behavior, including a search button that dispatches an event nothing listens for, a settings link to a placeholder, and a workspace switch that does nothing. Bookings exists as a screen but has no navigation entry.

Feedback is the more serious problem. Toasts are called in eleven files but the app never mounts the toast viewer, so most success and failure messages are invisible. Some failed changes leave the screen showing a status the server never saved. Loading text appears inline in more than a hundred places while only one screen has a skeleton. Empty states exist but disagree in wording and layout.

The visual layer has two sources that disagree. `apps/projects/DESIGN.md` carries a token map in its front matter and a second palette in its prose. `app/globals.css` follows the front matter, while a few screens use raw hex colors and palette colors from Tailwind. Material symbol spans render nothing because the font is never loaded, even though `lucide-react` is already a dependency.

The workspace has an accepted permissions model from spec 0009, a live V3 API from spec 0008, and query caching from spec 0002. The scope file for projects uses Tracer Bullet delivery and a Beta verification tier. There are no component tests today, only logic tests under `lib/__tests__`. Without a decision here, each new screen will copy the current patterns and the same failures will spread.

## Requirements

**User stories**:

* As a project member, I want one reliable way to move through the app so that I do not have to guess which of two screens is current.
* As a project member, I want to see whether my action worked so that I never trust a change the server did not save.
* As a team lead, I want overdue work, booking conflicts, and pending approvals in one place so that I can act on them without opening every screen.
* As a keyboard user, I want navigation, creation, and dialogs to work without a mouse so that the app is usable at speed.

**Acceptance criteria** (the contract, each independently checkable):

* **AC-1**: The shell shows two navigation groups, Views and Operations. Duplicate routes `/team`, `/milestones`, and `/notes-and-docs` redirect to `/projects` with a prompt to choose a project. `/task-detail` redirects to `/tasks/[id]`. `/bookings` appears under Operations.
* **AC-2**: A command palette opens with Command K or Control K, uses `cmdk`, lists navigation destinations and create task and create project actions, closes with Escape, traps focus while open, and returns focus to the trigger on close.
* **AC-3**: The C and P key hints open the create task and create project flows, and neither shortcut fires while the user is typing in an input, textarea, or select.
* **AC-4**: Create, update, and delete actions for tasks and projects, status changes, and timesheet submit actions show a visible success or failure toast. A failed action never shows a success message. Toast text, placement, duration, and error mapping follow the contract in Feature design.
* **AC-5**: The notification panel lists overdue tasks, booking conflicts, and pending timesheet approvals from data the app already fetches. It has loading, empty, and error states, and each item links to its source screen.
* **AC-6**: The workspace switch control becomes a read only label showing the active organization from the session. The Settings entry is removed from the sidebar.
* **AC-7**: The task path of list, detail, status change, and feedback handles loading, empty, API error, missing task, and failed change states. An optimistic status shows a saving state and is never presented as saved before the server confirms. A failed status change restores the previous status, shows the error, and refetches the task.
* **AC-8**: Shared dialog, page state, and feedback components live under `apps/projects/components/` and replace the repeated modal markup. Every dialog traps focus, closes with Escape, and returns focus to its trigger. Every control has a visible focus ring.
* **AC-9**: The task creation form keeps all current fields listed in Feature design, groups them into Details, Hierarchy, Cross system links, and Assignments, and shows a field level validation error next to the field that failed.
* **AC-10**: Colors come from the front matter token map in `apps/projects/DESIGN.md` and `app/globals.css`, using the semantic mapping in Feature design. Raw hex values, Tailwind palette colors, and the prose palette are removed from app screens. Icons use `lucide-react` and no material symbol spans remain. The app stays dark only.
* **AC-11**: On desktop the sidebar rail starts at 240px and collapses to a 56px icon rail with a toggle, with the choice stored in local storage. On screens below 1024px the navigation becomes a drawer opened from the header menu and closed by Escape, overlay click, or route change. Scrollbars stay visible and no content is hidden by a fixed width sidebar.
* **AC-12**: Vitest runs with jsdom and Testing Library, with a setup file that mocks the session, permissions, V3 hooks, and the clock. Component tests cover the task list, task detail, status change, feedback, empty state, and error state of the first path.
* **AC-13**: Existing organization permissions and project roles still decide which actions are available, using the action to permission table in Feature design. A read only member has read access without manage access and cannot mutate. The V3 API continues to enforce the same rules. No new endpoint or database migration is introduced.

## Options considered

### Option 1: Fix in place with incremental component replacement

Keep every route and API contract, introduce shared dialog, feedback, and page state components beside the existing screens, then move each screen onto them one at a time.

**Pros**:

* Lowest risk to a live app, since each screen can be changed and reverted on its own.
* Keeps the accepted API, permission, and data decisions intact.
* Matches the Tracer Bullet approach by proving the task path before the rest.

**Cons**:

* Two patterns coexist during the rollout, so the app looks mixed for a short time.
* Old markup must be found and removed deliberately or it lingers.

### Option 2: Build a parallel shell and switch screens over

Create the new shell and components alongside the current ones, then move screens across only when the new version is proven.

**Pros**:

* Gives a clean rollback point and a clear before and after.
* Lets the team compare behavior on real data before cutover.

**Cons**:

* Two navigation trees and two sets of components must be maintained during the rollout.
* More work than the current scope needs, since no API or data contract is changing.

### Option 3: Replace the shell and screens directly

Rewrite the shell and every screen in one pass and retire the old UI at release.

**Pros**:

* One consistent end state with no leftover patterns.
* Simplest mental model once it lands.

**Cons**:

* Big bang changes on a live app fail more often than incremental ones.
* A regression would affect every screen at once and the Beta verification tier would have little time to catch it.

## Decision

**Chosen option**: Option 1: Fix in place with incremental component replacement.

Reuse the existing API, hooks, permissions, and route structure, and replace the broken interface pieces one screen at a time, starting with the task path.

## Rationale

The strongest force is that the backend is already settled. Specs 0008, 0002, 0009, and 0042 cover the API connection, caching, permissions, and operational data. Nothing in the diagnosis needs a new endpoint or a schema change, so a rewrite would spend risk on the part that is working.

The feedback failure is the root cause of the feeling that the app is broken. Mounting the toast viewer and making mutations honest on failure fixes trust with a very small change. Building the shared dialog and page state components at the same time gives every later screen one place to get focus behavior and loading, empty, and error states right.

A parallel shell would be safer in theory but costs more than this scope warrants, because there is no contract migration to protect against. Direct replacement would put every screen at risk at once. Incremental replacement fits the Tracer Bullet approach in the projects scope and the Beta verification tier, and it leaves a clear rollback point at each step.

## Feature design

**Data model sketch**:

No new entity, field, relationship, index, migration, or retention rule. All screens continue to use the existing V3 records for projects, tasks, milestones, sprints, time entries, members, and bookings.

**State transitions**:

Task status keeps its current values: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, and CANCELED. A status change is optimistic in the interface only, with a saving badge until the server confirms. If the server rejects the write, the interface restores the previous status and shows the failure. The full transition matrix is in the Mutation and status contract below.

**API surface**:

No endpoint is added, removed, or reshaped. The interface uses the following existing calls through `lib/api.ts` and the hooks in `lib/hooks/use-projects.ts`.

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/v3/tasks` | GET | `projectId` optional | Task list with id, title, status, assignee, due date | Session cookie and organization headers | 401, 403, network failure |
| `/v3/tasks/:id` | GET | `id` | Single task with description and subtasks | Session cookie and organization headers | 401, 403, 404 |
| `/v3/tasks/:id` | PATCH | `status` | Updated task status | Session cookie and organization headers | 401, 403, 409, 422 |
| `/v3/projects` | GET and POST | Project fields on create | Project list or created project | Session cookie and organization headers | 401, 403, 422 |
| `/v3/bookings` | GET | `status` optional | Booking list with conflict fields | Session cookie and organization headers | 401, 403 |
| `/v3/tasks/timesheets/weekly` | GET | Member and week | Weekly timesheet with approval state | Session cookie and organization headers | 401, 403 |
| `/v3/projects/:id` | PATCH | Project fields | Updated project | Session cookie and organization headers | 401, 403, 422 |
| `/v3/projects/:id` | DELETE | `id` | Success flag | Session cookie and organization headers | 401, 403, 404 |
| `/v3/tasks` | POST | Task fields | Created task | Session cookie and organization headers | 401, 403, 422 |
| `/v3/tasks/:id` | DELETE | `id` | Success flag | Session cookie and organization headers | 401, 403, 404 |
| `/v3/tasks/timesheets/submit` | POST | Week and entries | Submitted timesheet | Session cookie and organization headers | 401, 403, 422 |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Render task list | Task id, title, status, assignee, due date | Existing task records from `GET /v3/tasks` through `useTasks` |
| Render task detail | Description, subtasks, comments, current status | Existing task record from `GET /v3/tasks/:id` through `useTask` |
| Change task status | New status | Status control input in the task detail screen |
| Change task status | Previous status for rollback | Cached task record held by TanStack Query |
| Change task status | Error shown to the user | Response from the PATCH call mapped by the mutation hook |
| Show any toast | Success or failure message | Result of the mutation that triggered it, never a timer or local guess |
| Show notification items | Overdue tasks | `useTasks` due dates compared with the device clock |
| Show notification items | Booking conflicts | Conflict fields from `useServiceBookings` |
| Show notification items | Pending approvals | Approval state from `useWeeklyTimesheets` |
| Show workspace label | Active organization name | `useWorkspaceContext().orgName`, falling back to `orgSlug`, with a Workspace placeholder while loading or on error |
| Show command palette | Command names and destinations | Navigation contract table and the two `/new?type=` routes |
| Close dialog and restore focus | Element that receives focus after close | Browser `document.activeElement` captured when the dialog opens |
| Hide or show mutation controls | User permission | Existing permission helpers from spec 0009 and the active organization headers |
| Show theme | Dark colors only | Front matter tokens in `apps/projects/DESIGN.md` mapped into `app/globals.css` |

**Navigation contract**:

| Group | Route | Label | Icon | Command name |
|---|---|---|---|---|
| Views | `/tasks` | Tasks | `ListTodo` | Go to tasks |
| Views | `/board` | Board | `KanbanSquare` | Go to board |
| Views | `/gantt` | Timeline | `GanttChartSquare` | Go to timeline |
| Views | `/calendar` | Calendar | `CalendarDays` | Go to calendar |
| Views | `/schedule` | Schedule | `CalendarClock` | Go to schedule |
| Operations | `/projects` | Projects | `FolderKanban` | Go to projects |
| Operations | `/bookings` | Bookings | `CalendarCheck` | Go to bookings |
| Operations | `/time-tracking` | Time tracking | `Timer` | Go to time tracking |
| Operations | `/performance` | Performance | `ChartNoAxesCombined` | Go to performance |

The palette also offers Create task to `/new?type=TASK` and Create project to `/new?type=PROJECT`. The `type` value accepts only `TASK` and `PROJECT`. The C and P shortcuts use these same two routes, require no modifier, and fire only when focus is on the body or a non interactive element. They are ignored inside inputs, textareas, selects, contenteditable regions, dialogs, and drawers. The palette opens from anywhere except while another dialog or drawer is open. Its placeholder is Search pages and actions, its empty state is No matches, and its trigger is the focused element captured on open, falling back to the header command button.

Redirects are exact. `/task-detail?id=<id>` goes to `/tasks/<id>` when `id` is present, otherwise to `/tasks` with a warning toast. `/team`, `/milestones`, and `/notes-and-docs` go to `/projects?choose=1`. On `/projects?choose=1`, `useProjects` drives a picker. Zero projects shows the empty state with a create action, one project opens it, and several show a searchable list. Cancel clears the query. Other query keys are preserved.

**Toast contract**:

| Action | Success message | Failure message |
|---|---|---|
| Create task | Task created | Could not create task |
| Update task | Task updated | Could not update task |
| Delete task | Task deleted | Could not delete task |
| Create project | Project created | Could not create project |
| Update project | Project updated | Could not update project |
| Delete project | Project deleted | Could not delete project |
| Change status | Status updated | Could not change status |
| Submit timesheet | Timesheet submitted | Could not submit timesheet |

Mount `<Toaster />` in `app/layout.tsx` inside the providers. Place toasts at the top right. Success stays 4 seconds, failure stays 6 seconds, at most three stack, and each has a dismiss button. Map server failures as follows: 401 to Your session expired. Sign in again, plus a redirect to the auth app; 403 to You do not have permission for this action; 404 to This item was not found, with a dedicated missing state on detail views and a back to tasks link; 409 to This item changed. Reload and try again; 422 to Check the highlighted fields; a network failure to Cannot reach the server. Try again.

**Mutation and status contract**:

Allowed task transitions are BACKLOG to TODO or CANCELED, TODO to IN_PROGRESS, BACKLOG, or CANCELED, IN_PROGRESS to IN_REVIEW, TODO, or CANCELED, IN_REVIEW to DONE, IN_PROGRESS, or CANCELED, DONE to IN_REVIEW, and CANCELED to BACKLOG. Moving to DONE or CANCELED asks for confirmation. The optimistic value shows a saving badge and is never a success message. On failure, the mutation context restores the cached `["tasks", projectId or "all"]` and `["task", id]` entries, shows the mapped error, then refetches both keys. On success, invalidate both keys and `["projects"]` when project counts are shown.

**Notification rules**:

Call `useTasks()` without a project id so the feed covers the workspace. Overdue means a `dueDate` before the start of the current local day and a status other than DONE or CANCELED. Booking conflicts come from the `conflicts` arrays on `useServiceBookings()` with no status filter. Pending approvals come from `useWeeklyTimesheets()` with no member filter for the current week starting Monday, where the status is neither APPROVED nor REJECTED. Items link to `/tasks/<id>`, `/bookings?booking=<id>`, and `/time-tracking?tab=approvals&week=<weekStartDate>`. The panel mounts in the header beside the timer with a `Bell` trigger and a count badge. Its empty text is You are all caught up. A failed hook hides only its own group and shows a small warning with retry.

**Form contract**:

Details holds title, description, project, status, priority, start date, due date, and estimated hours. Hierarchy holds the parent task. Cross system links holds the integration mode, booking, batch, milestone, and sprint. Assignments holds member, role, and allocated hours. Title and project are required. Title is at most 200 characters. Due date is on or after start date. Estimated and allocated hours are positive in half hour steps. A 422 response maps errors to fields by field name. Creation uses `POST /v3/tasks` through `useCreateTask`.

**Token mapping**:

Use `bg-surface` for the canvas, `bg-surface-container` for panels and inputs, `text-on-surface` for primary text, `text-outline` for muted text, `border-outline-variant` for dividers, `bg-primary-container` with `text-on-primary-container` for primary actions, and `text-error` for errors. Focus uses a 2px primary ring with a soft halo. Disabled controls use reduced opacity and no pointer events. The prose palette in DESIGN.md is replaced by a pointer to the front matter tokens, not kept as a second palette.

**Dialog scope**:

Replace the modal markup in the projects list create and edit dialogs, Overview edit dialog, Cycles create dialog, Milestones create dialog, Docs upload and import dialog, Team member dialog, Schedule dialogs in AddScheduleModal, CapacityWarningModal, LifecycleActions transition and cancel dialog, and CreateTaskModal. Native confirm calls become the shared confirm dialog. Dialogs use a stack, so only the topmost traps focus and Escape closes only the topmost. Focus restore walks the stack in reverse. If the captured element unmounted, focus the route heading or the header command button.

**Permission matrix**:

| Action | Requirement |
|---|---|
| View task list or detail | `canReadTasks` from `usePermissions` |
| Create or change task | `canManageTasks` |
| Edit project metadata | `canManageTasks` and `checkProjectRole(...).canEditProject` |
| Delete task or project | `canManageTasks` and `checkProjectRole(...).canEditProject` |
| Manage project members | `canManageTasks` and `checkProjectRole(...).isProjectAdmin` |
| Submit own timesheet | Active workspace member with `canReadTasks` |
| Process timesheet approval | `canManageTasks` |

A read only member has `canReadTasks` true, `canManageTasks` false, no owner or admin role, and none of `tasks:manage`, `tasks:*`, or the wildcard permission. The V3 API keeps the final say.

**Test setup**:

Add `jsdom`, `@testing-library/react`, and `@testing-library/user-event` as dev dependencies. Create `apps/projects/lib/__tests__/setup.ts`, mock `authClient.getSession`, `usePermissions`, the V3 hooks, and use fake timers for the clock. Keep the existing logic tests unchanged.

**Key invariants**:

* No mutation result is presented as successful until the server confirms it.
* A failed optimistic status change always restores the cached previous value.
* Every dialog traps focus, closes with Escape, and restores focus.
* Interface colors come from the token map. Screen files do not contain raw hex values or Tailwind palette colors.
* New shared components stay inside `apps/projects/components/` until another workspace needs them.
* No new environment variable, secret, endpoint, or database migration is added. The write endpoints listed above already exist and are reused.

**Security model**:

Authentication and tenant context remain as they are in specs 0008 and 0039. Session cookies and organization headers come from the active BetterAuth session. Permission checks from spec 0009 continue to decide whether create, edit, and delete controls are available. No new role, ownership rule, or compliance scope is introduced, and no regulated data is added to the interface.

**Configuration required**:

None.

**Critical test scenarios**:

* Happy path: find a task in the list, open it, change its status, and see a success toast with the new status persisted, verifies **AC-4**, **AC-7**.
* Failure case: the status PATCH returns an error, the task returns to its previous status, and an error toast names the failure, verifies **AC-4**, **AC-7**.
* Empty and loading: the list shows a skeleton while loading and a clear empty state with a create action when there are no tasks, verifies **AC-7**, **AC-8**.
* Keyboard: open the palette with Control K, move through commands, create a task, close with Escape, and confirm focus returns to the trigger, verifies **AC-2**, **AC-3**, **AC-8**.
* Notification data: with an overdue task, a booking conflict, and a pending approval present, the panel shows all three and each item opens its source screen, verifies **AC-5**.
* Auth and permission: a read only member sees no mutation controls and a direct attempt to call a mutation is rejected by the existing permission layer, verifies **AC-13**.
* Responsive: at 1280px the rail toggle collapses it to 56px and the content reflows, and at 768px the navigation opens as a drawer with visible scrollbars, verifies **AC-11**.

## Build plan

The projects scope uses Tracer Bullet delivery, so the first four tasks form one thin working path through navigation, data, mutation, and feedback. Later tasks thicken that path with the remaining screens and controls.

1. Add the DOM test environment, mount the toast viewer, and create the shared dialog, page state, and feedback components in `apps/projects/components/` using the front matter tokens and `lucide-react`, satisfies **AC-4**, **AC-8**, **AC-10**, **AC-12**.
2. Rework the shell chrome with two navigation groups, a bookings link, an active organization label, no Settings entry, and no dead controls, satisfies **AC-1**, **AC-6**.
3. Complete the task path across list, detail, and status change with loading, empty, API error, failed change rollback, and visible feedback, satisfies **AC-4**, **AC-7**, **AC-13**.
4. Add the `cmdk` palette with Command K and Control K, wire the C and P shortcuts, and block both while typing, satisfies **AC-2**, **AC-3**.
5. Add the notification panel sourced from the three existing hooks with loading, empty, error, and a link to each source, satisfies **AC-5**.
6. Redirect the duplicate routes to their main screens and add the project picker prompt on `/projects`, satisfies **AC-1**.
7. Group the task creation form into labelled sections and add field level validation feedback, satisfies **AC-9**.
8. Make the shell responsive with a collapsible desktop rail, a mobile drawer, and visible scrollbars, satisfies **AC-11**.
9. Write and run component tests for the first path and run the existing logic tests, satisfies **AC-12**.

## Consequences

**Positive**:

* People can tell whether an action worked and can recover when it did not.
* One set of dialog, feedback, and page state components removes repeated markup and inconsistent focus behavior.
* Navigation has one current home for each idea, and keyboard users get working shortcuts.
* The Beta verification tier has concrete acceptance criteria and component tests to check.

**Negative / tradeoffs**:

* Sidebar preferences move away from the current fixed 240px layout, so some muscle memory changes.
* Building notifications from existing data means no server side unread state, so counts are computed on the client.
* The workspace switch no longer offers switching from this app. That action stays in whichever app owns organization context.
* Mixed component patterns remain visible until every screen is migrated.

**Neutral**:

* No migration, environment variable, or API contract changes.
* New components stay local to `apps/projects` and can be promoted later.
* The design file still needs its prose palette aligned with its front matter for future readers.

## Follow-up

* [x] Enroll a feature row for this redesign in `docs/scope/projects.md` so the spec status follows the build lifecycle. The scope file is owned by `/scope`.
* [x] Replace the prose palette section in `apps/projects/DESIGN.md` with a pointer to its front matter token map so the two sources stop disagreeing.
* [ ] Update `apps/projects/docs/review/PROJECTS_APP_REVIEW.md`, which currently claims full passes and features that are not implemented.
* [ ] Promote the shared dialog, feedback, and page state components into `@repo/ui` once a second workspace needs them.
* [ ] After the build, run `/check verify` and save the steps to `verify.md`, then run `/test`, as required by the Beta tier in the projects scope.

## Migration plan

**Strategy**: strangler, with incremental screen cutover and no data migration.

**Phases**:

1. Add shared components and feedback beside the current screens, and prove the task path end to end.
2. Move the remaining shell controls and duplicate routes onto the new pattern.
3. Extend the shared components to the rest of the screens and remove the old markup.

Each phase ships as one commit that edits only its own files. Phases two and three switch screens onto the phase one components without changing those components, so reverting a later phase restores the prior screen.

**Rollback**: Revert the affected commit for any single phase. No data or API state changes, so a revert restores the previous behavior.

**Risks**: Bookmarks to the removed duplicate routes break by design, though redirects cover the main ones. Mixed markup during phase two can look inconsistent. Focus behavior can regress if a screen keeps its own modal. Client computed notification counts can differ from another app until that app has a shared feed.
