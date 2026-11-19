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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
