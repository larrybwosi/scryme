# 0045.1 Pipeline and Quality Gates

**Date**: 2026-11-19

## Summary

This child defines one pipeline shape for every trigger in the repo. Thin workflow files call reusable workflows that own the real steps, and the Turbo affected graph plus `.github/affected-paths.yml` decide what runs. Branch protection watches unique check names, so a pull request cannot merge with a red gate.

## Decision

Use `workflow_call` reusable workflows for affected detection, checks, and build verification. Pull request triggers pass inputs only and pass no secrets. Main and release triggers may pass repository secrets to publish jobs only, never to pull request jobs. Job names are unique, and every job declares a timeout. Concurrency cancels an older pull request run, but never cancels a run on main.

## Standard definition

**Canonical pattern**:

```yaml
name: affected
on:
  workflow_call:
    outputs:
      workspaces:
        description: Changed workspaces plus their dependants
        value: ${{ jobs.affected.outputs.workspaces }}

jobs:
  affected:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      workspaces: ${{ steps.graph.outputs.workspaces }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          filter: blob:none
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - id: graph
        run: |
          pnpm turbo query affected --output=json > affected.json
          echo "workspaces=$(jq -c '.' affected.json)" >> "$GITHUB_OUTPUT"
```

The `workspaces` output is the full Turbo query result. Each called workflow parses it to get the workspace names it needs. `.github/affected-paths.yml` holds the paths that Turbo cannot derive, covering `apps/android`, `apps/pos/src-tauri`, `apps/bakery/src-tauri`, `docs/`, and `skills/`.

Timeout contract: affected 5 minutes, docs metadata 5 minutes, lint 10 minutes, unit 10 minutes, native checks 20 minutes, integration 20 minutes, verify build 20 minutes, publish 30 minutes, deploy 20 minutes, health 20 minutes. Native Rust compilation from a cold cache needs the longer native checks limit.

The trigger file declares `on: pull_request`, a concurrency group with `cancel-in-progress: true`, `permissions: contents: read`, and calls to `affected.yml`, `checks.yml`, and `build.yml`. The `checks.yml` workflow owns jobs named `lint`, `unit`, `integration`, and `native checks`. The `build.yml` workflow owns a job named `verify build` for pull requests and a main only job named `test e2e`. These are the status checks. All except `test e2e` are required before merge. A job that does not apply reports success with a clear reason, never a skipped check that leaves the gate ambiguous.

**Replaces**:

- A single 568 line `test.yml` with a hand maintained `filter` job and duplicated shell conditionals.
- A `validation-needed` job that decides whether any later job runs.
- Per workspace `if` blocks inside lint, test, and build jobs.
- Pass through of build secrets to jobs that only run tests.

**Enforcement**:

Branch protection requires `lint`, `unit`, `integration`, `native checks`, `docs metadata`, and `verify build` on pull requests targeting `main`, `dev`, and `nextgen`. `docs metadata` is a job in `checks.yml` that validates front matter and internal links under `docs/` and `skills/`, and reports success when no such files changed. A workflow pull request that renames a required job must update branch protection in the same change. The affected workflow uses a full history checkout because Turbo affected detection needs the base ref (basis: [Constructing CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)). Repository secrets are available to publish jobs, but a pull request event never passes them. Low trust means a pull request from a fork, which receives read only caches and no secrets.

**Rollout**:

One migration pull request moves current jobs into reusable workflows and replaces the trigger files. Branch protection is updated after that pull request merges and before the old required checks are removed.

**Exceptions**:

Docs and spec only changes skip code jobs and require a `docs metadata` check. A new workspace needs a child spec update and an affected graph entry before its checks become required.

## Consequences

**Positive**:

- One edit to a reusable workflow updates every caller.
- Missing an affected workspace becomes a graph problem, not a forgotten YAML line.
- Required check names are explicit and easy to audit in branch protection.

**Negative / tradeoffs**:

- A bad input to a reusable workflow breaks all callers at once.
- Readers must follow workflow calls to find the real steps.
- The full history checkout adds a little time to every affected job.

## Rationale

The current filter map and shell conditionals are the main source of silent skips, so the gate must be derived from the workspace graph. Reusable workflows are the supported sharing mechanism (basis: [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)), and required status checks only protect merge when their names are unique and stable (basis: [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). Per job timeouts and pull request only cancellation follow the agreed limit rule and keep a main publish from being interrupted.
