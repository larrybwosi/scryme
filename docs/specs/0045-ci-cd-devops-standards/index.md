# 0045. CI CD and DevOps Standard

**Date**: 2026-11-19
**Status**: Accepted

## Summary

This umbrella defines how Scryme tests, builds, and releases every workspace. It replaces hand built workflow logic with reusable workflows, one build per release, and a single promotion path from commit to production. The four child specs cover the pipeline itself, testing rules, build and cache rules, and release gating. Together they make merge checks predictable and every release traceable from its source commit to the exact bytes that were promoted.

## Structure

- [0045.1 Pipeline and Quality Gates](0045-pipeline-and-quality-gates.md): owns triggers, change detection, required checks, job limits, and pull request secret boundaries.
- [0045.2 Test Strategy and Coverage](0045-test-strategy-and-coverage.md): owns test layers, where each runs, coverage floors, and flake quarantine.
- [0045.3 Build, Cache and Artifacts](0045-build-cache-and-artifacts.md): owns canonical commands, cache keys, image and native bundle builds, registries, and provenance.
- [0045.4 Release, Environments and Rollback](0045-release-environments-and-rollback.md): owns the Changesets trigger, staging and production promotion, approvals, health gate, and rollback.

## Decision

Adopt reusable workflows as the single source of truth, driven by thin trigger files, with path filters plus the Turbo affected graph deciding what runs. Every pull request must pass lint, unit, affected integration, and affected build checks before merge. Main builds each artifact once, stores it in GHCR for images or Actions artifacts for native bundles, attaches provenance, and promotes that same artifact through staging and production.

**Chosen option**: Create one umbrella standard with four child specs, enforced by branch protection and rollout in a single migration pull request. This keeps one decision per child while giving the whole pipeline one contract.

## Standard definition

**Canonical pattern**:

```yaml
name: pull request
on:
  pull_request:
    branches: [main, dev, nextgen]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  affected:
    uses: ./.github/workflows/affected.yml

  checks:
    needs: affected
    uses: ./.github/workflows/checks.yml
    with:
      workspaces: ${{ needs.affected.outputs.workspaces }}
    # no secrets are passed on pull request events

  verify build:
    needs: [affected, checks]
    uses: ./.github/workflows/build.yml
    with:
      workspaces: ${{ needs.affected.outputs.workspaces }}
      mode: verify
```

The reusable workflows own the real steps. Trigger files only declare the event, the inputs, and the job names that branch protection watches. Job names are unique across workflows so a status check never points at two jobs.

**Replaces**:

- One large `test.yml` with a hand maintained path map and repeated shell conditionals.
- Release jobs that rebuild deliverables for each target and trust `latest` tags.
- Workspace script drift such as `type-check` beside `typecheck`, and `test` beside `test:frontend`.
- Publish credentials available to every job, and publishing that is not gated on CI success.

**Enforcement**:

GitHub branch protection requires the checks named in child 0045.1. Reusable workflow inputs are the only supported way to add a workspace. A pull request that edits workflow files must keep the required check names unchanged, or update branch protection in the same change. GitHub native checks and notifications are the only alerting surface for this standard.

**Rollout**:

One migration pull request replaces the current trigger files with thin callers and moves the existing jobs into reusable workflows. New pull requests use the standard immediately after that pull request merges. Existing suites are mapped to the new layer names in the same pull request.

**Exceptions**:

Changes limited to `docs/` or `skills/` skip code checks and require a docs metadata check only. Every other change follows the full standard. Adding a new integration or a new credential requires a child spec update first.

## Cross child contract

| ID | Invariant | Owner |
|---|---|---|
| INV-1 | Every pull request passes lint, unit, affected integration, and affected build checks before merge | 0045.1 |
| INV-2 | A change to any app or package is detected without a manual list edit | 0045.1 |
| INV-3 | Pull request jobs receive no repository secrets, including from forks | 0045.1 |
| INV-4 | Every workspace declares one canonical command per layer, and CI calls those commands | 0045.2, 0045.3 |
| INV-5 | Coverage uses a per workspace floor plus changed code coverage | 0045.2 |
| INV-6 | A flaky test is quarantined with a named owner and an open issue, never rerun as a green result | 0045.2 |
| INV-7 | Main builds each deliverable once, then promotes that artifact by digest | 0045.3, 0045.4 |
| INV-8 | Images go to GHCR and native bundles go to Actions artifacts, each with a provenance record | 0045.3 |
| INV-9 | Turbo, Gradle, and Rust cache keys combine lockfile hash, operating system, and task name with restore keys, and pnpm uses the setup node lockfile cache | 0045.3 |
| INV-10 | Releases start from Changesets on main and only after CI success | 0045.4 |
| INV-11 | Staging is automatic on main and production requires a named approver | 0045.4 |
| INV-12 | A bad production release is rolled back by redeploying the previous digest behind a health gate | 0045.4 |
| INV-13 | Configuration comes from `.env.example` plus `.env.ci.mock`, with no real secrets in pull requests | 0045.1, 0045.4 |
| INV-14 | Database migrations stay backward compatible for one release so an application rollback remains safe | 0045.4 |

Every child spec must preserve these invariants. A child may add detail, but may not weaken an invariant without updating this umbrella and the branch protection configuration together.

## Consequences

**Positive**:

- A green pull request is a trustworthy signal because the same required checks run for every change.
- Releases are traceable from version and commit to the verified artifact digest and the approver.
- Feedback stays inside a time budget because caches are stable and slow suites move to main, `rc/*` branches, and `v*` tags.
- Adding a workspace is an input change to a reusable workflow, not a copy of a long job block.

**Negative / tradeoffs**:

- Repository secrets remain available to publish jobs, with the accepted risk that any publish job can read them. Fork pull requests receive none.
- E2E failures are found on main or a release candidate, not before merge.
- Reusable workflows add a layer of indirection, so a reader must open the called workflow to see the real steps.
- Provenance and digest promotion add steps to every release and require registry support.

**Neutral**:

- The existing Changesets flow, GHCR registry, and Tauri and Gradle toolchains are kept.
- Hosting provider choice, store publishing, and local developer scripts stay outside this standard.

## Follow-up

- [ ] Confirm whether a repository wide scope file should be created to track the migration pull request. The scope folder is owned by `/scope`, so this standard does not create one.
- [ ] Review the migration failure handling in `deploy.sh` in a separate deployment standard. It currently continues on customer database migration failure. The managed deploy path uses `deploy.yml` and is not affected by this follow up.

## Rationale

Reasoning, sampled current state, options, and verified references: see [rationale.md](rationale.md).
