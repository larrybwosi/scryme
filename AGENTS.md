# scryme

## Stack

- **Language / Runtime**: TypeScript / Node.js (>=24)
- **Framework**: NestJS (v3 API), Next.js / TanStack Start, React 19, Tailwind CSS
- **Key dependencies**: Prisma, Better-Auth, Turbo, RxJS, Socket.io
- **Package manager**: pnpm (v10.34.1)

## Build approach

Skateboard

## Commands

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

- [0001-android-location-pinning-and-check-in-verification.md](docs/specs/0001-android-location-pinning-and-check-in-verification.md): Android location pinning and check in verification

## Rules

- Monorepo structure managed by Turbo and pnpm workspaces.
- Strict TypeScript configurations with output style avoiding hyphens/dashes in documentation text.
- Database changes must strictly include migrations in `packages/db/prisma/migrations/`.
- Pre-commit instructions and guidelines must be strictly followed before submission.

## Context files

- [apps/admin/AGENTS.md](apps/admin/AGENTS.md): App workspace for admin.
- [apps/android/AGENTS.md](apps/android/AGENTS.md): App workspace for android.
- [apps/api/AGENTS.md](apps/api/AGENTS.md): App workspace for api.
- [apps/auth/AGENTS.md](apps/auth/AGENTS.md): App workspace for auth.
- [apps/bakery/AGENTS.md](apps/bakery/AGENTS.md): App workspace for bakery.
- [apps/cms/AGENTS.md](apps/cms/AGENTS.md): App workspace for cms.
- [apps/crm/AGENTS.md](apps/crm/AGENTS.md): App workspace for crm.
- [apps/docs/AGENTS.md](apps/docs/AGENTS.md): App workspace for docs.
- [apps/pos/AGENTS.md](apps/pos/AGENTS.md): App workspace for pos.
- [apps/site-next/AGENTS.md](apps/site-next/AGENTS.md): App workspace for site-next.
- [apps/web/AGENTS.md](apps/web/AGENTS.md): App workspace for web.
- [packages/auth/AGENTS.md](packages/auth/AGENTS.md): Package workspace for auth.
- [packages/chat/AGENTS.md](packages/chat/AGENTS.md): Package workspace for chat.
- [packages/config-eslint/AGENTS.md](packages/config-eslint/AGENTS.md): Package workspace for config-eslint.
- [packages/config-prettier/AGENTS.md](packages/config-prettier/AGENTS.md): Package workspace for config-prettier.
- [packages/config-typescript/AGENTS.md](packages/config-typescript/AGENTS.md): Package workspace for config-typescript.
- [packages/create-app/AGENTS.md](packages/create-app/AGENTS.md): CLI to bootstrap a Scryme-powered Next.js application
- [packages/db/AGENTS.md](packages/db/AGENTS.md): Package workspace for db.
- [packages/documents/AGENTS.md](packages/documents/AGENTS.md): Package workspace for documents.
- [packages/env/AGENTS.md](packages/env/AGENTS.md): Package workspace for env.
- [packages/mcp-server/AGENTS.md](packages/mcp-server/AGENTS.md): Package workspace for mcp-server.
- [packages/sdk/AGENTS.md](packages/sdk/AGENTS.md): Package workspace for sdk.
- [packages/shared/AGENTS.md](packages/shared/AGENTS.md): Package workspace for shared.
- [packages/ui/AGENTS.md](packages/ui/AGENTS.md): Package workspace for ui.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
