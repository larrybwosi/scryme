# 0045.2 Test Strategy and Coverage

**Date**: 2026-11-19

## Summary

This child defines which test layers run where and what a passing test gate means. Fast checks run on every pull request, stateful checks run on affected pull requests, and browser tests run on main, `rc/*` branches, and `v*` tags. Coverage is measured per workspace and on changed code, and a flaky test is fixed or quarantined rather than retried into a green result.

## Decision

Run lint and unit tests on every pull request. Run integration tests that need Postgres, Redis, or other services only when the affected graph includes their workspace. Run Playwright end to end tests on main, on `rc/*` branches, and on `v*` tags, not as a pull request gate. The main end to end run is part of the CI success signal used by release gating. Each workspace declares a coverage floor and a changed code coverage rule. A flaky test is removed from the required suite, given a named owner and an open issue, then restored when fixed.

## Standard definition

**Canonical pattern**:

| Layer | Command contract | Runs on | Required check |
|---|---|---|---|
| Lint and format | `pnpm lint` | every pull request | `lint` |
| Type check | `pnpm type-check` | every pull request | `lint` |
| Unit | `pnpm test` | every pull request | `unit` |
| Integration with services | `pnpm test:integration` | affected pull requests and main | `integration` |
| Native Rust and Gradle | `cargo test`, `./gradlew testDebugUnitTest` | affected pull requests | `native checks` |
| Browser end to end | `pnpm test:e2e` | main, `rc/*` branches, and `v*` tags | main branch gate |

Workspaces that currently expose `typecheck`, `lint:frontend`, `test:frontend`, or `test:v3:run` add the canonical names as aliases in the migration pull request. Existing names may remain for local convenience. CI calls only the canonical names through root scripts and Turbo filters. A workspace missing a canonical command fails the affected check with a clear message instead of reporting no tests.

Coverage rules:

- Each workspace checks in `coverage.config.json` with numeric `line`, `branch`, and `changedLine` floors. The floors are set by that workspace and CI fails when the file is missing.
- Coverage comes from the existing `@vitest/coverage-v8` providers. Native workspaces report coverage from their own tools under `native checks`.
- Changed code coverage is measured against `github.event.pull_request.base.sha` on pull requests and `github.event.before` on pushes.
- The coverage summary is written to `$GITHUB_STEP_SUMMARY` by the `unit` job, so a reviewer sees it on the check without opening logs.

Flake rules:

- A failing test is never rerun automatically as a green result.
- A flaky test is moved to `.github/flaky-tests.yml` with fields `testId`, `owner`, `issueUrl`, and `addedOn`. The owner is the GitHub username of the engineer who quarantines it, and that engineer opens the issue.
- A quarantined test does not count toward the required suite, and the `unit` check reports the quarantine count in the job summary.
- A fix restores the test to the required suite in the same pull request that closes its issue.
- Playwright uses 2 workers in CI. Sharding is added only when a measured run exceeds the 20 minute verify build limit.

**Replaces**:

- Mixed script names across `apps/api` and `apps/pos`, and a root `AGENTS.md` that documents `pnpm test` while the root script is absent.
- `test.yml` running POS Playwright tests only, with no rule for other browser surfaces.
- `--passWithNoTests` style silent success being treated as a meaningful test gate.
- Hidden retries that turn a flaky test into a passing build.

**Enforcement**:

Branch protection requires `lint`, `unit`, `integration`, and `native checks` as defined in 0045.1. A CI validation step fails when a workspace in the affected set lacks a canonical command or coverage config. The quarantine manifest is checked in and reviewed like code. Playwright CI setup follows the documented pattern of installing browser dependencies and keeping workers low or sharding in CI (basis: [Continuous Integration](https://playwright.dev/docs/ci)).

**Rollout**:

New pull requests use the layer map immediately after the migration pull request merges. Existing suites keep their code and are mapped to canonical names through aliases. Any suite that cannot meet its coverage floor is recorded as debt in the quarantine or coverage follow up, not silently exempted.

**Exceptions**:

Docs and spec only changes skip all test jobs. Android and Rust tests use native commands, but must report under `native checks` with the same owner and quarantine rules.

## Consequences

**Positive**:

- A merge gate reflects real test intent, not a command name that happens to exist.
- Slow browser suites no longer delay every pull request.
- Flaky tests become visible work with an owner instead of noise.

**Negative / tradeoffs**:

- Browser regressions are found after merge, when main is already affected.
- Every workspace must maintain a coverage config and canonical command aliases.
- Quarantine reduces gate coverage until the owner fixes the test.

## Rationale

The repo already has the right tools, Vitest, Playwright, Cargo, and Gradle, but no shared rule for when each runs. Keeping fast checks universal and moving slow stateful suites to main, `rc/*` branches, and `v*` tags preserves the feedback goal from Stage 1 while still catching browser failures before release. Per workspace coverage floors avoid a single global number that legacy areas can distort. Quarantine with an owner is the only flake policy that keeps required checks honest, which is what branch protection depends on (basis: [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).
