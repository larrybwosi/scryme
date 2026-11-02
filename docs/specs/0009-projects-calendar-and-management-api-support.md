# 0009. Projects App Calendar and Project Management Full API Support and Authorization

**Date**: 2026-11-02
**Status**: Proposed

## Summary

This architecture specification details the end-to-end API integration and authorization model for the Projects application's calendar and project management features. It establishes comprehensive Month, Week, and Day calendar perspectives powered by live task, milestone, and sprint API queries. It ensures robust authorization enforcement across all project management domains including the Projects Directory, Board/Kanban, Gantt, Global Tasks, and Time Tracking.

## Context

The Projects application (`apps/projects`) was styled with the Scryme Kinetic Precision theme, featuring comprehensive UI views for `/calendar`, `/projects`, `/board`, `/gantt`, `/tasks`, and `/time-tracking`. However, the `/calendar` page previously used static placeholders for Week and Day modes and static sample calendar entries, and various management actions lacked synchronized API mutations and strict role-based access checks.

To satisfy enterprise project execution requirements, the calendar must dynamically aggregate real backend entities (Tasks, Milestones, and Sprints) across all projects for an organization. Month, Week, and Day views must be fully interactive with date navigation, day inspection, and direct event creation. Concurrently, all operations across project management surfaces must enforce multi-tenant authorization using `tasks:read` for data fetching and `tasks:manage` for state mutations.

## Requirements

**User stories**:
- As a project manager or team lead, I want to see an interactive, unified Calendar across Month, Week, and Day views showing all tasks, milestones, and sprint releases so that I can monitor deadlines and schedules in real-time.
- As a team member, I want to create tasks or milestones directly from the Calendar or project views and have them instantly reflected in the backend API.
- As an organization administrator, I want all project, task, milestone, sprint, and time-tracking operations to be secured with multi-tenant isolation and role-based permissions (`tasks:read`, `tasks:manage`).

**Acceptance criteria**:
- **AC-1**: Implement fully interactive Month, Week, and Day timeline and agenda views on `/calendar` backed by live API hooks (`useTasks`, `useMilestones`, `useSprints`, `useProjects`).
- **AC-2**: Support date navigation (Prev, Next, Today, Month selection) and interactive day inspection displaying full event details with direct navigation to tasks/milestones.
- **AC-3**: Support modal-based task/milestone creation directly from `/calendar` with automatic optimistic cache invalidation.
- **AC-4**: Ensure all project management views (`/projects`, `/projects/[id]`, `/board`, `/gantt`, `/tasks`, `/time-tracking`) seamlessly consume live V3 NestJS API endpoints with proper loading and empty states.
- **AC-5**: Validate that all API endpoints enforce multi-tenant organization boundaries and correct RBAC permissions (`tasks:read` for reads, `tasks:manage` for creates/updates/deletes).
- **AC-6**: Provide unit and build test coverage verifying the calendar data transformations, authorization guards, and Next.js production compilation.

## Build plan

1. Author and verify architecture spec `0009-projects-calendar-and-management-api-support.md`.
2. Enhance `apps/projects/lib/api.ts` and `apps/projects/lib/hooks/use-projects.ts` to support multi-project milestones, sprints, and calendar event aggregation.
3. Update `apps/projects/app/calendar/page.tsx` with full Month, Week, and Day views, live date navigation, filtering, event inspection, and quick-create modal.
4. Verify and polish `/projects`, `/board`, `/gantt`, `/tasks`, and `/time-tracking` for full live API connectivity and error resilience.
5. Add unit tests for Calendar event mapping, date calculations, and V3 API task controller/use-case authorization.
6. Run pre-commit instructions, type checks, lint checks, and Next.js production builds.
