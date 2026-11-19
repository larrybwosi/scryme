# 0045. CI CD and DevOps Standard Rationale

**Date**: 2026-11-19

## Context

Scryme is a pnpm and Turbo monorepo with web apps, a NestJS API, Tauri desktop apps, an Android app, Rust code, and container images. Today the pipeline is defined by two long workflow files that have grown by adding special cases. `.github/workflows/test.yml` carries a hand maintained path map, a separate validation job, and repeated shell conditionals that decide which workspace to check. `.github/workflows/release.yml` owns version bumps, package publishing, four POS variants, bakery, Android, Rust, and image builds in one job graph.

This shape creates three concrete problems. First, a missing path filter entry or a mistyped package name silently skips work, because the filters are a manual map rather than a derived graph. Second, the same idea has several names across workspaces, so quality gates are uneven and a local green command does not always match CI. Third, release jobs rebuild deliverables per target, publish with `continue-on-error`, and create the tag after publishing, so a failed step can still produce a release that is hard to trace back to verified bytes.

There is also a trust boundary problem. Publish credentials live as repository secrets and are read by many jobs. They must never reach pull request code from a fork, yet the current workflow files do not state that rule in one place. The team chose to keep repository secrets for publish jobs but exclude fork pull requests, accepting the narrower risk in exchange for keeping the current secret model.

No scope row links this standard. It is a standalone decision, so its status moves from `Proposed` to `Accepted` on confirmation rather than through a build phase.

## Current state sample

The sample below is evidence, not a full audit. It shows the competing patterns that shaped the standard.

- `.github/workflows/test.yml`: `filter` job with explicit filters for every app and package, followed by shell `if` blocks that repeat the same conditions in `lint-typecheck`, `frontend-tests`, and `build-verify`.
- `.github/workflows/release.yml`: `pnpm/action-setup@v3` with pnpm 9, `pnpm install --no-frozen-lockfile`, `continue-on-error: true` on publish steps, and a `create-tag` job that runs last.
- `package.json`: pins `pnpm@10.34.1` and Node 24, but has no root `test` script even though `AGENTS.md` documents `pnpm test`.
- `turbo.json`: defines `lint`, `type-check`, and `test` tasks, with cache settings for `generate` but no cross run cache service.
- `apps/api/package.json`: uses `type-check`, `lint`, `test`, and `test:cov` with Vitest.
- `apps/pos/package.json`: uses `typecheck`, `lint:frontend`, `test:frontend`, `test:backend`, and `test:e2e` with Oxlint, Cargo, and Playwright.
- `docker-bake.hcl`: tags every image with both `latest` and a version variable, with no digest output or attestation step.
- `deploy.sh`: pulls `latest` images, continues on customer database migration failure, and starts all services from a local compose file.

Closest to correct is the Turbo task graph in `turbo.json`, because it derives dependencies from the workspace graph rather than a hand maintained list. The standard extends that idea to the workflow layer and keeps native toolchains behind the same gate names.

## Options considered

### Option 1: Document the standard and enforce it with branch protection and reusable workflows

Write one umbrella with four children, move jobs into reusable workflows, and make the required check names a branch protection contract. Existing app code stays where it is.

**Pros**:
- Strongest feasible automation without a new vendor or a new credential.
- One edit changes every caller, so drift is caught in review.
- Required checks give a direct, testable signal before merge.

**Cons**:
- Needs a coordinated workflow migration pull request.
- A wrong reusable workflow input can break every caller at once.
- Branch protection must be updated in step with check name changes.

### Option 2: Single migration pull request that also renames workspace scripts

Adopt the reusable workflow standard and rename all divergent workspace scripts to one set of names in the same pull request.

**Pros**:
- Removes script drift permanently in one pass.
- Local and CI commands become identical across every workspace.

**Cons**:
- Large blast radius across many package files and developer habits.
- Native tools such as Gradle and Cargo still need wrapper scripts, so perfect uniformity is not achievable.
- Harder to review and roll back than workflow changes alone.

### Option 3: Document only, rely on review

Write the standard and leave existing workflows and scripts in place, trusting reviewers to apply the rules.

**Pros**:
- No workflow rewrite and no immediate branch protection change.
- Cheapest option today.

**Cons**:
- No automated enforcement, so the inconsistency will return.
- Fork pull request secret boundaries remain implicit.
- Traceability and promotion rules cannot be verified by a check.

## Rationale

Option 1 fits the forces in Context. The current failure mode is duplicated hand maintained logic, so the fix must remove duplication and make the gate machine checkable. Reusable workflows are the supported GitHub mechanism for sharing jobs across callers (basis: [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)). Required status checks stop a pull request from merging when a gate is red, and unique job names prevent an ambiguous check from satisfying the rule (basis: [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).

Option 2 was rejected for the migration because of its blast radius. The standard still requires canonical commands, but child 0045.3 adds aliases and the root `test` script in the migration pull request rather than renaming every local script. This keeps rollout reviewable. Option 3 was rejected because the team picked required checks as the main success signal, which only works when enforcement is automatic.

The build and promotion choices follow from the traceability guarantee. Building once and promoting by digest is the practical way to prove that staging and production run the tested bytes, and GitHub documents provenance attestations with a digest from the image build step (basis: [Using artifact attestations to establish provenance for builds](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds)). Docker build push supports digest output, cache import and export, and provenance and SBOM generation in the same step (basis: [docker/build-push-action](https://github.com/docker/build-push-action)). The existing GHCR targets in `docker-bake.hcl` make that registry the low friction choice.

The engineer chose repository secrets for every job. That was challenged directly because it exposes publish credentials to ordinary checks. The confirmed position is narrower: keep repository secrets for publish jobs, but never expose them to forked pull requests. This is a deliberate tradeoff. OIDC with short lived tokens is the stronger option and is documented for GitHub Actions deployments (basis: [OpenID Connect](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)), but adopting it now would add provider setup that is outside this standard. The choice is recorded as a negative consequence, not hidden.

Cache and feedback choices follow from the fast feedback guarantee. `actions/cache` keys with restore keys and tool setup caching are the native path, with low trust triggers treated as read only by default in current guidance (basis: [Dependency caching reference](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows)). Turbo's CI guidance supports affected detection from the base ref and calls out a full history checkout, which the affected workflow must use (basis: [Constructing CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci)). Playwright's CI guidance recommends installing browser dependencies and keeping workers low or sharding in CI, which fits the decision to run E2E outside the pull request gate (basis: [Continuous Integration](https://playwright.dev/docs/ci)).

Changesets already expresses release intent in this repo. Its model is that contributors declare changes and the tool owns version and publish steps (basis: [changesets/changesets](https://github.com/changesets/changesets)). Keeping it and adding a CI success gate is smaller than replacing the release trigger. The simpler gate shape was adopted: the CI success job depends on the existing check names, and GitHub Environment reviewers provide production approval, so no separate approval service is added.

## Landscape scan

The links below were verified once during design. No later step fetches them again.

- Reusable workflow calls and `secrets` passing: [Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
- Required checks and unique job names: [About protected branches](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
- Cache keys, restore keys, and low trust cache writes: [Dependency caching reference](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows).
- Short lived deployment credentials: [OpenID Connect](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect).
- Affected detection and checkout depth: [Constructing CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci).
- Image digest, cache, provenance, and SBOM outputs: [docker/build-push-action](https://github.com/docker/build-push-action).
- Declared changes with version and publish steps: [changesets/changesets](https://github.com/changesets/changesets).
- Browser setup and CI workers: [Continuous Integration](https://playwright.dev/docs/ci).
- Attestation creation and verification: [Using artifact attestations to establish provenance for builds](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds).

## References

**Project sources** (verifiable, in this repo):

- `AGENTS.md`, Node 24, pnpm workspaces, and the Skateboard build approach.
- `.github/workflows/test.yml`, the current path filter and duplicated shell conditionals.
- `.github/workflows/release.yml`, the current Changesets release and publish graph.
- `turbo.json`, the task graph and cache settings.
- `package.json`, the pinned pnpm version and missing root test script.
- `docker-bake.hcl`, the GHCR image targets and version tags.
- `deploy.sh`, the current migration and service start behaviour.
- `apps/api/package.json` and `apps/pos/package.json`, the competing script names.

**Practices & standards**:

- Build once and promote the same artifact by digest.
- Required status checks before merge, with unique job names.
- Quarantine a flaky test with a named owner and an open issue, never rerun it as a green result.
- Per workspace coverage floor plus changed code coverage.
- Least exposure for credentials, with no secrets on fork pull requests.
- Provenance attestation for every released artifact.

**Links** (web verified during design):

- Reuse workflows: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
- About protected branches: https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Dependency caching reference: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows
- OpenID Connect: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- Constructing CI: https://turborepo.dev/docs/crafting-your-repository/constructing-ci
- docker/build-push-action: https://github.com/docker/build-push-action
- changesets/changesets: https://github.com/changesets/changesets
- Playwright Continuous Integration: https://playwright.dev/docs/ci
- Using artifact attestations to establish provenance for builds: https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds
