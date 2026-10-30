# config-prettier

## Overview

Package workspace for config-prettier.

## Key files

| File | Owns |
|---|---|
| package.json | Workspace configuration and scripts |

## Commands

```bash
# Dev
pnpm --filter @repo/prettier-config dev

# Build
pnpm --filter @repo/prettier-config build
```

## Conventions

- Monorepo package/application scoped strictly under `packages/config-prettier`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
