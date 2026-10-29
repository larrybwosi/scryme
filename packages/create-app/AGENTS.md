# create-app

## Overview

CLI to bootstrap a Scryme-powered Next.js application

## Key files

| File | Owns |
|---|---|
| package.json | Workspace configuration and scripts |

## Commands

```bash
# Dev
pnpm --filter create-scryme-app dev

# Build
pnpm --filter create-scryme-app build
```

## Conventions

- Monorepo package/application scoped strictly under `packages/create-app`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
