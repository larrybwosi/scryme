# Projects App TanStack Query Local First Integration

**Status**: Proposed

## Summary

You are updating the projects application to use TanStack Query for data fetching and local persistence. This change connects the frontend directly to the NestJS V3 API while keeping local mock data as a resilient fallback when network calls fail or when offline. Local storage persistence keeps cached project data available immediately on reload.

## Context

The projects app currently uses basic React hooks with manual fetch calls inside `useEffect`. When network requests fail, the existing API client catches errors and returns static fallback data, but state updates do not persist across reloads or sync reliably across components. Migrating to TanStack Query v5 gives you automatic background refetching, query caching, optimistic UI updates, and offline persistence.

## Requirements

- **AC-1**: Configure TanStack Query client with local storage persistence in `apps/projects`.
- **AC-2**: Provide custom React hooks for projects, tasks, milestones, time entries, and organization members in `apps/projects/lib/hooks/use-projects.ts`.
- **AC-3**: Support optimistic cache updates for task status changes and time entry creation.
- **AC-4**: Seamlessly fall back to mock project data when offline or when the NestJS V3 API is unreachable.
- **AC-5**: Refactor all pages (`/`, `/tasks`, `/gantt`, `/milestones`, `/new`, `/team`) to consume custom query and mutation hooks.

## Options considered

### Option 1: SWR with custom local storage provider
SWR provides lightweight data fetching. However, complex optimistic mutations and custom offline persisters require more boilerplate compared to TanStack Query v5.

### Option 2: TanStack Query v5 with `@tanstack/react-query-persist-client` (Chosen)
TanStack Query v5 offers robust query management, mutation side effects, optimistic updates, and built-in local persistence utilities (`@tanstack/query-sync-storage-persister`).

## Decision

Adopt TanStack Query v5 with `@tanstack/react-query-persist-client` for `apps/projects`. Wrap the app in a client side `QueryProvider` with `localStoragePersister`. Expose custom hooks for all entity operations and update all views to use these hooks.

## Build plan

1. Add TanStack Query packages to `apps/projects/package.json`, satisfies **AC-1**
2. Create `QueryProvider.tsx` with local storage persistence and wrap `layout.tsx`, satisfies **AC-1**
3. Implement custom query and mutation hooks in `apps/projects/lib/hooks/use-projects.ts`, satisfies **AC-2**, **AC-3**, **AC-4**
4. Refactor dashboard, tasks, gantt, milestones, new project, and team pages to use custom hooks, satisfies **AC-5**

## Consequences

**Positive**:
- Instant loading state from persisted local cache on application startup
- Automatic background revalidation when network is available
- Optimistic updates for snappy UI feedback on Kanban board drag and drop and status updates

**Negative / tradeoffs**:
- Slightly larger bundle size due to TanStack Query runtime packages

**Neutral**:
- Local storage cache key `SCRYME_PROJECTS_QUERY_CACHE` is used for client side persistence
