# Verify: Enterprise Time Tracking, Scheduling, Tasks and Operations · spec 0042 · updated 2026-11-18

_Steps derived from spec 0042. The spec has no numbered acceptance criteria, so each step is tagged to one of the four pillars and a build plan item. `/check verify` runs these, and `/test` locks the durable ones._

## UI / manual

- [ ] Start a timer on `/time-tracking`, stop it, and confirm the logged row shows duration, category, and billable state → Pillar 1, Build Plan 3
- [ ] Start a timer, reload the page after a delay, and confirm elapsed time reflects wall clock time → Pillar 1, Build Plan 3
- [ ] Submit and process a reviewed week, then confirm its entries are locked → Pillar 1, Build Plan 2
- [ ] Open an adjacent week and confirm its entries remain editable → Pillar 1, Build Plan 2
- [ ] Create two overlapping shifts for the same staff member on the same day, then confirm conflict blocking → Pillar 2, Build Plan 3
- [ ] Assign work that pushes a cluster above weekly capacity, then confirm the capacity warning appears → Pillar 2, Build Plan 3
- [ ] Request and approve a shift trade between colleagues, then confirm both schedules update → Pillar 2, Build Plan 3
- [ ] Add subtasks to a parent task, complete one subtask, and confirm the parent progress rollup updates → Pillar 3, Build Plan 3
- [ ] Assign one task to several people, override capacity, and confirm all assignees persist → Pillar 3, Build Plan 3
- [ ] Log actual time above estimate, then confirm estimate variance shows the difference → Pillar 3, Build Plan 3
- [ ] Link a service booking and a production batch to tasks, then confirm both appear in the operational view → Pillar 4, Build Plan 3
- [ ] Try to commit workload that exceeds available capacity, then confirm the guard blocks it → Pillar 4, Build Plan 3

## Commands

- [ ] `pnpm --filter projects test` → all 60 tests pass → Build Plan 4
- [ ] `pnpm --filter api exec vitest run src/v3/modules/tasks/application/use-cases/task.use-case.spec.ts` → all 12 tests pass → Build Plan 4
- [ ] `pnpm --filter projects lint` → no warnings → Build Plan 3
- [ ] `pnpm --filter projects type-check` → no type errors → Build Plan 3
- [ ] `pnpm --filter projects build` → production build completes → Build Plan 3 and Build Plan 4

## Acceptance-criteria coverage

- Pillar 1, robust time tracking and timesheet locking, covered by the first four manual steps and both test commands.
- Pillar 2, intelligent scheduling and shift conflict engine, covered by the next three manual steps and both test commands.
- Pillar 3, task management and operational linkages, covered by the next three manual steps and both test commands.
- Pillar 4, operations capacity guarding, covered by the last two manual steps and both test commands.
- Build Plan 1 and Build Plan 2 covered by the scope and spec updates plus the reviewed week locking checks.
- Build Plan 3 and Build Plan 4 covered by the manual steps, test commands, lint, type check, and production build.

## Environment note

The final type check and production build were blocked by memory in this run. Leave their command steps unticked until they pass in an environment with enough memory.
