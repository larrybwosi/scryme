# projects

## Overview

App workspace for projects. Provides dedicated project management, task tracking, scheduling, milestones, member assignments, and time tracking.

## Key files

| File | Owns |
|---|---|
| package.json | Workspace configuration and scripts |
| app/ | Next.js application routes and views |
| lib/api.ts | V3 API client with auth and tenant context |
| lib/hooks/use-projects.ts | TanStack Query data fetching and mutation hooks |
| lib/realtime-provider.tsx | Socket.io real-time updates and cache invalidation |

## Commands

```bash
# Dev
pnpm --filter projects dev

# Build
pnpm --filter projects build

# Test
pnpm --filter projects test
```

## Conventions

- Monorepo package/application scoped strictly under `apps/projects`.
- Multi tenant headers and auth tokens derived from active BetterAuth sessions.
- Real time synchronization through Socket.io V3 namespace.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
