# 0045.3 Build, Cache and Artifacts

**Date**: 2026-11-19

## Summary

This child defines how code becomes a build and how that build is stored. Pull requests verify that affected workspaces compile. Main builds each deliverable once, stores images in GHCR and native bundles in Actions artifacts, and attaches a provenance record so promotion can reuse the exact bytes.

## Decision

Call root scripts plus Turbo filters for JavaScript and TypeScript workspaces, and wrap native tools behind the same canonical command names. Use the setup node lockfile cache for pnpm, and GitHub Actions cache keys built from the lockfile hash, operating system, and task name with restore keys for Turbo, Gradle, and Rust. Build once on main, tag images with version and commit SHA, promote by digest, and create a provenance attestation for each released artifact. The version comes from `scripts/ensure-unique-version.js` before the build and is passed to every build and release job as `inputs.version`.

## Standard definition

**Canonical pattern**:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: pnpm

- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-build-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-turbo-build-

- uses: docker/build-push-action@v7
  id: image
  with:
    context: .
    file: apps/api/Dockerfile
    push: true
    tags: |
      ghcr.io/larrybwosi/scryme/api:${{ inputs.version }}
      ghcr.io/larrybwosi/scryme/api:sha-${{ inputs.commit_sha }}
    provenance: true
    sbom: true
    cache-from: type=gha
    cache-to: type=gha,mode=max

- uses: actions/attest@v4
  with:
    subject-name: ghcr.io/larrybwosi/scryme/api:${{ inputs.version }}
    subject-digest: ${{ steps.image.outputs.digest }}
```

The subject name is the full image reference for the artifact, and the attestation type is the provenance type supported by `actions/attest@v4`. Gradle and Rust use the same key shape with their own lockfile hashes and task names. A pull request from a fork has read only cache access.

Command contract:

- `pnpm build`, `pnpm lint`, `pnpm type-check`, and `pnpm test` are the canonical JavaScript and TypeScript entry points, with Turbo filters applied by the caller.
- `cargo build`, `cargo test`, `./gradlew assembleDebug`, and `./gradlew testDebugUnitTest` are wrapped behind the workspace canonical commands for native workspaces.
- Tauri variants pass their config and feature flags as workflow inputs, not as edits inside a job.
- Install steps use `pnpm install --frozen-lockfile` in every workflow.
- All workflows call `pnpm/action-setup@v4` with the `packageManager` version from `package.json`, currently `pnpm@10.34.1`.
- The migration pull request adds a root `test` script that runs `turbo run test`, matching `AGENTS.md`.

Deliverable inventory:

| Deliverable | Source | Registry or artifact | Variant inputs |
|---|---|---|---|
| api, admin, crm, cms, web, projects, site, auth, docs, prisma studio | Dockerfiles listed in `docker-bake.hcl` | `ghcr.io/larrybwosi/scryme/<name>` | version and commit SHA tags |
| POS desktop | `apps/pos` Tauri configs | Actions artifact `pos-<variant>-<version>-<sha>` | pharmacy, retail, supermarket, restaurant, with matching config and feature flags |
| Bakery desktop | `apps/bakery` Tauri config | Actions artifact `bakery-<version>-<sha>` | bakery config |
| Android | `apps/android` Gradle release tasks | Actions artifacts `scryme-android-<version>-<sha>.apk` and `.aab` | signing inputs stay in release secrets |

Artifact rules:

- Container images use GHCR with a version tag and a commit SHA tag. Promotion uses the immutable digest, never `latest`.
- Native bundles use Actions artifacts named with version and commit SHA, with a provenance file named `<artifact>.provenance.json` beside each bundle.
- A build that produces no digest or no provenance record fails before promotion.
- Pull requests from forks have read only cache access, and no other job writes a cache built from untrusted code.

**Replaces**:

- Release jobs that rebuild each Tauri variant, bakery, and Android bundle from scratch from the same commit.
- `pnpm install --no-frozen-lockfile` and pnpm 9 in `release.yml`.
- Image tags that use `latest` as the deployable reference.
- Cache keys tied to `github.sha`, which prevent useful reuse across runs.
- Provenance absent from every published artifact.

**Enforcement**:

The release workflow fails when `inputs.commit_sha` is missing, when an image has no digest output, or when an attestation is absent. Cache keys are asserted in the cache step inputs by review. Image build support for digest, provenance, SBOM, and cache import and export follows the documented build push action contract (basis: [docker/build-push-action](https://github.com/docker/build-push-action)). Attestation creation uses the documented `actions/attest@v4` flow with `id-token: write` and `attestations: write` scoped to the release job (basis: [Using artifact attestations to establish provenance for builds](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds)). Cache keys and restore keys follow the dependency caching guidance (basis: [Dependency caching reference](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/caching-dependencies-to-speed-up-workflows)).

**Rollout**:

The migration pull request adds canonical command aliases, updates install steps to frozen lockfile, and introduces digest and attestation steps. Old `latest` tags remain in the registry for compatibility but stop being a promotion target.

**Exceptions**:

Native bundles cannot live in GHCR as container images, so they use Actions artifacts with a provenance file. Docs only changes produce no build artifact and skip this child.

## Consequences

**Positive**:

- The release artifact built and tested on main is the artifact deployed later. Pull requests only verify compile and test health with mocks.
- Digest promotion makes rollback a fast redeploy of a known good build.
- Stable cache keys cut install and build time without a new vendor.

**Negative / tradeoffs**:

- Attestation steps add permissions and time to every release build.
- Actions artifacts have limited retention compared with a registry.
- Adding canonical aliases touches several workspace package files, even if no test logic changes.

## Rationale

The user picked build once and promote unchanged, plus traceability for every deploy. Those two guarantees cannot hold when each target rebuilds from source or when `latest` is the deploy reference. GHCR is already in `docker-bake.hcl`, so keeping it avoids a new registry credential. Native tools are wrapped rather than removed because Tauri and Gradle produce real deliverables that a container registry cannot represent. Frozen lockfile installs and stable keys turn reproducibility into a CI rule rather than a convention.
