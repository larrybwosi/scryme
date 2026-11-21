# Contributing to Scryme

Thanks for contributing to Scryme. This guide covers local setup, development workflow, and expectations for changes in this monorepo.

## Prerequisites

- **Node.js** 24 or newer (see `packageManager` and `engines` in `package.json`)
- **pnpm** 10.34.1
- **Docker** and **Docker Compose** for local infrastructure
- **Rust toolchain** 1.77 or newer if you plan to build the Tauri desktop apps (`apps/pos`, `apps/bakery`)

## Repository structure

Scryme is a monorepo managed with pnpm workspaces and Turborepo.

- `apps/` contains applications such as `api`, `web`, `pos`, `bakery`, `crm`, and others.
- `packages/` contains shared packages such as `db`, `auth`, `shared`, `ui`, and `sdk`.
- `docs/specs/` contains product and implementation specs.
- `skills/` contains agent skills that guide common workflows such as scoping, architecture, development, testing, and audits.

See the root `AGENTS.md` and workspace level `AGENTS.md` files for workspace specific notes.

## Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/larrybwosi/scryme.git
   cd scryme
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

   The install step also builds `@repo/env` and runs code generation tasks as configured in the repository.

3. **Start local infrastructure**

   ```bash
   docker compose up -d
   ```

4. **Configure environment variables**

   Copy the example environment files you need for the apps or packages you are working on, then fill in the required values.

   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   ```

   Add or copy other `.env` files as needed for your workspace.

5. **Prepare the database** (when your work depends on it)

   ```bash
   pnpm run db:migrate:dev
   pnpm run db:seed
   ```

   If you change the Prisma schema, include the required migration files in `packages/db/prisma/migrations/`.

6. **Build all packages before starting the dev server**

   ```bash
   pnpm build
   ```

   Build all packages first so workspace dependencies and generated artifacts are up to date before development servers start.

7. **Start development servers**

   ```bash
   pnpm dev
   ```

   To work on a specific app, you can use a filtered command, for example:

   ```bash
   pnpm --filter web dev
   pnpm --filter api dev
   pnpm --filter pos dev
   ```

## Using AI coding agents

If you are using an AI coding agent in this repository, use the relevant skills in `skills/` for the task at hand and follow their instructions. For example, use `scope`, `architect`, `develop`, `test`, or `audit` when they match the work you are doing.

Agents and contributors should also read and follow the root `AGENTS.md`, any applicable workspace `AGENTS.md`, and relevant specs in `docs/specs/` before making changes.

## Development guidelines

- Follow the existing structure, naming, style, and patterns of the surrounding code.
- Keep TypeScript changes consistent with the repository conventions.
- Investigate unfamiliar files or changes before modifying or removing them.
- Update documentation when your changes affect setup, behavior, commands, or interfaces.
- Keep changes scoped and focused on the problem you are solving.

## Common commands

```bash
# Install dependencies
pnpm install

# Build all packages and apps
pnpm build

# Run development servers
pnpm dev

# Lint
pnpm lint

# Format
pnpm format

# Run tests
pnpm test

# Generate code artifacts
pnpm generate
```

## Before opening a pull request

- Ensure your branch is up to date with the target branch.
- Run the relevant checks for the areas you changed, such as build, lint, and tests.
- Include database migrations when schema changes require them.
- Describe what changed, why it changed, and how it was verified.
- Link related issues or specs when applicable.

## Continuous integration

Every pull request uses one shared pipeline. A small trigger file calls reusable workflows that derive affected workspaces from the Turbo graph, so no hand maintained path list decides what runs. The following checks are required before merge on pull requests targeting main, dev and nextgen.

| Check | What it covers | Local command |
|---|---|---|
| lint | Lint and type checks | `pnpm lint` and `pnpm type-check` |
| unit | Unit tests and coverage floors | `pnpm test` |
| integration | Migration compatibility and tests that need Postgres or Redis | `node scripts/ci/check-migrations.js HEAD~1` and `pnpm test:integration` |
| native checks | Gradle and Cargo tests | `./gradlew testDebugUnitTest` in `apps/android` and `cargo test` in each Tauri workspace |
| docs metadata | Links in changed docs and skill files | `node scripts/ci/check-docs.js HEAD~1` |
| verify build | Builds of affected workspaces | `pnpm build` |

Browser tests run on main, on release candidates and on version tags, not on pull requests. You can run them with `pnpm test:e2e`.

Coverage floors live in `coverage.config.json` in each workspace that has a `test` script. The unit check enforces each workspace floor and the changed line floor, then prints the result on the check summary. A flaky test goes into `.github/flaky-tests.yml` with a test id, an owner, an open issue and the date it was added. Quarantined tests are omitted from the required suite instead of being retried into a green result. Configuration for CI comes from `.env.ci.mock`, which contains mock values only. Pull requests never receive repository secrets.

Releases start from a Changesets version commit on main after CI passes. Main builds each image once into GHCR, records its digest and provenance, promotes those digests into staging, and then waits for a named production approver. A rollback redeploys the previous deployment report behind a health gate and records the rollback on the release notes. Release checks carry a release prefix so they never collide with the required pull request checks.

## Questions and issues

If you are reporting a bug or requesting a feature, open an issue with enough detail to reproduce the problem or understand the proposal, including affected apps or packages, steps to reproduce, and any relevant logs or screenshots.
