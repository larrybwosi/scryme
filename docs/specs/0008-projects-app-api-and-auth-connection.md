# 0008. Projects App API Connection and Better Auth Integration

**Date**: 2026-11-01
**Status**: Proposed

## Summary

The Projects application is connected to the centralized authentication application and the NestJS V3 backend API. Users authenticate through the unified Better Auth flow, supporting direct session cookie verification as well as redirection from the authentication gateway. The Projects application exchanges authenticated requests with the NestJS backend, resolving tenant context from the active session, while dedicated backend endpoints in the tasks module support projects, tasks, milestones, sprint cycles, and technical documents.

## Context

The Projects application in `apps/projects` was originally created with mock client side datasets and stubbed API methods. The user requires full feature connectivity between the Projects frontend, the unified Auth app (`apps/auth`), and the V3 NestJS API (`apps/api`). Multi tenancy must derive directly from the active organization session. Sprint cycles and project documentation must be backed by real database records and API endpoints in the tasks module, enabling complete live operations across all views.

## Requirements

**User stories**:
- As a project manager or team member, I want to log into the Projects application using the centralized Scryme authentication system so that my session is securely validated and linked to my active organization.
- As a team member, I want all my projects, tasks, sprints, milestones, time entries, and documents to load and persist through the V3 API so that updates reflect in real time.

**Acceptance criteria**:
- **AC-1**: Implement authentication protection in `apps/projects` using Next.js proxy middleware and client auth utilities, redirecting unauthenticated users to the Auth app with a return callback URL and verifying session cookies.
- **AC-2**: Support session termination and user profile display in `apps/projects` Header and Sidebar, showing the active organization name and member details.
- **AC-3**: Extend Prisma schema with dedicated models for `ProjectSprint` (cycles) and `ProjectDocument` (documentation and RFCs) with complete multi tenant relationships.
- **AC-4**: Implement V3 NestJS controller endpoints, DTOs, and use case methods in `apps/api/src/v3/modules/tasks` for project sprints and project documents, secured with `V3AuthGuard` and permissions.
- **AC-5**: Connect `apps/projects/lib/api.ts` and React Query hooks in `apps/projects/lib/hooks/use-projects.ts` to live V3 API endpoints with credentials and tenant context headers.
- **AC-6**: Wire all Projects views (Projects list & detail, Tasks list & detail, Kanban Board, Sprints/Cycles tab, Documents tab, Milestones tab, Time tracking, Team tab) to live backend data while retaining resilient optimistic cache updates.

## Build plan

1. Add `ProjectSprint` and `ProjectDocument` models to `packages/db/prisma/schema/tasks.prisma` and corresponding relations in `organization.prisma`, run `pnpm --filter @repo/db generate` and `pnpm --filter @repo/db build`, satisfies **AC-3**.
2. Add sprint and document DTOs, use cases, and controller routes to `apps/api/src/v3/modules/tasks`, satisfies **AC-4**.
3. Implement `apps/projects/proxy.ts`, `apps/projects/lib/auth-client.ts`, and `apps/projects/app/api/auth/[...all]/route.ts` for unified Better Auth session handling, satisfies **AC-1**, **AC-2**.
4. Update `apps/projects/lib/api.ts` and `apps/projects/lib/hooks/use-projects.ts` to call real endpoints, satisfies **AC-5**.
5. Connect all views and tabs (`ProjectsPage`, `TasksPage`, `BoardPage`, `OverviewTab`, `IssuesTab`, `CyclesTab`, `DocsTab`, `MilestonesTab`, `TeamTab`, `TimeTrackingPage`) to live hooks, satisfies **AC-6**.
6. Verify unit tests and production builds across `apps/api` and `apps/projects`.
